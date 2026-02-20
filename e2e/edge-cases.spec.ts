import { test, expect } from '@playwright/test'

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('frame-planner-storage'))
    await page.reload()
  })

  test('add frame then delete immediately via keyboard', async ({ page }) => {
    const sidebar = page.locator('aside')

    // Add a frame
    await sidebar.getByRole('button', { name: '+ Rectangular' }).click()
    const frameItem = sidebar.getByRole('button', { name: /Rect 40.*30/ })
    await expect(frameItem).toBeVisible()

    // Select the frame by clicking in the list
    await frameItem.click()
    await expect(sidebar.getByText('Edit Frame')).toBeVisible()

    // Press Delete key (must not focus an input element)
    await page.locator('.bg-canvas-bg').click()
    await page.keyboard.press('Delete')

    // Frame should be removed
    await expect(sidebar.getByText('No frames yet')).toBeVisible()
    await expect(sidebar.getByText('Edit Frame')).not.toBeVisible()
  })

  test('3D view with zero frames does not crash', async ({ page }) => {
    const sidebar = page.locator('aside')

    // Verify no frames
    await expect(sidebar.getByText('No frames yet')).toBeVisible()

    // Switch to 3D view
    await sidebar.getByRole('button', { name: '3D' }).click()

    // Page should not show error — verify the app is still functional
    // The 3D view either renders or shows the ErrorBoundary fallback
    await expect(sidebar.getByRole('button', { name: '3D' })).toHaveClass(/bg-primary/)

    // Sidebar should still be interactive
    await expect(sidebar.getByText('Frame Planner')).toBeVisible()
    await expect(sidebar.getByText('No frames yet')).toBeVisible()

    // Can switch back to 2D without crash
    await sidebar.getByRole('button', { name: '2D' }).click()
    await expect(sidebar.getByRole('button', { name: '2D' })).toHaveClass(/bg-primary/)
  })
})
