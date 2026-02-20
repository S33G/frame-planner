import { test, expect } from '@playwright/test'

test.describe('Full workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('frame-planner-storage'))
    await page.reload()
  })

  test('app loads and shows canvas + sidebar on desktop', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByText('Frame Planner')).toBeVisible()

    // Canvas area exists
    const canvasArea = page.locator('.bg-canvas-bg')
    await expect(canvasArea).toBeVisible()

    // Default sections visible
    await expect(sidebar.getByRole('heading', { name: 'Wall' })).toBeVisible()
    await expect(sidebar.getByRole('heading', { name: 'Frames' })).toBeVisible()
    await expect(sidebar.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('can set wall dimensions via sidebar inputs', async ({ page }) => {
    const widthInput = page.getByLabel('Wall width')
    const heightInput = page.getByLabel('Wall height')

    // Default values: 300 width, 250 height (in cm)
    await expect(widthInput).toHaveValue('300')
    await expect(heightInput).toHaveValue('250')

    // Set new dimensions
    await widthInput.fill('400')
    await heightInput.click() // blur the width input
    await expect(widthInput).toHaveValue('400')

    await heightInput.fill('350')
    await widthInput.click() // blur the height input
    await expect(heightInput).toHaveValue('350')
  })

  test('can add rectangular and circular frames', async ({ page }) => {
    const sidebar = page.locator('aside')

    // Initially no frames
    await expect(sidebar.getByText('No frames yet')).toBeVisible()

    // Add rectangular frame
    await sidebar.getByRole('button', { name: '+ Rectangular' }).click()
    await expect(sidebar.getByText('No frames yet')).not.toBeVisible()
    // Frame list item shows "Rect 40×30" (default 40cm x 30cm)
    await expect(sidebar.getByRole('button', { name: /Rect 40.*30/ })).toBeVisible()

    // Add circular frame
    await sidebar.getByRole('button', { name: '+ Circular' }).click()
    await expect(sidebar.getByRole('button', { name: /Ellipse 40.*30/ })).toBeVisible()

    // Should have 2 frame list items with dimensions
    const frameItems = sidebar.locator('button').filter({ hasText: /\d+.*×.*\d+/ })
    await expect(frameItems).toHaveCount(2)
  })

  test('can select a frame and see frame editor', async ({ page }) => {
    const sidebar = page.locator('aside')

    // Add a frame
    await sidebar.getByRole('button', { name: '+ Rectangular' }).click()
    const frameItem = sidebar.getByRole('button', { name: /Rect 40.*30/ })
    await expect(frameItem).toBeVisible()

    // Click on the frame in the list to select it
    await frameItem.click()

    // Frame editor section should appear
    await expect(sidebar.getByText('Edit Frame')).toBeVisible()
    // Editor contains frame-specific controls
    await expect(sidebar.getByLabel('Frame width')).toBeVisible()
    await expect(sidebar.getByLabel('Frame height')).toBeVisible()
    await expect(sidebar.getByText('Remove Frame')).toBeVisible()
  })

  test('can switch between 2D and 3D view', async ({ page }) => {
    const sidebar = page.locator('aside')
    const btn2D = sidebar.getByRole('button', { name: '2D' })
    const btn3D = sidebar.getByRole('button', { name: '3D' })

    // Default is 2D view
    await expect(btn2D).toHaveClass(/bg-primary/)

    // Switch to 3D
    await btn3D.click()
    await expect(btn3D).toHaveClass(/bg-primary/)
    await expect(btn2D).not.toHaveClass(/bg-primary/)

    // Switch back to 2D
    await btn2D.click()
    await expect(btn2D).toHaveClass(/bg-primary/)
    await expect(btn3D).not.toHaveClass(/bg-primary/)
  })

  test('can toggle units between cm and in', async ({ page }) => {
    const sidebar = page.locator('aside')
    const cmBtn = sidebar.getByRole('button', { name: 'cm', exact: true })
    const inBtn = sidebar.getByRole('button', { name: 'in', exact: true })

    // Default unit is cm
    await expect(cmBtn).toHaveClass(/bg-primary/)
    await expect(sidebar.getByText('Width (cm)')).toBeVisible()

    // Switch to inches
    await inBtn.click()
    await expect(inBtn).toHaveClass(/bg-primary/)
    await expect(sidebar.getByText('Width (in)')).toBeVisible()

    // Switch back to cm
    await cmBtn.click()
    await expect(cmBtn).toHaveClass(/bg-primary/)
    await expect(sidebar.getByText('Width (cm)')).toBeVisible()
  })
})
