"""图：残差诊断——留一家外推残差 vs 拟合值 + 逐家残差分布。"""
import sys
sys.path.insert(0, "market-impact-study")
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import build_valuation_model as VL
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
NAME = {"002313": "日海智能", "002869": "金溢科技", "002881": "美格智能", "002970": "锐明技术",
        "300098": "高新兴", "300552": "万集科技", "300590": "移为通信", "300638": "广和通",
        "301608": "博实结", "603236": "移远通信", "688080": "映翰通", "688159": "有方科技",
        "688618": "三旺通信", "920249": "利尔达"}

df = VL.build_panel()
cols_all = list(VL.DRIVERS)
for c in cols_all:
    df[c] = pd.to_numeric(df[c], errors="coerce")
df = df.dropna(subset=["ps"]).reset_index(drop=True)
med = df[cols_all].median()
x_full = df[cols_all].fillna(med).fillna(0.0)
lo, hi = x_full.quantile(0.02), x_full.quantile(0.98)
x_full = x_full.clip(lower=lo, upper=hi, axis=1)
y = VL.excess_valuation(df)
groups = df["ts_code"].to_numpy()
params = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))["gbt_params"]

pred = np.full(len(y), np.nan)
for f in pd.unique(groups):
    m = groups != f
    if m.sum() < 30:
        continue
    kept = VL.select_features(x_full[m], y[m], df["ts_code"][m], cols_all)
    pred[~m] = VL.fit_gbt(x_full[m][kept], y[m], kept).predict(x_full[~m][kept])
ok = ~np.isnan(pred)
resid = y[ok] - pred[ok]
fit_v = pred[ok]
codes = np.array([g.split(".")[0] for g in groups[ok]])
yw = codes == "300590"

fig, axes = plt.subplots(1, 2, figsize=(12.4, 5.0), gridspec_kw={"width_ratios": [1, 1.25]})
ax = axes[0]
ax.scatter(fit_v[~yw], resid[~yw], s=16, color=C["peer"], alpha=0.4, edgecolor="none")
ax.scatter(fit_v[yw], resid[yw], s=42, color=C["yiwei"], alpha=0.9, edgecolor="white", linewidth=0.5, label="移为通信")
ax.axhline(0, color=C["ink"], lw=1.2, ls="--")
ax.set_xlabel("拟合值（留一家外推预测）", fontsize=11.5)
ax.set_ylabel("残差（实际 $-$ 预测）", fontsize=11.5)
ax.set_title("残差 vs 拟合：无明显结构", fontsize=12, color=C["ink"])
ax.legend(loc="upper right", fontsize=10, frameon=True)
ax.tick_params(labelsize=10)

ax = axes[1]
order = sorted(pd.unique(codes), key=lambda c: np.median(resid[codes == c]))
data = [resid[codes == c] for c in order]
labels = [NAME.get(c, c) for c in order]
bp = ax.boxplot(data, vert=False, widths=0.6, patch_artist=True, showfliers=False)
for i, patch in enumerate(bp["boxes"]):
    patch.set_facecolor(C["yiwei"] if order[i] == "300590" else C["peer"])
    patch.set_alpha(0.75)
for med_line in bp["medians"]:
    med_line.set_color(C["ink"])
ax.axvline(0, color=C["ink"], lw=1.2, ls="--")
ax.set_yticklabels(labels, fontsize=9.5)
ax.set_xlabel("残差（实际 $-$ 预测）", fontsize=11.5)
ax.set_title("逐家残差分布：个别公司系统性偏差", fontsize=12, color=C["ink"])
ax.tick_params(axis="x", labelsize=10)
fig.tight_layout()
fig.savefig(f"{FIG}/F_残差诊断.png", bbox_inches="tight")
print(f"saved F_残差诊断  resid_mean={resid.mean():.3f} std={resid.std():.3f}")
