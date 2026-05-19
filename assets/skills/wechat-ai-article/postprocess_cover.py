"""
Cover post-processor for wechat-ai-article skill.

Pipeline (new architecture):
    1. Load raw GenerateImage output (hero_raw.png) — the visual material only.
    2. Dispatch to an archetype composer (cover_archetypes.py) which handles
       the real layout: hero placement / fit, gradient veil, duotone, color
       panels, Chinese headline baked in via PIL with local CJK fonts.
    3. Overlay any English side-tags from the legacy `texts` block (brand tag,
       version arrow, numeric mark) using the existing tracking-aware renderer.
    4. Optional magazine polish: 1px hairline border / film grain noise /
       vignette.

Usage:
    python postprocess_cover.py \
        --input  hero_raw.png \
        --config cover_text.json \
        --output cover.png

Config schema: see cover_text_schema.json in the same folder.

Dependencies: Pillow (>= 10.0). Install with `pip install pillow`.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    sys.stderr.write(
        "[postprocess_cover] Pillow is required. Install with `pip install pillow`.\n"
    )
    sys.exit(2)

# Make cover_archetypes importable regardless of how the script is invoked.
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import cover_archetypes  # noqa: E402
except ImportError as exc:
    sys.stderr.write(
        f"[postprocess_cover] cannot import cover_archetypes: {exc}\n"
    )
    sys.exit(2)


CANVAS_W_DEFAULT = 2350
CANVAS_H_DEFAULT = 1000


# ---------------------------------------------------------------------------
# Canvas normalization (exact 2350x1000) — legacy path, still available for
# letterbox mode when a composer is not used.
# ---------------------------------------------------------------------------


def normalize_canvas(
    img: Image.Image,
    target_w: int,
    target_h: int,
    mode: str = "crop",
    letterbox_color: str = "#000000",
) -> Image.Image:
    """Force the image into exact target dimensions.

    mode = "crop":      scale to cover, then center-crop. Loses some pixels at edges.
    mode = "letterbox": scale to fit, then pad with letterbox_color.
    """
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if mode == "letterbox":
        if src_ratio > target_ratio:
            new_w = target_w
            new_h = round(target_w / src_ratio)
        else:
            new_h = target_h
            new_w = round(target_h * src_ratio)
        scaled = img.resize((new_w, new_h), Image.LANCZOS)
        canvas = Image.new("RGB", (target_w, target_h), letterbox_color)
        offset = ((target_w - new_w) // 2, (target_h - new_h) // 2)
        canvas.paste(scaled, offset)
        return canvas

    if src_ratio > target_ratio:
        new_h = target_h
        new_w = round(target_h * src_ratio)
    else:
        new_w = target_w
        new_h = round(target_w / src_ratio)
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return scaled.crop((left, top, left + target_w, top + target_h))


# ---------------------------------------------------------------------------
# Font loading (English/numeric side-tags only — CJK lives in cover_archetypes)
# ---------------------------------------------------------------------------


DEFAULT_FONT_DIRS = [
    Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts",
    Path(os.environ.get("USERPROFILE", "")) / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",
    Path("/Library/Fonts"),
    Path("/System/Library/Fonts"),
    Path.home() / "Library" / "Fonts",
    Path("/usr/share/fonts"),
    Path("/usr/local/share/fonts"),
    Path.home() / ".fonts",
]

FONT_FALLBACK_CHAIN = [
    "Inter-Bold.ttf",
    "Inter-SemiBold.ttf",
    "Inter-Regular.ttf",
    "HelveticaNeue.ttc",
    "Helvetica.ttc",
    "Arial.ttf",
    "arialbd.ttf",
    "arial.ttf",
    "segoeui.ttf",
    "seguibl.ttf",
    "Georgia.ttf",
    "georgia.ttf",
    "DejaVuSans.ttf",
    "DejaVuSans-Bold.ttf",
]


def _find_font_file(name: str) -> Path | None:
    name_lower = name.lower()
    for d in DEFAULT_FONT_DIRS:
        if not d.exists():
            continue
        try:
            for entry in d.rglob("*"):
                if entry.is_file() and entry.name.lower() == name_lower:
                    return entry
        except (PermissionError, OSError):
            continue
    return None


def load_font(font_name: str | None, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load a TrueType font by filename. Falls back through FONT_FALLBACK_CHAIN."""
    candidates: list[str] = []
    if font_name:
        candidates.append(font_name)
    candidates.extend(FONT_FALLBACK_CHAIN)

    for candidate in candidates:
        if os.path.isabs(candidate) and os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
        path = _find_font_file(candidate)
        if path is not None:
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue

    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Text rendering with manual letter-spacing
# ---------------------------------------------------------------------------


