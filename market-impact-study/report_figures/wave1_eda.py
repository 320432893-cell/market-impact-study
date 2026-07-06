"""Wave1 EDA 图：F2 面板时间线 / F3 目标分布 / F4 相关矩阵 / F5 缺失率 / F6 偏态体检。"""
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
d = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))
eda = d["eda"]
YW = "移为通信"


def save(fig, ax, name, src, credit_y=-0.16, credit=True):
    if credit and src:
        ax.text(1.0, credit_y, f"数据来源：{src}", transform=ax.transAxes,
                ha="right", va="top", fontsize=8.5, color="#8893A0")
    fig.savefig(f"{FIG}/{name}.png", bbox_inches="tight")
    plt.close(fig)
    print("saved", name)


# ---------- F2 面板覆盖时间线 ----------
panel = pd.read_csv(f"{ROOT}/data/processed/modeling/fundamental_panel.csv")
panel["yr"] = pd.to_datetime(panel["end_date"].astype(str), format="%Y%m%d",
                             errors="coerce").dt.year
pu = pd.read_csv(f"{ROOT}/data/peer_universe.csv").set_index("ts_code")["name"]
cov = panel.groupby("ts_code")["yr"].agg(["min", "max", "count"])
cov["name"] = [pu.get(c, c) for c in cov.index]
cov = cov.sort_values("min")

fig, ax = plt.subplots(figsize=(9, 6.0))
for i, (_, r) in enumerate(cov.iterrows()):
    yw = r["name"] == YW
    col = C["yiwei"] if yw else C["peer"]
    ax.plot([r["min"], r["max"]], [i, i], color=col, lw=6,
            solid_capstyle="round", alpha=0.92 if yw else 0.8, zorder=3)
    ax.text(r["max"] + 0.3, i, f"{int(r['count'])} 期", va="center", ha="left",
            fontsize=11.5, color=col, fontweight="bold" if yw else "normal")
ax.set_yticks(range(len(cov)))
ax.set_yticklabels(cov["name"], fontsize=13)
for t, n in zip(ax.get_yticklabels(), cov["name"]):
    if n == YW:
        t.set_color(C["yiwei"]); t.set_fontweight("bold")
ax.set_xlim(2008, 2028)
ax.set_xticks([2010, 2013, 2016, 2019, 2022, 2025])
ax.set_xlabel("报告期所属年份", fontsize=13)
ax.tick_params(axis="x", labelsize=12)
ax.set_ylim(-0.6, len(cov) - 0.4)
save(fig, ax, "F2_面板覆盖时间线", "", credit=False)   # 报告版：纯图，标题/说明/来源走 LaTeX 图注


# ---------- F3 各公司超额估值（均值 + 95% 置信区间，按均值排序）----------
fe = pd.read_csv(f"{ROOT}/report_figures/firm_excess.csv")
g = fe.groupby("name")["Y"]
agg = pd.DataFrame({"mu": g.mean(), "se": g.std() / np.sqrt(g.count()),
                    "n": g.count()}).sort_values("mu")   # 折让在下、溢价在上
fig, ax = plt.subplots(figsize=(9, 6.2))
ax.axvline(0, color=C["ink"], ls="--", lw=1.3, zorder=1)
ax.text(0.04, len(agg) - 0.35, "基准：同年份、同规模同行水位（$Y=0$）",
        fontsize=10, color="#6B7785", va="center")
for i, (nm, r) in enumerate(agg.iterrows()):
    yw = nm == YW
    col = C["yiwei"] if yw else C["accent"]
    ci = 1.96 * r["se"]
    ax.plot([r["mu"] - ci, r["mu"] + ci], [i, i], color=col,
            lw=2.4 if yw else 1.8, alpha=0.9, zorder=3, solid_capstyle="round")
    ax.scatter([r["mu"]], [i], s=130 if yw else 95, color=col,
               edgecolor="white", linewidth=1.1, zorder=4)
    ax.text(r["mu"] + ci + 0.04, i, f"{r['mu']:+.2f}", va="center", ha="left",
            fontsize=10, color=col, fontweight="bold" if yw else "normal")
ax.set_yticks(range(len(agg)))
ax.set_yticklabels(agg.index, fontsize=12)
for t, nm in zip(ax.get_yticklabels(), agg.index):
    if nm == YW:
        t.set_color(C["yiwei"]); t.set_fontweight("bold")
ax.set_ylim(-0.7, len(agg) - 0.1)
ax.set_xlim(-1.6, 1.6)
ax.set_xlabel("各公司平均超额估值 Y（点为均值，横线为 95% 置信区间）", fontsize=12)
ax.tick_params(axis="x", labelsize=11)
ax.annotate("← 估值折让", xy=(0.01, 0.015), xycoords="axes fraction",
            ha="left", va="bottom", fontsize=11, color="#6B7785")
