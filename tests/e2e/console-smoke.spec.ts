import { expect, test } from '@playwright/test'
import { createHmac } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const frameworkOverlayPattern =
  /Internal Server Error|Unhandled Runtime Error|Vite Error|SyntaxError|ReferenceError/

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function readLocalEnvValue(name: string) {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return undefined
  }

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`))
  const value = line?.slice(name.length + 1).trim()

  return value?.replace(/^['"]|['"]$/g, '')
}

function createSessionCookie() {
  const secret =
    process.env.HEOS_SESSION_SECRET ??
    readLocalEnvValue('HEOS_SESSION_SECRET') ??
    'playwright-local-session-secret'
  const payload = {
    email: 'playwright@heos.local',
    name: 'Playwright',
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  return `${body}.${signature}`
}

test.describe('HeOS console rendered measurement', () => {
  test.describe.configure({ mode: 'serial' })

  test('routes authenticated root visits to console instead of demo', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: 'heos_session',
        value: createSessionCookie(),
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 60 * 60,
      },
    ])

    await page.goto('/')

    await expect(page).toHaveURL(/\/console$/)
    await expect(page.getByRole('heading', { name: '后台管理工作台' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '主业务页面' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('现场作业中枢')
  })

  test('renders console and supports sign-out navigation', async ({
    context,
    page,
  }, testInfo) => {
    const consoleMessages: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleMessages.push(message.text())
      }
    })

    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await context.addCookies([
      {
        name: 'heos_session',
        value: createSessionCookie(),
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 60 * 60,
      },
    ])

    await page.goto('/console')
    await expect(page).toHaveURL(/\/console$/)
    await expect(page).toHaveTitle(/HeOS/)
    await expect(page.getByRole('heading', { name: '后台管理工作台' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '主业务页面' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '农事任务' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '告警中心' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '追溯档案' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出 JSON' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI 辅助记录' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(frameworkOverlayPattern)

    const desktopWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(desktopWidths.scrollWidth).toBeLessThanOrEqual(
      desktopWidths.clientWidth,
    )

    await page.screenshot({
      path: testInfo.outputPath(`console-${testInfo.project.name}.png`),
      fullPage: true,
    })

    const signOutButton = page.locator('header').getByRole('button', {
      name: '退出',
    })
    await signOutButton.scrollIntoViewIfNeeded()
    await signOutButton.click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: '登录云合控制台' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(frameworkOverlayPattern)

    expect(pageErrors).toEqual([])
    expect(consoleMessages).toEqual([])
  })
})
