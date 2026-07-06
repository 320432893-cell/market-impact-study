"""图：R²阶梯——从样本内拟合到真外推,解释力逐级落到约0.45。"""
import json
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
L = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/ch8_diag.json"))["ladder"]

items = [("样本内\n(拟合已知公司)", L["insample"], C["peer"]),
         ("分组交叉验证\n(留出公司)", L["groupcv"], C["accent"]),
         ("留时段外推\n(OOT)", L["oot"], C["accent"]),
         ("留一家外推\n(LOFO)", L["lofo"], C["yiwei"])]
labels = [a for a, _, _ in items]
vals = [b for _, b, _ in items]
cols = [c for _, _, c in items]

fig, ax = plt.subplots(figsize=(9, 5.0))
bars = ax.bar(range(len(items)), vals, color=cols, alpha=0.9, edgecolor="white", width=0.62)
for i, v in enumerate(vals):
    ax.text(i, v + 0.015, f"{v:.2f}", ha="center", fontsize=12, fontweight="bold", color=C["ink"])
ax.axhline(L["insample"], color=C["peer"], ls=":", lw=1, alpha=0.6)
ax.annotate("", xy=(0.5, L["groupcv"] + 0.01), xytext=(0.5, L["insample"] - 0.01),
            arrowprops=dict(arrowstyle="<->", color="#6B7785", lw=1.3))
ax.text(0.62, (L["insample"] + L["groupcv"]) / 2, "从“拟合”到“真外推”\n落差≈过拟合", fontsize=10,
        color="#6B7785", va="center")
ax.set_xticks(range(len(items)))
ax.set_xticklabels(labels, fontsize=10.5)
ax.set_ylabel("$R^2$", fontsize=12.5)
ax.set_ylim(0, 1.0)
ax.tick_params(axis="y", labelsize=11)
ax.text(0.0, -0.20, "灰=样本内(诊断,非性能)；蓝/红=样本外(性能)", transform=ax.transAxes,
        fontsize=10, color="#6B7785")
fig.savefig(f"{FIG}/F_R2阶梯.png", bbox_inches="tight")
print("saved F_R2阶梯")
