import { createServerFn } from "@tanstack/react-start"
import { getCurrentUser } from "./auth"
import { permissionCodes, type PermissionCode } from "../domain/rbac/access-control"
import {
  checkEveryPermission,
  filterConsoleMenuItems,
  getAccessSummary,
  resolveAccessContext,
} from "../domain/rbac/access-policy"

type CheckPermissionInput = {
  permissionCode: PermissionCode
}

function parsePermissionInput(input: CheckPermissionInput) {
  const permissionCode = input.permissionCode
  const knownPermissionCodes = new Set(Object.values(permissionCodes))

  if (!knownPermissionCodes.has(permissionCode)) {
    throw new Error("Unknown permission code")
  }

  return {
    permissionCode,
  }
}

async function readCurrentAccessContext() {
  return resolveAccessContext(await getCurrentUser())
}

export const getCurrentAccessContext = createServerFn({
  method: "GET",
}).handler(async () => {
  return readCurrentAccessContext()
})

export const getCurrentAccessSummary = createServerFn({
  method: "GET",
}).handler(async () => {
  return getAccessSummary(await readCurrentAccessContext())
})

export const getCurrentConsoleMenu = createServerFn({
  method: "GET",
}).handler(async () => {
  return filterConsoleMenuItems(await readCurrentAccessContext())
})

export const checkCurrentPermission = createServerFn({
  method: "POST",
})
  .validator(parsePermissionInput)
  .handler(async ({ data }) => {
    return checkEveryPermission(await readCurrentAccessContext(), [
      data.permissionCode,
    ])
  })

