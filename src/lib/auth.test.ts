import { afterEach, describe, expect, test, vi } from "vitest"

import {
  createSessionToken,
  getCurrentUserFromRequest,
} from "./auth"

describe("request auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("returns null when an API request has no session cookie", async () => {
    const user = await getCurrentUserFromRequest(
      new Request("https://app.yunhe.ai/api/core/alerts"),
    )

    expect(user).toBeNull()
  })

  test("reads a valid session from the current request cookie header", async () => {
    vi.stubEnv("HEOS_SESSION_SECRET", "test-session-secret")
    const token = await createSessionToken({
      email: "admin@heos.local",
      name: "Admin",
      expiresAt: Date.now() + 60_000,
    })

    const user = await getCurrentUserFromRequest(
      new Request("https://app.yunhe.ai/api/core/alerts", {
        headers: {
          cookie: `other=value; heos_session=${token}`,
        },
      }),
    )

    expect(user).toEqual({
      email: "admin@heos.local",
      name: "Admin",
    })
  })
})
