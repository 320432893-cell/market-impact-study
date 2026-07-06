"""统一图风格 + 中文字体（黑体）。ML 报告所有图 import 它。

字体取自 Windows（WSL2 下挂载）；换机器时改 _FONT 指向任一中文 ttf 即可。
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import seaborn as sns

_FONT = "/mnt/c/Windows/Fonts/simhei.ttf"
fm.fontManager.addfont(_FONT)
_NAME = fm.FontProperties(fname=_FONT).get_name()

# 配色：移为高亮 / 同行灰 / 过验证绿 / 证伪红 / 中性蓝
C = dict(
    yiwei="#D8443C",      # 移为高亮（暖红）
    peer="#9AA7B8",       # 同行（冷灰蓝）
    pass_="#2E8B6F",      # 过验证 / 正向（绿）
    fail="#C7543B",       # 证伪 / 负向（红）
    accent="#2F6DB5",     # 主蓝
    grid="#D9DEE6",
    ink="#22303F",        # 文字深灰
)


def setup():
    sns.set_theme(style="whitegrid", context="talk")
    plt.rcParams.update({
        "font.family": _NAME,
        "axes.unicode_minus": False,
        "axes.edgecolor": C["ink"],
        "axes.labelcolor": C["ink"],
        "text.color": C["ink"],
        "xtick.color": C["ink"],
        "ytick.color": C["ink"],
        "grid.color": C["grid"],
        "axes.titlesize": 18,
        "axes.titleweight": "bold",
        "figure.dpi": 130,
        "savefig.bbox": "tight",
    })
