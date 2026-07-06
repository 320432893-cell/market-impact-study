# tier: 小件
"""导出 CFO deck 原生图表所需数据(与主模型完全同口径,种子/预处理复刻 build_valuation_model 主流程)。

产物(供 build_cfo_dashboard.py 标准库读取):
- data/processed/modeling/cate_14firm/l1_path.json   L1 正则化路径(CV MSE ± SE、保留特征数、选定 α*)
- data/processed/modeling/cate_14firm/size_bins.json 规模6档 × 剥年后 log(PS) 均值±SE(论证"剥规模"必要性)
"""
import sys

sys.path.insert(0, "market-impact-study")
import json

import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV, lasso_path
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import StandardScaler

import build_valuation_model as m

ROOT = "market-impact-study"
OUT = f"{ROOT}/data/processed/modeling/cate_14firm"

df = m.build_panel()
cols_all = list(m.DRIVERS)
for c in cols_all:
    df[c] = pd.to_numeric(df[c], errors="coerce")
df = df.dropna(subset=["ps"]).reset_index(drop=True)

# ---- 与主流程 575-586 行完全一致的 X 预处理 ----
med = df[cols_all].median()
x_full = df[cols_all].fillna(med).fillna(0.0)
_lo, _hi = x_full.quantile(0.02), x_full.quantile(0.98)
x_full = x_full.clip(lower=_lo, upper=_hi, axis=1)
y = m.excess_valuation(df)
groups = df["ts_code"]

# ---- L1 路径(同 select_features 协议:GroupKFold(5) + LassoCV 种子 RNG)----
xs = StandardScaler().fit_transform(x_full[cols_all])
splits = list(GroupKFold(5).split(xs, y, groups))
las = LassoCV(cv=splits, random_state=m.RNG, max_iter=50000, n_jobs=2).fit(xs, y)
alphas = las.alphas_
mean_mse = las.mse_path_.mean(axis=1)
se_mse = las.mse_path_.std(axis=1) / np.sqrt(las.mse_path_.shape[1])
_, coefs, _ = lasso_path(xs, y, alphas=alphas, max_iter=50000)
n_feat = (np.abs(coefs) > 1e-6).sum(axis=0)
n_star = int((np.abs(las.coef_) > 1e-6).sum())
l1 = {
    "alpha": [round(float(a), 5) for a in alphas],
    "cv_mse": [round(float(v), 4) for v in mean_mse],
    "cv_se": [round(float(v), 4) for v in se_mse],
    "n_kept": [int(v) for v in n_feat],
    "a_star": round(float(las.alpha_), 4),
    "n_star": n_star,
}
json.dump(l1, open(f"{OUT}/l1_path.json", "w"), ensure_ascii=False)
print(f"l1_path.json: a*={l1['a_star']} n*={n_star} (主模型应为 0.0261/17)")

# ---- 规模6档(同 f_size_effect:log PS 缩尾 + 仅剥年度均值,qcut 6 档)----
logps = np.log(df["ps"].clip(lower=0.05).to_numpy())
logps = np.clip(logps, np.quantile(logps, 0.02), np.quantile(logps, 0.98))
logmv = df["log_mv"].to_numpy()
yr = df["year"]
y_dm = logps - yr.map(pd.Series(logps).groupby(yr).mean()).to_numpy() + logps.mean()
q = pd.qcut(logmv, 6, labels=False)
bins = []
for b in range(6):
    v = y_dm[q == b]
    mv = logmv[q == b]
    bins.append({
        "mv_lo": round(float(np.exp(mv.min()) / 1e4), 1),  # log(万元)→亿元
        "mv_hi": round(float(np.exp(mv.max()) / 1e4), 1),
        "mean": round(float(v.mean()), 3),
        "se": round(float(v.std(ddof=1) / np.sqrt(len(v))), 3),
        "n": int(len(v)),
    })
# ---- 白盒-黑盒方向对照(同 f_whitebox_blackbox:GBT 经验方向 = corr(特征值, SHAP))----
import shap

cols = m.select_features(x_full, y, groups, cols_all)
x = x_full[cols]
params = json.load(open(f"{OUT}/valuation_model.json"))["gbt_params"]
gbt = m.fit_gbt(x, y, cols, params)
sv = shap.TreeExplainer(gbt).shap_values(x)
disp = {c: m.DRIVERS[c][0] for c in cols}
en = {f["feat"]: f["coef"] for f in json.load(open(f"{OUT}/valuation_model.json"))["elasticnet_coef"]}
pts = []
for j, c in enumerate(cols):
    xv, sj = x[c].to_numpy(), sv[:, j]
    gd = float(np.corrcoef(xv, sj)[0, 1]) if xv.std() > 1e-9 and sj.std() > 1e-9 else 0.0
    pts.append({"feat": disp[c], "en": round(en[disp[c]], 4), "gbt": round(gd, 3),
                "agree": bool(np.sign(en[disp[c]]) == np.sign(gd))})
n_ok = sum(p["agree"] for p in pts)
json.dump({"points": pts, "n_agree": n_ok, "n_total": len(pts)},
          open(f"{OUT}/wb_direction.json", "w"), ensure_ascii=False)
print(f"wb_direction.json: {n_ok}/{len(pts)} 同向 (报告应为 16/17)")

yw_bin = int(pd.Series(q[(df["ts_code"] == "300590.SZ").to_numpy()]).mode()[0])
json.dump({"bins": bins, "yw_bin": yw_bin, "grand_mean": round(float(y_dm.mean()), 3),
           "note": "log(PS) 缩尾2/98、剥年度均值后按 log 市值 6 等分"},
          open(f"{OUT}/size_bins.json", "w"), ensure_ascii=False)
print("size_bins.json:", [b["mean"] for b in bins], "yw_bin:", yw_bin)
