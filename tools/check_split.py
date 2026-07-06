#!/usr/bin/env python3
# 职责：拆分/移动/删除 .py 后必跑的一组体检——抓改名漏更新的悬空调用、拆分留下的死码、跨层循环。
# 不做什么：不改源码/不自动修；无拆分信号时不跑(避免拖慢日常 commit)；不硬拦(结果交人复核)。
# 允许依赖层：标准库、本仓 git 工作区状态、外部静态检查 CLI(basedpyright/vulture/import-linter)。
# 谁不应该 import：正式业务代码、测试夹具、应用入口不应 import 本检查脚本。
"""拆分后体检：悬空引用 + 死码 + 跨层循环。只在检测到拆分信号时跑，非阻塞，结果交人复核。

触发时机（不靠记忆）：
  - 主：pre-commit/切片闭包 `--changed`，git diff 出现 .py 删除/重命名(D/R)→ 自动跑；无信号秒退。
  - 手动：直接 `python3 tools/check_split.py` 全量跑。
  - 兜底：阶段闭包/CI 本就全量跑 basedpyright/vulture。
非阻塞理由：basedpyright 当前 relaxed(类型 backlog 未绿)、vulture 有误报，硬拦会拿误报卡死提交；
故强制"自动跑 + 摆出结果"(有牙)，判断交人扫一眼兜底(产物优先)。
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GIT = "/usr/bin/git"
LOCAL_HOME = ROOT / ".cache" / "home"
LOCAL_UV_CACHE = ROOT / ".uv-cache"

# split 体检项：全是现成命令。循环第一步用 import-linter 兜跨层；同层 SCC 检测是下一步增量(需 grimp)。
SPLIT_CHECKS: tuple[tuple[str, list[str]], ...] = (
    ("老调用残留(改名漏更新→悬空引用)", ["uv", "run", "basedpyright"]),
    ("拆分留下的死码", ["uv", "run", "vulture", "app", "scripts", "market-impact-study", "--min-confidence", "80"]),
    ("循环依赖(跨层)", ["uv", "run", "lint-imports", "--config", ".importlinter", "--no-cache"]),
)


def _env() -> dict[str, str]:
    env = os.environ.copy()
    env["HOME"] = str(LOCAL_HOME)
    env["UV_CACHE_DIR"] = str(LOCAL_UV_CACHE)
    return env


def has_split_signal() -> bool:
    # 拆分/移动/删除的客观信号：git diff 里有 .py 被删除(D)或重命名(R)。
    # 纯删功能也会命中——删功能同样留悬空调用/死码，跑了不亏。
    for args in (
        ["diff", "--diff-filter=DR", "--name-only", "--", "*.py"],
        ["diff", "--cached", "--diff-filter=DR", "--name-only", "--", "*.py"],
    ):
        proc = subprocess.run([GIT, *args], cwd=ROOT, text=True, capture_output=True, check=False)  # noqa: S603
        if proc.stdout.strip():
            return True
    return False


def run_split_checks() -> int:
    print("[split] 检测到拆分/删除信号(.py 被删除或重命名)，跑 split 体检：", flush=True)
    for label, cmd in SPLIT_CHECKS:
        print(f"[split] {label}", flush=True)
        subprocess.run(cmd, cwd=ROOT, env=_env(), check=False)  # noqa: S603
    print(
        "\n[split] 以上为 split 体检结果(非阻塞·请人工复核)：改名漏更新的调用 / 拆分留下的死码 / "
        "循环依赖——逐条确认或处理。",
    )
    return 0  # 非阻塞：结果交人复核，不卡提交


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="拆分后体检：悬空引用 + 死码 + 跨层循环")
    parser.add_argument(
        "--changed", action="store_true", help="只在检测到拆分信号(git diff 有 .py 删除/重命名)时跑"
    )
    args = parser.parse_args(argv)
    if args.changed and not has_split_signal():
        print("[split] 无拆分信号(.py 无删除/重命名)，跳过")
        return 0
    return run_split_checks()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
