import { expect, test } from '@playwright/test'

test.describe('public trace archive', () => {
  test('renders public trace detail without authentication or horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/trace/tlxx-lettuce-2026-summer')

    await expect(page.getByRole('heading', { name: '2026 夏季教学叶菜' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '检测与巡检摘要' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '农事记录' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
  })
})
