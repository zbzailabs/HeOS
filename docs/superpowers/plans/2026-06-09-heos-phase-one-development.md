# HeOS Phase One Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver HeOS phase one from current initialized TanStack Start project into a standards-aligned agricultural device monitoring, alerting, audit, and compliance baseline.

**Architecture:** HeOS phase one uses TanStack Start on Cloudflare Workers as the application runtime. Business data is designed Cloudflare-first: D1 for relational business state, R2 for object material, KV for low-frequency configuration, Queues and Cron Triggers for Renke synchronization and retry workflows. Prisma and Neon remain initialization examples unless a later architecture review approves them for a specific exception.

**Tech Stack:** TanStack Start, TanStack Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui dependencies, Cloudflare Workers, D1, R2, KV, Queues, Cron Triggers, Vitest, pnpm.

---

## Current State

- Repository initialization, `AGENTS.md`, `DESIGN.md`, README, PRD split documents, and standards alignment documents exist.
- GitHub Issues #4-#15 exist and are attached to GitHub Project 2.
- GitHub Project 2 has fields for Status, Priority, Size, Estimate, Start date, and Target date.
- Feishu project `HeOS` exists with project key `6a16f0da0ee92e2296066580`.
- Current application code is still an initialized TanStack Start app with demo routes and Prisma/Neon examples.
- Business models, Renke synchronization, telemetry APIs, alerting, audit, and standards compliance pages are not implemented.

## Execution Rules

- Use GitHub Issues as the task source of truth.
- Use GitHub Project 2 for queue, priority, size, estimate, and delivery status.
- Record task starts and completions in Feishu project when the matching work item can be created or updated.
- Use Spec-Driven Development: every feature starts from a bounded spec, acceptance criteria, and test plan.
- Use `pnpm`.
- Run validation only when explicitly requested in the active turn.

## Workstream Order

### M0: Planning and Project Hygiene

**Files:**
- Create: `docs/superpowers/plans/2026-06-09-heos-phase-one-development.md`
- Modify: GitHub Project fields for Issues #4-#15
- Create or update: Feishu HeOS planning record

- [ ] **Step 1: Save this plan**

Create this file at `docs/superpowers/plans/2026-06-09-heos-phase-one-development.md`.

- [ ] **Step 2: Set project fields for #4-#15**

Set:

|Issue|Task|Priority|Size|Estimate|Status|
|---|---|---|---|---|---|
|#4|S0-01 StandardDictionary|P0|M|1|Ready|
|#5|S0-02 Unified enums|P0|S|0.5|In progress|
|#6|S1-01 TelemetryLatest/TelemetryHistory|P0|L|2|Ready|
|#7|S1-02 Alert and StandardRule|P0|M|1.5|Ready|
|#8|S1-03 AuditLog fields|P0|M|1|Ready|
|#9|S2-01 Renke sync API|P1|L|2|Backlog|
|#10|S2-02 Telemetry query API|P1|M|1|Backlog|
|#11|S2-03 Rule management API|P1|M|1|Backlog|
|#12|S3-01 Online/offline UI|P1|M|1|Backlog|
|#13|S3-02 Compliance page|P1|M|1.5|Backlog|
|#14|S4-01 compliance-report|P2|S|0.5|Backlog|
|#15|S4-02 Acceptance command boundary|P2|S|0.5|Backlog|

- [ ] **Step 3: Record planning result in Feishu**

Record:

```markdown
HeOS 一期开发计划已完成梳理。

当前状态：
- GitHub Issues #4-#15 已作为一期标准对齐任务主源。
- GitHub Project 2 作为开发看板。
- 当前代码仍为初始化应用，业务模型、接口、页面和 Renke 同步尚未实现。

执行顺序：
1. M1 标准与数据底座：#4 #5 #6 #8
2. M2 告警与规则：#7 #11
3. M3 Renke 同步与遥测查询：#9 #10
4. M4 页面与可视化：#12 #13
5. M5 发布冻结与验收：#14 #15

下一步：启动 #5，建立跨模块枚举统一文件。
```

### M1: Standards and Data Foundation

**Files:**
- Create: `docs/specs/S0-02-unified-enums.md`
- Create: `docs/specs/S0-03-admin-rbac-console.md`
- Create: `src/domain/standards/enums.ts`
- Create: `src/domain/standards/enums.test.ts`
- Later tasks create D1 schema and persistence modules for dictionary, telemetry, alert, and audit records.

- [ ] **Task #5 Step 1: Write S0-02 spec**

Create `docs/specs/S0-02-unified-enums.md` with the acceptance boundary for unified enums.

- [ ] **Task #5 Step 2: Add enum tests**

Create `src/domain/standards/enums.test.ts` covering uniqueness, known metric units, alert levels, and sync statuses.

- [ ] **Task #5 Step 3: Add enum source**

Create `src/domain/standards/enums.ts` with single-source definitions for `MetricCode`, `AlertType`, `AlertLevel`, `SyncStatus`, `TelemetryQuality`, and `DeviceOnlineStatus`.

