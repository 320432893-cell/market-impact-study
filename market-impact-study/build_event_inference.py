"""事件研究推断引擎:市场模型 AR/CAR + BMP/Corrado秩/符号/安慰剂/功效/公司聚类/净子集。
按事件类型(资本动作/业绩)与好坏消息(利好/利空)分层。基准=创业板指市场模型,估计窗[-250,-30]。
# tier: 小件
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

RAW = Path("market-impact-study/data/raw/tushare")
PROC = Path("market-impact-study/data/processed")
OUT = Path("market-impact-study/data/processed/modeling/cate_14firm/event_inference.json")
MKT = "399006.SZ"
EST = (-250, -30)
RANKWIN = (-250, 20)                    # Corrado 排名窗(估计+事件)
WINDOWS = {"[-1,+1]": (-1, 1), "[0,+5]": (0, 5), "[0,+20]": (0, 20)}
CATS = ["资本动作", "业绩信号"]
POS = ["回购", "增持", "预增", "扭亏", "中标", "获批", "合作", "订单", "分红", "员工持股", "股权激励", "增长"]
NEG = ["减持", "质押", "亏损", "预减", "下滑", "诉讼", "处罚", "风险", "商誉", "减值", "增发", "定增", "问询", "立案", "终止"]
RNG = np.random.RandomState(0)
ZA, ZB = stats.norm.ppf(0.975), stats.norm.ppf(0.80)


def classify(title):
    t = str(title)
    pos, neg = any(k in t for k in POS), any(k in t for k in NEG)
    return "利好" if pos and not neg else ("利空" if neg and not pos else "未分类")


def load_returns():
    ret = {}
    for p in sorted((RAW / "daily").glob("*.csv")):
        d = pd.read_csv(p, dtype={"trade_date": str})
        if d.empty:
            continue
        d = d[["ts_code", "trade_date", "pct_chg"]].dropna()
        d["r"] = pd.to_numeric(d["pct_chg"], errors="coerce") / 100.0
        ret[d["ts_code"].iloc[0]] = d.dropna(subset=["r"]).sort_values("trade_date").reset_index(drop=True)
    m = pd.read_csv(RAW / "index_daily" / f"{MKT}.csv", dtype={"trade_date": str})
    m["rm"] = pd.to_numeric(m["pct_chg"], errors="coerce") / 100.0
    return ret, m[["trade_date", "rm"]].dropna().sort_values("trade_date").reset_index(drop=True)


def load_events():
    e = pd.read_csv(PROC / "event_candidates.csv", dtype=str).fillna("")
    e = e[e["primary_category"].isin(CATS)].copy()
    e["d"] = pd.to_datetime(e["event_date"], errors="coerce")
    e = e.dropna(subset=["d"]).sort_values("d")
    e["sign"] = e["title"].map(classify)
    keep, last = [], {}
    for _, row in e.iterrows():
        k = (row["ts_code"], row["primary_category"])
        if k not in last or (row["d"] - last[k]).days > 5:
            keep.append(row); last[k] = row["d"]
    return pd.DataFrame(keep)


def build_cache(ret, mkt):
    cache = {}
    for code, rf in ret.items():
        mg = rf.merge(mkt, on="trade_date", how="inner").sort_values("trade_date").reset_index(drop=True)
        if len(mg) < 320:
            continue
        td = pd.to_datetime(mg["trade_date"], format="%Y%m%d").to_numpy()
        cache[code] = (mg["r"].to_numpy(), mg["rm"].to_numpy(), td)
    return cache


def ar_full(r, rm, t0):
    e0, e1 = t0 + EST[0], t0 + EST[1]
    if e0 < 0 or e1 > len(r):
        return None
    b, a = np.polyfit(rm[e0:e1], r[e0:e1], 1)
    sd = (r[e0:e1] - (a + b * rm[e0:e1])).std(ddof=2)
    if sd < 1e-6:
        return None
    return r - (a + b * rm), sd


def car_window(r, rm, t0, w0, w1):
    """轻量:只返回事件窗 CAR(用于安慰剂)。"""
    e0, e1 = t0 + EST[0], t0 + EST[1]
    if e0 < 0 or t0 + w1 >= len(r):
        return None
    b, a = np.polyfit(rm[e0:e1], r[e0:e1], 1)
    s, e = t0 + w0, t0 + w1
    return float(np.nansum(r[s:e + 1] - (a + b * rm[s:e + 1])))


def collect(events, cache):
    rows = []
    for _, ev in events.iterrows():
        c = cache.get(ev["ts_code"])
        if c is None:
            continue
        r, rm, td = c
        t0 = int(np.searchsorted(td, np.datetime64(ev["d"])))
        if t0 + RANKWIN[1] >= len(r) or t0 + RANKWIN[0] < 0:
            continue
        res = ar_full(r, rm, t0)
        if res is None:
            continue
        ar, sd = res
        rec = {"code": ev["ts_code"], "cat": ev["primary_category"], "sign": ev["sign"], "t0": t0, "d": ev["d"]}
        for wn, (a, b) in WINDOWS.items():
            car = float(np.nansum(ar[t0 + a:t0 + b + 1]))
            rec[wn] = car
            rec[wn + "_scar"] = car / (sd * np.sqrt(b - a + 1))
        rec["_win"] = ar[t0 + RANKWIN[0]:t0 + RANKWIN[1] + 1]   # 排名窗 AR
        rows.append(rec)
    return rows


def cluster_t(car, codes):
    car, codes = np.asarray(car), np.asarray(codes)
    ok = np.isfinite(car); car, codes = car[ok], codes[ok]
    firms = np.unique(codes); G = len(firms)
    if G < 3:
        return np.nan, np.nan, np.nan, G
    mean = car.mean()
    gm = np.array([car[codes == f].mean() for f in firms])
    se = gm.std(ddof=1) / np.sqrt(G)
    t = mean / se if se > 0 else np.nan
    p = 2 * (1 - stats.t.cdf(abs(t), G - 1)) if np.isfinite(t) else np.nan
    return float(mean), float(se), float(p), G


def bmp(scar):
    scar = np.asarray([s for s in scar if np.isfinite(s)]); n = len(scar)
    if n < 5:
        return None, np.nan
    t = scar.mean() / (scar.std(ddof=1) / np.sqrt(n))
    return round(float(t), 2), round(float(2 * (1 - stats.t.cdf(abs(t), n - 1))), 3)


def sign_p(car):
    car = np.asarray([c for c in car if np.isfinite(c)]); n = len(car)
    if n < 5:
        return np.nan
    return round(float(stats.binomtest(int((car > 0).sum()), n, 0.5).pvalue), 3)


def corrado(rows, wn):
    """Corrado 秩检验:排名窗内对每个事件 AR 排名→标准化,事件窗累计秩的横截面统计。"""
    M = np.array([r["_win"] for r in rows if len(r["_win"]) == RANKWIN[1] - RANKWIN[0] + 1])
    if len(M) < 5 or np.isnan(M).any():
        M = M[~np.isnan(M).any(axis=1)] if len(M) else M
    if len(M) < 5:
        return np.nan
    T = M.shape[1]
    ranks = np.apply_along_axis(stats.rankdata, 1, M)     # 每事件在窗内排名
    U = ranks / (T + 1) - 0.5                              # 标准化秩,均值0
    Abar = U.mean(axis=0)                                  # 每相对日的平均秩
    sA = np.sqrt(np.mean(Abar ** 2))                       # 全窗标准差
    off = RANKWIN[0]
    w0, w1 = WINDOWS[wn]
    idx = np.arange(w0 - off, w1 - off + 1)
    L = len(idx)
    t = (Abar[idx].sum() / np.sqrt(L)) / sA if sA > 0 else np.nan
    return round(float(2 * (1 - stats.norm.cdf(abs(t)))), 3)


def placebo(rows, cache, wn, B=100):
    a, b = WINDOWS[wn]
    codes = [r["code"] for r in rows]
    real = float(np.abs([r[wn] for r in rows]).mean())
    null = []
    for _ in range(B):
        vals = []
        for c in RNG.choice(codes, size=len(codes)):
            r, rm, _ = cache[c]
            t0 = RNG.randint(260, len(r) - 25)
            cw = car_window(r, rm, t0, a, b)
            if cw is not None:
                vals.append(cw)
        if vals:
            null.append(np.abs(vals).mean())
    return round(float((np.array(null) >= real).mean()), 3)


def battery(rows, cache, iso_mask):
    out = {"n": len(rows)}
    for wn in WINDOWS:
        car = [r[wn] for r in rows]
        codes = [r["code"] for r in rows]
        mean, se, pcl, G = cluster_t(car, codes)
        pw = float(stats.norm.cdf(abs(mean) / se - ZA)) if se and se > 0 else np.nan
        bt, bp = bmp([r[wn + "_scar"] for r in rows])
        cari = np.array(car)[iso_mask]; codesi = np.array(codes)[iso_mask]
        mi, _, pi, _ = cluster_t(cari.tolist(), codesi.tolist())
        out[wn] = {
            "mean_CAR_pct": round(mean * 100, 3), "cluster_p": round(pcl, 3), "G": G,
            "BMP_t": bt, "BMP_p": bp, "corrado_p": corrado(rows, wn),
            "sign_p": sign_p(car), "placebo_p": placebo(rows, cache, wn),
            "MDE80_pct": round((ZA + ZB) * se * 100, 3) if se and se > 0 else None,
            "power": round(pw, 2) if np.isfinite(pw) else None,
            "isolated_n": int(iso_mask.sum()),
            "isolated_mean_pct": round(mi * 100, 3), "isolated_p": round(pi, 3),
        }
    return out


def main():
    ret, mkt = load_returns()
    cache = build_cache(ret, mkt)
    rows = collect(load_events(), cache)
    print(f"有效事件 {len(rows)} (公司 {len({r['code'] for r in rows})})", flush=True)
    all_ev = pd.read_csv(PROC / "event_candidates.csv", dtype=str).fillna("")
    all_ev["d"] = pd.to_datetime(all_ev["event_date"], errors="coerce")
    by_code = {c: g["d"].dropna().tolist() for c, g in all_ev.groupby("ts_code")}

    def iso(rs):
        return np.array([sum(1 for od in by_code.get(r["code"], []) if od != r["d"] and abs((od - r["d"]).days) <= 7) == 0 for r in rs])

    groups = {"全部": rows}
    for cat in CATS:
        groups[cat] = [r for r in rows if r["cat"] == cat]
    for sg in ["利好", "利空"]:
        groups[sg] = [r for r in rows if r["sign"] == sg]

    result = {"market": MKT, "est_window": EST, "n_total": len(rows), "groups": {}}
    for name, rs in groups.items():
        if len(rs) < 20:
            continue
        result["groups"][name] = battery(rs, cache, iso(rs))
        w = result["groups"][name]["[0,+5]"]
        print(f"{name:<6} n={len(rs):<4} [0,+5] 均值={w['mean_CAR_pct']:+.2f}% 聚类p={w['cluster_p']} "
              f"BMP_p={w['BMP_p']} Corrado_p={w['corrado_p']} 符号p={w['sign_p']} 安慰剂p={w['placebo_p']} 功效={w['power']}", flush=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("saved ->", OUT)


if __name__ == "__main__":
    main()
