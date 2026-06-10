import {
  consoleMenuItems,
  permissionCodes,
  type ConsoleMenuItem,
  type PermissionCode,
} from "./access-control"
import { hasPermission, type AccessContext } from "./access-policy"

export type ConsoleModule = {
  id: string
  title: string
  description: string
  route: string
  metric: string
  status: "ready" | "planned"
  permissionCode: PermissionCode | null
}

export const consoleModules = [
  {
    id: "tenant-access",
    title: "租户权限",
    description: "租户、组织、用户、岗位、角色、菜单和权限点。",
    route: "/console/tenant",
    metric: "12 项权限",
    status: "ready",
    permissionCode: permissionCodes.TENANT_USER_READ,
  },
  {
    id: "asset-management",
    title: "资产管理",
    description: "项目、基地、地块、大棚、设备和点位模板。",
    route: "/console/assets",
    metric: "D1 模型待接入",
    status: "planned",
    permissionCode: permissionCodes.PROJECT_SITE_READ,
  },
  {
    id: "monitoring-alerts",
    title: "监测告警",
    description: "实时数据、历史曲线、告警规则和告警记录。",
    route: "/console/monitoring",
    metric: "遥测接口待接入",
    status: "planned",
    permissionCode: permissionCodes.DEVICE_TELEMETRY_READ,
  },
  {
    id: "system-audit",
    title: "系统管理",
    description: "字典、参数、供应商账号、审计日志和运行状态。",
    route: "/console/system",
    metric: "审计待增强",
    status: "planned",
    permissionCode: permissionCodes.SYSTEM_AUDIT_READ,
  },
] as const satisfies readonly ConsoleModule[]

export function getConsoleModuleAccess(context: AccessContext | null) {
  return consoleModules.map((module) => ({
    ...module,
    allowed: module.permissionCode
      ? hasPermission(context, module.permissionCode)
      : true,
  }))
}

export function getVisibleConsoleMenuRoutes(menuItems: readonly ConsoleMenuItem[]) {
  return menuItems
    .filter((menuItem) => menuItem.visible)
    .map((menuItem) => menuItem.route)
}

export function getConsoleShellMetrics(
  context: AccessContext | null,
  menuItems: readonly ConsoleMenuItem[],
) {
  return {
    menuCount: getVisibleConsoleMenuRoutes(menuItems).length,
    moduleCount: consoleModules.length,
    allowedModuleCount: getConsoleModuleAccess(context).filter(
      (module) => module.allowed,
    ).length,
    configuredMenuCount: consoleMenuItems.length,
  }
}

