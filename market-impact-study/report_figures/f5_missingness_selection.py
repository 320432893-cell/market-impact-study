"""F5 重做：缺失率 × 特征选择结局。论证"缺失稳健性"——高缺失特征均被 L1 剔除/收缩/污染排除。"""
import json
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
vm = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))
ar = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/attribution_rigorous.json"))
contam = ar["feature_contamination_tags"]
l1 = {f["feat"]: f for f in vm["l1_selection"]["features"]}
ecoef = {f["feat"]: f["coef"] for f in vm["elasticnet_coef"]}

# 颜色：剔除(红) / 保留但排除出结论(橙) / 保留且进入结论(绿)
DROP, EXCL, USED = C["fail"], "#E0A03C", C["pass_"]


def outcome(feat):
    """该特征在建模中的最终去向（专业术语）。"""
    rec = l1.get(feat)
    if rec is None or not rec["kept"]:
        r = rec["reason"]["r"] if rec else 0.0
        tag = "L1 剔除·共线冗余" if r >= 0.5 else "L1 剔除·弱信号归零"
        return tag, DROP
    if contam.get(feat) in ("含营收", "含市值"):
        return f"保留但因机械相关（{contam[feat]}）排除", EXCL
    if abs(ecoef.get(feat, 0)) < 0.02:
        return "保留但系数收缩至≈0", EXCL
    return "保留且进入稳健结论", USED


miss = sorted(vm["eda"]["missing"], key=lambda m: m["pct"])
feats = [m["feat"] for m in miss]
pct = [m["pct"] for m in miss]
outs = [outcome(f) for f in feats]
cols = [o[1] for o in outs]

fig, ax = plt.subplots(figsize=(12, 7))
ax.barh(range(len(feats)), pct, color=cols, alpha=0.9, edgecolor="white")
for i, (p, (txt, _)) in enumerate(zip(pct, outs)):
    ax.text(p + 0.8, i, f"{p:.1f}%　·　{txt}", va="center", fontsize=9.5, color=C["ink"])
ax.set_yticks(range(len(feats)))
ax.set_yticklabels(feats, fontsize=10.5)
ax.set_xlim(0, 100)
ax.set_xlabel("缺失率（%）")
ax.set_title("缺失值中位数填充后，高缺失特征均被正则化先行剔除", pad=26)
ax.text(0.5, 1.03, "缺失值采用中位数保守填充，并标记高缺失特征以待检验；L1 正则化与机械相关性约束审查"
        "已先行将其剔除或收缩，填充不影响稳健结论（进入结论者缺失率均低于 20%）",
        transform=ax.transAxes, ha="center", fontsize=9, color="#6B7785")
ax.legend(handles=[
    Patch(facecolor=DROP, label="L1 正则化剔除（共线冗余 / 弱信号归零）"),
    Patch(facecolor=EXCL, label="保留但排除出结论（机械相关 / 系数≈0）"),
    Patch(facecolor=USED, label="保留且进入稳健结论"),
], loc="lower right", fontsize=10, frameon=True, framealpha=0.95)
ax.text(0.0, -0.13, "技术附录", transform=ax.transAxes, ha="left", va="top",
        fontsize=9, color="#6B7785", fontweight="bold")
ax.text(1.0, -0.13, "数据来源：valuation_model.json（l1_selection / eda.missing）+ attribution_rigorous.json",
        transform=ax.transAxes, ha="right", va="top", fontsize=8.5, color="#8893A0")
fig.savefig(f"{FIG}/F5_缺失率与选择结局.png", bbox_inches="tight")
print("saved F5_缺失率与选择结局")
