"""算第8章诊断数据:① 甜区(验证R² vs 树复杂度 num_leaves) ② R²阶梯(样本内/分组CV/留时段/留一家)。"""
import json
from pathlib import Path

import build_valuation_model as VL
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import GroupKFold

OUT = Path("market-impact-study/data/processed/modeling/cate_14firm/ch8_diag.json")


def main() -> None:
    df = VL.build_panel()
    cols_all = list(VL.DRIVERS)
    for c in cols_all:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["ps"]).reset_index(drop=True)
    med = df[cols_all].median()
    xf = df[cols_all].fillna(med).fillna(0.0)
    lo, hi = xf.quantile(0.02), xf.quantile(0.98)
    xf = xf.clip(lower=lo, upper=hi, axis=1)
    y = VL.excess_valuation(df)
    g = df["ts_code"].to_numpy()
    cols = VL.select_features(xf, y, df["ts_code"], cols_all)
    x = xf[cols]
    mono = [VL.DRIVERS[c][1] for c in cols]
    vm = json.loads(Path("market-impact-study/data/processed/modeling/cate_14firm/"
                         "valuation_model.json").read_text())
    base = dict(vm["gbt_params"])
    gk = list(GroupKFold(5).split(x, y, g))

    def cv_r2(params):
        pr = np.zeros(len(y))
        for tr, te in gk:
            m = LGBMRegressor(**params, random_state=VL.RNG, verbose=-1, monotone_constraints=mono)
            m.fit(x.iloc[tr], y[tr])
            pr[te] = m.predict(x.iloc[te])
        return r2_score(y, pr)

    def insample_r2(params):
        m = LGBMRegressor(**params, random_state=VL.RNG, verbose=-1, monotone_constraints=mono)
        m.fit(x, y)
        return r2_score(y, m.predict(x))

    # ① 甜区:num_leaves 扫描(其余超参固定为已调值)
    sweep = []
    for nl in [3, 4, 5, 6, 7, 11, 15, 31, 63]:
        p = dict(base, num_leaves=nl, max_depth=-1)
        sweep.append({"num_leaves": nl, "insample": round(insample_r2(p), 3), "cv": round(cv_r2(p), 3)})
        print(f"  num_leaves={nl}: insample={sweep[-1]['insample']} cv={sweep[-1]['cv']}")

    # ② R²阶梯:样本内 / 分组CV / 留时段OOT / 留一家LOFO
    ladder = {
        "insample": vm["insample_r2"],
        "groupcv": round(cv_r2(base), 3),
        "oot": vm["oot_r2"],
        "lofo": vm["lofo_r2"],
        "chosen_num_leaves": base["num_leaves"],
    }
    print("R²阶梯:", ladder)
    OUT.write_text(json.dumps({"sweep": sweep, "ladder": ladder, "metrics": vm.get("metrics", {})},
                              ensure_ascii=False, indent=2), encoding="utf-8")
    print("saved ->", OUT)


if __name__ == "__main__":
    main()
