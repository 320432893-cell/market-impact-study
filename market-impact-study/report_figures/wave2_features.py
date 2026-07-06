"""Wave2：F8 污染标记(附录) / F9 L1 剔除(主) / F10 入选系数(主)。"""
import json
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
vm = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))


def save(fig, ax, name, src, tag, credit_y=-0.16):
    ax.text(0.0, credit_y, tag, transform=ax.transAxes, ha="left", va="top",
            fontsize=9, color="#6B7785", fontweight="bold")
    ax.text(1.0, credit_y, f"数据来源：{src}", transform=ax.transAxes,
            ha="right", va="top", fontsize=8.5, color="#8893A0")
    fig.savefig(f"{FIG}/{name}.png", bbox_inches="tight")
    plt.close(fig)
    print("saved", name)


# ---------- F9 L1 剔除（主报告，双栏紧凑版）----------
dropped = sorted([f for f in vm["l1_selection"]["features"] if not f["kept"]],
                 key=lambda f: -f["reason"]["r"])      # r 从高到低
half = (len(dropped) + 1) // 2
panels = [dropped[:half], dropped[half:]]              # 左栏高 r、右栏低 r
fig, axes = plt.subplots(1, 2, figsize=(12.8, 10.6))
for ax, items in zip(axes, panels):
    items = sorted(items, key=lambda f: f["reason"]["r"])   # 每栏内升序→高 r 在上
    rs = [f["reason"]["r"] for f in items]
    labels = [f"{f['feat']}  →  {f['reason']['with']}" for f in items]
    cols = [C["fail"] if r >= 0.5 else "#9AA7B8" for r in rs]
    ax.barh(range(len(items)), rs, color=cols, alpha=0.9, edgecolor="white", height=0.62)
    for i, r in enumerate(rs):
        ax.text(r + 0.02, i, f"{r:.2f}", va="center", fontsize=13, color=C["ink"])
    ax.axvline(0.5, color=C["ink"], ls="--", lw=1.3)
    ax.set_yticks(range(len(items)))
    ax.set_yticklabels(labels, fontsize=13.5)
    ax.set_ylim(-0.8, len(items) - 0.2)
    ax.set_xlim(0, 1.18)
    ax.set_xlabel("与最相关保留特征的相关系数 $r$", fontsize=14)
    ax.tick_params(axis="x", labelsize=12.5)
axes[0].text(0.52, len(panels[0]) - 1.3, "共线阈值 0.50", fontsize=12.5, color=C["ink"])
axes[1].legend(handles=[Patch(facecolor=C["fail"], label="高共线冗余（$r\\geq0.5$）"),
                        Patch(facecolor="#9AA7B8", label="弱信号归零（$r<0.5$）")],
               loc="lower right", fontsize=13, frameon=True, framealpha=0.95)
fig.tight_layout(w_pad=3.0)
fig.savefig(f"{FIG}/F9_L1特征选择剔除.png", bbox_inches="tight")
plt.close(fig)
print("saved F9_L1特征选择剔除 (2-col)")


# ---------- F10 入选特征的白盒线性系数（纯图，说明走 LaTeX 图注）----------
ec = sorted(vm["elasticnet_coef"], key=lambda f: f["coef"])
feats = [f["feat"] for f in ec]
coefs = [f["coef"] for f in ec]
cols = [C["pass_"] if c > 0 else C["fail"] for c in coefs]
fig, ax = plt.subplots(figsize=(10.5, 7.2))
ax.barh(range(len(ec)), coefs, color=cols, alpha=0.9, edgecolor="white")
for i, c in enumerate(coefs):
    ax.text(c + (0.006 if c >= 0 else -0.006), i, f"{c:+.3f}", va="center",
            ha="left" if c >= 0 else "right", fontsize=10, color=C["ink"])
ax.axvline(0, color=C["ink"], lw=1.1)
ax.set_yticks(range(len(ec)))
ax.set_yticklabels(feats, fontsize=11)
ax.set_xlim(-0.32, 0.30)
ax.set_xlabel("白盒线性模型（ElasticNet）标准化系数", fontsize=12.5)
ax.tick_params(axis="x", labelsize=11)
ax.legend(handles=[Patch(facecolor=C["pass_"], label="正向（指标高 → 估值溢价）"),
                   Patch(facecolor=C["fail"], label="负向（指标高 → 估值折让）")],
          loc="lower right", fontsize=10.5, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F10_入选特征系数.png", bbox_inches="tight")
plt.close(fig)
print("saved F10_入选特征系数 (plot-only)")


# F8 已迁出并重做：见 f8_arithmetic_coupling.py（措辞改为「机械相关/算术耦合」，并印上定义）。