def draw_text_with_tracking(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: Any,
    fill: str,
    tracking: float = 0.0,
    anchor: str = "lt",
) -> None:
    """Draw text with extra letter-spacing. tracking is em fraction (0.1 = 10%)."""
    if tracking == 0:
        draw.text(xy, text, font=font, fill=fill, anchor=anchor)
        return

    font_size = getattr(font, "size", 16)
    extra = round(font_size * tracking)

    widths: list[int] = []
    for ch in text:
        try:
            bbox = font.getbbox(ch)
            widths.append(bbox[2] - bbox[0])
        except (AttributeError, TypeError):
            widths.append(font.getlength(ch) if hasattr(font, "getlength") else font_size // 2)

    total = sum(widths) + extra * max(0, len(text) - 1)

    x, y = xy
    if anchor.startswith("m"):
        x -= total // 2
    elif anchor.startswith("r"):
        x -= total

    if len(anchor) > 1:
        v_anchor = anchor[1]
        try:
            ascent, descent = font.getmetrics()
            if v_anchor == "m":
                y -= (ascent + descent) // 2
            elif v_anchor == "b" or v_anchor == "d":
                y -= ascent + descent
            elif v_anchor == "s":
                y -= ascent
        except AttributeError:
            pass

    cursor = x
    for ch, w in zip(text, widths):
        draw.text((cursor, y), ch, font=font, fill=fill, anchor="lt")
        cursor += w + extra


def render_text_layers(canvas: Image.Image, texts: list[dict[str, Any]]) -> None:
    """Draw every English/numeric text overlay defined in the config."""
    draw = ImageDraw.Draw(canvas)
    for spec in texts:
        text = spec.get("text", "")
        if not text:
            continue
        x = int(spec.get("x", 0))
        y = int(spec.get("y", 0))
        size = int(spec.get("size", 48))
        color = spec.get("color", "#ffffff")
        font_name = spec.get("font")
        tracking = float(spec.get("tracking", 0.0))
        anchor = spec.get("anchor", "lt")
        upper = bool(spec.get("uppercase", False))
        if upper:
            text = text.upper()
        font = load_font(font_name, size)
        draw_text_with_tracking(draw, (x, y), text, font, color, tracking, anchor)


# ---------------------------------------------------------------------------
# Optional polish: border / noise / vignette
# ---------------------------------------------------------------------------


def add_border(canvas: Image.Image, px: int, color: str) -> None:
    if px <= 0:
        return
    draw = ImageDraw.Draw(canvas)
    w, h = canvas.size
    for i in range(px):
        draw.rectangle((i, i, w - 1 - i, h - 1 - i), outline=color)


def add_noise(canvas: Image.Image, intensity: float) -> Image.Image:
    """Add monochrome film grain. intensity in [0, 1], typically 0.02-0.05."""
    if intensity <= 0:
        return canvas
    w, h = canvas.size
    noise = Image.effect_noise((w, h), 255 * intensity).convert("L")
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(canvas.convert("RGB"), noise_rgb, intensity)


def add_vignette(canvas: Image.Image, strength: float) -> Image.Image:
    """Darken edges. strength in [0, 1], typically 0.1-0.3."""
    if strength <= 0:
        return canvas
    w, h = canvas.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    max_radius = (w**2 + h**2) ** 0.5 / 2
    for r in range(0, int(max_radius), 4):
        alpha = int(255 * (r / max_radius) * strength)
        draw.ellipse(
            (w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r),
            outline=alpha,
            width=4,
        )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=80))
    dark = Image.new("RGB", (w, h), "#000000")
    return Image.composite(dark, canvas.convert("RGB"), mask)


# ---------------------------------------------------------------------------
# Main entry
# ---------------------------------------------------------------------------


def process(
    input_path: Path,
    config_path: Path,
    output_path: Path,
) -> None:
    if not input_path.exists():
        raise SystemExit(f"[postprocess_cover] input not found: {input_path}")
    if not config_path.exists():
        raise SystemExit(f"[postprocess_cover] config not found: {config_path}")

    with config_path.open("r", encoding="utf-8") as fh:
        config: dict[str, Any] = json.load(fh)

    canvas_cfg = config.get("canvas", {})
    target_w = int(canvas_cfg.get("width", CANVAS_W_DEFAULT))
    target_h = int(canvas_cfg.get("height", CANVAS_H_DEFAULT))
    fit_mode = canvas_cfg.get("fit", "crop")
    letterbox_color = canvas_cfg.get("letterbox_color", "#000000")
    border_px = int(canvas_cfg.get("border_px", 0))
    border_color = canvas_cfg.get("border_color", "#000000")
    noise_intensity = float(canvas_cfg.get("noise", 0.0))
    vignette_strength = float(canvas_cfg.get("vignette", 0.0))
    seed = canvas_cfg.get("seed")
    if seed is not None:
        random.seed(int(seed))

    raw = Image.open(input_path).convert("RGB")

    archetype_id = config.get("archetype")
    if archetype_id:
        # New path: dispatch to archetype composer for real layout + CN headline.
        spec = {
            "palette": config.get("palette") or {},
            "headline_cn": config.get("headline_cn") or {},
            "veil": config.get("veil") or {},
            "duotone": config.get("duotone") or {},
        }
        canvas = cover_archetypes.compose(archetype_id, raw, spec)
        # Composer always returns canvas at cover_archetypes.CANVAS_W/H
        # (currently 2350x1000). If the caller wanted something else, fall
        # through to a final normalize to be safe.
        if canvas.size != (target_w, target_h):
            canvas = normalize_canvas(canvas, target_w, target_h, fit_mode, letterbox_color)
    else:
        # Legacy path: just normalize the raw image; no composition.
        canvas = normalize_canvas(raw, target_w, target_h, fit_mode, letterbox_color)

    canvas = add_noise(canvas, noise_intensity)
    canvas = add_vignette(canvas, vignette_strength)

    texts = config.get("texts", [])
    if texts:
        render_text_layers(canvas, texts)

    add_border(canvas, border_px, border_color)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", optimize=True)
    print(
        f"[postprocess_cover] wrote {output_path} "
        f"({target_w}x{target_h}, archetype={archetype_id or 'none'}, "
        f"{len(texts)} text layers)"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Post-process wechat-ai-article cover images."
    )
    parser.add_argument("--input", required=True, help="Path to cover_raw.png / hero_raw.png")
    parser.add_argument("--config", required=True, help="Path to cover_text.json")
    parser.add_argument("--output", required=True, help="Path to write cover.png")
    args = parser.parse_args()

    process(Path(args.input), Path(args.config), Path(args.output))


if __name__ == "__main__":
    main()
