"""图：结论森林图——三条驱动的标准化效应 + Bell-McCaffrey 95% 区间,颜色标判定。"""
import json
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
d = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))
lofo = d["lofo_r2"]
T = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/drivers_triangulation.json"))

# (标签, JSON键, β键, 判定文字, 是否确证)
rows = [
    ("资产负债率（杠杆）", "H2", "beta", "5/5 确证", True),
    ("营收增长", "H1", "slope", "5/5 确证", True),
    ("净利率（营收残差化）", "H3", "beta", "1/5 未支持", False),
]
fig, ax = plt.subplots(figsize=(9.4, 5.6))
ys = np.arange(len(rows))[::-1]  # 从上到下
for y, (lab, hk, bk, verdict, ok) in zip(ys, rows):
    r = T[hk]
    beta = r[bk]
    se, dof = r["se_cr2"], r["dof_bm"]
    half = float(stats.t.ppf(0.975, dof)) * se
    col = C["pass_"] if ok else C["fail"]
    ax.errorbar(beta, y, xerr=half, fmt="o", color=col, ecolor=col, elinewidth=3.0,
                capsize=6, ms=14, mec="white", mew=1.2, zorder=4)
    ax.text(beta, y + 0.18, f"$\\beta={beta:+.2f}$  [{beta-half:+.2f}, {beta+half:+.2f}]",
            ha="center", va="bottom", fontsize=12.5, color=C["ink"])
    ax.text(1.02, y, verdict, transform=ax.get_yaxis_transform(), va="center",
            fontsize=14, color=col, fontweight="bold")
ax.axvline(0, color=C["ink"], lw=1.5, ls="--", zorder=1)
ax.set_yticks(ys)
ax.set_yticklabels([r[0] for r in rows], fontsize=15)
ax.set_ylim(-0.6, len(rows) - 0.25)
ax.set_xlabel("标准化效应 $\\beta$（对超额估值）", fontsize=15)
ax.tick_params(axis="x", labelsize=12.5)
ax.set_xlim(-0.85, 0.75)
ax.text(0.01, 0.02, f"横线为 Bell-McCaffrey 95% 区间；样本外 $R^2\\approx{lofo:.2f}$（基本面解释约一半）",
        transform=ax.transAxes, fontsize=11, color="#6B7785", style="italic")
fig.tight_layout()
fig.savefig(f"{FIG}/F_森林图.png", bbox_inches="tight")
print("saved F_森林图")
