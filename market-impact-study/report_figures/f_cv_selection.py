"""图：按公司分组交叉验证选定 L1 惩罚强度 α。
左轴=分组 CV 验证均方误差(±1 SE)，右轴=保留特征数；最低点即选定 α=0.028→16 个特征。"""
import sys
sys.path.insert(0, "market-impact-study")
import numpy as np
import importlib
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LassoCV, lasso_path
from sklearn.model_selection import GroupKFold
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"

m = importlib.import_module("build_valuation_model")
df = m.build_panel()
cols = [c for c in m.DRIVERS if c in df.columns]
y = m.excess_valuation(df)
groups = df["ts_code"].values
X = df[cols].fillna(df[cols].median())
_lo, _hi = X.quantile(0.02), X.quantile(0.98)   # 特征缩尾,与主模型同口径
X = X.clip(lower=_lo, upper=_hi, axis=1)
Xs = StandardScaler().fit_transform(X)
splits = list(GroupKFold(5).split(Xs, y, groups))

las = LassoCV(cv=splits, random_state=m.RNG, max_iter=50000).fit(Xs, y)
alphas = las.alphas_                       # 100 个 α（降序）
mse = las.mse_path_                         # (n_alphas, n_folds)
mean_mse = mse.mean(axis=1)
se_mse = mse.std(axis=1) / np.sqrt(mse.shape[1])
a_star = las.alpha_                         # 选定 α=0.0278

# 各 α 保留特征数
_, coefs, _ = lasso_path(Xs, y, alphas=alphas, max_iter=50000)
n_feat = (np.abs(coefs) > 1e-6).sum(axis=0)
n_star = int((np.abs(las.coef_) > 1e-6).sum())

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
fig, ax = plt.subplots(figsize=(9.5, 5.2))
ymin = mean_mse.min()
ymax = mean_mse.max()
# 验证误差 U 形曲线 ± 1SE
ax.fill_between(alphas, mean_mse - se_mse, mean_mse + se_mse,
                color=C["accent"], alpha=0.16, zorder=2)
ax.plot(alphas, mean_mse, color=C["accent"], lw=2.6, zorder=4)
# 选定 α：竖线 + 最低点
ax.axvline(a_star, color=C["ink"], ls="--", lw=1.4, zorder=3)
ax.scatter([a_star], [ymin], s=95, color=C["ink"], zorder=6, edgecolor="white", linewidth=1.2)
# 两端区域标注（过拟合 / 欠拟合）
ax.text(alphas.min() * 1.4, ymax * 0.96, "$\\alpha$ 过小\n特征过多、过拟合\n验证误差高",
        fontsize=10.5, color="#6B7785", va="top")
ax.text(alphas.max() * 0.92, ymax * 0.99, "$\\alpha$ 过大\n信息被惩罚掉\n欠拟合", fontsize=10.5,
        color="#6B7785", va="top", ha="right")
ax.annotate(f"选定 $\\alpha\\approx{a_star:.3f}$：验证误差最低\n（此处恰好保留 {n_star} 个特征）",
            xy=(a_star, ymin), xytext=(a_star * 0.30, ymin + (ymax - ymin) * 0.46),
            fontsize=11.5, color=C["ink"], fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=C["ink"], lw=1.3))
ax.set_xscale("log")
ax.set_xticks([0.001, 0.01, 0.1])
ax.set_xticklabels(["0.001", "0.01", "0.1"])
ax.xaxis.set_minor_formatter(mticker.NullFormatter())
ax.set_xlim(alphas.min(), alphas.max())
ax.set_ylim(0, ymax * 1.04)
ax.set_xlabel("L1 惩罚强度 $\\alpha$（对数刻度；越大→保留特征越少）", fontsize=12)
ax.set_ylabel("分组交叉验证·验证均方误差（越低越好）", fontsize=12)
ax.tick_params(labelsize=11)
fig.savefig(f"{FIG}/F_CV选择.png", bbox_inches="tight")
print(f"saved F_CV选择  alpha*={a_star:.4f} nfeat={n_star}")
