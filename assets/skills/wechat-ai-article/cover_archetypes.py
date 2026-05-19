"""
Cover archetype composers for wechat-ai-article skill.

This module owns the "actual layout engine" half of the cover generation:
GenerateImage only produces a rich visual material (hero_raw.png), and the
composers in this file compose the final cover by pasting/transforming that
material, applying veils/duotone/panels, and baking Chinese headlines + English
tags via Pillow.

Each compose_<axx> function has the same signature:
    (hero_raw: Image.Image, spec: dict) -> Image.Image
and always returns a 2350x1000 RGB canvas with everything already composited
except English side-tags (those are drawn later by postprocess_cover.py via
render_text_layers for backward compatibility with the old schema).

Dependencies: Pillow >= 10.0.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Iterable

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    sys.stderr.write(
        "[cover_archetypes] Pillow is required. Install with `pip install pillow`.\n"
    )
    raise


CANVAS_W = 2350
CANVAS_H = 1000


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------


def _hex_to_rgba(color: str, default_alpha: int = 255) -> tuple[int, int, int, int]:
    """Parse '#rrggbb' or '#rrggbbaa' (case-insensitive) into (r, g, b, a)."""
    if not isinstance(color, str):
        return (0, 0, 0, default_alpha)
    s = color.strip().lstrip("#")
    if len(s) == 3:
        s = "".join(ch * 2 for ch in s)
    if len(s) == 6:
        r = int(s[0:2], 16)
        g = int(s[2:4], 16)
        b = int(s[4:6], 16)
        return (r, g, b, default_alpha)
    if len(s) == 8:
        r = int(s[0:2], 16)
        g = int(s[2:4], 16)
        b = int(s[4:6], 16)
        a = int(s[6:8], 16)
        return (r, g, b, a)
    return (0, 0, 0, default_alpha)


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    r, g, b, _ = _hex_to_rgba(color)
    return (r, g, b)


# ---------------------------------------------------------------------------
# CJK font loading
# ---------------------------------------------------------------------------


CJK_FONT_SEARCH_DIRS = [
    Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts",
    Path(os.environ.get("USERPROFILE", "")) / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",
    Path("/System/Library/Fonts"),
    Path("/System/Library/Fonts/Supplemental"),
    Path("/Library/Fonts"),
    Path.home() / "Library" / "Fonts",
    Path("/usr/share/fonts"),
    Path("/usr/local/share/fonts"),
    Path.home() / ".fonts",
]


CJK_BOLD_CHAIN = [
    "msyhbd.ttc",       # Microsoft YaHei Bold (Windows default)
    "msyhbd.ttf",
    "SourceHanSansSC-Bold.otf",
    "NotoSansCJK-Bold.ttc",
    "NotoSansSC-Bold.otf",
    "PingFang.ttc",     # macOS (contains multiple weights)
    "STHeiti Medium.ttc",
    "simhei.ttf",       # Windows SimHei (bold-ish)
    "Heiti SC.ttc",
    "msyh.ttc",         # fall back to regular
    "msyh.ttf",
]


CJK_REGULAR_CHAIN = [
    "msyh.ttc",
    "msyh.ttf",
    "SourceHanSansSC-Regular.otf",
    "NotoSansCJK-Regular.ttc",
    "NotoSansSC-Regular.otf",
    "PingFang.ttc",
    "STHeiti Light.ttc",
    "simsun.ttc",
    "Heiti SC.ttc",
]


def _find_font_path(name: str) -> Path | None:
    target = name.lower()
    for d in CJK_FONT_SEARCH_DIRS:
        if not d.exists():
            continue
        try:
            for entry in d.rglob("*"):
                if entry.is_file() and entry.name.lower() == target:
                    return entry
        except (PermissionError, OSError):
            continue
    return None


def load_cjk_font(size: int, weight: str = "bold") -> ImageFont.FreeTypeFont:
    """Load a Chinese-capable font. Prefers msyhbd.ttc; falls back through
    Source Han Sans, Noto Sans CJK, PingFang, SimHei, SimSun."""
    chain = CJK_BOLD_CHAIN if weight == "bold" else CJK_REGULAR_CHAIN
    for candidate in chain:
        path = _find_font_path(candidate)
        if path is None:
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
        else:
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
    # Final fallback (will render CJK as boxes, but never crash)
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Chinese line breaking + auto-sizing
# ---------------------------------------------------------------------------


# Characters that must not start a line (hang back onto the previous line).
_CJK_NO_START = set("，。、！？：；）】」』》〉〕）,.!?:;)]}\u3001\u3002\u3005")
# Characters that must not end a line (pull forward to the next line).
_CJK_NO_END = set("（【「『《〈〔（([{")


def _measure_line(text: str, font: ImageFont.FreeTypeFont) -> int:
    if hasattr(font, "getlength"):
        try:
            return int(font.getlength(text))
        except (AttributeError, TypeError):
            pass
    bbox = font.getbbox(text)
    return int(bbox[2] - bbox[0])


def wrap_chinese(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Greedy wrap that respects common CJK line-break rules.

    No distinction between words: every character can break, except leading
    forbidden punctuation is hung back to the previous line.
    """
    if not text:
        return [""]
    lines: list[str] = []
    buf = ""
    for ch in text:
        candidate = buf + ch
        if _measure_line(candidate, font) <= max_width:
            buf = candidate
            continue
        # Overflow. If the incoming char is forbidden-at-line-start, force it
        # to still belong to the current line even if slightly overshooting.
        if ch in _CJK_NO_START and buf:
            buf = candidate
            continue
        # Otherwise push the current buffer as a line and start fresh.
        if buf and buf[-1] in _CJK_NO_END and len(buf) > 1:
            # Last char of current buffer is a forbidden-at-line-end punct —
            # pull it forward.
            lines.append(buf[:-1])
            buf = buf[-1] + ch
        else:
            lines.append(buf)
            buf = ch
    if buf:
        lines.append(buf)
    return lines or [""]


