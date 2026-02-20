import { test, expect } from '@playwright/test'

test.describe('Mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('frame-planner-storage'))
    await page.reload()
  })

  test('sidebar is hidden on mobile viewport', async ({ page }) => {
    // The sidebar's parent div has class "hidden md:block"
    // On mobile, the aside element should not be visible
    const sidebar = page.locator('aside')
    await expect(sidebar).not.toBeVisible()

    // Toolbar should still be visible
    const addButton = page.getByRole('button', { name: '+ Add' })
    await expect(addButton).toBeVisible()
  })

  test('canvas fills full width on mobile', async ({ page }) => {
    const canvasArea = page.locator('.bg-canvas-bg')
    await expect(canvasArea).toBeVisible()

    const box = await canvasArea.boundingBox()
    expect(box).toBeTruthy()
    // Canvas should span the full viewport width (375px mobile viewport)
    expect(box!.width).toBeGreaterThanOrEqual(370)
  })
})
