"""图：偏差-方差甜区——样本内R²随树复杂度单调升、分组交叉验证R²见顶后回落,最优落在浅档。"""
import json
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
d = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/ch8_diag.json"))
sw = d["sweep"]
nl = [s["num_leaves"] for s in sw]
ins = [s["insample"] for s in sw]
cv = [s["cv"] for s in sw]
chosen = d["ladder"]["chosen_num_leaves"]

fig, ax = plt.subplots(figsize=(9, 5.2))
ax.plot(nl, ins, "-o", color=C["accent"], lw=2.4, ms=6, label="样本内 $R^2$（对已知公司的拟合）")
ax.plot(nl, cv, "-s", color=C["yiwei"], lw=2.4, ms=6, label="分组交叉验证 $R^2$（对新公司的外推）")
ax.set_xscale("log")
ax.set_xticks(nl)
ax.get_xaxis().set_major_formatter(mtick.ScalarFormatter())
ax.minorticks_off()
# 甜区竖线 + 标注
jc = nl.index(chosen)
ax.axvline(chosen, color=C["ink"], ls="--", lw=1.3)
ax.annotate(f"甜区：选定 {chosen} 叶\n（交叉验证 $R^2$ 最高）", xy=(chosen, cv[jc]),
            xytext=(chosen * 1.3, 0.62), fontsize=11, color=C["ink"], fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=C["ink"], lw=1.2))
ax.text(nl[-1], ins[-1] + 0.01, "树越深→样本内越高\n但外推回落＝过拟合", fontsize=10,
        color="#6B7785", ha="right", va="bottom")
ax.set_xlabel("树复杂度：叶节点数（对数刻度，越大越复杂）", fontsize=12)
ax.set_ylabel("$R^2$", fontsize=12.5)
ax.set_ylim(0.3, 1.0)
ax.tick_params(labelsize=10.5)
ax.legend(loc="center left", fontsize=10.5, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F_甜区.png", bbox_inches="tight")
print("saved F_甜区")
