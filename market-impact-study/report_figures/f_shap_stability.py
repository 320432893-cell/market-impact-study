"""图：SHAP 描述性重要性 + 聚类自助稳定性区间——按选中频率分稳/不稳,诚实暴露14簇下的高方差。"""
import json
import numpy as np
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
sb = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/stability_bootstrap.json"))
sel = set(json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))["selected_features"])
rows = [r for r in sb["features"] if r["shap_median"] is not None and r["feat"] in sel]
rows.sort(key=lambda r: r["shap_median"])

feats = [r["feat"] for r in rows]
med = [r["shap_median"] for r in rows]
lo = [r["shap_ci"][0] for r in rows]
hi = [r["shap_ci"][1] for r in rows]
freq = [r["select_freq"] for r in rows]

fig, ax = plt.subplots(figsize=(9.2, 7.0))
for i, (m, l, h, f) in enumerate(zip(med, lo, hi, freq)):
    stable = f >= 0.8
    col = C["accent"] if stable else C["peer"]
    ax.plot([l, h], [i, i], color=col, lw=2.2 if stable else 1.6, alpha=0.85,
            solid_capstyle="round", zorder=2)
    ax.scatter([m], [i], s=70 if stable else 45, color=col, edgecolor="white",
               linewidth=1, zorder=3)
    ax.text(h + 0.004, i, f"选中 {f:.0%}", va="center", fontsize=9,
            color=C["ink"] if stable else "#8893A0",
            fontweight="bold" if stable else "normal")
ax.set_yticks(range(len(feats)))
ax.set_yticklabels(feats, fontsize=10.5)
for t, f in zip(ax.get_yticklabels(), freq):
    if f >= 0.8:
        t.set_fontweight("bold")
ax.set_xlim(0, max(hi) * 1.22)
ax.set_xlabel("SHAP 重要性（聚类自助下的中位与 $5\\!-\\!95\\%$ 区间）", fontsize=12)
ax.tick_params(axis="x", labelsize=10.5)
ax.scatter([], [], color=C["accent"], s=70, label="稳定（自助选中 $\\geq80\\%$）")
ax.scatter([], [], color=C["peer"], s=45, label="较不稳（$50\\!-\\!80\\%$）")
ax.legend(loc="lower right", fontsize=10.5, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F_SHAP稳定性.png", bbox_inches="tight")
print("saved F_SHAP稳定性  n=", len(feats))
