"""图：安慰剂检验——打乱公司-特征对应后的零分布,实际效应落点。尾部=真,分布内=噪声。"""
import sys
sys.path.insert(0, "market-impact-study")
import json
import numpy as np
import matplotlib.pyplot as plt
import verify_drivers_triangulation as V
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
B = 500
# 权威 p 值取自三角验证 JSON,保持与正文矩阵表一致(图中直方图仅作零分布可视化)
TRI = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/drivers_triangulation.json"))
PJSON = {"低杠杆溢价": TRI["H2"]["p_placebo"], "成长折价": TRI["H1"]["p_placebo"], "盈利溢价": TRI["H3"]["p_placebo"]}


def placebo_null(X, y, g, k):
    """公司层安慰剂: 打乱公司-特征对应,收集零分布 β_k。"""
    beta = V.ols_cluster(X, y, g)[0][k]
    gids = np.unique(g)
    rng = np.random.RandomState(123)
    col = X[:, k].copy()
    gmean = {gg: col[g == gg].mean() for gg in gids}
    null = np.empty(B)
    for b in range(B):
        perm = dict(zip(gids, rng.permutation(gids), strict=False))
        Xb = X.copy()
        Xb[:, k] = np.array([gmean[perm[c]] for c in g])
        null[b] = V.ols_cluster(Xb, y, g)[0][k]
    return float(beta), null


lp = V.level_panel()
cp = V.change_panel()
cp = cp.copy()
cp["dln_ps"] = cp["dln_mv"] - cp["dln_rev"]

# H2 低杠杆
g2 = lp["ts_code"].to_numpy()
feat2 = V._z(lp["f_debt_to_assets"].fillna(lp["f_debt_to_assets"].median()).to_numpy())
X2 = np.column_stack([np.ones(len(g2)), feat2, V._fe(lp["year"].to_numpy())])
# H1 成长
g1 = cp["ts_code"].to_numpy()
feat1 = V._z(cp["dln_rev"].to_numpy())
X1 = np.column_stack([np.ones(len(g1)), feat1, V._fe(g1, cp["yr"].to_numpy())])
# H3 盈利(残差化)
nm = lp["f_net_margin"].fillna(lp["f_net_margin"].median()).to_numpy()
lr = lp["log_rev"].to_numpy()
A = np.column_stack([np.ones(len(lr)), lr])
nm_resid = nm - A @ np.linalg.lstsq(A, nm, rcond=None)[0]
feat3 = V._z(nm_resid)
X3 = np.column_stack([np.ones(len(g2)), feat3, V._fe(lp["year"].to_numpy())])

panels = [
    ("低杠杆溢价", X2, lp["Y"].to_numpy(), g2, True),
    ("成长折价", X1, cp["dln_ps"].to_numpy(), g1, True),
    ("盈利溢价", X3, lp["Y"].to_numpy(), g2, False),
]

fig, axes = plt.subplots(3, 1, figsize=(8.8, 10.6))
for i, (ax, (title, X, y, g, real)) in enumerate(zip(axes, panels)):
    beta, null = placebo_null(X, y, g, 1)
    p = PJSON[title]
    ax.hist(null, bins=40, color=C["peer"], alpha=0.55, edgecolor="white", linewidth=0.3)
    lc = C["pass_"] if real else C["fail"]
    ax.axvline(beta, color=lc, lw=3, zorder=5)
    ax.axvline(0, color="#9AA7B8", lw=1.1, ls=":")
    ymax = ax.get_ylim()[1]
    ax.annotate(f"实际效应 {beta:+.2f}", xy=(beta, ymax * 0.6),
                xytext=(beta + (0.03 if real and beta < 0 else -0.03), ymax * 0.82),
                fontsize=12.5, color=lc, fontweight="bold",
                ha="left" if (real and beta < 0) else "right",
                arrowprops=dict(arrowstyle="->", color=lc, lw=1.5))
    verdict = "实际效应落在零分布尾部 → 真效应" if real else "实际效应落在零分布中央 → 与噪声不可区分"
    ax.set_title(f"{title}（安慰剂 $p={p:.3f}$）：{verdict}", fontsize=12.5, color=C["ink"])
    ax.set_ylabel("频数", fontsize=11.5)
    ax.tick_params(labelsize=10.5)
axes[-1].set_xlabel("打乱公司-特征对应后重估的系数（零分布）", fontsize=12)
fig.tight_layout(h_pad=2.0)
fig.savefig(f"{FIG}/F_安慰剂.png", bbox_inches="tight")
print("saved F_安慰剂")
