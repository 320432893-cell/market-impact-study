"""图：白盒(ElasticNet系数) vs 黑盒(GBT的SHAP方向) 逐特征方向对照——落在同象限=两模型同向。"""
import sys
sys.path.insert(0, "market-impact-study")
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap
import build_valuation_model as VL
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"

# 重建已缩尾、已选特征的建模数据，拟合 GBT，算 SHAP
df = VL.build_panel()
cols_all = list(VL.DRIVERS)
for c in cols_all:
    df[c] = pd.to_numeric(df[c], errors="coerce")
df = df.dropna(subset=["ps"]).reset_index(drop=True)
med = df[cols_all].median()
xf = df[cols_all].fillna(med).fillna(0.0)
lo, hi = xf.quantile(0.02), xf.quantile(0.98)
xf = xf.clip(lower=lo, upper=hi, axis=1)
y = VL.excess_valuation(df)
cols = VL.select_features(xf, y, df["ts_code"], cols_all)
x = xf[cols]
params = json.loads(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json").read())["gbt_params"]
gbt = VL.fit_gbt(x, y, cols, params)
sv = shap.TreeExplainer(gbt).shap_values(x)
# GBT 经验方向 = 特征值与其 SHAP 的相关号（标准化到[-1,1]）
disp = {c: VL.DRIVERS[c][0] for c in cols}
gbt_dir = {}
for j, c in enumerate(cols):
    xv = x[c].to_numpy()
    s = sv[:, j]
    gbt_dir[disp[c]] = float(np.corrcoef(xv, s)[0, 1]) if xv.std() > 1e-9 and s.std() > 1e-9 else 0.0
en = {f["feat"]: f["coef"] for f in json.loads(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json").read())["elasticnet_coef"]}

feats = list(disp.values())
ex = np.array([en[f] for f in feats])
gx = np.array([gbt_dir[f] for f in feats])
agree = np.sign(ex) == np.sign(gx)

fig, ax = plt.subplots(figsize=(8.2, 6.6))
ax.axhline(0, color="#C8D0DA", lw=1.1)
ax.axvline(0, color="#C8D0DA", lw=1.1)
# 同向象限淡绿底
ax.axspan = None
for xx, yy, f, ok in zip(ex, gx, feats, agree):
    col = C["pass_"] if ok else C["fail"]
    ax.scatter(xx, yy, s=64, color=col, edgecolor="white", linewidth=0.8, zorder=3)
from adjustText import adjust_text
texts = [ax.text(ex[i], gx[i], feats[i], fontsize=8.5, color=C["ink"]) for i in range(len(feats))]
adjust_text(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="#B8C0CA", lw=0.5))
ax.set_xlabel("白盒线性系数（ElasticNet 标准化）", fontsize=12)
ax.set_ylabel("黑盒树方向（特征值与其 SHAP 的相关）", fontsize=12)
ax.tick_params(labelsize=10.5)
n_ok = int(agree.sum())
ax.text(0.03, 0.97, f"{n_ok}/{len(feats)} 个特征两模型同向\n（点落在左下/右上=方向一致）",
        transform=ax.transAxes, va="top", fontsize=11, color=C["ink"], fontweight="bold")
ax.scatter([], [], color=C["pass_"], s=64, label="方向一致")
ax.scatter([], [], color=C["fail"], s=64, label="方向相反")
ax.legend(loc="lower right", fontsize=10, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F_白盒黑盒.png", bbox_inches="tight")
print(f"saved F_白盒黑盒  同向 {n_ok}/{len(feats)}")
