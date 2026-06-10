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

export type ConsoleMenuTreeItem = ConsoleMenuItem & {
  children: ConsoleMenuItem[]
}

export const consoleModules = [
  {
    id: "tenant-access",
    title: "租户权限",
    description: "用户、角色、菜单权限和数据范围。",
    route: "/console/tenant",
    metric: "4 个二级入口",
    status: "ready",
    permissionCode: permissionCodes.TENANT_USER_READ,
  },
  {
    id: "asset-management",
    title: "资产管理",
    description: "项目、基地、地块、大棚、设备和点位模板。",
    route: "/console/assets",
    metric: "3 个二级入口",
    status: "planned",
    permissionCode: permissionCodes.PROJECT_SITE_READ,
  },
  {
    id: "standards",
    title: "标准字典",
    description: "标准字典、遥测指标和规则校验。",
    route: "/console/standards",
    metric: "字典已接入",
    status: "ready",
    permissionCode: permissionCodes.STANDARD_DICTIONARY_READ,
  },
  {
    id: "monitoring-alerts",
    title: "监测告警",
    description: "实时数据、历史曲线、告警规则和告警记录。",
    route: "/console/monitoring",
    metric: "告警模型已接入",
    status: "ready",
    permissionCode: permissionCodes.DEVICE_TELEMETRY_READ,
  },
  {
    id: "provider-sync",
    title: "同步供应商",
    description: "Renke 同步入口、同步记录和供应商异常。",
    route: "/console/providers",
    metric: "接口待接入",
    status: "planned",
    permissionCode: permissionCodes.PROVIDER_SYNC_READ,
  },
  {
    id: "system-audit",
    title: "系统管理",
    description: "字典、参数、供应商账号、审计日志和运行状态。",
    route: "/console/system",
    metric: "审计模型已接入",
    status: "ready",
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

export function getConsoleMenuTree(
  menuItems: readonly ConsoleMenuItem[],
): ConsoleMenuTreeItem[] {
  const visibleMenuItems = menuItems
    .filter((menuItem) => menuItem.visible)
    .toSorted((left, right) => left.order - right.order)

  return visibleMenuItems
    .filter((menuItem) => menuItem.parentId === null)
    .map((menuItem) => ({
      ...menuItem,
      children: visibleMenuItems.filter(
        (child) => child.parentId === menuItem.id,
      ),
    }))
}

export function getConsoleShellMetrics(
  context: AccessContext | null,
  menuItems: readonly ConsoleMenuItem[],
) {
  return {
    menuCount: getConsoleMenuTree(menuItems).length,
    childMenuCount: getConsoleMenuTree(menuItems).reduce(
      (total, item) => total + item.children.length,
      0,
    ),
    moduleCount: consoleModules.length,
    allowedModuleCount: getConsoleModuleAccess(context).filter(
      (module) => module.allowed,
    ).length,
    configuredMenuCount: consoleMenuItems.length,
  }
}
