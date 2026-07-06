"""图：三角验证矩阵——3 条预登记假设 × 多种少簇稳健方法,绿=支持/红=不支持,一眼看 H1/H2 全过、H3 不过。"""
import json
import numpy as np
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
t = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/drivers_triangulation.json"))

rows = [("H1 成长折价", t["H1"]), ("H2 低杠杆溢价", t["H2"]), ("H3 盈利", t["H3"])]
cols = ["WCB\np值", "CR2\np值", "Romano\n-Wolf p", "贝叶斯\n95%区间",
        "组内\nFE", "安慰剂", "留一家", "综合\n判定"]

GREEN, RED = "#2E8B6F", "#C7543B"


def cell(h, j):
    p = h["passes"]
    ci = h["bayes"]["ci95"]
    ci_excl0 = (ci[0] < 0 and ci[1] < 0) or (ci[0] > 0 and ci[1] > 0)
    data = [
        (f"{h['p_wcb']:.3f}", h["p_wcb"] < 0.05),
        (f"{h['p_cr2']:.3f}", h["p_cr2"] < 0.05),
        (f"{h['p_romano_wolf']:.3f}", h["p_romano_wolf"] < 0.05),
        (f"[{ci[0]:.2f},{ci[1]:.2f}]", ci_excl0),
        ("一致" if p["识别"] else "不一致", p["识别"]),
        ("通过" if p["证伪"] else "未过", p["证伪"]),
        ("一致" if p["泛化"] else "弱", p["泛化"]),
        (h["verdict"].split("(")[1].split(")")[0] if "(" in h["verdict"] else h["verdict"], "可信" in h["verdict"]),
    ]
    return data[j]


fig, ax = plt.subplots(figsize=(12.0, 3.7))
nr, nc = len(rows), len(cols)
for j, c in enumerate(cols):
    ax.text(j + 0.5, nr + 0.18, c, ha="center", va="bottom", fontsize=10, fontweight="bold", color=C["ink"])
for i, (rname, h) in enumerate(rows):
    yy = nr - 1 - i
    ax.text(-0.12, yy + 0.5, rname, ha="right", va="center", fontsize=11, fontweight="bold", color=C["ink"])
    for j in range(nc):
        txt, ok = cell(h, j)
        face = GREEN if ok else RED
        ax.add_patch(plt.Rectangle((j, yy), 1, 1, facecolor=face, alpha=0.16, edgecolor="white", lw=2))
        ax.text(j + 0.5, yy + 0.5, txt, ha="center", va="center", fontsize=10,
                color=(GREEN if ok else RED), fontweight="bold")
ax.set_xlim(-2.0, nc)
ax.set_ylim(0, nr + 0.6)
ax.axis("off")
ax.text(-2.0, -0.35, "绿=支持该假设　红=不支持；有效独立簇约 5（少簇，故用上述多法交叉）",
        fontsize=9.5, color="#6B7785", ha="left")
fig.savefig(f"{FIG}/F_三角验证.png", bbox_inches="tight")
print("saved F_三角验证")
