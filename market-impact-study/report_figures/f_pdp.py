"""图：部分依赖(PDP)——梯度提升树下 杠杆/成长/盈利 对超额估值的边际形状。"""
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
cols = VL.select_features(x_full, y, df["ts_code"], cols_all)
x = x_full[cols]
params = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))["gbt_params"]
gbt = VL.fit_gbt(x, y, cols, params)

panels = [
    ("f_debt_to_assets", "资产负债率（杠杆）", True),
    ("f_rev_cagr3", "营收 3 年复合增速（成长）", False),
    ("f_net_margin", "净利率（盈利）", False),
]
fig, axes = plt.subplots(1, 3, figsize=(12.4, 4.4))
for ax, (col, name, constrained) in zip(axes, panels):
    xv = x[col].to_numpy()
    grid = np.linspace(np.percentile(xv, 2), np.percentile(xv, 98), 40)
    pd_vals = []
    Xs = x.copy()
    for g in grid:
        Xs[col] = g
        pd_vals.append(gbt.predict(Xs).mean())
    pd_vals = np.array(pd_vals) - np.mean(pd_vals)  # 居中
    ax.plot(grid, pd_vals, color=C["accent"], lw=2.6, zorder=3)
    ax.axhline(0, color="#C8D0DA", lw=1, ls=":")
    # 底部 rug：实际观测分布
    ax.plot(xv, np.full_like(xv, pd_vals.min()), "|", color="#9AA7B8", ms=6, alpha=0.5)
    tag = "（含单调约束）" if constrained else "（数据决定形状）"
    ax.set_title(f"{name}{tag}", fontsize=11.5, color=C["ink"])
    ax.set_xlabel("特征取值（缩尾后）", fontsize=10.5)
    ax.set_ylabel("部分依赖（对超额估值）", fontsize=10.5)
    ax.tick_params(labelsize=9.5)
fig.tight_layout()
fig.savefig(f"{FIG}/F_部分依赖.png", bbox_inches="tight")
print("saved F_部分依赖")