def fit_chinese_to_rect(
    text: str,
    rect: dict[str, int],
    font_file: str | None,
    max_size: int,
    min_size: int,
    line_height: float = 1.15,
    weight: str = "bold",
) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    """Find the largest font size such that `text` wraps to fit `rect`.

    Returns (font, wrapped_lines, chosen_size).
    """
    max_w = max(1, int(rect.get("w", CANVAS_W)))
    max_h = max(1, int(rect.get("h", CANVAS_H)))

    lo = max(12, int(min_size))
    hi = max(lo, int(max_size))
    chosen_size = lo
    chosen_lines: list[str] = [text]
    chosen_font: ImageFont.FreeTypeFont | None = None

    # Exponential shrink with a small step so we don't spend too many probes.
    for size in range(hi, lo - 1, -4):
        font = _load_headline_font(font_file, size, weight=weight)
        lines = wrap_chinese(text, font, max_w)
        # Guard against degenerate wrapping (single char wider than rect)
        widest = max(_measure_line(ln, font) for ln in lines) if lines else 0
        if widest > max_w and size > lo:
            continue
        total_h = int(len(lines) * size * line_height)
        if total_h <= max_h:
            chosen_font, chosen_lines, chosen_size = font, lines, size
            break
    if chosen_font is None:
        chosen_font = _load_headline_font(font_file, lo, weight=weight)
        chosen_lines = wrap_chinese(text, chosen_font, max_w)
        chosen_size = lo
    return chosen_font, chosen_lines, chosen_size


def _load_headline_font(
    font_file: str | None, size: int, weight: str = "bold"
) -> ImageFont.FreeTypeFont:
    """Try to honor a user-specified font filename first; otherwise use the
    CJK fallback chain."""
    if font_file:
        path = _find_font_path(font_file)
        if path is not None:
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                pass
        else:
            try:
                return ImageFont.truetype(font_file, size)
            except OSError:
                pass
    return load_cjk_font(size, weight=weight)


