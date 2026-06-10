# S2-06 Renke D1 同步与失败重试

## 1. 范围

本规格覆盖 `/api/providers/renke/sync` 的服务端同步链路：

- Renke 登录获取 token。
- 获取用户设备列表并定位设备 `40406816`。
- 使用设备列表返回的 `deviceType` 决定历史数据 endpoint。
- 获取实时数据并标准化为 HeOS 遥测样本。
- 写入 D1 设备台账、`heos_telemetry_latest`、`heos_telemetry_history` 和 `heos_sync_runs`。
- 对鉴权失败、源站超时和结构异常生成同步记录和重试计划。

供应商接口只在服务端路由调用，前端不接触 Renke token 和供应商凭据。

## 2. D1 写入

同步成功时执行以下写入：

- `heos_devices`：按 `tenant_id + external_device_id` upsert 设备台账，更新设备类型、供应商状态、在线状态和最近上报时间。
- `heos_telemetry_latest`：按 `tenant_id + site_id + device_id + metric_code` upsert 最新值，仅接受时间不早于当前记录的样本。
- `heos_telemetry_history`：按 `sample_key` 幂等写入历史样本。
- `heos_sync_runs`：记录 traceId、设备数、成功数、失败数、状态和错误信息。

## 3. 历史 endpoint 选择

| deviceType | endpoint |
| --- | --- |
| `met` | `/api/v2.0/met/history/getHistoryDataList` |
| `soil` | `/api/v2.0/soil/history/getHistoryDataList` |
| `irrigation` | `/api/v2.0/irrigation/device/getDeviceHistoryList` |
| `irrigation2`、`irrigation3.1`、`irrigation3.3` | `/api/v2.0/irrigation/device/getDeviceHistoryList` |

未知设备类型返回 `null`，由后续设备适配任务补充。

## 4. 失败与重试

- 鉴权失败写入 `auth_timeout`。
- 源站超时写入 `source_timeout`。
- 返回结构不符合预期或指标无法映射写入 `schema_mismatch`。
- `auth_timeout` 和 `source_timeout` 进入 `renke-sync-retry` 队列边界，最多 3 次。
- 当前实现返回重试计划；正式队列发送在 Cloudflare Queues 绑定接入后开启。
- Cron Triggers 后续以定时 POST `/api/providers/renke/sync` 为边界，不改变领域层写入逻辑。

## 5. 验收

- `pnpm exec vitest run src/domain/renke/sync.test.ts`
- `pnpm test`
- `pnpm build`
- 服务端路由不向客户端暴露 Renke token。
- 成功响应包含 `targetDevice.deviceType` 与 `historyEndpoint`。
- D1 binding 存在时返回 `persistence.status = written` 或可诊断失败状态。
