"""图：特征组消融——逐步加入特征组的留一家 R²,带按公司重抽的置信带(诚实显示小样本噪声)。"""
import sys
sys.path.insert(0, "market-impact-study")
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
import build_valuation_model as VL
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"

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

G_LEV = ["f_debt_to_assets"]
G_GROW = ["f_rev_cagr3", "f_rev_yoy", "f_dt_ni_yoy"]
G_PROF = ["f_net_margin", "f_asset_turn", "f_rd_intensity", "f_quick_ratio", "f_finaexp_ratio", "f_fa_turn"]
G_MKT = ["liq_volratio", "liq_amplitude", "liq_amihud", "chip_holder_yoy", "nf_north_ratio", "nf_margin_ratio", "nf_inst_top10"]
steps = [
    ("仅杠杆", G_LEV),
    ("＋成长", G_LEV + G_GROW),
    ("＋盈利与质量", G_LEV + G_GROW + G_PROF),
    ("＋市场结构（全部）", G_LEV + G_GROW + G_PROF + G_MKT),
]


def lofo_pred(cols):
    pred = np.full(len(y), np.nan)
    for f in pd.unique(groups):
        m = groups != f
        if m.sum() < 30:
            continue
        pred[~m] = VL.fit_gbt(x_full[m][cols], y[m], cols, params).predict(x_full[~m][cols])
    return pred


firms = pd.unique(groups)
rng = np.random.RandomState(0)
labels, point, lo_ci, hi_ci = [], [], [], []
for name, cols in steps:
    pred = lofo_pred(cols)
    ok = ~np.isnan(pred)
    a, p, g = y[ok], pred[ok], groups[ok]
    point.append(r2_score(a, p))
    # 按公司整块重抽,得 R² 置信带(不重拟合,诚实反映 14 家的抽样方差)
    boots = []
    for _ in range(3000):
        samp = rng.choice(firms, size=len(firms), replace=True)
        idx = np.concatenate([np.where(g == s)[0] for s in samp])
        boots.append(r2_score(a[idx], p[idx]))
    lo_ci.append(np.percentile(boots, 5))
    hi_ci.append(np.percentile(boots, 95))
    labels.append(name)

xs = np.arange(len(steps))
fig, ax = plt.subplots(figsize=(8.8, 4.8))
point = np.array(point); lo_ci = np.array(lo_ci); hi_ci = np.array(hi_ci)
ax.fill_between(xs, lo_ci, hi_ci, color=C["accent"], alpha=0.16, label="按公司重抽 90% 区间")
ax.plot(xs, point, "-o", color=C["accent"], lw=2.4, ms=9, mec="white", mew=1.0, zorder=4, label="留一家 $R^2$")
for x, v in zip(xs, point):
    ax.text(x, v + 0.03, f"{v:.2f}", ha="center", fontsize=11, color=C["ink"], fontweight="bold")
ax.axhline(0, color="#9AA7B8", lw=1, ls=":")
ax.set_xticks(xs)
ax.set_xticklabels(labels, fontsize=11)
ax.set_ylabel("留一家外推 $R^2$", fontsize=12)
ax.set_title("逐步加入特征组的样本外解释力", fontsize=12.5, color=C["ink"])
ax.legend(loc="lower right", fontsize=10.5, frameon=True)
ax.tick_params(axis="y", labelsize=10.5)
fig.tight_layout()
fig.savefig(f"{FIG}/F_消融.png", bbox_inches="tight")
print("saved F_消融  point=", [round(v, 3) for v in point])