def draw_chinese_headline(
    canvas: Image.Image,
    headline_cfg: dict[str, Any],
) -> None:
    """Draw a multi-line Chinese headline into a bounding rect, auto-sizing.

    Accepts a `headline_cn` dict from cover_text.json.
    Honored keys: text, font, max_size, min_size, color, shadow, align,
                  rect { x, y, w, h }, line_height, weight, tracking.
    """
    text = (headline_cfg.get("text") or "").strip()
    if not text:
        return

    rect = headline_cfg.get("rect") or {"x": 120, "y": 680, "w": CANVAS_W - 240, "h": 240}
    color = headline_cfg.get("color", "#ffffff")
    shadow = headline_cfg.get("shadow")
    align = headline_cfg.get("align", "left")
    font_file = headline_cfg.get("font")
    max_size = int(headline_cfg.get("max_size", 140))
    min_size = int(headline_cfg.get("min_size", 56))
    line_height = float(headline_cfg.get("line_height", 1.15))
    weight = headline_cfg.get("weight", "bold")
    tracking = float(headline_cfg.get("tracking", 0.0))

    font, lines, size = fit_chinese_to_rect(
        text, rect, font_file, max_size, min_size, line_height, weight
    )

    line_px = int(size * line_height)
    total_h = line_px * len(lines)
    x0 = int(rect["x"])
    y0 = int(rect["y"])
    w = int(rect["w"])
    h = int(rect["h"])

    y_cursor = y0 + max(0, (h - total_h) // 2)

    draw = ImageDraw.Draw(canvas, "RGBA")
    for line in lines:
        line_w = _measure_line(line, font)
        if tracking:
            extra = int(size * tracking) * max(0, len(line) - 1)
            line_w += extra
        if align == "center":
            x = x0 + (w - line_w) // 2
        elif align == "right":
            x = x0 + (w - line_w)
        else:
            x = x0
        if shadow:
            sh_rgba = _hex_to_rgba(shadow)
            _draw_text_with_tracking(
                draw, (x + 4, y_cursor + 4), line, font, sh_rgba, tracking
            )
        fill_rgba = _hex_to_rgba(color)
        _draw_text_with_tracking(draw, (x, y_cursor), line, font, fill_rgba, tracking)
        y_cursor += line_px


def _draw_text_with_tracking(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: float,
) -> None:
    """Simple left-anchored draw with per-character tracking. Used by the
    headline renderer above."""
    if not tracking:
        draw.text(xy, text, font=font, fill=fill)
        return
    size = getattr(font, "size", 16)
    extra = int(size * tracking)
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += _measure_line(ch, font) + extra


# ---------------------------------------------------------------------------
# Image transforms
# ---------------------------------------------------------------------------


def _ensure_rgb(img: Image.Image) -> Image.Image:
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def cover_fit(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale-to-cover + center-crop."""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_h = target_h
        new_w = max(target_w, round(target_h * src_ratio))
    else:
        new_w = target_w
        new_h = max(target_h, round(target_w / src_ratio))
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    left = max(0, (new_w - target_w) // 2)
    top = max(0, (new_h - target_h) // 2)
    return scaled.crop((left, top, left + target_w, top + target_h))


def paste_hero_into_rect(
    canvas: Image.Image,
    hero: Image.Image,
    rect: dict[str, int],
    fit: str = "cover",
    opacity: float = 1.0,
) -> None:
    """Paste hero (cropped/fitted) into a sub-rect of canvas."""
    x = int(rect["x"])
    y = int(rect["y"])
    w = int(rect["w"])
    h = int(rect["h"])

    if fit == "contain":
        src_ratio = hero.width / hero.height
        target_ratio = w / h
        if src_ratio > target_ratio:
            new_w = w
            new_h = round(w / src_ratio)
        else:
            new_h = h
            new_w = round(h * src_ratio)
        scaled = hero.resize((new_w, new_h), Image.LANCZOS)
        pad = Image.new("RGB", (w, h), (0, 0, 0))
        pad.paste(scaled, ((w - new_w) // 2, (h - new_h) // 2))
        fitted = pad
    else:
        fitted = cover_fit(hero, w, h)

    if opacity < 1.0:
        base = canvas.crop((x, y, x + w, y + h)).convert("RGB")
        blended = Image.blend(base, fitted.convert("RGB"), max(0.0, min(1.0, opacity)))
        canvas.paste(blended, (x, y))
    else:
        canvas.paste(fitted, (x, y))


def apply_gradient_veil(
    canvas: Image.Image,
    direction: str = "bottom",
    from_color: str = "#00000000",
    to_color: str = "#000000cc",
    start_ratio: float = 0.35,
) -> Image.Image:
    """Composite a linear alpha gradient over the canvas.

    direction: 'bottom' | 'top' | 'left' | 'right' — where the heavier end sits.
    start_ratio: fraction of the canvas on the "from" side that remains
                  essentially transparent before the ramp begins.
    """
    w, h = canvas.size
    veil = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fr = _hex_to_rgba(from_color)
    tr = _hex_to_rgba(to_color)

    if direction in ("bottom", "top"):
        length = h
        axis = "v"
    else:
        length = w
        axis = "h"

    start = max(0, int(length * start_ratio))
    ramp = max(1, length - start)

    px = veil.load()
    if px is None:
        return canvas.convert("RGB")

    for i in range(length):
        if i < start:
            rgba = fr
        else:
            t = (i - start) / ramp
            t = min(1.0, max(0.0, t))
            rgba = (
                int(fr[0] * (1 - t) + tr[0] * t),
                int(fr[1] * (1 - t) + tr[1] * t),
                int(fr[2] * (1 - t) + tr[2] * t),
                int(fr[3] * (1 - t) + tr[3] * t),
            )
        # Reverse the axis for 'top' / 'left' so the heavy end sits there.
        idx = i
        if direction == "top":
            idx = h - 1 - i
        elif direction == "left":
            idx = w - 1 - i
        if axis == "v":
            for x in range(w):
                px[x, idx] = rgba
        else:
            for y in range(h):
                px[idx, y] = rgba

    base = canvas.convert("RGBA")
    out = Image.alpha_composite(base, veil)
    return out.convert("RGB")


def apply_duotone(img: Image.Image, shadow_hex: str, highlight_hex: str) -> Image.Image:
    """Map luminance to a 2-color gradient.

    Very cheap: build a 256-entry LUT from shadow -> highlight, then apply to
    the grayscale version of the image.
    """
    gray = img.convert("L")
    s = _hex_to_rgb(shadow_hex)
    h = _hex_to_rgb(highlight_hex)

    r_table = bytes(int(s[0] + (h[0] - s[0]) * i / 255) for i in range(256))
    g_table = bytes(int(s[1] + (h[1] - s[1]) * i / 255) for i in range(256))
    b_table = bytes(int(s[2] + (h[2] - s[2]) * i / 255) for i in range(256))

    r = gray.point(r_table)
    g = gray.point(g_table)
    b = gray.point(b_table)
    return Image.merge("RGB", (r, g, b))


def draw_color_panel(
    canvas: Image.Image,
    rect: dict[str, int],
    color: str,
    opacity: float = 1.0,
) -> None:
    """Paint a rectangular color panel (optionally semi-transparent) over the canvas."""
    r, g, b, a = _hex_to_rgba(color)
    a = int(a * max(0.0, min(1.0, opacity)))
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    x = int(rect["x"])
    y = int(rect["y"])
    w = int(rect["w"])
    h = int(rect["h"])
    draw.rectangle((x, y, x + w, y + h), fill=(r, g, b, a))
    composed = Image.alpha_composite(canvas.convert("RGBA"), overlay)
    canvas.paste(composed.convert("RGB"), (0, 0))


def draw_hairline(
    canvas: Image.Image,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    color: str = "#ffffff",
    width: int = 2,
) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.line((x1, y1, x2, y2), fill=_hex_to_rgb(color), width=width)


# ---------------------------------------------------------------------------
# Archetype composers
# ---------------------------------------------------------------------------


def _palette(spec: dict[str, Any]) -> dict[str, str]:
    pal = spec.get("palette") or {}
    return {
        "primary": pal.get("primary", "#0f172a"),
        "accent": pal.get("accent", "#f1ead7"),
        "panel_color": pal.get("panel_color", pal.get("accent", "#c0241d")),
        "ink": pal.get("ink", "#111111"),
    }


def _blank_canvas(color: str) -> Image.Image:
    return Image.new("RGB", (CANVAS_W, CANVAS_H), _hex_to_rgb(color))


def compose_a01(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A01 · Cinematic Hero — full-bleed hero + bottom linear black veil."""
    canvas = cover_fit(_ensure_rgb(hero_raw), CANVAS_W, CANVAS_H).copy()

    veil_cfg = spec.get("veil") or {}
    direction = veil_cfg.get("direction", "bottom")
    from_color = veil_cfg.get("from", "#00000000")
    to_color = veil_cfg.get("to", "#000000d0")
    start_ratio = float(veil_cfg.get("start_ratio", 0.42))
    if veil_cfg.get("enabled", True):
        canvas = apply_gradient_veil(canvas, direction, from_color, to_color, start_ratio)

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", "#f6f2e8")
        hl.setdefault("shadow", "#00000077")
        hl.setdefault("align", "left")
        hl.setdefault(
            "rect", {"x": 120, "y": 660, "w": CANVAS_W - 260, "h": 280}
        )
        draw_chinese_headline(canvas, hl)
    return canvas


def compose_a02(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A02 · Editorial Split — left 38% color panel + right 62% hero."""
    pal = _palette(spec)
    split = int(CANVAS_W * 0.38)
    canvas = _blank_canvas(pal["panel_color"])

    hero_rect = {"x": split, "y": 0, "w": CANVAS_W - split, "h": CANVAS_H}
    paste_hero_into_rect(canvas, _ensure_rgb(hero_raw), hero_rect, fit="cover")

    # Thin divider line between panel and image for editorial crispness.
    draw_hairline(
        canvas, split, 0, split, CANVAS_H, color=pal["accent"], width=2
    )

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", pal["accent"])
        hl.setdefault("align", "left")
        hl.setdefault(
            "rect", {"x": 90, "y": 320, "w": split - 180, "h": 460}
        )
        draw_chinese_headline(canvas, hl)
    return canvas


def compose_a03(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A03 · Duotone Pressure — full-bleed image run through duotone + veil."""
    pal = _palette(spec)
    fitted = cover_fit(_ensure_rgb(hero_raw), CANVAS_W, CANVAS_H)

    duotone_cfg = spec.get("duotone") or {}
    shadow_hex = duotone_cfg.get("shadow", pal["primary"])
    highlight_hex = duotone_cfg.get("highlight", pal["accent"])
    canvas = apply_duotone(fitted, shadow_hex, highlight_hex)

    veil_cfg = spec.get("veil") or {}
    if veil_cfg.get("enabled", True):
        canvas = apply_gradient_veil(
            canvas,
            veil_cfg.get("direction", "bottom"),
            veil_cfg.get("from", "#00000000"),
            veil_cfg.get("to", "#00000066"),
            float(veil_cfg.get("start_ratio", 0.25)),
        )

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", pal["accent"])
        hl.setdefault("shadow", "#00000099")
        hl.setdefault("align", "center")
        hl.setdefault(
            "rect", {"x": 180, "y": 540, "w": CANVAS_W - 360, "h": 360}
        )
        draw_chinese_headline(canvas, hl)
    return canvas


def compose_a04(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A04 · Data Monolith — solid color + low-opacity hero as texture."""
    pal = _palette(spec)
    canvas = _blank_canvas(pal["primary"])

    fitted = cover_fit(_ensure_rgb(hero_raw), CANVAS_W, CANVAS_H)
    blended = Image.blend(canvas, fitted, 0.22)
    canvas.paste(blended, (0, 0))

    # Top hairline for editorial rigor.
    draw_hairline(canvas, 120, 120, CANVAS_W - 120, 120, color=pal["accent"], width=2)
    draw_hairline(
        canvas, 120, CANVAS_H - 120, CANVAS_W - 120, CANVAS_H - 120,
        color=pal["accent"], width=2,
    )

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", pal["accent"])
        hl.setdefault("align", "left")
        hl.setdefault(
            "rect", {"x": 140, "y": 360, "w": 1200, "h": 360}
        )
        draw_chinese_headline(canvas, hl)
    return canvas


def compose_a05(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A05 · Type Sculpture — hero at 55% behind a very large CN headline.

    Simpler than a true character-mask approach: render the hero full-bleed
    but darkened, overlay a solid tint, then the headline occupies the
    majority of canvas as a sculptural element.
    """
    pal = _palette(spec)
    fitted = cover_fit(_ensure_rgb(hero_raw), CANVAS_W, CANVAS_H)

    # Heavy tint toward primary so the hero reads as texture, not subject.
    tint = Image.new("RGB", (CANVAS_W, CANVAS_H), _hex_to_rgb(pal["primary"]))
    canvas = Image.blend(fitted, tint, 0.62)

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", pal["accent"])
        hl.setdefault("align", "left")
        hl.setdefault("max_size", 220)
        hl.setdefault("min_size", 120)
        hl.setdefault("line_height", 1.0)
        hl.setdefault(
            "rect", {"x": 120, "y": 120, "w": CANVAS_W - 240, "h": CANVAS_H - 240}
        )
        draw_chinese_headline(canvas, hl)
    return canvas


def compose_a06(hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """A06 · Magazine Index — cream background + left inset + right type stack."""
    pal = _palette(spec)
    bg = pal.get("panel_color") or "#efe8d3"
    canvas = _blank_canvas(bg)

    inset_rect = {"x": 140, "y": 140, "w": 720, "h": 720}
    # Inset: paste as cover-fit into the inset rect, then draw a thin border.
    paste_hero_into_rect(canvas, _ensure_rgb(hero_raw), inset_rect, fit="cover")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle(
        (
            inset_rect["x"] - 1,
            inset_rect["y"] - 1,
            inset_rect["x"] + inset_rect["w"],
            inset_rect["y"] + inset_rect["h"],
        ),
        outline=_hex_to_rgb(pal["ink"]),
        width=2,
    )

    # Divider between inset and type stack.
    draw_hairline(
        canvas,
        inset_rect["x"] + inset_rect["w"] + 80,
        180,
        inset_rect["x"] + inset_rect["w"] + 80,
        CANVAS_H - 180,
        color=pal["ink"],
        width=2,
    )

    headline = spec.get("headline_cn")
    if headline:
        hl = dict(headline)
        hl.setdefault("color", pal["ink"])
        hl.setdefault("align", "left")
        hl.setdefault(
            "rect",
            {
                "x": inset_rect["x"] + inset_rect["w"] + 140,
                "y": 260,
                "w": CANVAS_W - (inset_rect["x"] + inset_rect["w"] + 300),
                "h": 520,
            },
        )
        draw_chinese_headline(canvas, hl)
    return canvas


ARCHETYPE_DISPATCH = {
    "A01": compose_a01,
    "A02": compose_a02,
    "A03": compose_a03,
    "A04": compose_a04,
    "A05": compose_a05,
    "A06": compose_a06,
}


def compose(archetype_id: str, hero_raw: Image.Image, spec: dict[str, Any]) -> Image.Image:
    """Main entry. Dispatch to the correct composer; fall back to A01 if the
    archetype_id is unknown (never crashes)."""
    composer = ARCHETYPE_DISPATCH.get(archetype_id)
    if composer is None:
        sys.stderr.write(
            f"[cover_archetypes] unknown archetype '{archetype_id}', falling back to A01\n"
        )
        composer = compose_a01
    return composer(hero_raw, spec)


__all__ = [
    "CANVAS_W",
    "CANVAS_H",
    "ARCHETYPE_DISPATCH",
    "compose",
    "apply_gradient_veil",
    "apply_duotone",
    "paste_hero_into_rect",
    "draw_color_panel",
    "draw_hairline",
    "load_cjk_font",
    "fit_chinese_to_rect",
    "wrap_chinese",
    "draw_chinese_headline",
    "cover_fit",
]
