/* 移为通信市值解释 · 幻灯片(16:9,转PPT)。机器学习方法为主篇,模型发现为应用篇。ECharts 出图。 */
const Y = "#a32135", F = DATA.firms, YW = DATA.yiwei, TRI = DATA.tri, EX = DATA.explain, M = DATA.model, WB = DATA.whitebox;
let charts = {};
function mk(id, opt) { const d = document.getElementById(id); if (!d) return; const c = echarts.init(d); c.setOption(Object.assign({ animation: false, textStyle: { fontFamily: '"Source Han Sans SC","Microsoft YaHei",sans-serif', fontSize: 18 } }, opt)); charts[id] = c; }
function axx(name, zero) { return { name, nameTextStyle: { color: "#666", fontSize: 17 }, splitLine: { lineStyle: { color: "#e8e8e8" } }, axisLabel: { color: "#666", fontSize: 17 }, axisLine: { onZero: !!zero, lineStyle: { color: "#c4c4c4", width: 1.5 } } }; }
function yaxx(name) { return { type: "value", name, nameLocation: "middle", nameGap: 50, nameTextStyle: { color: "#666", fontSize: 17 }, splitLine: { lineStyle: { color: "#e8e8e8" } }, axisLabel: { color: "#666", fontSize: 17 }, axisLine: { lineStyle: { color: "#c4c4c4", width: 1.5 } } }; }
function kpi(l, n, s) { return `<div class="metric"><div class="num">${n}</div><div class="cap"><b>${l}</b>　${s}</div></div>`; }
function kpis(arr) { return `<div class="metrics">${arr.join("")}</div>`; }
function pcard(l, v) { return `<div class="pcard"><div class="pl">${l}</div><div class="pv">${v}</div></div>`; }
function chip(t) { return `<span class="chip">${t}</span>`; }
function cssHeatmap(mat, names) {
  const ab = { "营业利润率": "营业利润", "资产周转率": "资产周转", "营收3年CAGR": "营收成长", "资产负债率": "资产负债", "海外收入占比": "海外占比" };
  const dn = names.map(x => ab[x] || x);
  const n = names.length;
  const cc = v => { const a = Math.min(1, Math.abs(v)); const bg = v >= 0 ? `rgba(163,33,53,${a.toFixed(2)})` : `rgba(29,53,87,${a.toFixed(2)})`; return `<div class="hm-cell" style="background:${bg};color:${a > 0.55 ? "#fff" : "#3a342f"}">${v.toFixed(2)}</div>`; };
  const head = `<div class="hm-cell hm-corner"></div>` + dn.map(nm => `<div class="hm-cell hm-col">${nm}</div>`).join("");
  const body = mat.map((row, i) => `<div class="hm-cell hm-row">${dn[i]}</div>` + row.map(cc).join("")).join("");
  return `<div class="heatmap" style="grid-template-columns:108px repeat(${n}, 1fr);grid-template-rows:84px repeat(${n}, 1fr)">${head}${body}</div>`;
}
function cssBars(cats, series, maxV) {
  const yax = [1, 0.75, 0.5, 0.25, 0].map(f => `<span>${+(maxV * f).toFixed(2)}</span>`).join("");
  const sets = cats.map((cat, i) => {
    const bars = series.map(s => `<div class="hbar-bar" style="height:${Math.max(3, (s.data[i] / maxV) * 100)}%;background:${s.color}"><span class="v">${s.data[i]}</span></div>`).join("");
    return `<div class="hbar-set">${bars}</div>`;
  }).join("");
  const catrow = cats.map(c => `<div>${c}</div>`).join("");
  const leg = series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("");
  return `<div class="hbar"><div class="hbar-main"><div class="hbar-yaxis">${yax}</div>`
    + `<div class="hbar-right"><div class="hbar-plot">${sets}</div><div class="hbar-cats">${catrow}</div></div></div>`
    + `<div class="hbar-legend">${leg}</div></div>`;
}
function cssStack(segs, total) {
  const bar = segs.map(s => `<div class="hstack-seg" style="width:${(s.value / total * 100).toFixed(1)}%;background:${s.color}">+${s.value}<span>${Math.round(s.value / total * 100)}%</span></div>`).join("");
  const leg = segs.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join("");
  return `<div class="hstack"><div class="hstack-bar">${bar}</div><div class="hstack-legend">${leg}</div></div>`;
}
function covTimeline() {
  const cov = DATA.coverage || [];
  if (!cov.length) return "";
  const lo = Math.min(...cov.map(c => c.start)), hi = Math.max(...cov.map(c => c.end)), span = hi - lo || 1;
  const rows = cov.map(c => {
    const left = (c.start - lo) / span * 100, w = Math.max((c.end - c.start) / span * 100, 2);
    const tc = c.is_yiwei ? "color:#a32135;font-weight:700" : "color:#4a423c";
    return `<div style="display:flex;align-items:center;gap:9px;margin:5px 0">
      <div style="width:96px;font-size:18px;text-align:right;${tc}">${c.firm}</div>
      <div style="width:48px;font-size:17px;text-align:right;white-space:nowrap;${c.is_yiwei ? "color:#a32135;font-weight:700" : "color:#8a8078"}">${c.n} 期</div>
      <div style="position:relative;flex:1;height:18px;background:#f0ece3;border-radius:3px">
        <div style="position:absolute;left:${left.toFixed(1)}%;width:${w.toFixed(1)}%;top:0;height:18px;background:${c.is_yiwei ? "#a32135" : "#9aa7b8"};border-radius:3px"></div></div></div>`;
  }).join("");
  return `<div style="padding:6px 10px 0 6px;flex:1;display:flex;flex-direction:column;justify-content:space-between">${rows}
    <div style="display:flex;justify-content:space-between;margin:8px 10px 0 162px;font-size:17px;color:#8a8078"><span>${lo}</span><span>${Math.round((lo + hi) / 2)}</span><span>${hi}</span></div></div>`;
}
function targetByFirm() {
  const pva = M.pva || [];
  if (!pva.length) return "";
  const g = {};
  pva.forEach(d => { (g[d.firm] = g[d.firm] || []).push(d.a); });
  const rows0 = Object.entries(g).map(([firm, v]) => {
    const n = v.length, m = v.reduce((s, x) => s + x, 0) / n;
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / n);
    return { firm, m, ci: 1.96 * sd / Math.sqrt(n), yw: firm === "移为通信" };
  }).sort((a, b) => b.m - a.m);
  const mx = Math.max(...rows0.map(r => Math.abs(r.m) + r.ci)) * 1.04 || 1;
  const px = v => 50 + v / mx * 48;
  const rows = rows0.map(r => {
    const pos = r.m >= 0, xm = px(r.m), wl = px(r.m - r.ci), wr = px(r.m + r.ci);
    const col = r.yw ? "#a32135" : (pos ? "#7a97b8" : "#c2a15a");
    const tc = r.yw ? "color:#a32135;font-weight:700" : "color:#4a423c", wc = "rgba(60,50,45,.55)";
    const bar = pos ? `left:50%;width:${(xm - 50).toFixed(1)}%` : `left:${xm.toFixed(1)}%;width:${(50 - xm).toFixed(1)}%`;
    return `<div style="display:flex;align-items:center;gap:9px;margin:2px 0">
      <div style="width:84px;font-size:17px;text-align:right;${tc}">${r.firm}</div>
      <div style="width:46px;font-size:18px;text-align:right;${tc}">${pos ? "+" : ""}${r.m.toFixed(2)}</div>
      <div style="position:relative;flex:1;height:17px;background:#faf6ef;border-radius:2px">
        <div style="position:absolute;left:50%;top:-2px;height:21px;border-left:1.5px solid #cfc7ba"></div>
        <div style="position:absolute;top:3px;height:11px;border-radius:2px;background:${col};${bar}"></div>
        <div style="position:absolute;left:${wl.toFixed(1)}%;width:${(wr - wl).toFixed(1)}%;top:8px;height:1.5px;background:${wc}"></div>
        <div style="position:absolute;left:${wl.toFixed(1)}%;top:5px;height:7px;border-left:1.5px solid ${wc}"></div>
        <div style="position:absolute;left:${wr.toFixed(1)}%;top:5px;height:7px;border-left:1.5px solid ${wc}"></div></div></div>`;
  }).join("");
  return `<div style="padding:8px 14px 0 4px;flex:1;display:flex;flex-direction:column;justify-content:space-between">${rows}
    <div style="display:flex;margin:8px 14px 0 139px;font-size:17px;color:#8a8078"><span style="flex:1;text-align:center">← 折让</span><span style="flex:1;text-align:center">溢价 →</span></div></div>`;
}
function sizeBins() {
  const sb = M.sizebins; if (!sb || !sb.bins) return "";
  const lo = 1.1, hi = 1.75, py = v => (hi - v) / (hi - lo) * 100; // 值域定标(均值1.28~1.54,CI≈±0.1)
  const gm = py(sb.grand_mean);
  const cols = sb.bins.map((b, i) => {
    const yw = i === sb.yw_bin, c = yw ? "#a32135" : "#3f6493";
    const t = py(b.mean + 1.96 * b.se), bt = py(b.mean - 1.96 * b.se);
    return `<div style="flex:1;position:relative;height:100%">
      <div style="position:absolute;left:50%;top:${t.toFixed(1)}%;height:${(bt - t).toFixed(1)}%;border-left:2px solid rgba(63,100,147,.4)"></div>
      <div style="position:absolute;left:50%;top:${py(b.mean).toFixed(1)}%;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>
      <div style="position:absolute;left:50%;top:${(t - 13).toFixed(1)}%;transform:translateX(-50%);font-size:17px;font-weight:700;color:${yw ? "#a32135" : "#2c496e"}">${b.mean.toFixed(2)}</div>
      <div style="position:absolute;left:0;right:0;bottom:-52px;text-align:center;font-size:17px;color:#6f6259;line-height:1.35">第 ${i + 1} 档${yw ? "<br><b style='color:#a32135'>移为</b>" : "<br>" + b.mv_lo + "–" + b.mv_hi + " 亿"}</div></div>`;
  }).join("");
  return `<div style="flex:1;display:flex;flex-direction:column;padding:6px 18px 66px">
    <div style="flex:1;position:relative;border-left:1.5px solid #d7d7d7;border-bottom:1.5px solid #d7d7d7;background:repeating-linear-gradient(to top,#ededed 0 1px,transparent 1px 25%),#fff">
      <div style="position:absolute;left:0;right:0;top:${gm.toFixed(1)}%;border-top:2px dashed #b7a98e"></div>
      <div style="position:absolute;left:8px;top:${(gm - 11).toFixed(1)}%;font-size:17px;color:#8a7f66">全样本均值 ${sb.grand_mean}</div>
      <div style="position:absolute;inset:0;display:flex;padding:0 10px">${cols}</div>
    </div></div>`;
}
function o_l1path() {
  const p = M.l1path; if (!p || !p.alpha) return {};
  const xs = p.alpha.map(a => Math.log10(a)), iStar = p.alpha.findIndex(a => a === p.a_star);
  const band = p.cv_mse.map((m, i) => [xs[i], +(m - p.cv_se[i]).toFixed(4), +(m + p.cv_se[i]).toFixed(4)]);
  return { grid: { left: 86, right: 74, top: 40, bottom: 62 },
    legend: { top: 2, data: ["交叉验证 MSE", "保留特征数"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "axis", formatter: ps => { const i = ps[0].dataIndex; return `α=${p.alpha[i]}<br>CV MSE ${p.cv_mse[i]}<br>保留 ${p.n_kept[i]} 项`; } },
    xAxis: Object.assign(axx("惩罚强度 log₁₀(α)"), { type: "value", min: Math.min(...xs), max: Math.max(...xs), nameLocation: "middle", nameGap: 34 }),
    yAxis: [Object.assign(yaxx("交叉验证 MSE"), { min: v => (v.min * 0.96).toFixed(2), scale: true }),
      { type: "value", name: "保留特征数", nameLocation: "middle", nameGap: 44, nameRotate: -90, position: "right", min: 0, max: 45,
        nameTextStyle: { color: "#8a8078", fontSize: 17 }, splitLine: { show: false }, axisLabel: { color: "#8a8078", fontSize: 17.5 } }],
    series: [
      { name: "保留特征数", type: "line", step: "end", yAxisIndex: 1, data: p.n_kept.map((n, i) => [xs[i], n]), symbol: "none", lineStyle: { color: "#b0a693", width: 2, type: "dashed" }, itemStyle: { color: "#b0a693" }, z: 1 },
      { name: "交叉验证 MSE", type: "line", data: p.cv_mse.map((m, i) => [xs[i], m]), symbol: "none", lineStyle: { color: "#3f6493", width: 3 }, itemStyle: { color: "#3f6493" }, z: 3,
        markLine: { symbol: "none", silent: true, lineStyle: { color: "#a32135", type: "dashed", width: 2 }, label: { show: true, formatter: `α*=${p.a_star}\n保留 ${p.n_star} 项`, color: "#a32135", fontSize: 17, fontWeight: 700, position: "insideEndTop" }, data: [{ xAxis: Math.log10(p.a_star) }] } },
      { name: "±1SE", type: "line", data: band.map(b => [b[0], b[1]]), symbol: "none", lineStyle: { opacity: 0 }, stack: "se", showInLegend: false, z: 2 },
      { name: "±1SEb", type: "line", data: band.map(b => [b[0], +(b[2] - b[1]).toFixed(4)]), symbol: "none", lineStyle: { opacity: 0 }, stack: "se", areaStyle: { color: "rgba(63,100,147,.14)" }, showInLegend: false, z: 2 },
    ] };
}
function cssDonut(segs, centerLabel) {
  let acc = 0;
  const stops = segs.map(s => { const a = acc; acc += s.pct; return `${s.color} ${a}% ${acc}%`; }).join(",");
  const leg = segs.map(s => `<span><i style="background:${s.color}"></i>${s.name} ${s.pct}%</span>`).join("");
  return `<div class="donutbox"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-hole"><div class="donut-c"><b>${segs[0].pct}%</b><br>${centerLabel}</div></div></div><div class="donut-leg">${leg}</div></div>`;
}
function driversBars() {
  const rows = [["H1 成长被折价", TRI.H1.coef, TRI.H1.within, true], ["H2 低杠杆 \u2194 高估值", TRI.H2.coef, TRI.H2.within, true], ["H3 盈利率驱动", TRI.H3.coef, TRI.H3.within, false]];
  const mx = 0.55;
  const cards = rows.map(h => {
    const w1 = Math.min(100, Math.abs(h[1]) / mx * 100), w2 = Math.min(100, Math.abs(h[2]) / mx * 100);
    const tag = h[3] ? '<span style="color:#2e7d32">稳健</span>' : '<span style="color:#a32135">未获稳健支持</span>';
    return `<div style="flex:1;border:1.5px solid var(--frame);border-radius:6px;padding:14px 20px;background:#fdfbf6"><div style="font-weight:700;font-size:20px;margin-bottom:10px">${h[0]} ${tag}</div><div style="font-size:18px;color:var(--mute)">跨公司系数 ${h[1]}</div><div style="height:15px;background:#9a9a9a;width:${w1}%;border-radius:3px;margin:4px 0 9px"></div><div style="font-size:18px;color:var(--mute)">公司内系数 ${h[2]}</div><div style="height:15px;background:${h[3] ? "#a32135" : "#cfccc4"};width:${w2}%;border-radius:3px;margin:4px 0 0"></div></div>`;
  }).join("");
  return `<div style="display:flex;gap:24px;flex:none;margin:2px 0 8px">${cards}</div>`;
}
function cssHBars(rows, ref) {
  const mx = Math.max(...rows.map(r => r.value)) * 1.18;
  const bars = rows.map(r => `<div class="hbars-row"><div class="hbars-cat">${r.name}</div><div class="hbars-track"><div class="hbars-fill" style="width:${(r.value / mx * 100).toFixed(1)}%;background:${r.color}">×${r.value}</div></div>${r.desc ? `<div class="hbars-desc">${r.desc}</div>` : ""}</div>`).join("");
  const refLine = ref ? `<div class="hbars-ref" style="left:${(ref / mx * 100).toFixed(1)}%"><span>持平 ×${ref}</span></div>` : "";
  return `<div class="hbars"><div class="hbars-area">${refLine}<div class="hbars-rows">${bars}</div></div></div>`;
}

/* ---- 业务图 ---- */
function o_yiwei() {
  return { grid: { left: 70, right: 40, top: 14, bottom: 30 }, tooltip: { valueFormatter: v => "×" + v },
    xAxis: axx("倍数(2017→2025)"), yAxis: { type: "category", data: ["市值", "估值倍数", "营收"], axisLabel: { color: "#4a423c", fontWeight: 600 } },
    series: [{ type: "bar", barWidth: "55%", data: [{ value: YW.mcap, itemStyle: { color: Y } }, { value: YW.ps, itemStyle: { color: "#9b2226" } }, { value: YW.rev, itemStyle: { color: "#2f5d50" } }],
      label: { show: true, position: "right", formatter: p => "×" + p.value, fontWeight: 700 },
      markLine: { silent: true, symbol: "none", data: [{ xAxis: 1 }], lineStyle: { color: "#4a423c", type: "dashed" }, label: { formatter: "持平=1", color: "#4a423c" } } }] };
}
function o_firms() {
  const fs = [...F].sort((a, b) => a.ln_rev + a.ln_ps - (b.ln_rev + b.ln_ps));
  return { grid: { left: 104, right: 30, top: 28, bottom: 56 }, legend: { top: 0, data: ["经营(营收)", "估值(再定价)"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => { const f = fs[p[0].dataIndex]; return `${f.firm}<br>市值×${f.mcap} = 营收×${f.rev} × 倍数×${f.ps}`; } },
    xAxis: Object.assign(axx("市值对数变化 = 经营 + 估值", true), { nameLocation: "middle", nameGap: 32 }),
    yAxis: { type: "category", data: fs.map(f => f.firm), axisLabel: { color: "#4a423c", fontSize: 16.5 } },
    series: [
      { name: "经营(营收)", type: "bar", stack: "t", itemStyle: { color: "#2f5d50" }, data: fs.map(f => ({ value: +f.ln_rev.toFixed(2), itemStyle: { color: f.is_yiwei ? "#1e4a3e" : "rgba(47,93,80,.75)" } })) },
      { name: "估值(再定价)", type: "bar", stack: "t", itemStyle: { color: "#9b2226" }, data: fs.map(f => ({ value: +f.ln_ps.toFixed(2), itemStyle: { color: f.is_yiwei ? "#7d1828" : "rgba(155,34,38,.72)" } })) },
    ] };
}
function o_strategy() {
  const d = F.filter(f => f.ov_share != null && f.ov_cagr != null).map(f => ({
    value: [f.ov_share, f.ov_cagr, f.mcap, f.firm],
    symbolSize: f.is_yiwei ? 24 : Math.max(15, Math.sqrt(Math.max(f.mcap, .3)) * 14),
    itemStyle: { color: f.is_yiwei ? Y : "#3f6493", opacity: f.is_yiwei ? 1 : .72, borderColor: f.is_yiwei ? "#7d1828" : "#fff", borderWidth: f.is_yiwei ? 2.5 : 1 },
    label: { show: true, formatter: f.firm, position: f.is_yiwei ? "left" : "right", distance: 7, color: f.is_yiwei ? Y : "#4a423c", fontWeight: f.is_yiwei ? 700 : 600, fontSize: f.is_yiwei ? 17 : 15 } }));
  return { grid: { left: 88, right: 140, top: 20, bottom: 58 }, tooltip: { formatter: p => `${p.data.value[3]}<br>海外占比 ${p.data.value[0]}%<br>海外增速 ${p.data.value[1]}%<br>市值 ×${p.data.value[2]}` },
    xAxis: Object.assign(axx("海外收入占比 %"), { max: 105, nameLocation: "middle", nameGap: 34 }), yAxis: Object.assign(yaxx("海外营收增速 %"), { min: -30 }),
    series: [{ type: "scatter", data: d, labelLayout: { hideOverlap: true },
      markLine: { silent: true, symbol: "none", lineStyle: { color: "#b0a693", type: "dashed", width: 2 }, data: [{ yAxis: 30, label: { formatter: "领先企业增速带 ≥30%", color: "#8a8078", fontSize: 16, position: "insideStartTop" } }] } }] };
}
function o_pd() {
  const dep = EX.dependence["资产负债率"]; if (!dep) return {};
  const fp = dep.firms.map(f => ({ value: [f.x, f.y], itemStyle: { color: f.is_yiwei ? Y : "#9a9a9a", opacity: f.is_yiwei ? 1 : .7 },
    label: { show: f.is_yiwei, formatter: "移为", position: "top", color: Y, fontWeight: 700 } }));
  return { grid: { left: 56, right: 26, top: 24, bottom: 36 }, legend: { top: 0, data: ["模型隐含响应", "各家落点"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "item", formatter: p => p.seriesName === "各家落点" ? `${dep.firms[p.dataIndex].firm}<br>资产负债率 ${p.value[0]}%<br>超额估值 ${p.value[1]}` : `负债率 ${p.value[0]}%<br>隐含超额估值 ${p.value[1]}` },
    xAxis: axx("资产负债率 %"), yAxis: axx("超额估值", true),
    series: [
      { name: "模型隐含响应", type: "line", smooth: true, data: dep.curve.map(c => [c.x, c.y]), lineStyle: { color: "#1d3557", width: 3 }, symbol: "none", z: 1 },
      { name: "各家落点", type: "scatter", data: fp, symbolSize: 11, z: 2 },
    ] };
}
function o_mcap_cf() {
  const s = EX.mcap.scenarios;
  return { grid: { left: 50, right: 26, top: 20, bottom: 30 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: p => { const d = s[p[0].dataIndex]; return `${d.scenario}<br>营收CAGR ${d.rev_cagr}%<br>市值 ×${d.mcap_mult}`; } },
    xAxis: { type: "category", data: s.map(d => d.scenario), axisLabel: { color: "#4a423c", fontWeight: 600 } }, yAxis: axx("市值倍数 ×"),
    series: [{ type: "bar", barWidth: "46%", data: s.map(d => ({ value: d.mcap_mult, itemStyle: { color: d.scenario === "移为实际" ? Y : "#2f5d50" } })),
      label: { show: true, position: "top", formatter: p => "×" + p.value, fontWeight: 700 } }] };
}
function o_pathmini(f) {
  const p = f.path;
  return { grid: { left: 6, right: 6, top: 8, bottom: 6 }, tooltip: { trigger: "axis", valueFormatter: v => (v >= 0 ? "+" : "") + v },
    xAxis: { type: "category", data: p.map(d => d.yr), show: false }, yAxis: { type: "value", show: false },
    series: [
      { type: "line", data: p.map(d => d.cum_rev), smooth: true, symbol: "none", lineStyle: { color: "#2f5d50", width: 1.5 } },
      { type: "line", data: p.map(d => d.cum_ps), smooth: true, symbol: "none", lineStyle: { color: "#9b2226", width: 1.5 } },
      { type: "line", data: p.map(d => d.cum_mv), smooth: true, symbol: "none", lineStyle: { color: f.is_yiwei ? Y : "#0f172a", width: 2.5 } },
    ] };
}

/* ---- ML 图 ---- */
function o_featgrp() {
  const g = [["盈利能力", 7], ["资本结构/偿债", 5], ["现金流质量", 5], ["所有权/资金面", 6], ["流动性/筹码", 5], ["成长性", 4], ["费用/研发", 4], ["营运效率", 3], ["趋势Δ", 2], ["海外营收占比", 1]];
  g.sort((a, b) => a[1] - b[1]);
  return { grid: { left: 130, right: 44, top: 8, bottom: 26 }, tooltip: { trigger: "item", formatter: p => p.name + ":" + p.value + " 项" },
    xAxis: axx("候选特征数"), yAxis: { type: "category", data: g.map(x => x[0]), axisLabel: { color: "#22303f", fontSize: 17, fontWeight: 600 } },
    series: [{ type: "bar", barWidth: "52%", data: g.map(x => x[1]), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#3f6493" }, { offset: 1, color: "#7f9cc0" }] }, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: "right", formatter: p => p.value, fontSize: 17, fontWeight: 700, color: "#2c496e" } }] };
}
function o_l1() {
  const f = [...M.l1.features].filter(x => x.kept).sort((a, b) => a.coef - b.coef);
  return { grid: { left: 172, right: 48, top: 8, bottom: 58 },
    tooltip: { trigger: "item", formatter: p => { const x = f[p.dataIndex]; return `${x.feat}<br>L1 标准化系数 ${x.coef}`; } },
    xAxis: Object.assign(axx("L1 标准化系数", true), { nameLocation: "middle", nameGap: 30 }),
    yAxis: { type: "category", data: f.map(x => x.feat), axisLabel: { color: "#22303f", fontSize: 17, fontWeight: 600 } },
    series: [{ type: "bar", barWidth: "62%", data: f.map(x => ({ value: x.coef, itemStyle: { color: x.coef < 0 ? "#a32135" : "#2f5d50", borderRadius: x.coef < 0 ? [3, 0, 0, 3] : [0, 3, 3, 0] } })) }] };
}
function o_shap() {
  const d = [...M.shap].reverse();
  return { grid: { left: 120, right: 44, top: 8, bottom: 26 }, tooltip: { trigger: "item", formatter: p => `${p.name}<br>平均|SHAP| ${p.value}` },
    xAxis: axx("平均 |SHAP|(对超额估值的平均影响幅度)"), yAxis: { type: "category", data: d.map(x => x.feat), axisLabel: { color: "#4a423c" } },
    series: [{ type: "bar", data: d.map(x => ({ value: x.shap, itemStyle: { color: x.dir < 0 ? "#3f6493" : x.dir > 0 ? "#2f5d50" : "#9a9a9a" } })), label: { show: true, position: "right", formatter: p => p.value, fontSize: 17 } }] };
}
function o_shapstab() {
  const sel = new Set(M.selected), rows = (M.stab.features || []).filter(x => sel.has(x.feat) && x.shap_median != null);
  rows.sort((a, b) => a.shap_median - b.shap_median);
  const stable = rows.map(x => x.select_freq >= 0.8);
  const mx = Math.max(...rows.map(x => x.shap_ci[1])) * 1.04;
  return { grid: { left: 150, right: 76, top: 8, bottom: 52 },
    tooltip: { trigger: "item", formatter: p => { const x = rows[p.dataIndex]; return `${x.feat}<br>自助中位 |SHAP| ${x.shap_median}<br>5–95% 区间 [${x.shap_ci[0]}, ${x.shap_ci[1]}]<br>选中频率 ${Math.round(x.select_freq * 100)}%`; } },
    xAxis: Object.assign(axx("自助中位 |SHAP|(5–95% 区间)"), { type: "value", max: +mx.toFixed(3), nameLocation: "middle", nameGap: 32 }),
    yAxis: { type: "category", data: rows.map(x => x.feat), axisLabel: { color: "#22303f", fontSize: 17, fontWeight: 600 } },
    series: [
      { type: "custom", renderItem: (pr, api) => { const y = api.coord([0, api.value(1)])[1]; const x1 = api.coord([rows[pr.dataIndex].shap_ci[0], 0])[0], x2 = api.coord([rows[pr.dataIndex].shap_ci[1], 0])[0]; return { type: "line", shape: { x1, y1: y, x2, y2: y }, style: { stroke: stable[pr.dataIndex] ? "rgba(63,100,147,.55)" : "rgba(150,150,150,.5)", lineWidth: 2.5 } }; }, data: rows.map((x, i) => [x.shap_median, i]), z: 1, silent: true },
      { type: "scatter", data: rows.map((x, i) => ({ value: [x.shap_median, i], itemStyle: { color: stable[i] ? "#3f6493" : "#9a9a9a" } })), symbolSize: 11, z: 2 },
      { type: "scatter", data: rows.map((x, i) => [mx, i]), symbolSize: 0, silent: true, z: 2,
        label: { show: true, position: "right", distance: 2, formatter: p => Math.round(rows[p.dataIndex].select_freq * 100) + "%", fontSize: 17, fontWeight: 600, color: "#8a8078" } },
    ] };
}
function o_wbdir() {
  const w = M.wbdir; if (!w || !w.points) return {};
  const ok = w.points.filter(p => p.agree), bad = w.points.filter(p => !p.agree);
  return { grid: { left: 84, right: 40, top: 30, bottom: 60 },
    tooltip: { trigger: "item", formatter: p => `${p.data.name}<br>白盒系数 ${p.data.value[0]}　树方向 ${p.data.value[1]}` },
    xAxis: Object.assign(axx("白盒线性系数(ElasticNet 标准化)"), { type: "value", nameLocation: "middle", nameGap: 34, axisLine: { onZero: true, lineStyle: { color: "#a9926b" } } }),
    yAxis: Object.assign(yaxx("树方向 corr(特征值, SHAP)"), {}),
    series: [
      { type: "scatter", data: ok.map(p => ({ name: p.feat, value: [p.en, p.gbt] })), symbolSize: 12, itemStyle: { color: "#2f5d50" }, z: 2 },
      { type: "scatter", data: bad.map(p => ({ name: p.feat, value: [p.en, p.gbt] })), symbolSize: 14, itemStyle: { color: "#a32135" }, z: 3,
        label: { show: true, position: "right", distance: 7, formatter: p => p.name, fontSize: 17.5, fontWeight: 700, color: "#a32135" } },
    ] };
}
function o_r2val() {
  const r = M.r2;
  return { grid: { left: 50, right: 26, top: 22, bottom: 28 }, tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["样本内", "样本外 OOT", "留一家 LOFO"], axisLabel: { color: "#4a423c", fontWeight: 600 } }, yAxis: axx("R²"),
    series: [{ type: "bar", barWidth: "46%", data: [{ value: r.insample, itemStyle: { color: "#9a9a9a" } }, { value: r.oot, itemStyle: { color: "#1d3557" } }, { value: r.lofo, itemStyle: { color: "#2f5d50" } }],
      label: { show: true, position: "top", formatter: p => p.value, fontWeight: 700 } }] };
}
function o_learncurve() {
  const lc = M.lc; if (!lc || !lc.train_sizes) return {};
  return { grid: { left: 96, right: 48, top: 38, bottom: 62 },
    legend: { top: 2, data: ["训练集 R²", "交叉验证 R²"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "axis", valueFormatter: v => (v == null ? "—" : v) },
    xAxis: Object.assign(axx("训练样本量(观测数)"), { type: "category", data: lc.train_sizes, boundaryGap: false, nameLocation: "middle", nameGap: 34, axisLabel: { color: "#6f6259", fontSize: 17, margin: 12 } }),
    yAxis: Object.assign(yaxx("R²"), { min: 0, max: 1 }),
    series: [
      { name: "训练集 R²", type: "line", data: lc.train_r2, smooth: true, symbolSize: 8, lineStyle: { color: "#9a9a9a", width: 3 }, itemStyle: { color: "#9a9a9a" },
        label: { show: true, position: "bottom", distance: 8, formatter: p => p.dataIndex === 0 ? "" : p.value, color: "#8a8a8a", fontSize: 17.5 } },
      { name: "交叉验证 R²", type: "line", data: lc.cv_r2, smooth: true, symbolSize: 8, lineStyle: { color: "#3f6493", width: 3.5 }, itemStyle: { color: "#3f6493" },
        label: { show: true, position: "top", distance: 8, formatter: p => p.value, color: "#2c496e", fontWeight: 700, fontSize: 17.5 } },
    ] };
}
function o_pva() {
  const pa = M.pva; if (!pa || !pa.length) return {};
  const all = pa.map(d => d.a).concat(pa.map(d => d.p));
  const lo = Math.floor(Math.min(...all) * 10) / 10, hi = Math.ceil(Math.max(...all) * 10) / 10;
  const oth = pa.filter(d => !d.yw).map(d => [d.a, d.p]);
  const yw = pa.filter(d => d.yw).map(d => [d.a, d.p]);
  return { grid: { left: 88, right: 44, top: 30, bottom: 60 },
    legend: { top: 2, data: ["其余公司", "移为通信", "理想线 y=x"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "item", formatter: p => p.seriesType === "scatter" ? `实际 ${p.value[0]}　预测 ${p.value[1]}` : "理想线 y=x" },
    xAxis: Object.assign(axx("实际超额估值"), { type: "value", min: lo, max: hi, nameLocation: "middle", nameGap: 34 }),
    yAxis: Object.assign(yaxx("LOFO 预测超额估值"), { min: lo, max: hi }),
    series: [
      { name: "理想线 y=x", type: "line", data: [[lo, lo], [hi, hi]], symbol: "none", lineStyle: { color: "#9a9a9a", type: "dashed", width: 2 }, itemStyle: { color: "#9a9a9a" }, z: 1 },
      { name: "其余公司", type: "scatter", data: oth, symbolSize: 8, itemStyle: { color: "rgba(29,53,87,.5)" }, z: 2 },
      { name: "移为通信", type: "scatter", data: yw, symbolSize: 12, itemStyle: { color: Y, borderColor: "#7d1828", borderWidth: 1.5 }, z: 3 },
    ] };
}
function o_gap() {
  const g = M.screen && M.screen.yiwei_mispricing; if (!g || g.actual_excess == null) return {};
  const exp = g.fundamental_justified, sen = g.sentiment_gap;
  const ep = Math.round((g.explained_share || 0) * 100), sp = Math.round((g.sentiment_share || 0) * 100);
  return { grid: { left: 30, right: 44, top: 40, bottom: 40 },
    legend: { top: 4, data: ["基本面可解释", "情绪 / 未解释"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: v => "+" + v },
    xAxis: Object.assign(axx("超额估值(对数)"), { type: "value", max: +(g.actual_excess * 1.15).toFixed(2) }),
    yAxis: { type: "category", data: ["移为实际溢价 +" + g.actual_excess], axisLabel: { color: "#4a423c", fontWeight: 700, fontSize: 17 } },
    series: [
      { name: "基本面可解释", type: "bar", stack: "x", barWidth: 64, data: [exp], itemStyle: { color: "#1d3557" },
        label: { show: true, formatter: `基本面 +${exp}（${ep}%）`, color: "#fff", fontWeight: 700, fontSize: 17 } },
      { name: "情绪 / 未解释", type: "bar", stack: "x", barWidth: 64, data: [sen], itemStyle: { color: "#a32135" },
        label: { show: true, formatter: `未解释 +${sen}（${sp}%）`, color: "#fff", fontWeight: 700, fontSize: 17 } },
    ] };
}
function o_roc() {
  const c = M.screen && M.screen.classification; if (!c || !c.roc) return {};
  const pts = c.roc.fpr.map((f, i) => [f, c.roc.tpr[i]]);
  return { grid: { left: 84, right: 40, top: 32, bottom: 60 },
    legend: { top: 2, data: ["ROC 曲线", "随机基准"], textStyle: { fontSize: 17 } },
    tooltip: { trigger: "axis", valueFormatter: v => v },
    xAxis: Object.assign(axx("假阳性率 FPR"), { type: "value", min: 0, max: 1, nameLocation: "middle", nameGap: 34 }),
    yAxis: Object.assign(yaxx("真阳性率 TPR"), { min: 0, max: 1 }),
    graphic: [{ type: "text", right: 64, bottom: 78, style: { text: "AUC = " + c.auc, fontSize: 24, fontWeight: 700, fill: "#2c496e" } }],
    series: [
      { name: "随机基准", type: "line", data: [[0, 0], [1, 1]], symbol: "none", lineStyle: { color: "#9a9a9a", type: "dashed", width: 2 }, itemStyle: { color: "#9a9a9a" }, z: 1 },
      { name: "ROC 曲线", type: "line", data: pts, symbol: "none", lineStyle: { color: "#3f6493", width: 3 }, itemStyle: { color: "#3f6493" }, areaStyle: { color: "rgba(63,100,147,.10)" }, z: 2 },
    ] };
}
function o_wb() {
  const r = WB.r2_compare, L = r.linear_whitebox, G = r.gbt;
  return { grid: { left: 70, right: 34, top: 56, bottom: 36 },
    legend: { top: 8, data: ["线性(白盒)", "GBT(黑盒)"], textStyle: { fontSize: 17 } }, tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["样本内", "OOT", "LOFO"], axisLabel: { color: "#4a423c", fontWeight: 600, fontSize: 17 }, axisLine: { lineStyle: { color: "#cfccc4" } } },
    yAxis: { type: "value", min: 0, max: 1, name: "R²", nameLocation: "middle", nameGap: 46, nameTextStyle: { color: "#6f6259", fontSize: 17 }, splitLine: { lineStyle: { color: "#ece3d4" } }, axisLabel: { color: "#6f6259" } },
    series: [
      { name: "线性(白盒)", type: "bar", barWidth: "30%", data: [L.insample, L.oot, L.lofo], itemStyle: { color: "#1d3557" }, label: { show: true, position: "top", fontSize: 17, fontWeight: 700, formatter: p => p.value } },
      { name: "GBT(黑盒)", type: "bar", barWidth: "30%", data: [G.insample, G.oot, G.lofo], itemStyle: { color: "#9a9a9a" }, label: { show: true, position: "top", fontSize: 17, fontWeight: 700, formatter: p => p.value } },
    ] };
}
function o_ceiling() {
  const ex = Math.round((1 - M.unexplained) * 100), un = 100 - ex;
  return { tooltip: { formatter: "{b}: {c}%" }, legend: { bottom: 0, textStyle: { fontSize: 17 } },
    series: [{ type: "pie", radius: ["45%", "70%"], center: ["50%", "44%"], label: { formatter: "{b}\n{c}%", fontSize: 17 },
      data: [{ value: ex, name: "现有数据可解释", itemStyle: { color: "#1d3557" } }, { value: un, name: "未解释残差(推测含情绪等)", itemStyle: { color: "#cfccc4" } }] }] };
}

function o_firmlines() {
  const codes = ["300590.SZ", "300638.SZ", "603236.SH", "002881.SZ", "688159.SH", "300098.SZ", "002869.SZ", "002313.SZ"];
  const fm = codes.map(c => EX.per_firm.firms.find(f => f.code === c)).filter(Boolean);
  const hero = { "广和通": "#3f6493", "高新兴": "#6d89ad", "移远通信": "#96abc6" };
  const series = fm.map(f => {
    const hc = hero[f.firm];
    return {
      name: f.firm, type: "line", smooth: 0.25, symbol: "none",
      data: f.path.map(p => [+p.yr, p.cum_mv]),
      lineStyle: { width: f.is_yiwei ? 4.5 : hc ? 2.8 : 1.8, color: f.is_yiwei ? Y : hc || "rgba(150,145,135,.38)" },
      z: f.is_yiwei ? 9 : hc ? 5 : 2,
      labelLayout: { hideOverlap: true, moveOverlap: "shiftY" },
      endLabel: { show: true, formatter: f.firm, color: f.is_yiwei ? Y : hc || "#8a8078", fontSize: f.is_yiwei ? 18 : 15.5, fontWeight: f.is_yiwei ? 700 : hc ? 600 : 400 },
    };
  });
  return { grid: { left: 86, right: 150, top: 24, bottom: 58 }, tooltip: { trigger: "axis" },
    xAxis: Object.assign(axx("年份"), { type: "value", min: "dataMin", max: "dataMax", nameLocation: "middle", nameGap: 34, axisLabel: { color: "#666", fontSize: 17, formatter: v => v.toFixed(0) } }),
    yAxis: yaxx("累积 ln 市值(首年=0)"), series };
}
/* ---- 三角验证卡 ---- */
function triCard(key) {
  const t = TRI[key], pk = t.passes, pass5 = Object.values(pk).filter(Boolean).length, ok = pass5 >= 4;
  const badges = Object.entries(pk).map(([k, v]) => `<span class="vbadge ${v ? "pass" : "fail"}" style="font-size:21px;margin:0 6px 8px 0">${k}</span>`).join("");
  return `<div class="card" style="flex:1;justify-content:space-between;gap:16px;padding:26px 30px">
    <div><h3 style="font-size:24px;line-height:1.3;margin:0 0 12px">${t.name}</h3>
      <span class="vbadge ${ok ? "pass" : "fail"}" style="font-size:23px;padding:4px 16px;font-weight:700">五维通过 ${pass5}/5${ok ? "" : " · 未获稳健支持"}</span></div>
    <div style="display:flex;flex-wrap:wrap">${badges}</div>
    <table class="t" style="font-size:20px">
      <tr><td>回归系数</td><td>${t.coef}</td></tr>
      <tr class="hl"><td>聚类自助 p(WCB)</td><td>${t.p_wcb}</td></tr>
      <tr><td>置换检验 p</td><td>${t.p_perm}</td></tr>
      <tr><td>安慰剂检验 p</td><td>${t.p_plac}</td></tr></table></div>`;
}
function bigchart(id, note) { return `<div class="srow"><div class="scol" style="flex:1.7"><div id="${id}" class="chart"></div></div><div class="scol" style="flex:1">${note}</div></div>`; }
/* ---- 逻辑图组件 ---- */
function flowbox(h, s) { return `<div class="flow-box"><div class="fb-h">${h}</div><div class="fb-s">${s}</div></div>`; }
const ARR = `<div class="flow-arrow">▶</div>`;
function ladstep(n, h, s, ht) { return `<div class="lad-step" style="min-height:${ht}px"><div class="ls-n">${n}</div><div class="ls-h">${h}</div><div class="ls-s">${s}</div></div>`; }
function identbox(h, v, s, big) { return `<div class="ident-box${big ? " big" : ""}"><div class="ib-h">${h}</div><div class="ib-v">${v}</div><div class="ib-s">${s}</div></div>`; }
function obj(n, h, s) { return `<div class="obj"><div class="on">${n}</div><div><div class="oh">${h}</div><div class="os">${s}</div></div></div>`; }
function lane(p, n, steps) { return `<div class="lane"><div class="lane-tag"><div class="lt-p">${p}</div><div class="lt-n">${n}</div></div><div class="lane-steps">${steps.map(s => `<div class="step"><div class="sp-h">${s[0]}</div><div class="sp-s">${s[1]}</div></div>`).join('<div class="step-arr">▶</div>')}</div></div>`; }

/* ============ 内容幻灯片(封面/目录/分隔页由引擎生成) ============ */
const CONTENT = [
  // ---- PART 01 研究背景与问题 ----
  { b: () => ({
    title: "研究问题与目标",
    headline: "将公司估值的解释界定为<b>可证伪的实证任务</b>,而非主观财务研判。",
    html: `<div class="srow">
      <div class="scol" style="flex:0.85">
        <div class="thesis"><div class="thesis-tag">研究主张 · THESIS</div><div class="thesis-main">以<b>面板少簇稳健推断</b>为主干、机器学习作<b>描述性归因</b>,解释公司「超额估值」的横截面差异。</div><div class="thesis-goals"><span class="gchip">识别稳健价值驱动</span><span class="gchip">量化样本外解释力上限</span><span class="gchip">界定解释力边界</span></div></div>
        ${obj("①", "描述性建模 + 稳健推断", "机器学习给出驱动方向的描述性地图;面板/公司内回归配合少簇稳健方法裁定可信度")}
        ${obj("②", "稳健甄别", "五方法交叉验证区分稳健关联与共线、算术耦合假象")}
        ${obj("③", "边界与实证", "量化样本外解释力上限,并应用于移为通信个案诊断")}
      </div>
      <div class="scol" style="flex:1.15">
        <div class="panel data"><div class="panel-h">ML 任务定义 · Problem Framing</div>
        <table class="t">
        <tr><td>任务类型</td><td>公司横截面/面板回归(解释性,非预测)</td></tr>
        <tr class="hl"><td>目标变量 Y</td><td>超额估值:log(PS) 剥离年度固定效应与规模后之残差</td></tr>
        <tr><td>研究样本</td><td>模组/终端行业 ${M.n_firms} 家;面板 ${M.n_obs} 观测;${M.y0}–${M.y1}</td></tr>
        <tr><td>特征集</td><td>候选 ${M.n_all} 项,经 L1(Lasso)折内选择保留 ${M.n_sel} 项;财务理论分组,严格 PIT</td></tr>
        <tr><td>评估方案</td><td>样本外时序外推(OOT)与留一公司(LOFO);R² / RMSE / MAE 多指标</td></tr>
        <tr><td>成功判据</td><td>样本外 R² 显著为正;关键驱动经多方法三角验证一致确认</td></tr></table></div>
        <div class="panel data"><div class="panel-h">方法特色 · Methodological Highlights</div>
        <table class="t">
        <tr><td>可解释优先</td><td>单调约束 + 白盒线性对照;黑白盒方向 16/17 一致</td></tr>
        <tr><td>稳健推断</td><td>少簇稳健三角验证:野自助 + CR2/BM自由度 + Romano-Wolf + 贝叶斯多层 + 安慰剂</td></tr>
        <tr><td>去伪机制</td><td>算术耦合审查:在定义级剔除与营收/市值算术耦合的特征</td></tr>
        <tr><td>诚实边界</td><td>量化不可解释上界,不夸大模型解释力</td></tr></table></div>
      </div></div>` }) },
  { b: () => ({
    title: "研究设计 · 技术路线",
    headline: "数据准备 → 建模与验证 → 结果应用 三阶段闭环;<b>防泄漏 / 防过拟合 / 防算术耦合</b>机制贯穿全程。",
    html: `<div class="swim">
      ${lane("PHASE 01", "数据准备", [["① 数据采集", "Tushare Pro 12 类接口全量(行情·三表·指标·主营·筹码)"], ["② 特征工程", "财务理论分组 · PIT 时点对齐"], ["③ 标签构建", "log(PS) 剥年度与规模后的残差"]])}
      ${lane("PHASE 02", "建模与验证", [["④ 模型选型", "浅树 GBT(仅杠杆单调) + 线性对照 + SHAP"], ["⑤ 训练优化", "嵌套 CV · L1 · 浅树先验封顶"], ["⑥ 模型评估", "OOT / LOFO · R²/RMSE/MAE"], ["⑦ 可解释", "SHAP 归因 + 白盒对照(16/17同向)"], ["⑧ 严谨性", "多方法三角验证 + 算术耦合审查"]])}
      ${lane("PHASE 03", "结果与应用", [["⑨ 驱动解读", "全样本价值驱动规律"], ["⑩ 案例实证", "典型企业估值诊断"]])}
      <div class="guard"><div class="g-l">全流程防控</div><div class="g-i">防泄漏(PIT · 折内选特征)　·　防过拟合(浅树先验 · 嵌套CV · 强正则)　·　防算术耦合(定义级剔除算术耦合项)</div></div>
    </div>` }) },
  // ---- PART 02 / 03 机器学习方法 ----
  { b: () => ({
    title: "① 数据来源",
    headline: "全部数据来自 <b>Tushare Pro</b>(2000 积分),<b>12 类专业接口全量采集</b>,统一按公告日 <b>PIT</b> 对齐,杜绝未来函数。",
    html: kpis([kpi("研究样本", M.n_firms + " 家", "模组/终端行业"), kpi("面板观测", M.n_obs + " 行", "公司 × 报告期"), kpi("时间跨度", M.y0 + "–" + M.y1, "逾十年"), kpi("数据接口", "12 类", "Tushare Pro 全量")])
      + `<div class="srow">
      <div class="scol" style="flex:1.45"><div class="panel"><div class="panel-h">Tushare Pro · 12 类专业接口</div>
      <table class="t">
      <tr><td>行情与估值</td><td>daily 日线;daily_basic(PS / PB / PE / 市值 / 换手 / 量比 / 振幅)</td></tr>
      <tr><td>财务三表</td><td>income · balancesheet · cashflow(完整科目)</td></tr>
      <tr class="hl"><td>财务指标</td><td>fina_indicator —— 108 字段现成比率</td></tr>
      <tr><td>主营构成</td><td>fina_mainbz(海外收入占比 / 分产品)</td></tr>
      <tr><td>筹码与资金</td><td>hk_hold 北向 · margin_detail 融资融券 · moneyflow 资金流</td></tr>
      <tr><td>股东结构</td><td>stk_holdernumber 户数 · top10_floatholders 前十大流通</td></tr>
      </table></div></div>
      <div class="scol"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">面板覆盖(非平衡) · 次新股样本极短,有效簇远少于 14</div>${covTimeline()}</div></div></div>` }) },
  { b: () => { const e = M.eda || {}, st = e.stats || [];
    return { title: "② 数据探索 · 描述统计与目标分布",
      headline: `同规模、同年份下 ${M.n_firms} 家估值仍<b>分化显著</b>(超额估值介于 \u00b10.9、高低相差约 6 倍),说明估值由<b>公司特异因素</b>主导、值得逐家解释;移为 +0.70 <b>居溢价前列(次高)</b>。`,
      html: `<div class="srow" style="flex:1">
        <div class="scol"><div class="panel data" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">描述性统计 · 长尾偏态、含强离群 → 2/98% 缩尾 + 树模型抗离群</div><table class="t"><tr><th>变量</th><th>n</th><th>均值</th><th>标准差</th><th>最小</th><th>中位</th><th>最大</th><th>分布</th></tr>${st.map((r, i) => { const rng = (r.max - r.min) || 1; const mp = Math.max(0, Math.min(100, (r.median - r.min) / rng * 100)); return `<tr${i === 0 ? ' class="hl"' : ""}><td>${r.name}</td><td>${r.n}</td><td>${r.mean}</td><td>${r.std}</td><td>${r.min}</td><td>${r.median}</td><td>${r.max}</td><td><div style="position:relative;height:9px;width:80px;background:#e8e2d6;border-radius:2px"><div style="position:absolute;left:calc(${mp.toFixed(0)}% - 1px);top:-3px;width:2px;height:15px;background:#a32135"></div></div></td></tr>`; }).join("")}</table>
          <div style="margin-top:auto;padding:9px 14px;border-top:1.5px solid var(--brand);font-size:17px;color:var(--ink)"><b>分布条</b>=[最小,最大]、红标=中位:红标越偏离中央越<b>偏态</b>——净利率长左尾(极端亏损)、营收同比/速动比率长右尾(高增长、高流动性离群)。</div></div></div>
        <div class="scol" style="flex:1.35"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">逐家超额估值 Y · 溢价(右)/ 折让(左) · 须=95% CI —— 10/14 家显著、多为真实信号</div>${targetByFirm()}</div></div></div>` };
  } },
  { b: () => { const e = M.eda || {};
    return { title: "③ 数据探索 · 相关性与缺失值",
      headline: "盈利类特征高度共线(净利率 \u2194 营业利润率 r=0.99),印证 L1 降维的必要性;部分市场面特征缺失率较高。",
      html: `<div class="srow" style="flex:1">
        <div class="scol" style="flex:1.75"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">特征相关性热力图 · 红=正相关 蓝=负相关 色深=强</div>${cssHeatmap(e.corr || [], e.corr_names || [])}</div></div>
        <div class="scol">
          <div class="panel data" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">缺失率 Top 10 · 按公告日 PIT,折内中位数填补</div><table class="t"><tr><th>特征</th><th>缺失率</th><th>分布</th></tr>${(e.missing || []).map(m => { const mkt = /融资|北向|主力|股东户数|换手|量比|振幅|Amihud|机构|净流入/.test(m.feat); return `<tr><td>${m.feat}</td><td>${m.pct}%</td><td><div style="height:14px;width:${m.pct}%;background:${mkt ? "#a32135" : "#3a6ea5"};border-radius:3px"></div></td></tr>`; }).join("")}</table>
          <div style="margin-top:auto;padding:8px 14px;font-size:18px"><span style="color:#a32135">■</span> 市场微结构(交易/资金面)　<span style="color:#3a6ea5">■</span> 基本面</div></div></div></div><div class="callout" style="flex:none;padding-right:190px"><b>结论</b>:特征高度冗余(盈利簇 r=0.99、杠杆↔流动性 -0.77)、缺失集中于市场微结构类(前四 49–61%)——建模前须 <b>L1 降维</b>,并以<b>基本面</b>为主干、市场面特征谨慎。</div>` };
  } },
  { b: () => ({
    title: "④ 标签设计 · 定义解释目标 Y",
    headline: `将"公司估值的相对高低"定义为可建模的连续目标 —— <b>超额估值</b>:剥离行业与规模后、公司特异的估值溢价/折让。`,
    html: `<div class="ident" style="flex:none;margin-bottom:18px">
      <div class="ident-box"><div class="ib-h">观测值</div><div class="ib-v" style="font-size:32px">log(PS)</div><div class="ib-s">市销率对数</div></div>
      <div class="ident-op">=</div>
      <div class="ident-box"><div class="ib-h">剥离 ①</div><div class="ib-v" style="font-size:26px">年度固定效应</div><div class="ib-s">行业同步重估(de-rating/re-rating)</div></div>
      <div class="ident-op">+</div>
      <div class="ident-box"><div class="ib-h">剥离 ②</div><div class="ib-v" style="font-size:26px">log 规模</div><div class="ib-s">大小盘系统差异</div></div>
      <div class="ident-op">+</div>
      <div class="ident-box big"><div class="ib-h">目标 Y</div><div class="ib-v" style="font-size:30px">超额估值</div><div class="ib-s">公司特异溢价/折让 = 残差</div></div>
    </div>
    <div class="srow">
      <div class="scol" style="flex:1.15;justify-content:flex-start"><div class="panel" style="flex:none"><div class="panel-h">目标 Y 的定义依据</div><table class="t compact" style="font-size:17px">
      <tr><td>直接用 PS</td><td>混入全行业估值水平 + 规模效应 → 非公司特异</td></tr>
      <tr><td>剥年度 FE</td><td>去除行业同步重估(de-rating/re-rating;时间共同成分)</td></tr>
      <tr><td>剥 log 规模</td><td>去大小盘系统差异(实测影响极小,见右图)</td></tr>
      <tr class="hl"><td>残差 = Y</td><td>纯公司特异溢价/折让 = 真正要解释的对象</td></tr></table></div>
      <div class="panel" style="flex:1;margin-top:12px"><div class="panel-h">口径选择</div><table class="t compact" style="font-size:17px">
      <tr><td>采用 PS 的理由</td><td>对亏损公司仍适用;本行业以营收为主要锚定</td></tr>
      <tr><td>采用残差的理由</td><td>使解释力目标真实可达,隔离公司特异问题</td></tr>
      <tr class="hl"><td>Y 的性质</td><td>Y 是回归<b>算出来的残差</b>(非直接观测、本身带误差);推断时把<b>整条流程反复重抽样</b>,让这层误差也进入置信区间</td></tr>
      <tr><td>任务类型</td><td>连续目标 → 回归;样本外 OOT / LOFO 评估</td></tr>
      <tr><td>不预测项</td><td>不预测股价方向/时序:市场近似有效,择时信号样本外不稳健;本研究定位解释而非预测。</td></tr></table></div></div>
      <div class="scol"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">规模 6 档的估值水平 · 剥离②的依据</div>
        <div class="note" style="padding:13px 22px 4px;margin:0">全部观测按市值 6 等分,各档剥年度后的 log(PS) 均值(须=95% CI)<b>基本持平</b>,最大相差 0.26 —— 规模几乎不影响估值倍数,剥规模仅为标准控制项;<b style="color:#a32135">移为处于第 4 档</b>,规模修正约为零。</div>
        ${sizeBins()}</div></div></div>` }) },
  { b: () => ({
    title: "⑤ 特征工程 · 理论分组",
    headline: M.n_all + " 个候选驱动按<b>财务理论分组</b>;仅对<b>杠杆单调施加理论先验</b>(浅树 GBT 仅杠杆单调),并对全部特征施加<b>严格 PIT(时点)约束</b>。",
    html: `<div class="srow" style="flex:1">
      <div class="scol"><div class="panel data" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">特征族 · 理论依据</div>
      <table class="t" style="font-size:18px"><tr><th>特征族</th><th>财务理论依据</th></tr>
      <tr><td>盈利能力</td><td>杜邦分解 —— 盈利质量驱动价值</td></tr>
      <tr><td>资本结构 / 偿债</td><td>资本结构理论:高杠杆抬升财务风险、压低估值</td></tr>
      <tr><td>成长性</td><td>成长性溢价 —— 增长预期定价</td></tr>
      <tr><td>现金流质量 / 营运效率</td><td>现金流贴现本质 / 营运资本管理</td></tr>
      <tr><td>费用 / 研发</td><td>费用管控;研发投入形成无形资产与期权价值</td></tr>
      <tr><td>流动性 / 筹码 / 资金面</td><td>市场微观结构 —— 仅作残差解释,标注反向因果</td></tr></table>
      <div style="margin-top:auto;padding:13px 16px;border-top:1.5px solid var(--brand);font-size:21px;color:var(--ink);line-height:1.65"><b>算术耦合审查</b>:目标 Y 由市值与营收构造。若特征自身含营收或市值,则其与 Y 的相关性含机械成分,只能用于关联解释、不可作因果推断。<div style="margin-top:8px;line-height:1.8"><div><span style="color:#2E8B6F;font-weight:700">● 无耦合(归因较可靠)</span>:杠杆与流动性 5/5、海外 1/1</div><div><span style="color:#a8792e;font-weight:700">● 含营收耦合</span>:盈利、成长、费用/研发</div><div><span style="color:#a32135;font-weight:700">● 含市值耦合</span>:资金面</div></div></div></div></div>
      <div class="scol"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">各特征族候选数 · 共 ${M.n_all} 项</div><div id="c_fg" class="chart" style="flex:1"></div></div></div></div>` }) },
  { b: () => ({
    title: "⑥ 特征选择 · L1(Lasso)正则化",
    headline: `特征标准化 → GroupKFold 5 折折内 LassoCV 自动选 <b>α=${M.l1.alpha}</b> → 保留非零系数:<b>${M.n_all} → ${M.n_sel}</b>;舍弃项逐一给出共线原因。`,
    html: `<div class="callout" style="flex:none;margin-bottom:12px;font-size:23px">采用 <b>L1(Lasso)正则化</b>:对系数施加惩罚,把冗余特征的系数<b>直接压到 0</b>,自动留下项数少而可解释的<b>稀疏</b>子集 —— 适配本任务特征<b>高度共线</b>(净利率与营业利润率 r=0.99)、样本<b>小</b>(14 家)的设定;L2(Ridge) 仅整体收缩、不归零,无特征筛选作用。</div>
    <div class="srow">
      <div class="scol"><div class="note">L1 系数图:<b>入选 ${M.n_sel} 项</b>的标准化系数(红=负向、绿=正向);其余 ${M.n_all - M.n_sel} 项系数被压缩至 0(见右表)。</div><div id="c_l1" class="chart"></div></div>
      <div class="scol" style="flex:1.1;justify-content:flex-start">
        <div class="panel" style="flex:none;display:flex;flex-direction:column"><div class="panel-h">惩罚强度 α 的选定 · 分组交叉验证</div><div id="c_l1p" class="chart" style="height:228px;flex:none;border:none;border-radius:0;background:transparent;min-height:0"></div></div>
        <div class="panel data" style="flex:1;display:flex;flex-direction:column;margin-top:12px"><div class="panel-h">舍弃 ${M.dropped.length} 项 · 按原因归类</div>${(() => {
        const dr = M.l1.features.filter(x => !x.kept), coll = {}, weak = [];
        dr.forEach(f => { if (f.reason && f.reason.r >= 0.5) { (coll[f.reason.with] = coll[f.reason.with] || []).push(f); } else weak.push(f.feat); });
        const groups = Object.entries(coll).sort((a, b) => b[1].length - a[1].length);
        const cn = groups.reduce((s2, g) => s2 + g[1].length, 0);
        const rows = groups.map(([rep2, items]) => { const rs = items.map(i => i.reason.r), lo = Math.min(...rs).toFixed(2), hi = Math.max(...rs).toFixed(2); return `<tr><td style="white-space:nowrap"><b>共线于 ${rep2}</b> <span style="font-size:17px;color:#8a8078">${lo === hi ? "r=" + hi : lo + "–" + hi}</span></td><td>${items.map(i => i.feat).join("、")}</td></tr>`; }).join("");
        return `<table class="t compact" style="font-size:17.5px"><tr><th>舍弃原因(高共线 r≥0.5 / 弱信号)</th><th>特征(系数压至 0)</th></tr>${rows}<tr class="hl"><td style="white-space:nowrap"><b>弱信号 ${weak.length} 项</b> <span style="font-size:17px;color:#8a8078">r&lt;0.5</span></td><td>${weak.slice(0, 4).join("、")} 等</td></tr></table>`;
      })()}</div></div></div>` }) },
  { ch: "机器学习", b: () => {
    const p = M.params;
    return { title: "⑦ 模型选型 · 浅树 GBT(仅杠杆单调) + 线性对照",
      headline: "浅树 GBT(仅杠杆单调)为<b>本数据</b>的适配选择 —— 各项优势均对应本研究的实际约束。",
      html: `<div class="arch" style="margin:2px 0 14px;gap:14px;flex:none">
        <div class="arch-box" style="min-width:160px;padding:14px 18px"><div class="ab-h" style="font-size:21px">输入 X · ${M.n_sel} 特征</div></div>
        <div class="arch-op">▶</div>
        <div class="arch-box main" style="min-width:320px;padding:16px 26px"><div class="ab-h" style="font-size:25px">浅树 GBT(主模型)</div></div>
        <div class="arch-op">▶</div>
        <div class="arch-box" style="min-width:150px;padding:14px 18px"><div class="ab-h" style="font-size:21px">ŷ 超额估值</div></div>
        <div class="arch-box" style="min-width:230px;padding:14px 18px;border-top-color:var(--navy)"><div class="ab-h" style="font-size:18px;color:var(--navy)">并行 ElasticNet 白盒<br>下游 SHAP 归因</div></div>
      </div>
      <div class="note" style="flex:none;font-size:19px;margin:0 0 12px"><b>两模型分工</b>:浅树 GBT 负责给<b>新公司预测</b>(结果落在历史取值范围、外推更稳),ElasticNet 白盒负责<b>解读每个特征的方向</b>(完全透明、系数可手算);<b>两者方向一致才采信</b>。</div>
      <div class="srow">
        <div class="scol" style="flex:1.3"><div class="panel"><div class="panel-h">GBT 适配本数据的依据:优点 ↔ 实际契合</div><table class="t">
        <tr><th>模型优点</th><th>结合本研究实际(契合依据)</th></tr>
        <tr><td>非线性 + 变量交互</td><td>估值–杠杆关系非线性(低杠杆区间溢价斜率大、高杠杆区间趋平),纯线性无法刻画</td></tr>
        <tr><td>原生处理混合量纲/缺失</td><td>${M.n_all} 个不同量纲财务比率,免繁重预处理</td></tr>
        <tr class="hl"><td>单调约束注入经济先验</td><td>N=14 极小,无约束会学出"负债率↑→估值↑"等反经济关系 → 强制单调防拟合无经济意义关系</td></tr>
        <tr><td>浅树 + 强正则抗过拟合</td><td>${M.n_obs} 观测 / 14 簇,小配置以降低方差(样本外未显著退化)</td></tr>
        <tr><td>原生 SHAP 归因</td><td>满足可解释要求,可逐特征 / 逐家拆解</td></tr>
        <tr><td>可与线性白盒交叉验证</td><td>树的驱动符号须与 ElasticNet 一致方予采信(双重校验)</td></tr></table></div></div>
        <div class="scol"><div class="panel"><div class="panel-h">候选模型对比 · 未采用其余方案的理由</div><table class="t">
        <tr><td>纯线性 OLS/Lasso</td><td>无法刻画非线性与交互 → 仅作白盒对照</td></tr>
        <tr><td>随机森林</td><td>非线性但难以注入单调先验、归因偏弱</td></tr>
        <tr><td>深度神经网络</td><td>样本量过小易过拟合、黑箱、无法注入先验</td></tr>
        <tr class="hl"><td>→ 选 LightGBM</td><td>原生支持单调约束、训练快、SHAP 兼容</td></tr></table>
        <div class="note" style="margin-top:10px">超参经嵌套 CV 自动选取(浅树先验封顶),小样本下强正则抗过拟合;<b>完整超参与复杂度设定见下页</b>。</div></div></div></div>` };
  } },
  { ch: "机器学习", b: () => { const p = M.params; return {
    title: "⑧ 复杂度约束与超参设定",
    headline: "复杂度经由三类正则控制:<b>结构正则</b>(浅树,num_leaves≤7、max_depth≤3)、<b>单调性约束</b>(经济符号先验)、<b>统计正则</b>(L1/L2 + 行子采样)。超参在按公司分组的<b>嵌套交叉验证</b>内选定,随机种子固定。",
    html: `<div style="flex:1;display:flex;flex-direction:column"><table class="t" style="flex:1;font-size:18px">
      <tr><th style="width:15%">类别</th><th style="width:14%">超参数</th><th style="width:8%">值</th><th style="width:24%">作用</th><th>设定依据</th></tr>
      <tr class="hl"><td rowspan="3"><b style="font-size:20px">结构正则</b><div style="font-size:18px;color:#8a8078;font-weight:400;margin-top:3px">浅树 · 复杂度上界<br>(叶≤7 · 深≤3)</div></td><td>叶节点数</td><td><b style="color:#a32135;font-size:25px">${p.num_leaves}</b></td><td>单棵树叶节点上限</td><td>偏差-方差权衡下 CV R² 于 4 叶附近取极大(≈0.45);增大叶数提升样本内拟合而降低 OOT</td></tr>
      <tr class="hl"><td>最大树深</td><td><b style="color:#a32135;font-size:25px">${p.max_depth}</b></td><td>特征交互阶数上限</td><td>限制至二阶交互,压缩假设空间</td></tr>
      <tr class="hl"><td>最小叶样本</td><td><b style="font-size:23px">${p.min_child_samples}</b></td><td>叶节点最小样本数</td><td>约束分裂粒度,降低叶内估计方差</td></tr>
      <tr><td><b style="font-size:20px">单调性约束</b></td><td>单调约束</td><td><b style="color:#a32135;font-size:23px">−1</b><div style="font-size:18px;color:#8a8078">仅杠杆</div></td><td>资产负债率对 Y 的单调递减约束</td><td>注入符号先验,排除与理论相悖的非单调拟合;其余特征不约束</td></tr>
      <tr><td rowspan="2"><b style="font-size:20px">提升过程</b></td><td>迭代轮数</td><td><b style="font-size:23px">${p.n_estimators}</b></td><td>提升迭代轮数(基学习器数)</td><td>与低学习率匹配;CV R² 于约 200 轮收敛</td></tr>
      <tr><td>学习率</td><td><b style="font-size:23px">${p.learning_rate}</b></td><td>收缩率(shrinkage)</td><td>低学习率配合多轮迭代降低过拟合,收敛更平稳</td></tr>
      <tr><td rowspan="4"><b style="font-size:20px">统计正则</b><div style="font-size:18px;color:#8a8078;font-weight:400;margin-top:3px">惩罚 · 子采样</div></td><td>L1 正则</td><td><b style="font-size:23px">${p.reg_alpha}</b></td><td>叶权重 L1 惩罚</td><td>稀疏化叶权重、抑制弱信号,与折内 Lasso 特征选择互补</td></tr>
      <tr><td>L2 正则</td><td><b style="font-size:23px">${p.reg_lambda}</b></td><td>叶权重 L2 惩罚</td><td>收缩叶权重、抑制极端值,提升外推稳定性</td></tr>
      <tr><td>行采样</td><td><b style="font-size:23px">${p.subsample}</b></td><td>样本子采样比例</td><td>随机梯度提升,降低方差、去相关基学习器</td></tr>
      <tr><td>列采样</td><td><b style="font-size:23px">${p.colsample_bytree}</b></td><td>特征子采样比例</td><td>特征已由 L1 预选(42→17),不再列采样</td></tr>
    </table></div>` }; } },
  { ch: "机器学习", b: () => ({
    title: "⑨ 训练流程与泛化验证",
    headline: "<b>嵌套交叉验证</b>下的无泄漏训练:特征选择、缩尾、调参均在折内执行。CV R²(GroupKFold,按公司)收敛于 <b>≈0.45</b>、与 LOFO 一致且非零;训练与验证 R² 的稳定间隙度量结构性解释上限,而非样本量约束。",
    html: `<div class="flow" style="flex:none;height:162px;margin-bottom:14px">${[
      flowbox("① 嵌套 CV", "外层 GroupKFold 估泛化 · 内层选超参"),
      flowbox("② 折内选特征 + 缩尾", "L1 特征选择、2/98% 缩尾 均折内拟合"),
      flowbox("③ 固定随机种子", "缩尾 / 选参 / 训练统一种子 · 全流程可复现"),
      flowbox("结果", "样本内 R² " + M.r2.insample + " · OOT R² " + M.r2.oot + " · LOFO R² " + M.r2.lofo),
    ].join(ARR)}</div>
    <div class="srow">
      <div class="scol"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">学习曲线 · 训练集 vs 交叉验证 R²</div>
        <div class="note" style="padding:14px 22px 4px;margin:0">两条曲线随训练样本量变化:灰线为训练集 R²(≈0.85,仅反映样本内拟合),蓝线为交叉验证 R²(GroupKFold 按公司留出,<b>与 LOFO 同口径</b>,衡量泛化)。<b>泛化以蓝线为准</b>:随样本增加收敛于 <b>≈0.45</b> 且稳定为正,过拟合受控。两线间隙不随样本量收窄 —— 表明其来自横截面估值<b>约半数本就无法由现有特征解释</b>的结构性上限,而非样本不足。</div>
        <div id="c_lc" class="chart" style="flex:1;border:none;border-radius:0;background:transparent;min-height:0"></div></div></div>
      <div class="scol"><div class="panel"><div class="panel-h">训练-验证间隙的结构性来源</div><table class="t">
      <tr><td>无选择偏差</td><td>嵌套 GroupKFold:外层估计泛化误差、内层选参,泛化估计与模型选择相互独立</td></tr>
      <tr><td>间隙来源</td><td>低信噪比设定(N=14 簇 / ${M.n_obs} 观测);横截面溢价约半数方差为特征不可解释的结构性残差</td></tr>
      <tr class="hl"><td>泛化稳定性</td><td>正则化与单调性约束下,OOT R²=${M.r2.oot} 与 LOFO R²=${M.r2.lofo} 一致为正且量级相当,未见退化</td></tr>
      <tr><td>证伪检验</td><td>原假设「过拟合主导」预测 OOT R² ≤ 0;实测显著为正,据此拒绝该假设</td></tr></table>
      <div class="note" style="margin-top:10px">注:LOFO 为更严格的泛化协议 —— 整簇留出下 R²=${M.r2.lofo},佐证跨公司可迁移性,排除公司级记忆效应。</div></div></div>` }) },
  { ch: "机器学习", b: () => {
    const mt = M.metrics || {}, mr = (lbl, o) => `<tr><td>${lbl}</td><td>${o && o.r2 != null ? o.r2 : "—"}</td><td>${o && o.rmse != null ? o.rmse : "—"}</td><td>${o && o.mae != null ? o.mae : "—"}</td></tr>`;
    return {
      title: "⑩ 样本外泛化性能与解释力上界",
      headline: "以三数据集(样本内 / OOT / LOFO)× 三指标(R²/RMSE/MAE)评估:OOT R²=<b>" + M.r2.oot + "</b>、LOFO R²=<b>" + M.r2.lofo + "</b> 稳定为正,显著优于均值基线;约 <b>" + Math.round(M.unexplained * 100) + "%</b> 方差为结构性不可约残差。",
      html: `<div class="srow">
        <div class="scol" style="flex:1.2"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">预测-实际散点 · LOFO 留出外推</div>
          <div class="note" style="padding:14px 22px 2px;margin:0">每点为一个公司-报告期观测,越贴近虚线 <b>y=x</b> 外推误差越小;<b style="color:#a32135">红点为移为</b>。用于观察拟合优度与残差结构。</div>
          <div id="c_pva" class="chart" style="flex:1;border:none;border-radius:0;background:transparent;min-height:0"></div></div></div>
        <div class="scol" style="justify-content:flex-start">
          <div class="panel data" style="flex:none"><div class="panel-h">泛化性能 · 三数据集 × 三指标</div><table class="t" style="font-size:19px">
          <tr><th>数据集</th><th>R\u00b2</th><th>RMSE</th><th>MAE</th></tr>
          <tr><td>样本内</td><td>${(mt.insample||{}).r2}</td><td>${(mt.insample||{}).rmse}</td><td>${(mt.insample||{}).mae}</td></tr>
          <tr class="hl"><td>OOT(时序外推)</td><td>${(mt.oot||{}).r2}</td><td>${(mt.oot||{}).rmse}</td><td>${(mt.oot||{}).mae}</td></tr>
          <tr class="hl"><td>LOFO(留一公司)</td><td>${(mt.lofo||{}).r2}</td><td>${(mt.lofo||{}).rmse}</td><td>${(mt.lofo||{}).mae}</td></tr>
          <tr><td>朴素基线(均值)</td><td>0</td><td>\u22480.68</td><td>—</td></tr></table>
          <div class="note" style="padding:10px 22px 12px;margin:0;font-size:17px">折内重选特征防泄漏;基线 RMSE 即 Y 的标准差,本模型样本外 RMSE 明显更低。</div></div>
          <div class="panel data" style="flex:1;margin-top:12px"><div class="panel-h">解释力构成与上界</div><table class="t">
          <tr><th>方差成分</th><th>占比</th><th>说明</th></tr>
          <tr class="hl"><td>特征可解释方差</td><td>~${Math.round((1 - M.unexplained) * 100)}%</td><td>由财务与市场特征捕获,样本外稳定复现</td></tr>
          <tr><td>不可约残差</td><td>~${Math.round(M.unexplained * 100)}%</td><td>含情绪、叙事等特征集外的不可观测因子</td></tr>
          <tr><td>残差性质</td><td>结构性上界</td><td>现有特征已捕获全部可解释信号,继续增维只增方差、R² 停在此水平</td></tr></table></div>
        </div></div>`,
    };
  } },
  { ch: "机器学习", b: () => {
    const pva = M.pva || [], res = pva.map(d => d.a - d.p);
    const lo = Math.min(...res), hi = Math.max(...res), nb = 11, bw = (hi - lo) / nb || 1;
    const counts = Array(nb).fill(0); res.forEach(r => { counts[Math.min(nb - 1, Math.max(0, Math.floor((r - lo) / bw)))]++; });
    const hx = counts.map((c, i) => +(lo + bw * (i + 0.5)).toFixed(2));
    const byf = {}; pva.forEach(d => { (byf[d.firm] = byf[d.firm] || []).push(d.a - d.p); });
    const med = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const fe = Object.entries(byf).map(([f, a]) => ({ firm: f, mae: a.reduce((sm, x) => sm + Math.abs(x), 0) / a.length, med: med(a), n: a.length })).sort((a, b) => b.mae - a.mae);
    const rows = fe.map(x => `<tr${x.firm === "移为通信" ? ' class="hl"' : ""}><td>${x.firm}</td><td>${x.mae.toFixed(3)}</td><td style="color:${x.med > 0.2 ? "#2e7d32" : x.med < -0.2 ? "#a32135" : "inherit"};font-weight:${Math.abs(x.med) > 0.2 ? 700 : 400}">${(x.med >= 0 ? "+" : "") + x.med.toFixed(3)}</td><td>${x.n}</td></tr>`).join("");
    return { title: "⑪ 误差与残差分析",
      headline: "LOFO 留出残差整体近似零均值、无系统性高估或低估;个别公司存在固定偏移 \u2014\u2014 该偏移即基本面之外、与公司绑定的特异成分(情绪缺口)在残差上的体现。",
      html: `<div class="srow" style="flex:1">
        <div class="scol"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">残差分布 · LOFO 留出外推</div>
          <div class="note" style="padding:14px 22px 2px;margin:0">残差(实际 \u2212 预测)近似以 0 为中心、无明显偏态:模型整体无系统性偏差。</div>
          <div class="residhist" style="padding:0 16px 14px">${cssBars(hx, [{ name: "频数", color: "linear-gradient(to top,#3f6493,#c0cee0)", data: counts }], Math.max(1, ...counts))}</div></div></div>
        <div class="scol">
          <div class="panel data" style="flex:1"><div class="panel-h">逐家误差(MAE 降序)与残差中位</div><table class="t compact" style="font-size:18px"><tr><th>公司</th><th>MAE</th><th>残差中位</th><th>n</th></tr>${rows}</table></div>
          <div class="callout" style="flex:none;font-size:20px;margin-top:12px">残差中位显著偏离 0 即公司级固定偏移:<b>移为 +0.354(模型低估)</b>、日海智能 \u22120.619、利尔达 \u22120.724 \u2014\u2014 此即基本面无法解释的公司特异溢价/折让,于第 19 页转化为错误定价筛查信号。</div></div></div>` };
  } },
  { ch: "机器学习", b: () => {
    const c = (M.screen && M.screen.classification) || {}, cm = c.confusion || {};
    return { title: "⑫ 错误定价筛查 · 分类评估",
      headline: "将回归模型转化为<b>高估/低估二分类筛查器</b>(阈值=0 区分溢价/折让),服务投资标的初筛;留出外推 <b>AUC=" + c.auc + "</b>。",
      html: `<div class="srow">
        <div class="scol" style="flex:1.05"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">ROC 曲线 · LOFO 留出外推</div>
          <div class="note" style="padding:13px 22px 2px;margin:0">曲线越趋左上、曲线下面积(AUC)越大,排序区分能力越强;灰虚线为随机基准。</div>
          <div id="c_roc" class="chart" style="flex:1;border:none;border-radius:0;background:transparent;min-height:0"></div></div></div>
        <div class="scol" style="justify-content:flex-start">
          <div class="panel data" style="flex:none"><div class="panel-h">混淆矩阵与分类指标 · 判别阈值 = 0</div>
          <table class="t"><tr><th></th><th>预测:溢价</th><th>预测:折让</th></tr>
          <tr><td>实际:溢价</td><td style="background:#f2f7f2;color:#2e7d32;font-weight:700">真阳 TP ${cm.tp}</td><td style="background:#fbf3e8;color:#a32135">假阴 FN ${cm.fn}</td></tr>
          <tr><td>实际:折让</td><td style="background:#fbf3e8;color:#a32135">假阳 FP ${cm.fp}</td><td style="background:#f2f7f2;color:#2e7d32;font-weight:700">真阴 TN ${cm.tn}</td></tr></table>
          <table class="t compact" style="border-top:2px solid var(--brand);font-size:18px"><tr><th style="font-size:18px">AUC</th><th style="font-size:18px">准确率</th><th style="font-size:18px">精确率</th><th style="font-size:18px">召回率</th><th style="font-size:18px">F1</th></tr>
          <tr>${[c.auc, c.accuracy, c.precision, c.recall, c.f1].map(v => `<td style="font-size:24px;font-weight:700;color:#a32135">${v}</td>`).join("")}</tr></table>
          <div class="note" style="padding:8px 20px 12px;margin:0;font-size:18px">样本溢价基准占比 ${Math.round((c.base_rate_premium || 0) * 100)}%,各指标均高于随机基线;精确率=预测溢价中实为溢价之比,召回率=实际溢价被正确识别之比。</div></div>
          <div class="panel" style="flex:1;margin-top:12px"><div class="panel-h">应用定位 · 投资标的初筛</div><table class="t" style="font-size:19px">
          <tr><td>前提</td><td>标签为<b>模型定义的超额估值正负</b>(溢价/折让),非市场可观测真值;LOFO 留出外推、无前视泄漏</td></tr>
          <tr><td>功能</td><td>对候选公司预测基本面应得估值,识别实际估值显著偏离应得水平者</td></tr>
          <tr><td>口径</td><td>与回归同一模型、同一留出外推口径,分类仅为决策层呈现</td></tr>
          <tr><td>边界</td><td>有效簇仅 ${M.n_firms},指标置信区间较宽,且标签依赖横截面定价模型;定位为<b>方向性初筛</b>,不构成定价或择时结论</td></tr></table></div></div></div>`,
    };
  } },
  { ch: "机器学习", b: () => {
    const incr = (WB.r2_compare.blackbox_incremental_oot * 100).toFixed(1), w = WB.r2_compare;
    const wbBars = cssBars(["样本内", "OOT", "LOFO"], [
      { name: "线性(白盒)", color: "#3f6493", data: [w.linear_whitebox.insample, w.linear_whitebox.oot, w.linear_whitebox.lofo] },
      { name: "GBT(黑盒)", color: "#9a9a9a", data: [w.gbt.insample, w.gbt.oot, w.gbt.lofo] },
    ], 1.0);
    return { title: "⑬ 可解释性 — SHAP 稳定性与白盒证明",
      headline: "SHAP 给<b>重要性</b>、不给方向:自助重抽 " + M.stab.B + " 次区分<b>稳定核心与不稳项</b>;<b>方向</b>由白盒系数与树的经验方向互证(" + M.wbdir.n_agree + "/" + M.wbdir.n_total + " 同向),且黑盒对线性 OOT 增量仅 +" + incr + "% → 结论不依赖黑盒。",
      html: `<div class="srow"><div class="scol" style="flex:1.08"><div class="panel" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">SHAP 重要性 · 聚类自助稳定性(${M.stab.B} 次)</div>
        <div class="note" style="padding:12px 22px 0;margin:0">点=自助中位重要性,横线=5–95% 区间,行尾=入选频率;<span style="color:#3f6493;font-weight:700">■ 稳定(≥80%)</span> <span style="color:#9a9a9a;font-weight:700">■ 较不稳</span>。<b>杠杆、成长与市场结构构成稳定核心</b>;盈利类入选频率不足 80%,解读以核心为准。</div>
        <div id="c_ss" class="chart" style="flex:1;border:none;border-radius:0;background:transparent;min-height:0"></div></div></div>
      <div class="scol" style="justify-content:flex-start">
        <div class="panel" style="flex:none;display:flex;flex-direction:column"><div class="panel-h">方向对照 · 白盒系数 × 树的经验方向</div>
          <div class="note" style="padding:12px 22px 0;margin:0">同负(左下)或同正(右上)即两模型同向:<b>${M.wbdir.n_agree}/${M.wbdir.n_total} 一致</b>,仅<b style="color:#a32135">北向持股占比</b>例外 —— 方向结论由两个机理不同的模型互证。</div>
          <div id="c_wd" class="chart" style="height:272px;flex:none;border:none;border-radius:0;background:transparent;min-height:0"></div></div>
        <div class="panel data" style="flex:1;margin-top:12px"><div class="panel-h">白盒证明 · 同协议 R² 对比</div><table class="t compact" style="font-size:17px">
          <tr><th>口径</th><th>线性(白盒)</th><th>GBT(黑盒)</th><th>黑盒增量</th></tr>
          <tr><td>样本内</td><td>${w.linear_whitebox.insample}</td><td>${w.gbt.insample}</td><td>+${(w.gbt.insample - w.linear_whitebox.insample).toFixed(3)}</td></tr>
          <tr class="hl"><td>OOT</td><td>${w.linear_whitebox.oot}</td><td>${w.gbt.oot}</td><td>+${(w.gbt.oot - w.linear_whitebox.oot).toFixed(3)}</td></tr>
          <tr class="hl"><td>LOFO</td><td>${w.linear_whitebox.lofo}</td><td>${w.gbt.lofo}</td><td>${(w.gbt.lofo - w.linear_whitebox.lofo).toFixed(3)}</td></tr></table></div></div></div>
      <div class="callout" style="flex:none;margin-top:12px;font-size:21px">方向图谱:<b>杠杆为负、成长为负、盈利为正</b>,两个机理不同的模型给出同一套方向。SHAP 因特征共线会分摊贡献,<b>重要性不等于因果效应</b> —— 何者经得起少簇稳健检验,由下页五维一致性裁定。</div>` };
  } },
  { ch: "机器学习", b: () => {
    const gd = EX.guardrail, refusedNames = gd.refused_levers.map(r => r.feat).join("、");
    return { title: "⑭ 稳健性检验 — 五维一致性(consilience)",
      headline: "同一假设须在<b>推断 / 设定 / 识别 / 证伪 / 泛化</b>五类独立证据下结论一致方认定为稳健(显著性以 p<0.05 为参照阈值);任一维度不一致即记为未通过。",
      html: `${(() => {
        const H = ["H1", "H2", "H3"].map(k => TRI[k]);
        const cell = (v, ok) => `<td style="background:${ok ? "#eef4ee" : "#faeceb"};color:${ok ? "#2e5d32" : "#a32135"};font-weight:600">${v}</td>`;
        const dims = [
          ["推断", "野聚类自助 p(WCB)", h => `p=${h.p_wcb}`, h => h.passes["推断"]],
          ["设定", "多设定下符号一致率", h => Math.round(h.sign * 100) + "%", h => h.passes["设定"]],
          ["识别", "公司内固定效应系数", h => (h.within > 0 ? "+" : "") + h.within + (h.passes["识别"] ? "(同号)" : "(趋零变号)"), h => h.passes["识别"]],
          ["证伪", "安慰剂 / 置换检验 p", h => `${h.p_plac} / ${h.p_perm}`, h => h.passes["证伪"]],
          ["泛化", "留一公司方向一致率", h => Math.round(h.lofo * 100) + "%", h => h.passes["泛化"]],
        ];
        return `<div class="panel data" style="flex:1;display:flex;flex-direction:column;margin-bottom:12px"><div class="panel-h">三条预登记假设 × 五维证据矩阵 · 绿=通过 红=未过</div>
        <table class="t" style="font-size:18.5px;flex:1;height:100%">
        <tr><th style="width:22%">维度 · 方法</th>${H.map(h => `<th>${h.name.replace(/\(.*$/, "")}</th>`).join("")}</tr>
        <tr><td><b>标准化系数 β</b><div style="font-size:17px;color:#8a8078;font-weight:400">跨公司回归</div></td>${H.map(h => `<td style="font-size:23px;font-weight:700">${h.coef > 0 ? "+" + h.coef : h.coef}</td>`).join("")}</tr>
        ${dims.map(d => `<tr><td><b>${d[0]}</b><div style="font-size:17px;color:#8a8078;font-weight:400">${d[1]}</div></td>${H.map(h => cell(d[2](h), d[3](h))).join("")}</tr>`).join("")}
        <tr class="hl"><td><b>判定</b><div style="font-size:17px;color:#8a8078;font-weight:400">五维一致方稳健</div></td>${H.map(h => { const n = Object.values(h.passes).filter(Boolean).length, ok = n >= 4; return `<td style="font-size:20px;font-weight:700;color:${ok ? "#2e5d32" : "#a32135"}">${ok ? "可信" : "存疑"} ${n}/5${ok ? "" : " · 未获稳健支持"}</td>`; }).join("")}</tr></table>
        <div class="note" style="padding:9px 20px 12px;margin:0;font-size:18px">附:Romano–Wolf 多重比较校正 p —— ${H.map(h => h.name.slice(0, 2) + " " + h.rw).join(" · ")};有效独立簇约 ${H.map(h => h.G).join(" / ")} 个,故任何单一 p 值不足为凭,以五维一致为准。</div></div>`;
      })()}
        <div class="callout" style="flex:none;font-size:20px;line-height:1.5"><b>算术耦合审查</b>:对位于 Y=ln(PS) 分母的含营收特征及含市值特征作定义级标记,排除其反事实解读(共 ${gd.refused_levers.length} 项:${refusedNames});特征重要性(SHAP)仅作初筛,最终判定以上述五维检验为准。</div>` };
  } },
  // ---- PART 04 结果解释与实务建议 ----
  { b: () => ({
    title: "分析框架 · 市值的恒等分解",
    headline: "市值 = 营收 × 估值倍数(PS);取对数后变动<b>可加分解</b>为 经营通道 + 再定价通道,会计恒等、逐家精确。",
    html: `<div class="ident" style="flex:none;margin:2px 0 8px">${[
      identbox("市值", "Market Cap", "公司总市值", true),
      `<div class="ident-op">=</div>`,
      identbox("营收", "Revenue", "经营通道", false),
      `<div class="ident-op">×</div>`,
      identbox("估值倍数", "PS = 市值 / 营收", "再定价通道", false),
    ].join("")}</div>
    <div class="note" style="flex:none">对数形式(可加):<b>Δln 市值 = Δln 营收 + Δln(PS)</b> —— 将市值变动精确拆为"经营贡献"与"估值再定价贡献",可逐家归因。</div>
    <div style="flex:none;display:flex;align-items:center;gap:22px;background:#f6ecec;border-left:5px solid var(--brand);border-radius:6px;padding:12px 24px;margin:4px 0 10px"><span style="font-size:17px;color:#8a6a6a;white-space:nowrap">实例 · 移为 ${YW.y0}–${YW.y1}</span><span style="font-size:24px;font-weight:700;color:var(--ink)">市值 <b style="color:var(--brand)">×${YW.mcap}</b> ＝ 营收 <b style="color:#2f5d50">×${YW.rev}</b> × 估值倍数 <b style="color:var(--brand)">×${YW.ps}</b></span><span style="font-size:17px;color:#6f6259">营收翻倍有余,但估值倍数近乎腰斩 —— 增长被再定价通道抵消,详见移为诊断页。</span></div>
    <div class="srow" style="flex:1">
      <div class="scol"><div class="panel"><div class="panel-h">经营通道 · 营收</div><table class="t">
        <tr><td>含义</td><td>把生意规模做大(量 × 价)</td></tr>
        <tr><td>驱动因素</td><td>终端需求、市场份额、产能与新品</td></tr>
        <tr class="hl"><td>本研究衡量</td><td>营收复利增速(CAGR)、营收倍数</td></tr>
        <tr><td>判读</td><td>增速领先同行 → 经营通道贡献为正</td></tr></table></div></div>
      <div class="scol"><div class="panel"><div class="panel-h">再定价通道 · 估值倍数(PS)</div><table class="t">
        <tr><td>含义</td><td>市场为每元营收支付的倍数</td></tr>
        <tr><td>驱动因素</td><td>成长预期、盈利质量、风险(杠杆)、情绪(推测·未度量)</td></tr>
        <tr class="hl"><td>本研究衡量</td><td>超额估值 = log(PS) 剥年度+规模之残差(即 ML 目标 Y)</td></tr>
        <tr><td>判读</td><td>倍数扩张为正;行业性压缩则形成拖累</td></tr></table></div></div></div>
    <div class="callout" style="flex:none">该框架把"市值为何变化"拆为两个可归因问题 —— <b>生意是否做大、市场是否重定价</b>;本章据此对全样本逐家分解,并落到移为诊断。</div>` }) },
  { b: () => ({
    title: "结论筛选流程与决策剪枝",
    headline: `候选信号经<b>四个递增严格的环节</b>逐级筛除,由 ${M.n_all} 项收敛至 <b>2 条稳健价值驱动</b>;剪枝表进一步标注各驱动的<b>可操作性</b>,唯一兼具稳健证据与公司可操作性的是杠杆。`,
    html: `<div class="srow" style="flex:1">
      <div class="scol" style="flex:0.92;justify-content:space-between;gap:0">${[
        ["01", "特征入选", `${M.n_all} → ${M.n_sel}:L1 将冗余与共线特征系数归零(净利率与营业利润率 r=0.99 等)`, 100],
        ["02", "算术耦合剔除", "剔除含营收、含市值的算术耦合项(毛利率、净利率等 9 项),排除机械相关", 88],
        ["03", "公司内检验", "剔除幸存者偏差项:研发强度、海外占比 —— 跨公司显著、公司内不显著", 76],
        ["04", "五维一致性", "预登记命题 3 → 2:H1 成长被折价、H2 低杠杆 ↔ 高估值 通过;H3 盈利 1/5 未获支持", 64],
      ].map((x, i) => `<div style="width:${x[3]}%;background:var(--soft);border:1px solid var(--line);border-left:7px solid var(--brand);border-radius:0 6px 6px 0;padding:20px 22px"><div style="display:flex;align-items:baseline;gap:12px"><span style="font-size:22px;color:var(--brand);font-weight:700">${x[0]}</span><span style="font-size:22px;font-weight:700">${x[1]}</span></div><div style="font-size:18.5px;color:var(--mute);line-height:1.55;margin-top:6px">${x[2]}</div></div>`).join("")}
        <div class="callout" style="flex:none;margin-top:14px;font-size:19px;line-height:1.5">SHAP 重要性仅作初筛,最终判定以五维一致性为准;较高剔除比例与小样本下控制过拟合及假阳性的预期一致。</div></div>
      <div class="scol"><div class="panel data" style="flex:1;display:flex;flex-direction:column"><div class="panel-h">决策剪枝 · 稳健性 × 可操作性</div>
        <table class="t compact" style="font-size:17px;flex:1;height:100%">
        <tr><th>驱动</th><th>一致性</th><th>标准化效应</th><th>操作性</th><th>统计学含义</th></tr>
        <tr><td><b>资产负债率</b></td><td style="background:#eef4ee;color:#2e5d32;font-weight:700">5/5</td><td>−0.52</td><td><b>公司可控协变量</b></td><td>与超额估值稳健负相关、公司内符号不变;属观测性关联、未达因果识别,量级不可读作精确弹性</td></tr>
        <tr><td><b>营收增长</b></td><td style="background:#eef4ee;color:#2e5d32;font-weight:700">5/5</td><td>−0.17</td><td>非正向操作项</td><td>倍数压缩为本样本的系统性定价特征,与"规模溢价"先验相反;增长本身不应停止</td></tr>
        <tr><td>净利率(残差化)</td><td style="background:#faeceb;color:#a32135;font-weight:700">1/5</td><td>+0.11(不显著)</td><td>—</td><td>偏效应不显著(WCB p=0.41)、公司内变号;功效不足,未获稳健支持</td></tr>
        <tr><td>特异 / 情绪成分</td><td>—</td><td>≈50% 残差方差</td><td>不可解释</td><td>与基本面正交(1−R²),构成模型之外的不确定性敞口</td></tr></table>
        <div class="note" style="padding:9px 20px 12px;margin:0;font-size:18px">唯一兼具稳健证据与可操作性的是<b>杠杆</b>;成长折价虽稳健、却非可正向操作的杠杆;盈利无证据支撑。</div></div></div></div>` }) },
  { ch: "模型发现", b: () => {
    const b1 = DATA.elasticity.beta_2wayFE;
    const card = (no, name, ok, verdict, big, bigSub, mean, theory, test) => `<div class="scol"><div class="card" style="flex:1;justify-content:space-between;gap:14px;padding:28px 30px">
      <div><h3 style="font-size:25px;line-height:1.3;margin:0 0 10px">${no} ${name}</h3>
        <span class="vbadge ${ok ? "pass" : "fail"}" style="font-size:22px;padding:4px 16px;font-weight:700">${verdict}</span></div>
      <div style="font-size:38px;font-weight:700;color:${ok ? "#1d3557" : "#a32135"};line-height:1.1">${big}<span style="font-size:18px;color:#6f6259;font-weight:400"> ${bigSub}</span></div>
      <div style="font-size:21px;line-height:1.5"><b>经济含义</b>:${mean}</div>
      <div style="font-size:21px;line-height:1.5"><b>财务理论</b>:${theory}</div>
      <div class="note" style="font-size:18px;margin:0">检验:${test}</div></div></div>`;
    return { title: "发现① 三条价值驱动结论",
      headline: "三条结论经五维一致性检验:成长被折价、低杠杆 ↔ 高估值 <b>成立(5/5)</b>;盈利率驱动估值 <b>未获稳健支持(1/5)</b>。",
      html: `${driversBars()}
        <div class="note" style="flex:none;font-size:18px">图示各假设的<b>跨公司系数 vs 公司内时序系数</b>:H1、H2 公司内仍显著(稳健),H3 公司内趋零并变号(未获稳健支持)。"五维 X/5" 指通过 推断/设定/识别/证伪/泛化 五类检验的项数,方法见第 21 页。</div>
        <div class="srow" style="flex:1">
        ${card("①", "成长被折价", true, "五维通过 5/5", "β ≈ " + b1, "(市值对营收弹性 &lt;1)", `营收每增长 10%,市值仅增长约 ${Math.round(b1 * 10)}%,营收增长未获等比例的市值提升。`, "行业商品化,增长缺乏稀缺性,难获成长溢价。", `Δln(PS) ~ Δln营收 斜率 ${TRI.H1.coef};WCB p=${TRI.H1.p_wcb};公司内 ${TRI.H1.within}`)}
        ${card("②", "低杠杆 ↔ 高估值", true, "五维通过 5/5", TRI.H2.coef, "(超额估值 ~ 资产负债率)", "资产负债率越低,超额估值越高;领先-滞后检验偏正向,削弱反向因果疑虑。", "资本结构理论:低杠杆降低财务困境风险与资本成本,支撑更高估值倍数。", `β=${TRI.H2.coef};WCB p=${TRI.H2.p_wcb};公司内 ${TRI.H2.within};属相关性,非因果`)}
        ${card("③", "盈利率驱动估值", false, "五维通过 1/5 · 未获稳健支持", "≈ 0", "(剔除营收算术相关后)", "剔除与营收的算术相关后,盈利率的偏效应未获稳健支持(功效不足,非已证明无关)。", "市场更可能为可持续质量与实质成长定价,而非账面利润率。", `β=${TRI.H3.coef};WCB p=${TRI.H3.p_wcb};安慰剂 p=${TRI.H3.p_plac}(均不显著)`)}
      </div>
      <div class="callout" style="flex:none">与财务理论的一致性:成长被折价 合行业商品化;低杠杆 ↔ 高估值 合资本结构理论;盈利率未获独立稳健支持(功效不足),其观测方向与"市场为质量与成长而非账面利润率定价"一致。前两条为确证结论,第三条暂存疑。</div>` };
  } },
  { ch: "模型发现", b: () => {
    const g = (M.screen && M.screen.yiwei_mispricing) || {};
    return { title: "发现② 移为估值诊断 + 错误定价分解",
      headline: "市值 ×" + YW.mcap + " = 营收 ×" + YW.rev + " × 估值倍数 ×" + YW.ps + ";估值已属行业前列,<b>当前溢价过半属不可解释残差(推测含情绪)</b>。",
      html: `<div class="srow" style="flex:1">
        <div class="scol"><div class="note">恒等分解(2017→2025):市值 = 营收 × 估值倍数。营收<b>增速低于同行</b>、估值倍数<b>受行业压缩</b>,两通道均不占优。</div>${cssHBars([{ name: "营收(经营通道)", value: YW.rev, color: "#2f5d50", desc: `经营通道:营收累计增至 ×${YW.rev}` }, { name: "估值倍数(再定价)", value: YW.ps, color: "#9b2226", desc: `再定价通道:倍数压缩至 ×${YW.ps}(行业 de-rating)` }, { name: "市值", value: YW.mcap, color: "#7d1828", desc: `两通道相乘 → 市值仅 ×${YW.mcap},几近停滞` }], 1)}</div>
        <div class="scol"><div class="note">超额估值分解(同行 LOFO 定价模型外推):基本面应得 <b>+${g.fundamental_justified}</b>,实际 +${g.actual_excess},差额 <b>+${g.sentiment_gap}</b> 属情绪/未解释。</div>
          ${cssStack([{ name: "基本面可解释", color: "#1d3557", value: g.fundamental_justified }, { name: "情绪 / 未解释", color: "#a32135", value: g.sentiment_gap }], g.actual_excess)}
          <div class="panel"><div class="panel-h">移为关键定位</div><table class="t">
            <tr class="hl"><td>超额估值</td><td>+${g.actual_excess} · 行业前列(溢价)</td></tr>
            <tr><td>资产负债率</td><td>约 13.5% · 行业最低(估值正向项)</td></tr>
            <tr><td>海外营收占比 / 增速</td><td>${YW.ov_share}% / ${YW.ov_cagr}%(领先企业海外增速 +50~69%)</td></tr>
            <tr><td>营收三年复利增速</td><td>${YW.rev_cagr}% · 低于领先企业水平</td></tr></table></div></div></div>
        <div class="callout" style="flex:none">移为估值已属行业前列:约 ${Math.round((g.explained_share || 0) * 100)}% 由基本面支撑、约 ${Math.round((g.sentiment_share || 0) * 100)}% 为不可解释残差(推测含情绪;N=14 区间宽)。<b>提升空间在营收规模,非估值倍数;下行风险集中于该残差。</b></div>` };
  } },
  { ch: "模型发现", b: () => ({
    title: "发现③ 全行业对标与战略画像",
    headline: "将模型结论置于全行业:成长被折价 → 领先企业以营收放量跨越估值压缩;移为<b>经营通道受海外增速制约</b>。",
    html: `<div class="srow" style="flex:1">
      <div class="scol"><div class="note">市值变动恒等分解(绿=经营/营收,红=再定价/估值;移为深色)。<b>印证模型结论 H1</b>:营收增长被估值倍数压缩(β&lt;1),领先企业须以充分营收放量取胜。</div><div id="c_fs" class="chart"></div></div>
      <div class="scol"><div class="note">战略画像(海外占比 × 增速,气泡=市值倍数)。<b>解释移为经营通道为何偏弱</b>:海外占比高(97%)、增速低(6%),即模型所指营收增速约束的根源。</div><div id="c_st" class="chart"></div></div></div>
    <div class="callout" style="flex:none;margin-top:12px">与模型的关系:ML 模型解释的是<b>再定价通道</b>(超额估值 Y);本页将其并入<b>经营通道</b>的恒等分解与战略画像,据此定位移为短板在经营侧(海外增长),而非估值。</div>` }) },
  { ch: "模型发现", b: () => {
    const rows = [...F].sort((a, b) => b.mcap - a.mcap).map(f => `<tr${f.is_yiwei ? ' class="hl"' : ""}><td>${f.firm}</td><td>×${f.mcap}</td><td>×${f.rev}</td><td>${f.rev_cagr}%</td></tr>`).join("");
    return { title: "发现④ 逐家市值路径与倍数对照",
      headline: "各公司累积市值路径(首年=0):领先企业持续上行,<b>移为(红)长期低平</b>;路径斜率由营收放量主导。",
      html: `<div class="srow" style="flex:1">
        <div class="scol" style="flex:1.5"><div class="note">折线 = 各代表公司累积 ln 市值随年份变化(首年归零);<b class="hot">移为(红)</b>长期低平,广和通 / 移远 / 美格等持续抬升。斜率越大 = 市值复利越快。</div><div id="c_fl" class="chart"></div></div>
        <div class="scol" style="flex:1"><div class="note">全 13 家市值 / 营收倍数(按市值倍数降序,移为高亮);领先企业以营收放量抬升市值。</div>
          <div class="panel data" style="flex:1"><div class="panel-h">逐家倍数与营收增速</div><table class="t" style="font-size:18px"><tr><th>公司</th><th>市值 ×</th><th>营收 ×</th><th>营收 CAGR</th></tr>${rows}</table></div></div></div>` };
  } },
  // ---- 实务建议 ----
  { ch: "模型发现", b: () => {
    const g = (M.screen && M.screen.yiwei_mispricing) || {};
    const rec = (tag, color, title, action, basis, note) => `<div class="scol"><div class="card" style="flex:1;justify-content:flex-start;gap:11px;padding:22px 28px;border-top:7px solid ${color}">
      <h3 style="font-size:24px;margin:0"><span style="color:${color}">【${tag}】</span> ${title}</h3>
      <div style="font-size:20px;line-height:1.5"><b>建议</b>:${action}</div>
      <div style="font-size:19px;line-height:1.5"><b>依据</b>:${basis}</div>
      <div class="note" style="font-size:17px;margin:0">${note}</div></div></div>`;
    return { title: "实务建议 · 维持 / 扩张 / 规避 / 监测",
      headline: "由模型结论导出的可操作建议:估值已处最优(维持)、营收增长是唯一引擎(扩张)、规避无效的估值动作(规避)、持续监测错误定价(监测)。",
      html: `<div class="srow" style="flex:1">
        ${rec("维持", "#1d3557", "资本结构与预期管理", "维持保守的资产负债结构,审慎评估并购加杠杆;并主动管理投资者预期与信息披露。", "低杠杆是唯一通过五维检验的估值正向因子,移为资产负债率约 13.5% 居行业最低;当前估值溢价约 " + Math.round((g.sentiment_share || 0) * 100) + "% 属不可解释残差(推测含情绪,未度量),稳定性较低。", "性质:稳健相关(非因果)。理论依据:资本结构理论 + 行为金融。")}
        ${rec("扩张", "#a32135", "扩张海外市场份额", "将资本与资源由财务优化转向海外市场份额扩张,以扩大营收规模基数。", "市值 = 营收 × 估值倍数;移为估值倍数已居行业前列、接近上限,故抬升市值的主要路径为营收增长。移为海外营收增速仅 6%,领先企业为 +50~69%。", "边界:倍数接近上限属会计恒等(确定);份额扩张能否转化为估值提升,不作因果承诺。")}
      </div>
      <div class="srow" style="flex:1">
        ${rec("规避", "#8a7f72", "规避无效的估值动作", "不将研发强度、毛利率、费用率视为估值杠杆;不以再定价为目的实施财务优化。", "上述指标在跨公司层面显著、但在公司内时序检验中不显著(幸存者偏差),调整之并不改变估值;低杠杆与流动性亦已处于最优区间。", "理论依据:内生性 / 幸存者偏差。经营层面研发投入仍应正常进行。")}
        ${rec("监测", "#2e7d32", "持续监测错误定价", "以「实际溢价 − 基本面应得」缺口构建季度监测看板,辅助投资者沟通与决策。", "当前缺口为 +" + g.sentiment_gap + "(不可解释残差偏高,推测含情绪),提示回调风险;缺口转负则提示低估。", "用途:决策支持 / 持续投资者关系工具(复用本模型 LOFO 外推)。")}
      </div>` };
  } },
  // ---- 结语 ----
  { ch: "结语", b: () => ({
    title: "局限与边界",
    headline: "本研究为<b>解释性建模,而非因果推断</b>;受样本规模约束,结论以保守口径表述,并明确其适用边界与不可解释部分。",
    html: `<div class="srow" style="flex:1"><div class="scol"><div class="panel"><div class="panel-h">研究局限与边界声明</div><table class="t">
      <tr><th>局限维度</th><th>具体表现</th><th>本研究的处理 / 边界声明</th></tr>
      <tr><td>因果识别</td><td>N=14、缺乏外生冲击,IV/DiD 估计噪声较大</td><td>仅实施准因果(公司内固定效应 + 领先-滞后 + 安慰剂);结论声明为稳健相关,不主张因果</td></tr>
      <tr class="hl"><td>样本规模</td><td>14 家公司、有效独立簇约 5 个,横截面解释上限约 50%</td><td>采用 wild cluster bootstrap 少簇推断;结论一律为<b>量级判断而非精确点估计</b>,不夸大解释力</td></tr>
      <tr><td>截面外推</td><td>逐家分析深度受上市历史长度限制</td><td>次新股结果仅供参考;以留一公司(LOFO)验证跨公司可迁移性</td></tr>
      <tr><td>预测边界</td><td>预测过拟合属结构性问题(信号低)</td><td>仅报告稳健的跨公司外推 R²≈0.5,不追求测试集择时 IC</td></tr>
      <tr><td>适用范围</td><td>样本限于模组 / 终端行业,截至 2025</td><td>结论限定于样本期与本行业,外推至其他行业需谨慎</td></tr></table></div></div></div>
    <div class="callout" style="flex:none;margin-bottom:10px;background:#f3f6f3;border-left-color:#2e7d32;color:#2e5d32">未来工作:\u2460 扩大样本(更多模组 / 通信设备公司与行业)以提升横截面统计功效;\u2461 引入外生冲击(政策 / 事件)开展因果识别(IV / DiD);\u2462 纳入文本与另类数据,补充情绪、叙事等当前不可观测成分;\u2463 将错误定价缺口看板滚动更新为持续监测工具。</div>
    <div class="callout" style="flex:none">研究定位:以剔除伪规律、白盒可复算、明确标识不可解释残差为方法准则,提供经稳健性检验的解释性结论,而非可直接套用的估值提升公式。</div>` }) },
];

/* ---- 篇章 / 目录 ---- */
const PART_OF = [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4];
const PARTS = {
  1: { t: "研究背景与问题", en: "BACKGROUND", desc: "选题价值、案例选择与研究问题界定" },
  2: { t: "数据与特征工程", en: "DATA & FEATURES", desc: "数据来源、预处理与结合财务理论的特征构建" },
  3: { t: "模型构建·训练·评估", en: "MODELING", desc: "模型选型、优化、多指标评估与可解释性" },
  4: { t: "结果解释与实务建议", en: "FINDINGS", desc: "模型发现、案例公司诊断与可操作建议" },
};
const TOC = [
  ["01", "研究背景与问题", "选题、案例与研究问题", "BACKGROUND"],
  ["02", "数据与特征工程", "数据源、预处理、财务理论特征", "DATA & FEATURES"],
  ["03", "模型构建·训练·评估", "选型、优化、多指标评估、可解释", "MODELING"],
  ["04", "结果解释与实务建议", "模型发现、案例诊断、实务建议", "FINDINGS"],
];

function coverHtml(n) {
  return `<section class="slide cover"><div class="brand"></div><div class="cover-square"></div>
    <h1 class="cover-title">基于机器学习的公司估值建模与价值驱动分析</h1><div class="cover-rule"></div>
    <div class="cover-sub">《大数据财务分析》小组案例　·　以移为通信(300590)为例</div>
    <div class="cover-members">组员:林震 · 郁思雨 · 甘元 · 马雨佳 · 潘润斌 · 刘妤冬</div>
    <div class="cover-no">${String(n).padStart(2, "0")}</div></section>`;
}
function tocHtml(n) {
  const rows = TOC.map((r, i) => `<div class="toca-row"><div class="tr-no">${r[0]}</div><div class="tr-name">${r[1]}</div><div class="tr-note">${r[2]}</div><div class="tr-dots"></div><div class="tr-en">${r[3]}</div></div>`).join("");
  return `<section class="slide toc"><div class="brand"></div><div class="toca-grid">
    <aside class="toca-side"><div class="toca-en">CONTENTS</div><h2 class="toca-title">目录</h2><div class="toca-rule"></div>
      <p class="toca-lead">以可解释机器学习对公司估值横截面建模,识别价值驱动,并应用于案例公司的实务建议。</p><div class="toca-meta">全文 · 四个部分</div></aside>
    <div class="toca-list">${rows}</div></div><div class="cover-no">${String(n).padStart(2, "0")}</div></section>`;
}
function dividerHtml(part, n) {
  const p = PARTS[part], pn = String(part).padStart(2, "0");
  return `<section class="slide pdiv"><div class="pd-block"><span class="pd-bignum">${pn}</span></div>
    <div class="pd-left"><div class="pd-part">PART ${pn}</div><h2 class="pd-title">${p.t}</h2><div class="pd-en">${p.en}</div><div class="pd-rule"></div><p class="pd-desc">${p.desc}</p></div>
    <div class="cover-no">${String(n).padStart(2, "0")}</div></section>`;
}
function thanksHtml(n) {
  return `<section class="slide cover"><div class="brand"></div><div class="cover-square"></div>
    <h1 class="cover-title">感谢观看</h1><div class="cover-rule"></div>
    <div class="cover-sub">THANK YOU　·　欢迎批评指正</div>
    <div class="cover-members">基于机器学习的公司估值建模与价值驱动分析　·　以移为通信(300590)为例</div>
    <div class="cover-no">${String(n).padStart(2, "0")}</div></section>`;
}
function autodetect(h) {
  return [
    h.includes('id="c_yw"') && ["c_yw", o_yiwei], h.includes('id="c_fs"') && ["c_fs", o_firms],
    h.includes('id="c_st"') && ["c_st", o_strategy], h.includes('id="c_pd"') && ["c_pd", o_pd],
    h.includes('id="c_mcf"') && ["c_mcf", o_mcap_cf], h.includes('id="c_shap"') && ["c_shap", o_shap], h.includes('id="c_ss"') && ["c_ss", o_shapstab], h.includes('id="c_wd"') && ["c_wd", o_wbdir],
    h.includes('id="c_r2"') && ["c_r2", o_r2val], h.includes('id="c_wb"') && ["c_wb", o_wb],
    h.includes('id="c_lc"') && ["c_lc", o_learncurve], h.includes('id="c_pva"') && ["c_pva", o_pva],
    h.includes('id="c_fl"') && ["c_fl", o_firmlines],
    h.includes('id="c_roc"') && ["c_roc", o_roc], h.includes('id="c_gap"') && ["c_gap", o_gap],
    h.includes('id="c_ceil"') && ["c_ceil", o_ceiling], h.includes('id="c_fg"') && ["c_fg", o_featgrp],
    h.includes('id="c_l1"') && ["c_l1", o_l1], h.includes('id="c_l1p"') && ["c_l1p", o_l1path],
  ].filter(Boolean);
}

/* 组装:封面 + 目录 + (每篇分隔页 + 内容页) */
const deck = [{ type: "cover" }, { type: "toc" }];
let cp = 0;
CONTENT.forEach((c, i) => {
  const part = PART_OF[i];
  if (part !== cp) { cp = part; deck.push({ type: "divider", part }); }
  deck.push({ type: "content", c, part });
});
deck.push({ type: "thanks" });

function build() {
  let pg = 0;
  const html = deck.map(s => {
    pg++;
    if (s.type === "cover") return coverHtml(pg);
    if (s.type === "toc") return tocHtml(pg);
    if (s.type === "divider") return dividerHtml(s.part, pg);
    if (s.type === "thanks") return thanksHtml(pg);
    const d = s.c.b(); s.c._d = d;
    return `<section class="slide"><div class="brand"></div><div class="header"><div class="kicker">${PARTS[s.part].t}</div><h2 class="title">${d.title}</h2>${d.headline ? `<div class="subtitle">${d.headline}</div>` : ""}</div><div class="body">${d.html}</div><div class="cover-no">${String(pg).padStart(2, "0")}</div></section>`;
  }).join("");
  document.getElementById("deck").innerHTML = html;
  deck.filter(s => s.type === "content").forEach(s => (s.c._d.charts || autodetect(s.c._d.html)).forEach(([id, fn]) => mk(id, fn())));
}
build();
window.addEventListener("resize", () => Object.values(charts).forEach(c => c && c.resize()));
