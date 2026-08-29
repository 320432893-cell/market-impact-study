# market-impact-study

同业市值归因与事件研究：财务指标居后而市值居前的公司，市场定价的依据到底是什么。

## 数据

`collect_tushare_data.py` / `collect_akshare_sources.py` / `collect_eastmoney_ir.py` 从 tushare、akshare、东方财富投资者关系页拉 A 股行情、财务与事件数据，`peer_universe.py` 圈定可比样本。处理后的面板、事件候选、建模数据集落在 `data/processed/`。

## 建模

`build_fundamental_panel.py` 与 `build_normalized_features.py` 构建标准化财务面板；42 个原始特征经对数恒等分解、耦合审查与 L1 筛选收敛到 17 个，交给单调约束 LightGBM 与 ElasticNet 分任描述与验证（`build_valuation_model.py`、`build_attribution_rigorous.py`）——前者要对业务方向可解释，后者要在换设定后仍然稳健。`build_nested_cv.py` 做嵌套交叉验证，`build_stability_bootstrap.py` 和 `build_spec_curve.py` 分别验证系数在重采样和不同设定组合下的稳健区间。

## 事件研究与因果推断

`calculate_event_car.py` / `build_factor_car.py` 算事件窗口的异常收益；`build_event_inference.py`、`harden_cate_inference.py`、`interpret_cate_policy.py` 做条件平均处理效应（CATE）推断，`build_yiwei_synthetic_control.py` 用合成控制法构造反事实基准。`verify_event_dml_robust.py`、`verify_whitebox_explanation.py`、`verify_drivers_triangulation.py` 是三条独立的验证线——同一个结论要经得住双重机器学习稳健性检验、白盒可解释性回查、多信源交叉验证三关都过。

## 结论

低负债带来估值溢价，盈利能力无稳健影响；基本面能解释估值差异约一半（嵌套交叉验证 R² 0.45）。

## 工程习惯

`docs/INCIDENTS.md` 记生产事故（现象/根因/回归测试三栏），`docs/ERROR_CATALOG.md` 是已知错误类型索引——分析类项目也按"失效要留痕迹"的标准维护，不是跑一次就扔的脚本。

`run_pipeline.py` 是全流程入口，`validate_market_outputs.py` / `validate_ml_ssot.py` 是产出侧的正确性校验。
