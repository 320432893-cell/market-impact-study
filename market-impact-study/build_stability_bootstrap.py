"""#2 成对聚类自助稳定性:重抽公司(整块,有放回)→整管重拟合,量化"选特征抖动 + SHAP/系数指示性区间"。

把第一阶段(残差目标 generated-regressor)+ 特征选择 + 建模三层不确定性一起抖进来。
超参固定为主模型已调好的值(stability selection 标准做法,不每折重调)。
诚实:14 簇下成对自助本身偏粗,给的是指示性区间、非精确 CI(报告里如实标注)。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import build_valuation_model as VL
import numpy as np
import pandas as pd
import shap
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import ElasticNetCV

OUT = Path("market-impact-study/data/processed/modeling/cate_14firm/stability_bootstrap.json")
B = int(sys.argv[1]) if len(sys.argv) > 1 else 300
RNG = np.random.RandomState(0)


def _winsor(x: pd.DataFrame) -> pd.DataFrame:
    lo, hi = x.quantile(0.02), x.quantile(0.98)
    return x.clip(lower=lo, upper=hi, axis=1)


def main() -> None:
    base = VL.build_panel()
    cols_all = list(VL.DRIVERS)
    for c in cols_all:
        base[c] = pd.to_numeric(base[c], errors="coerce")
    base = base.dropna(subset=["ps"]).reset_index(drop=True)
    params = json.loads(Path("market-impact-study/data/processed/modeling/cate_14firm/"
                             "valuation_model.json").read_text())["gbt_params"]
    firms = base["ts_code"].unique()
    disp = {c: VL.DRIVERS[c][0] for c in cols_all}

    sel_count: dict[str, int] = {disp[c]: 0 for c in cols_all}
    shap_vals: dict[str, list] = {disp[c]: [] for c in cols_all}
    coef_vals: dict[str, list] = {disp[c]: [] for c in cols_all}
    ok = 0
    for b in range(B):
        draw = RNG.choice(firms, size=len(firms), replace=True)
        parts = []
        for i, f in enumerate(draw):
            d = base[base["ts_code"] == f].copy()
            d["ts_code"] = f"{f}__{i}"  # 重复公司→独立伪簇
            parts.append(d)
        df = pd.concat(parts, ignore_index=True)
        med = df[cols_all].median()
        x = _winsor(df[cols_all].fillna(med).fillna(0.0))
        try:
            y = VL.excess_valuation(df)              # 第一阶段在自助样本上重算
            g = df["ts_code"]
            kept = VL.select_features(x, y, g, cols_all)  # L1 重选
            xk = x[kept]
            gbt = VL.fit_gbt(xk, y, kept, params)
            sv = np.abs(shap.TreeExplainer(gbt).shap_values(xk)).mean(axis=0)
            xs = StandardScaler().fit_transform(xk)
            en = ElasticNetCV(l1_ratio=[0.2, 0.5, 0.8], cv=5, random_state=0, max_iter=5000).fit(xs, y)
        except Exception:
            continue
        for j, c in enumerate(kept):
            nm = disp[c]
            sel_count[nm] += 1
            shap_vals[nm].append(float(sv[j]))
            coef_vals[nm].append(float(en.coef_[j]))
        ok += 1
        if (b + 1) % 50 == 0:
            print(f"  {b + 1}/{B} done")

    def pct(a, q):
        return round(float(np.percentile(a, q)), 4) if a else None

    rows = []
    for c in cols_all:
        nm = disp[c]
        n = sel_count[nm]
        rows.append({
            "feat": nm,
            "select_freq": round(n / ok, 3),
            "shap_median": pct(shap_vals[nm], 50),
            "shap_ci": [pct(shap_vals[nm], 5), pct(shap_vals[nm], 95)] if n else None,
            "coef_median": pct(coef_vals[nm], 50),
            "coef_ci": [pct(coef_vals[nm], 5), pct(coef_vals[nm], 95)] if n else None,
        })
    rows.sort(key=lambda r: -r["select_freq"])
    OUT.write_text(json.dumps({"B": B, "n_ok": ok, "features": rows}, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    print(f"\nsaved -> {OUT}  (有效自助 {ok}/{B})")
    print("选中频率前12:")
    for r in rows[:12]:
        ci = r["coef_ci"]
        print(f"  {r['feat']:14s} 频率{r['select_freq']:.0%}  系数中位{r['coef_median']}  系数CI{ci}")


if __name__ == "__main__":
    main()
