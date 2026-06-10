# Renke Field Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐腾龙小学智慧农场真实仁科设备的雨量指标，并把土壤探头未插入土壤的现场事实纳入告警策略。

**Architecture:** 继续使用 TanStack Start + Cloudflare D1。指标枚举、字典、迁移约束和仁科同步映射保持同一来源；告警策略在仁科同步域内根据腾龙当前现场状态抑制土壤探头误报。

**Tech Stack:** TypeScript, Vitest, Cloudflare Workers, Cloudflare D1, pnpm.

---

### Task 1: Add Rainfall Metric

**Files:**
- Modify: `src/domain/standards/enums.ts`
- Modify: `src/domain/standards/dictionary.ts`
- Modify: `src/domain/standards/enums.test.ts`
- Modify: `src/domain/standards/dictionary.test.ts`
- Modify: `src/domain/renke/sync.ts`
- Modify: `src/domain/renke/sync.test.ts`
- Modify: `db/migrations/0002_heos_standard_dictionary.sql`
- Modify: `db/migrations/0003_heos_telemetry_core.sql`
- Modify: `db/seeds/0001_tenglong_smart_farm.sql`

- [ ] **Step 1: Write failing tests**

Add tests that expect `metricCodes.RAINFALL` to exist, default unit `mm`, dictionary entry `rainfall`, D1 constraints containing `rainfall`, and Renke `nodeName: "雨量"` mapping to rainfall.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm exec vitest run src/domain/standards/enums.test.ts src/domain/standards/dictionary.test.ts src/domain/renke/sync.test.ts`

Expected: FAIL because `RAINFALL` and `rainfall` mapping do not exist.

- [ ] **Step 3: Implement rainfall metric**

Add `RAINFALL: "rainfall"` to the metric enum, dictionary, migrations, seed capability list, and Renke mapping. Remove rainfall from skip logic.

- [ ] **Step 4: Verify rainfall tests pass**

Run: `pnpm exec vitest run src/domain/standards/enums.test.ts src/domain/standards/dictionary.test.ts src/domain/renke/sync.test.ts`

Expected: PASS.

### Task 2: Suppress Expected Soil Probe Alerts

**Files:**
- Modify: `src/domain/renke/sync.ts`
- Modify: `src/domain/renke/sync.test.ts`

- [ ] **Step 1: Write failing test**

Add a test for device `40406816` where `soil_moisture=0` and `soil_ph=9` are written as telemetry but do not create open threshold alerts, because the soil probes are not inserted into soil in the current field state.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm exec vitest run src/domain/renke/sync.test.ts`

Expected: FAIL because existing logic creates threshold alerts for those soil readings.

- [ ] **Step 3: Implement field-state suppression**

Add a narrow helper in `src/domain/renke/sync.ts` that suppresses threshold alerts for `device-renke-40406816` soil metrics `soil_moisture` and `soil_ph`; keep telemetry samples and non-soil alerts unchanged.

- [ ] **Step 4: Verify target tests pass**

Run: `pnpm exec vitest run src/domain/renke/sync.test.ts`

Expected: PASS.

### Task 3: Release and Tracker Update

**Files:**
- No new source files.

- [ ] **Step 1: Full verification**

Run:

```bash
pnpm test
pnpm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Deploy**

Run: `pnpm exec wrangler deploy`

Expected: deployment succeeds and returns a current version id.

- [ ] **Step 3: Production sync verification**

Run:

```bash
curl -sS -X POST https://app.yunhe.ai/api/providers/renke/sync -H 'content-type: application/json' --data '{}'
pnpm exec wrangler d1 execute heos --remote --command "select metric_code, value from heos_telemetry_latest where device_id='device-renke-40406816' order by metric_code;"
pnpm exec wrangler d1 execute heos --remote --command "select alert_type, metric_code, status from heos_alerts order by updated_at desc limit 10;"
```

Expected: rainfall appears in latest telemetry, sync succeeds, expected soil probe values do not create fresh threshold alerts.

- [ ] **Step 4: Close GitHub Issues and update Project**

Record commit, verification commands, deployment version, production D1 evidence, and any Feishu/Meegle blocker.
