import { test, expect } from '@playwright/test'

test.describe('localStorage persistence', () => {
  test('frames persist after page reload', async ({ page }) => {
    // Start with clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('frame-planner-storage'))
    await page.reload()

    const sidebar = page.locator('aside')

    // Verify no frames initially
    await expect(sidebar.getByText('No frames yet')).toBeVisible()

    // Add two frames
    await sidebar.getByRole('button', { name: '+ Rectangular' }).click()
    await expect(sidebar.getByRole('button', { name: /Rect 40.*30/ })).toBeVisible()

    await sidebar.getByRole('button', { name: '+ Circular' }).click()
    await expect(sidebar.getByRole('button', { name: /Ellipse 40.*30/ })).toBeVisible()

    // Verify localStorage was written
    const stored = await page.evaluate(() => localStorage.getItem('frame-planner-storage'))
    expect(stored).toBeTruthy()

    // Reload page — frames should persist
    await page.reload()

    // Verify both frames are still listed
    await expect(sidebar.getByRole('button', { name: /Rect 40.*30/ })).toBeVisible()
    await expect(sidebar.getByRole('button', { name: /Ellipse 40.*30/ })).toBeVisible()
    await expect(sidebar.getByText('No frames yet')).not.toBeVisible()
  })

  test('wall settings persist after page reload', async ({ page }) => {
    // Start with clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('frame-planner-storage'))
    await page.reload()

    const widthInput = page.getByLabel('Wall width')
    const heightInput = page.getByLabel('Wall height')

    // Verify defaults
    await expect(widthInput).toHaveValue('300')
    await expect(heightInput).toHaveValue('250')

    // Change wall dimensions
    await widthInput.fill('450')
    await heightInput.click() // blur
    await expect(widthInput).toHaveValue('450')

    await heightInput.fill('320')
    await widthInput.click() // blur
    await expect(heightInput).toHaveValue('320')

    // Reload page — settings should persist
    await page.reload()

    await expect(widthInput).toHaveValue('450')
    await expect(heightInput).toHaveValue('320')
  })
})
