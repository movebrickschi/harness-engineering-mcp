---
spec_id: harness-spec-stack-python
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli]
---

# Stack Adapter: Python

## 1. 项目识别

- 入口：`pyproject.toml`（推荐）/ `setup.py`（旧）
- Python 版本：建议 3.11+，`python-version` 字段或 `.python-version`

## 2. 依赖管理

| 项 | 推荐 |
| --- | --- |
| 包管理器 | uv（推荐，快）/ poetry / pdm |
| 锁定文件 | `uv.lock` / `poetry.lock` 必须入库 |
| 虚拟环境 | `.venv/` 在项目目录，`.gitignore` 排除 |

```bash
uv sync                 # 装依赖
uv run pytest           # 跑测试
```

## 3. 测试矩阵

| 类型 | 推荐工具 |
| --- | --- |
| 单元 | pytest |
| 异步 | pytest-asyncio |
| 集成 | pytest + Testcontainers / docker fixtures |
| HTTP | pytest + httpx / requests-mock |
| E2E（CLI） | pytest + subprocess / `click.testing.CliRunner` |
| 契约 | pact-python |

```bash
pytest --cov=src --cov-report=xml --cov-report=term
```

## 4. 覆盖率

- 工具：`coverage.py`
- 输出：`coverage.xml`（CI 消费）+ `htmlcov/`（人读）
- 阈值：在 `pyproject.toml` 的 `[tool.coverage.report]` 设置 `fail_under`

## 5. 静态检查

| 工具 | 用途 |
| --- | --- |
| ruff | 风格 + 静态错误（替代 flake8 / isort / black） |
| mypy | 类型检查 |
| pyright | 类型检查（备选） |
| bandit | 安全静态扫描 |
| vulture | 死代码 |

```bash
ruff check . && ruff format --check .
mypy src
bandit -r src
```

## 6. 安全扫描

| 维度 | 工具 |
| --- | --- |
| SCA | `pip-audit` / Safety / Snyk |
| 密钥扫描 | gitleaks / detect-secrets |
| SAST | bandit / Semgrep |
| SBOM | `cyclonedx-py` |

## 7. 性能

| 类型 | 工具 |
| --- | --- |
| 压测 | locust / k6 |
| Profiling | cProfile + snakeviz / py-spy |
| 内存 | tracemalloc / memray |

## 8. 项目类型差异

### 8.1 Backend Service

- 框架：FastAPI（推荐）/ Django / Flask
- API 文档：FastAPI 原生 OpenAPI / drf-spectacular
- 异步：asyncio + uvicorn / gunicorn

### 8.2 Library

- 发布：PyPI（用 twine / `uv publish`）
- 兼容性矩阵：Python 3.10 / 3.11 / 3.12 / 3.13
- API 稳定性：`__all__` + 公开 / 私有命名约定（`_` 前缀）

### 8.3 CLI

- 框架：typer（推荐）/ click / argparse
- entry point：`pyproject.toml` `[project.scripts]`
- 兼容性：跨 OS

## 9. CI 关键步骤

```yaml
- uses: actions/setup-python@v5
  with: { python-version-file: '.python-version' }
- uses: astral-sh/setup-uv@v3
- run: uv sync
- run: uv run ruff check .
- run: uv run mypy src
- run: uv run pytest --cov
- run: uv run pip-audit         # mid-team+
- run: uv run bandit -r src     # mid-team+
```

## 10. 与本规范的常见映射

| 规范条目 | Python 实现 |
| --- | --- |
| 测试金字塔 | pytest + Testcontainers + pact-python |
| 性能预算 | locust 基线 + py-spy 火焰图 |
| Audit Log | structlog + 中间件 + 独立 sink |
| Feature Flag | Unleash python client / 自建 |
| 数据分级 | 字段级 type hint + 自定义校验 |

## 11. 反模式（栈特定）

- `requirements.txt` 不锁定版本（`flask` 而非 `flask==3.0.1`）
- 全局可变状态
- 用 `eval` / `exec` 处理外部输入
- `except: pass` 吞所有异常
- 把 `__pycache__` / `.venv` 入库
- pip install 直接装到系统 Python
