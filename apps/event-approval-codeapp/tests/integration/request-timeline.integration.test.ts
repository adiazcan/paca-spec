import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { RequestHistoryPage } from '@/features/request-history/RequestHistoryPage'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

describe('request timeline rendering', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('renders timeline entries in chronological order', async () => {
    const user = userEvent.setup()

    render(createElement(RequestHistoryPage))

    const requestButton = await screen.findByRole('button', {
      name: /View timeline for EA-1002/i,
    })
    await user.click(requestButton)

    await screen.findByRole('heading', { name: /Timeline for EA-1002/i })

    const entries = await screen.findAllByRole('listitem', {
      name: /timeline-event/i,
    })

    expect(entries.length).toBe(2)
    expect(entries[0]).toHaveTextContent(/submitted/i)
    expect(entries[1]).toHaveTextContent(/approved/i)
  })
})
