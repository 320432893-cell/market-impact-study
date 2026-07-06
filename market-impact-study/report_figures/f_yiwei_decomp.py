"""图：移为通信溢价分解——实际溢价 = 基本面应得 + 情绪缺口,直观显示"一半一半"。"""
import json
import matplotlib.pyplot as plt
from fig_style import setup, C

setup()
ROOT = "market-impact-study"
FIG = f"{ROOT}/figures/ml_report"
ym = json.load(open(f"{ROOT}/data/processed/modeling/cate_14firm/valuation_model.json"))["mispricing_screen"]["yiwei_mispricing"]
fund = ym["fundamental_justified"]
sent = ym["sentiment_gap"]
act = ym["actual_excess"]

fig, ax = plt.subplots(figsize=(7.6, 4.6))
# 瀑布：基本面(0→fund) + 情绪(fund→act) = 实际
ax.bar(0, fund, color=C["accent"], alpha=0.9, edgecolor="white", width=0.6)
ax.bar(1, sent, bottom=fund, color=C["yiwei"], alpha=0.85, edgecolor="white", width=0.6)
ax.bar(2, act, color=C["peer"], alpha=0.9, edgecolor="white", width=0.6)
ax.text(0, fund + 0.02, f"+{fund:.2f}", ha="center", fontsize=12, fontweight="bold", color=C["accent"])
ax.text(1, act + 0.02, f"+{sent:.2f}", ha="center", fontsize=12, fontweight="bold", color=C["yiwei"])
ax.text(2, act + 0.02, f"+{act:.2f}", ha="center", fontsize=12, fontweight="bold", color=C["ink"])
# 连接线
ax.plot([0.3, 0.7], [fund, fund], color="#9AA7B8", lw=1, ls=":")
ax.set_xticks([0, 1, 2])
ax.set_xticklabels(["基本面应得\n（低杠杆等）", "情绪缺口\n（解释不了）", "实际溢价"], fontsize=11)
ax.set_ylabel("超额估值 $Y$", fontsize=12.5)
ax.set_ylim(0, act * 1.28)
ax.tick_params(axis="y", labelsize=10.5)
ax.text(1, act * 1.18, f"基本面解释 {fund/act:.0%}，情绪占 {sent/act:.0%}",
        transform=ax.transData, ha="center", fontsize=11, color="#6B7785")
fig.savefig(f"{FIG}/F_移为分解.png", bbox_inches="tight")
print(f"saved F_移为分解  fund={fund} sent={sent} act={act}")