ax.annotate("估值溢价 →", xy=(0.99, 0.015), xycoords="axes fraction",
            ha="right", va="bottom", fontsize=11, color="#6B7785")
save(fig, ax, "F3_目标变量分布", "", credit=False)   # 报告版：纯图，说明走 LaTeX 图注


# ---------- F4 相关矩阵（纯图，说明走 LaTeX 图注）----------
names = eda["corr_names"]
M = np.array(eda["corr"])
fig, ax = plt.subplots(figsize=(9.5, 8.0))
mask = np.triu(np.ones_like(M, dtype=bool), k=1)
sns.heatmap(M, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r", center=0,
            vmin=-1, vmax=1, square=True, linewidths=0.6, linecolor="white",
            cbar_kws={"shrink": 0.7, "label": "皮尔逊相关系数"},
            xticklabels=names, yticklabels=names, annot_kws={"size": 10}, ax=ax)
plt.setp(ax.get_xticklabels(), rotation=35, ha="right", fontsize=11)
plt.setp(ax.get_yticklabels(), rotation=0, fontsize=11)
save(fig, ax, "F4_特征相关矩阵", "", credit=False)


# ---------- F5 缺失率（纯图，说明走 LaTeX 图注）----------
miss = sorted(eda["missing"], key=lambda m: m["pct"])
feats = [m["feat"] for m in miss]
pct = [m["pct"] for m in miss]
micro = ("融资余额", "北向", "主力", "股东户数")
cols = [C["fail"] if any(k in f for k in micro) else C["accent"] for f in feats]
fig, ax = plt.subplots(figsize=(9.5, 5.8))
ax.barh(feats, pct, color=cols, alpha=0.9, edgecolor="white")
for i, p in enumerate(pct):
    ax.text(p + 0.8, i, f"{p:.0f}%", va="center", fontsize=10.5, color=C["ink"])
ax.axvline(50, color="#9AA7B8", ls="--", lw=1.3)
ax.text(51, 5, "50% 参考线", color="#6B7785", fontsize=10)
ax.set_xlim(0, 72)
ax.set_xlabel("缺失比例（%）", fontsize=12.5)
ax.tick_params(labelsize=11.5)
# 图例代理：红=市场微结构类，蓝=基本面类
ax.scatter([], [], marker="s", s=90, color=C["fail"], label="市场微结构类")
ax.scatter([], [], marker="s", s=90, color=C["accent"], label="基本面类")
ax.legend(loc="lower right", fontsize=11, frameon=True, framealpha=0.9)
save(fig, ax, "F5_特征缺失率", "", credit=False)


# ---------- F6 偏度体检（各特征偏度系数条形图，纯图）----------
import sys as _sys
_sys.path.insert(0, ROOT)
import importlib
_bvm = importlib.import_module("build_valuation_model")
DR = _bvm.DRIVERS
_panel = _bvm.build_panel()
# 用与 F4 相同的 10 个核心特征，保持两图一致
disp2col = {v[0]: k for k, v in DR.items()}
sk = []
for nm in names:                       # names = eda['corr_names']
    col = disp2col.get(nm)
    if col and col in _panel:
        sk.append((nm, float(_panel[col].skew())))
sk.sort(key=lambda t: t[1])
labels6 = [t[0] for t in sk]
vals6 = [t[1] for t in sk]
cols6 = [C["fail"] if abs(v) > 2 else (C["accent"] if abs(v) > 1 else C["peer"])
         for v in vals6]
XMIN, XMAX = -4.0, 3.2
fig, ax = plt.subplots(figsize=(9.5, 5.6))
ax.axvspan(-1, 1, color="#E7ECF2", alpha=0.8, zorder=0)        # 近似对称带
ax.barh(range(len(vals6)), [max(min(v, XMAX), XMIN) for v in vals6],
        color=cols6, alpha=0.9, edgecolor="white", zorder=2)
ax.axvline(0, color=C["ink"], lw=1.1, zorder=3)
for i, v in enumerate(vals6):
    if v < XMIN:                                   # 超出坐标的极端值，靠左缘标注
        ax.text(XMIN + 0.12, i, f"{v:.1f}（超出范围）", va="center", ha="left",
                fontsize=10.5, color="white", fontweight="bold")
    else:
        ax.text(v + (0.12 if v >= 0 else -0.12), i, f"{v:.1f}", va="center",
                ha="left" if v >= 0 else "right", fontsize=10.5,
                color=C["ink"], fontweight="bold" if abs(v) > 2 else "normal")
ax.set_yticks(range(len(labels6)))
ax.set_yticklabels(labels6, fontsize=11.5)
ax.set_xlabel("偏度系数（0＝对称，正＝长右尾，负＝长左尾；灰带 [-1, 1] 为近似对称区）",
              fontsize=11.5)
ax.tick_params(axis="x", labelsize=11)
ax.set_xlim(XMIN, XMAX)
save(fig, ax, "F6_特征偏态体检", "", credit=False)
