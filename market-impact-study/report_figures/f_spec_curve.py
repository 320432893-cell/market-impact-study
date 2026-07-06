"""图：设定曲线——两条核心驱动在多种合理设定下的系数,看是否始终同号显著。"""
import sys
sys.path.insert(0, "market-impact-study")
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
import verify_drivers_triangulation as V
import build_valuation_model as VL
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"


def short_firms(g, k=3):
    u, c = np.unique(g, return_counts=True)
    return set(u[np.argsort(c)[:k]])


def fit(label, X, y, g, out):
    """稳健拟合: 清非有限行、列满秩检查、异常跳过。"""
    m = np.isfinite(y) & np.all(np.isfinite(X), axis=1)
    if m.sum() < 30:
        return
    Xm, ym, gm = X[m], y[m], g[m]
    keep = Xm.std(axis=0) > 1e-9
    keep[0] = True  # 保留截距
    Xm = Xm[:, keep]
    if np.linalg.matrix_rank(Xm) < Xm.shape[1]:
        return
    try:
        b, se, _ = V.ols_cluster(Xm, ym, gm)
    except np.linalg.LinAlgError:
        return
    out.append((label, float(b[1]), float(se[1])))


def specs_level(df, feat_col):
    """H2/H3 水平回归: Y ~ feat (+控制/FE), 公司聚类。返回[(label, beta, se), ...]"""
    out = []
    base_y = df["Y"].to_numpy()
    g0 = df["ts_code"].to_numpy()
    fr = df[feat_col].to_numpy(dtype=float)
    fr = np.where(np.isfinite(fr), fr, np.nanmedian(fr))
    feat = V._z(fr)
    yr = V._fe(df["year"].to_numpy())
    fe_g = V._fe(g0)
    one = np.ones(len(base_y))
    designs = {
        "年度FE": np.column_stack([one, feat, yr]),
        "无FE": np.column_stack([one, feat]),
        "公司FE": np.column_stack([one, feat, fe_g]),
        "双向FE": np.column_stack([one, feat, fe_g, yr]),
    }
    # 加控制变量
    for cc, nm in [("f_current_ratio", "+流动比率"), ("f_rev_cagr_3y", "+成长"), ("f_rd_intensity", "+研发")]:
        if cc in df and cc != feat_col:
            ctl = V._z(np.nan_to_num(df[cc].to_numpy().astype(float), nan=0.0))
            designs[nm] = np.column_stack([one, feat, yr, ctl])
    for label, X in designs.items():
        fit(label, X, base_y, g0, out)
    # 样本变体(年度FE)
    sf = short_firms(g0)
    yrnum = df["year"].to_numpy()
    for label, m in {"去最短3家": ~np.isin(g0, list(sf)), "去移为": g0 != "300590.SZ", "仅2018后": yrnum >= 2018}.items():
        Xm = np.column_stack([one[m], feat[m], V._fe(yrnum[m])])
        fit(label, Xm, base_y[m], g0[m], out)
    # 缩尾档位
    Xb = np.column_stack([one, feat, yr])
    for lo, hi, label in [(1, 99, "缩尾1/99"), (5, 95, "缩尾5/95")]:
        yw = np.clip(base_y, np.percentile(base_y, lo), np.percentile(base_y, hi))
        fit(label, Xb, yw, g0, out)
    return out


def specs_change(cp):
    """H1 变动回归: dln(PS) ~ dln(营收)。"""
    cp = cp.copy()
    cp["dln_ps"] = cp["dln_mv"] - cp["dln_rev"]
    y = cp["dln_ps"].to_numpy()
    g0 = cp["ts_code"].to_numpy()
    xr = V._z(cp["dln_rev"].to_numpy())
    yrc = cp["yr"].to_numpy()
    one = np.ones(len(y))
    designs = {
        "双向FE": np.column_stack([one, xr, V._fe(g0, yrc)]),
        "仅公司FE": np.column_stack([one, xr, V._fe(g0)]),
        "仅年度FE": np.column_stack([one, xr, V._fe(yrc)]),
        "无FE": np.column_stack([one, xr]),
    }
    out = []
    for label, X in designs.items():
        fit(label, X, y, g0, out)
    Xb = designs["双向FE"]
    sf = short_firms(g0)
    for label, m in {"去最短3家": ~np.isin(g0, list(sf)), "去移为": g0 != "300590.SZ"}.items():
        Xm = np.column_stack([one[m], xr[m], V._fe(g0[m], yrc[m])])
        fit(label, Xm, y[m], g0[m], out)
    for lo, hi, label in [(1, 99, "缩尾1/99"), (5, 95, "缩尾5/95")]:
        yw = np.clip(y, np.percentile(y, lo), np.percentile(y, hi))
        fit(label, Xb, yw, g0, out)
    return out


def panel(ax, specs, title, tcrit):
    specs = sorted(specs, key=lambda r: r[1])
    labels = [r[0] for r in specs]
    betas = np.array([r[1] for r in specs])
    ses = np.array([r[2] for r in specs])
    sig = (np.abs(betas) - tcrit * ses) > 0
    same = np.sign(betas) == np.sign(np.median(betas))
    xs = np.arange(len(specs))
    for i in xs:
        ok = sig[i] and same[i]
        col = C["pass_"] if ok else C["fail"]
        ax.errorbar(xs[i], betas[i], yerr=tcrit * ses[i], fmt="o", color=col, ecolor=col,
                    elinewidth=1.4, capsize=2.5, ms=6, mec="white", mew=0.6, zorder=3)
    ax.axhline(0, color=C["ink"], lw=1.1, ls="--")
    ax.set_xticks(xs)
    ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=10.5)
    ax.set_ylabel("系数", fontsize=12.5)
    n_ok = int((sig & same).sum())
    ax.set_title(f"{title}（{n_ok}/{len(specs)} 设定同号且显著）", fontsize=13, color=C["ink"])
    ax.tick_params(axis="y", labelsize=11)


tcrit = float(stats.t.ppf(0.975, 13))  # G-1≈13
lvl = V.level_panel()
chg = V.change_panel()
fig, axes = plt.subplots(2, 1, figsize=(9.4, 10.0))
panel(axes[0], specs_level(lvl, "f_debt_to_assets"), "低杠杆 → 高估值（资产负债率，负）", tcrit)
panel(axes[1], specs_change(chg), "成长被打折（ΔlnPS ~ Δln营收，负）", tcrit)
fig.tight_layout(h_pad=3.0)
fig.savefig(f"{FIG}/F_设定曲线.png", bbox_inches="tight")
print("saved F_设定曲线")