- [ ] **Task #5 Step 4: Validate when requested**

Run only when explicitly requested:

```bash
pnpm test
pnpm build
```

- [ ] **Task #5 Step 5: Update Issue #5**

Post a GitHub comment with changed files, validation status, and remaining integration points.

- [ ] **Task S0-03 Step 1: Write admin RBAC and console shell spec**

Create `docs/specs/S0-03-admin-rbac-console.md` to define the HeOS permission-management and console-shell boundary. Reference RuoYi for mature RBAC concepts and soybean-admin for admin-console layout and permission-route concepts, while keeping HeOS on TanStack Start, React, Tailwind CSS, shadcn/ui dependencies, and Cloudflare-first runtime.

- [ ] **Task S0-03 Step 2: Create issue for admin RBAC and console shell**

Create a GitHub Issue that records:

- Reference scope: RuoYi data model concepts, soybean-admin console-layout and permission-route concepts.
- Excluded scope: Java/Spring/MyBatis/Shiro, Vue/Pinia/NaiveUI/UnoCSS, generic CRUD generator migration.
- Acceptance: future work includes `Tenant`, `OrgUnit`, `User`, `Role`, `Menu`, `Permission`, `DataScope`, `AuditLog`, `/console` shell, service-side permission checks, service-side menu filtering, and current public demo retention.

- [ ] **Task S1-04 Step 1: Write RBAC D1 model spec**

Create `docs/specs/S1-04-rbac-d1-model.md` to define the minimal D1 model for permissions, data scopes, menus, role bindings, user bindings, and audit logs.

- [ ] **Task S1-04 Step 2: Add D1 migration**

Create `db/migrations/0001_heos_rbac_core.sql` with D1-compatible `CREATE TABLE` and index statements for `Tenant`, `OrgUnit`, `User`, `Post`, `Role`, `Menu`, `Permission`, `RolePermission`, `UserRole`, `DataScope`, `RoleDataScope`, and `AuditLog`.

- [ ] **Task S1-04 Step 3: Add TypeScript source definitions**

Create `src/domain/rbac/access-control.ts` with single-source definitions for permission codes, data scopes, console menu metadata, and RBAC table names.

- [ ] **Task S1-04 Step 4: Add focused tests**

Create `src/domain/rbac/access-control.test.ts` covering permission-code uniqueness, data-scope uniqueness, menu permission references, D1 table coverage, key indexes, and SQLite-compatible column choices.

- [ ] **Task S2-04 Step 1: Write server access spec**

Create `docs/specs/S2-04-server-access-functions.md` to define service-side access context, permission checks, menu filtering, and the temporary bootstrap-admin boundary before D1-backed authorization is wired.

- [ ] **Task S2-04 Step 2: Add access policy functions**

Create `src/domain/rbac/access-policy.ts` with pure functions for resolving the current access context, checking permissions, filtering console menus, and producing a safe access summary.

- [ ] **Task S2-04 Step 3: Add TanStack Server Functions**

Create `src/lib/access.ts` with `getCurrentAccessContext`, `getCurrentAccessSummary`, `getCurrentConsoleMenu`, and `checkCurrentPermission`. These functions must read the current app session and apply the service-side access policy.

- [ ] **Task S2-04 Step 4: Add focused tests**

Create `src/domain/rbac/access-policy.test.ts` covering anonymous access, bootstrap administrator access, readonly access, menu filtering, and high-risk permission rejection.

### M2: Alerting and Rules

**Issues:** #7, #11

- [ ] Implement `Alert` and `StandardRule` persistence.
- [ ] Implement alert deduplication for offline and threshold alerts.
- [ ] Implement rule create, update, and validation APIs.
- [ ] Write audit records for rule changes.
- [ ] Keep rule response fields consistent with enum definitions from #5.

### M3: Renke Sync and Telemetry APIs

**Issues:** #9, #10

- [ ] Implement server-only Renke client.
- [ ] Implement token refresh and retry classification.
- [ ] Normalize samples to `tenantId/siteId/deviceId/metricCode/value/unit/quality/source/ts`.
- [ ] Implement latest and history query APIs with trace IDs.
- [ ] Enforce time-window and required-parameter validation.

### M4: UI and Compliance Visualization

**Issues:** #12, #13

- [ ] Build device status list from telemetry APIs.
- [ ] Build alert list with offline reason and trigger time.
- [ ] Build compliance checklist page.
- [ ] Add export snapshot action for compliance checklist.

### M5: Release Freeze and Acceptance

**Issues:** #14, #15

- [ ] Generate compliance report template and current report.
- [ ] Record task boundary, validation commands, pass/fail state, and remaining gaps.
- [ ] Update GitHub Issues, GitHub Project, and Feishu project records.

## Risk Controls

- Do not implement page UI before the enum, dictionary, telemetry, and alert contracts are stable.
- Do not put Renke secrets in committed files.
- Do not turn Prisma/Neon into the phase-one default database without a written architecture review.
- Do not close P0 Issues until tests and build have been run in an explicit validation step.
- Do not mark release-ready while any S0 or S1 issue remains open.
