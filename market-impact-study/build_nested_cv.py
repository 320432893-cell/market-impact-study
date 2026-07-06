"""#3 嵌套交叉验证:把"特征选择+缩尾+调参"全放进 LOFO/OOT 折内,给出无泄漏的外推 R²。

与主模型(全样本调参一次)对照,量化"超参全样本调一次"那处小泄漏对外推 R² 的影响。
只算诚实的验证指标,不改主模型 JSON(SHAP/系数仍用全样本模型)。
"""
from __future__ import annotations

import json
from pathlib import Path

import build_valuation_model as VL
import numpy as np
import pandas as pd
from sklearn.metrics import r2_score
from sklearn.model_selection import GroupKFold, RandomizedSearchCV
from lightgbm import LGBMRegressor

OUT = Path("market-impact-study/data/processed/modeling/cate_14firm/nested_cv.json")
N_ITER = 40


def _winsor_fit(xtr: pd.DataFrame):
    lo, hi = xtr.quantile(0.02), xtr.quantile(0.98)
    return lo, hi


def _tune(x, y, groups, cols):
    mono = [VL.DRIVERS[c][1] for c in cols]
    base = LGBMRegressor(random_state=VL.RNG, verbose=-1, subsample_freq=1, monotone_constraints=mono)
    rs = RandomizedSearchCV(base, VL.SPACE, n_iter=N_ITER, scoring="r2", cv=GroupKFold(5),
                            random_state=VL.RNG, n_jobs=2, refit=False, error_score="raise")
    rs.fit(x, y, groups=groups)
    return dict(rs.best_params_)


def _fit_pred(xtr, ytr, gtr, xte, cols_all):
    # 折内:缩尾(训练分位)→L1选→调参→训→预测
    lo, hi = _winsor_fit(xtr[cols_all])
    xtr_w = xtr[cols_all].clip(lower=lo, upper=hi, axis=1)
    xte_w = xte[cols_all].clip(lower=lo, upper=hi, axis=1)
    kept = VL.select_features(xtr_w, ytr, gtr, cols_all)
    params = _tune(xtr_w[kept], ytr, gtr, kept)
    gbt = VL.fit_gbt(xtr_w[kept], ytr, kept, params)
    return gbt.predict(xte_w[kept])


def main() -> None:
    df = VL.build_panel()
    cols_all = list(VL.DRIVERS)
    for c in cols_all:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["ps"]).reset_index(drop=True)
    med = df[cols_all].median()
    xf = df[cols_all].fillna(med).fillna(0.0)
    y = VL.excess_valuation(df)
    g = df["ts_code"].to_numpy()

    # 嵌套 OOT(按时间)
    tr = (df["year"] <= VL.OOT_CUT).to_numpy()
    te = (df["year"] >= VL.OOT_CUT + 1).to_numpy()
    p_oot = _fit_pred(xf[tr], y[tr], g[tr], xf[te], cols_all)
    oot_r2 = round(float(r2_score(y[te], p_oot)), 3)
    print(f"嵌套 OOT R² = {oot_r2}  (n_test={te.sum()})")

    # 嵌套 LOFO(留一家)
    pred = np.full(len(df), np.nan)
    for i, code in enumerate(df["ts_code"].unique()):
        m = (df["ts_code"] != code).to_numpy()
        if m.sum() < 30:
            continue
        pred[~m] = _fit_pred(xf[m], y[m], g[m], xf[~m], cols_all)
        print(f"  折 {i + 1}/14 留出 {df[df['ts_code'] == code]['firm'].iloc[0]} 完成")
    ok = ~np.isnan(pred)
    lofo_r2 = round(float(r2_score(y[ok], pred[ok])), 3)

    vm = json.loads(Path("market-impact-study/data/processed/modeling/cate_14firm/"
                         "valuation_model.json").read_text())
    res = {
        "nested_oot_r2": oot_r2,
        "nested_lofo_r2": lofo_r2,
        "main_oot_r2": vm.get("oot_r2"),
        "main_lofo_r2": vm.get("lofo_r2"),
        "note": "嵌套:特征选择+缩尾+调参全在折内(无泄漏);主模型:超参全样本调一次。差异=该处泄漏的量级。",
        "n_iter_per_fold": N_ITER,
    }
    OUT.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n嵌套 LOFO R² = {lofo_r2}  (主模型 lofo {vm.get('lofo_r2')})")
    print(f"saved -> {OUT}")


if __name__ == "__main__":
    main()
