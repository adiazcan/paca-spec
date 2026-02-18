import { expect, test } from '@playwright/test'

test('employee -> approver -> notification smoke flow', async ({ page }) => {
  const approvalComment = 'Approved in smoke validation run.'
  const eventName = 'Global Reliability Summit 2026'

  await page.route('https://events.contoso.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'ok',
    })
  })

  await page.goto('/')

  // Step 1: Employee submits a request
  await page.getByRole('button', { name: 'New Request' }).click()
  await expect(
    page.getByRole('heading', { name: 'Submit Event Request' }).first(),
  ).toBeVisible({ timeout: 10_000 })

  await page.getByLabel(/Event Name/i).fill(eventName)
  await page
    .getByLabel(/Event Website/i)
    .fill('https://events.contoso.com/reliability-2026')
  await page.getByLabel(/Origin/i).fill('Seattle')
  await page.getByLabel(/Destination/i).fill('London')
  await page.getByLabel(/Registration Fee/i).fill('950')

  await page.locator('form button[type="submit"]').click()
  await expect(
    page.getByRole('heading', { name: 'My Event Requests' }).first(),
  ).toBeVisible({ timeout: 10_000 })

  // Step 2: Approver decides
  await page.getByRole('button', { name: 'Switch to Approver' }).click()
  await expect(
    page.getByRole('heading', { name: 'All Event Requests' }).first(),
  ).toBeVisible({ timeout: 10_000 })

  const eventCard = page.locator('article', { hasText: eventName }).first()
  await eventCard.getByRole('button', { name: 'View Details' }).click()

  await page.getByLabel('Comment').fill(approvalComment)
  await page.getByRole('button', { name: 'Approve' }).click()

  // Step 3: Employee verifies updated status
  await page.getByRole('button', { name: 'Switch to Employee' }).click()
  const employeeEventCard = page
    .locator('article', { hasText: eventName })
    .first()

  await expect(employeeEventCard).toContainText('Approved', { timeout: 10_000 })
})
