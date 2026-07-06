"""图：学习曲线——训练R²与分组交叉验证R²随样本量变化，展示过拟合间隙与样本外解释力上限。"""
import json
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
lc = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))["learning_curve"]
n = lc["train_sizes"]
tr = lc["train_r2"]
cv = lc["cv_r2"]

fig, ax = plt.subplots(figsize=(9, 5.2))
ax.fill_between(n, cv, tr, color=C["peer"], alpha=0.22, zorder=1)
ax.plot(n, tr, "-o", color=C["accent"], lw=2.4, ms=7, zorder=3, label="训练集 $R^2$")
ax.plot(n, cv, "-s", color=C["yiwei"], lw=2.4, ms=7, zorder=3, label="分组交叉验证 $R^2$（样本外）")
# 间隙标注（避免减号 U+2212 乱码）
mid = len(n) // 2
ax.annotate("训练与验证之差\n＝过拟合间隙", xy=(n[mid], (tr[mid] + cv[mid]) / 2),
            xytext=(n[mid] - 55, 0.68), fontsize=11, color="#6B7785", ha="center",
            arrowprops=dict(arrowstyle="->", color="#9AA7B8", lw=1.2))
ax.axhline(sum(cv[-2:]) / 2, color=C["yiwei"], ls=":", lw=1.2, alpha=0.7)
ax.text(n[-1], sum(cv[-2:]) / 2 - 0.05, "样本外解释力约 $0.45$（其余约一半解释不了）",
        fontsize=10.5, color=C["yiwei"], va="top", ha="right")
ax.set_xlabel("训练样本量（公司—报告期观测数）", fontsize=12.5)
ax.set_ylabel("$R^2$", fontsize=12.5)
ax.set_ylim(0, 1.0)
ax.tick_params(labelsize=11)
ax.legend(loc="lower right", fontsize=11, frameon=True, framealpha=0.95)
fig.savefig(f"{FIG}/F_学习曲线.png", bbox_inches="tight")
print("saved F_学习曲线")
