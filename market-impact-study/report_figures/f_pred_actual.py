"""图：留一家外推 预测 vs 实际——每点一个公司-报告期,移为高亮,对角线为完美预测。"""
import json
import numpy as np
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
vm = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))
pa = vm["pred_actual"]
lofo = vm["lofo_r2"]
a = np.array([d["a"] for d in pa])
p = np.array([d["p"] for d in pa])
yw = np.array([d["yw"] for d in pa])

fig, ax = plt.subplots(figsize=(7.4, 6.4))
lim = [min(a.min(), p.min()) - 0.2, max(a.max(), p.max()) + 0.2]
ax.plot(lim, lim, ls="--", color="#9AA7B8", lw=1.3, zorder=1)
ax.text(lim[1] - 0.05, lim[1] - 0.05, "完美预测线", color="#6B7785", fontsize=10, ha="right", va="top", rotation=45)
# 拟合趋势线(展示"抓住方向")
b1, b0 = np.polyfit(a, p, 1)
xs = np.array(lim)
ax.plot(xs, b1 * xs + b0, color=C["accent"], lw=2.2, zorder=3, label="实际拟合趋势")
ax.scatter(a[~yw], p[~yw], s=14, color=C["peer"], alpha=0.35, edgecolor="none", zorder=2, label="其余 13 家")
ax.scatter(a[yw], p[yw], s=62, color=C["yiwei"], alpha=0.92, edgecolor="white", linewidth=0.6,
           zorder=5, label="移为通信")
ax.set_xlim(lim)
ax.set_ylim(lim)
ax.set_aspect("equal")
ax.set_xlabel("实际超额估值 $Y$", fontsize=12.5)
ax.set_ylabel("留一家外推预测 $\\hat{Y}$", fontsize=12.5)
ax.tick_params(labelsize=11)
ax.text(0.04, 0.97, f"留一家 $R^2 \\approx {lofo:.2f}$", transform=ax.transAxes,
        fontsize=13, color=C["ink"], va="top", fontweight="bold")
ax.text(0.04, 0.90, "趋势对、散布大：\n方向抓住，约能解释一半", transform=ax.transAxes,
        fontsize=10.5, color="#6B7785", va="top")
ax.legend(loc="lower right", fontsize=10, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F_预测实际.png", bbox_inches="tight")
print("saved F_预测实际  n=", len(a), "lofo=", lofo)
