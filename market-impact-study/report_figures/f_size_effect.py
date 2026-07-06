"""图：分规模档（binscatter）看估值——6 档平均估值基本持平，规模几乎不影响估值倍数。"""
import sys
sys.path.insert(0, "market-impact-study")
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from fig_style import setup, C
import importlib

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
YW = "移为通信"
NB = 6

m = importlib.import_module("build_valuation_model")
df = m.build_panel()
pu = pd.read_csv(f"{ROOT}/data/peer_universe.csv").set_index("ts_code")["name"]
nm = df["ts_code"].map(pu).to_numpy()

logps = np.log(df["ps"].clip(lower=0.05).to_numpy())
logps = np.clip(logps, np.quantile(logps, 0.02), np.quantile(logps, 0.98))
logmv = df["log_mv"].to_numpy()
yr = pd.get_dummies(df["year"], prefix="y", drop_first=True).to_numpy(dtype=float)
y = logps - LinearRegression().fit(yr, logps).predict(yr) + logps.mean()

q = pd.qcut(logmv, NB, labels=False)
means, ses, labs = [], [], []
for b in range(NB):
    mk = q == b
    means.append(y[mk].mean())
    ses.append(y[mk].std() / np.sqrt(mk.sum()))
    labs.append(f"{logmv[mk].min():.1f}–{logmv[mk].max():.1f}")
yw_bin = int(pd.Series(q[nm == YW]).mode().iloc[0])
xpos = np.arange(NB)

fig, ax = plt.subplots(figsize=(9, 5.2))
# 整体均值参考线
gm = y.mean()
ax.axhline(gm, color="#9AA7B8", ls="--", lw=1.2, zorder=1)
ax.text(NB - 0.5, gm + 0.05, "全样本平均", fontsize=10.5, color="#6B7785", ha="right")
# 各档：误差棒 + 点，移为所在档标红
for i in range(NB):
    yw = i == yw_bin
    col = C["yiwei"] if yw else C["accent"]
    ax.errorbar(xpos[i], means[i], yerr=1.96 * ses[i], fmt="none",
                ecolor=col, elinewidth=1.6, capsize=5, alpha=0.9, zorder=3)
    ax.scatter(xpos[i], means[i], s=150 if yw else 110, color=col,
               edgecolor="white", linewidth=1.2, zorder=4)
ax.plot(xpos, means, color=C["ink"], lw=1.6, alpha=0.55, zorder=2)
ax.scatter([], [], color=C["yiwei"], s=110, label="移为通信所在规模档")
ax.annotate("移为通信", xy=(yw_bin, means[yw_bin]), xytext=(yw_bin - 1.0, means[yw_bin] + 0.55),
            fontsize=11.5, color=C["yiwei"], fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=C["yiwei"], lw=1.2))

spread = max(means) - min(means)
ax.text(0.5, 0.06, f"6 个规模档平均估值最大相差仅 {spread:.2f}，几乎落在同一水平",
        transform=ax.transAxes, ha="left", fontsize=11.5, color=C["ink"])

ax.set_ylim(0, 2.6)
ax.set_xticks(xpos)
ax.set_xticklabels([f"档{i+1}\n{labs[i]}" for i in range(NB)], fontsize=10)
ax.set_xlabel("按对数市值（规模）从小到大分为 6 档", fontsize=12.5)
ax.set_ylabel("对数市销率（已剥离年度）平均值", fontsize=12)
ax.tick_params(axis="y", labelsize=11)
ax.legend(loc="upper right", fontsize=10.5, frameon=True, framealpha=0.9)
fig.savefig(f"{FIG}/F_规模效应.png", bbox_inches="tight")
print("saved binscatter  spread=", round(spread, 3), "yw_bin=", yw_bin + 1)
