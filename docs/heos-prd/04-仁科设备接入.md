# 仁科设备接入说明

版本日期：2026-06-08

> 内部资料：本文保留仁科账号、密码、设备编号和接口域名原文。该文档不适合公开发布。

## 1. 接入目标

腾龙小学智慧农场作为 HeOS 一期首个真实接入场景。第一阶段完成仁科设备接入、实时数据监测、历史曲线、设备在线状态和基础告警。控制功能默认关闭，只保留权限、审计、审批和安全阈值设计。

## 2. 项目信息

- 项目名称：腾龙小学智慧农场。
- 供应商：仁科。
- 接口域名：`http://api.farm.0531yun.cn`。
- 账号：`cq260519tlxx`。
- 密码：`cq260519tlxx`。
- 设备名称：`40406816`。
- 设备地址码：`40406816`。

## 3. 接入链路

1. 调用登录接口获取 token。
2. 使用 token 获取用户设备列表。
3. 找到设备 `40406816`，确认 `deviceType`。
4. 调用实时数据接口获取当前数据。
5. 按 `deviceType` 选择历史数据接口。
6. 写入 HeOS 数据库。
7. 展示项目页、设备在线状态、实时数据、历史曲线和基础告警。

## 4. 认证

登录接口：

```text
POST http://api.farm.0531yun.cn/api/v2.0/entrance/user/userLogin
```

请求参数：

```json
{
  "loginName": "cq260519tlxx",
  "loginPwd": "cq260519tlxx"
}
```

返回字段包含 `token`、`currDate`、`expDate`。除登录接口外，后续接口在 HTTP Header 中传递 token。

```text
token: <token>
```

`RenkeClient` 第一版包含以下方法：

```text
login()
getToken()
refreshTokenIfExpired()
requestWithToken()
```

## 5. 设备列表

获取用户设备接口：

```text
GET /api/v2.0/entrance/device/getsysUserDevice
```

Header：

```text
token: <token>
```

可选参数：

```text
groupId
deviceType
```

返回字段：

```text
deviceAddr
groupId
deviceType
deviceName
devicelng
devicelat
deviceIccId
```

该接口用于确认设备 `40406816` 的真实设备类型。设备地址码不能单独判断设备类型，必须以接口返回的 `deviceType` 为准。

## 6. 实时数据

获取设备实时数据接口：

```text
GET /api/v2.0/entrance/device/getRealTimeData
```

Header：

```text
token: <token>
```

参数：

```text
deviceAddrs=40406816
```

返回字段：

```text
deviceAddr
deviceName
lat
lng
status
deviceType
data
```

`status` 可能值：

```text
online
offline
alarm
```

离线判断不能完全依赖供应商返回的 `offline`。HeOS 内部按最后一次数据时间计算：

```text
now - lastSeenAt > 300 秒 => offline
now - lastSeenAt <= 300 秒 => online
```

## 7. 设备类型

仁科文档列出的设备类型：

```text
met                     气象设备
soil                    墒情设备
irrigation              智慧环控 3.0 设备
irrigation3.1           物联网远程智能控制设备
irrigation2             智慧环控 2.0 设备
irrigation3.3           智慧环控通用 3.0 设备
camera                  摄像头
worm                    虫情设备
spore                   孢子设备
rodent                  鼠害设备
waterQualityDetector    多功能水质分析仪
```

腾龙 P0 不预设设备类型，先通过设备列表或实时数据接口读取 `deviceType`。

## 8. 历史数据

历史数据接口按设备类型区分。

### 8.1 气象设备

当 `deviceType = met`，使用：

```text
GET /api/v2.0/met/history/getHistoryDataList
```

参数：

```text
beginTime  13 位时间戳
endTime    13 位时间戳
deviceAddr 设备地址
nodeId     节点编号，多个值用逗号分隔
pages      页码
limit      每页数量，最大 1000
```

返回 `rows` 包含：

```text
nodeId
deviceAddress
temValue
humValue
alarmStatus
recordTime
```

### 8.2 墒情设备

当 `deviceType = soil`，使用：

```text
GET /api/v2.0/soil/history/getHistoryDataList
```

参数结构与气象历史数据一致。

### 8.3 智慧环控 3.0

当 `deviceType = irrigation`，使用：

```text
GET /api/v2.0/irrigation/device/getDeviceHistoryList
```

参数：

```text
deviceAddr
startTime  yyyy-MM-dd HH:mm:ss
endTime    yyyy-MM-dd HH:mm:ss
pages
limit
factorId
```

返回字段：

```text
factorId
factorName
createTime
valueText
electricQuantity
signal
alarming
value
```

### 8.4 智慧环控 2.0 / 通用 3.0

当 `deviceType = irrigation2` 或 `irrigation3.3`，使用文档第八章对应接口。开发前先用设备列表接口确认设备类型，再选择接口。

## 9. 字段映射

|仁科字段|HeOS 字段|
|---|---|
|`deviceAddr`|`Device.externalDeviceId`|
|`deviceName`|`Device.name`|
|`deviceType`|`Device.type` 和点位模板选择|
|`lat`、`lng`、`devicelat`、`devicelng`|设备位置|
|`status`|设备供应商状态|
|`data`|标准化指标集合|
|`recordTime`、`createTime`|采样时间|
|`alarmStatus`、`alarming`|`Alert` 输入|

标准化后写入：

- `TelemetryLatest`：最新指标值、最后采样时间、在线状态。
- `TelemetryHistory`：历史指标值、单位、来源字段、采样时间。
- `Alert`：阈值告警、离线告警、供应商告警。
- `AuditLog`：同步任务、异常、控制尝试。

## 10. 告警规则

一期基础告警包含：

- 离线告警：设备超过 5 分钟无最新数据。
- 阈值告警：温度、湿度、光照、土壤水分、水质等指标超限。
- 供应商告警：仁科返回 `alarm` 或历史数据中出现告警状态。
- 同步异常：鉴权失败、参数错误、接口异常、返回结构异常。

## 11. 控制边界

仁科文档包含阀门控制和继电器控制接口。例如智慧环控 3.0 手动开启关闭阀门接口：

```text
GET /api/v2.0/irrigation/valveOperatingMode/manualControlValve
```

参数：

```text
deviceAddr
factorId
```

P0 不开放控制功能。后续打开控制前，HeOS 必须完成以下链路：

1. 租户权限校验。
2. 设备能力校验。
3. 作物阶段和策略范围校验。
4. 安全阈值校验。
5. 二次确认或审批。
6. 命令有效期校验。
7. 供应商下发。
8. 回执、失败告警和 `AuditLog` 记录。

## 12. 页面结果

腾龙小学智慧农场页面包含：

```text
腾龙小学智慧农场
├── 项目总览
├── 设备在线状态
├── 实时环境数据
├── 气象数据
├── 土壤数据
├── 水质数据
├── 历史曲线
├── 告警事件
└── 数据同步记录
```

P0 验收项：

1. 打开腾龙小学智慧农场项目页。
2. 查看设备在线和离线状态。
3. 查看气象站、土壤监测站、水质监测站最新数据。
4. 查看单个指标历史曲线。
5. 设置基础阈值并生成告警事件。
6. 数据来自真实设备或真实接口。
7. 控制功能默认禁用。
