"""F8 重做：特征与目标的算术耦合诊断。论证"为何必须做机械相关性约束审查"。

机械相关 = 特征公式与 Y=log(市值/营收) 共用营收或市值分量 → ratio variables 伪相关，非经济信号。
"""
import json
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
ar = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/attribution_rigorous.json"))
gc = ar["group_cleanliness_definitional"]

NONE_, REV, MV = C["pass_"], "#E0A03C", C["fail"]   # 无耦合 / 含营收 / 含市值
groups = sorted(gc.keys(), key=lambda g: gc[g]["clean_frac"])
indep = [gc[g]["干净"] for g in groups]
rev = [gc[g]["含营收"] for g in groups]
mv = [gc[g]["含市值"] for g in groups]

fig, ax = plt.subplots(figsize=(10.0, 5.8))
y = np.arange(len(groups))
ax.barh(y, indep, color=NONE_, alpha=0.9, edgecolor="white")
ax.barh(y, rev, left=indep, color=REV, alpha=0.9, edgecolor="white")
ax.barh(y, mv, left=np.array(indep) + np.array(rev), color=MV, alpha=0.9, edgecolor="white")
for i in range(len(groups)):
    seg = [(indep[i], NONE_, 0), (rev[i], REV, indep[i]), (mv[i], MV, indep[i] + rev[i])]
    for n, col, left in seg:
        if n > 0:
            ax.text(left + n / 2, i, str(int(n)), va="center", ha="center",
                    fontsize=9.5, color="white", fontweight="bold")
    tot = indep[i] + rev[i] + mv[i]
    frac = gc[groups[i]]["clean_frac"]
    ax.text(tot + 0.12, i, f"无耦合占比 {frac:.0%}", va="center", fontsize=9.5,
            color=NONE_ if frac == 1 else "#6B7785",
            fontweight="bold" if frac == 1 else "normal")
ax.set_yticks(y); ax.set_yticklabels(groups, fontsize=11)
ax.set_xlim(0, max(indep[i] + rev[i] + mv[i] for i in range(len(groups))) + 3.2)
ax.set_xlabel("特征个数", fontsize=12.5)
ax.tick_params(labelsize=11)
ax.legend(handles=[
    Patch(facecolor=NONE_, label="无算术耦合（定义独立）"),
    Patch(facecolor=REV, label="机械相关·含营收"),
    Patch(facecolor=MV, label="机械相关·含市值"),
], loc="lower right", fontsize=10, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F8_算术耦合诊断.png", bbox_inches="tight")
print("saved F8_算术耦合诊断")
