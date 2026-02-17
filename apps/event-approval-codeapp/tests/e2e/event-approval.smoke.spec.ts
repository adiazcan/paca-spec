import { expect, test } from '@playwright/test'

test('employee -> approver -> notification smoke flow', async ({ page }) => {
  const approvalComment = 'Approved in smoke validation run.'

  await page.goto('/')

  await page.getByLabel('Event Name *').fill('Global Reliability Summit 2026')
  await page
    .getByLabel('Event Website *')
    .fill('https://events.contoso.com/reliability-2026')
  await page.getByLabel('Origin *').fill('Seattle')
  await page.getByLabel('Destination *').fill('London')
  await page.getByLabel('Registration Fee ($)').fill('950')

  await page.locator('form button[type="submit"]').click()
  await expect(
    page.getByText(/submitted with status submitted/i),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Approver View' }).click()
  await page
    .getByRole('button', {
      name: /Global Reliability Summit 2026 — submitted/i,
    })
    .click()

  await page.getByLabel('Decision comment').fill(approvalComment)
  await page.getByRole('button', { name: 'Approve request' }).click()

  await page.getByRole('button', { name: 'Employee View' }).click()
  await page.getByRole('button', { name: 'Notifications' }).click()

  await expect(
    page.getByRole('listitem').filter({ hasText: approvalComment }),
  ).toBeVisible()
})