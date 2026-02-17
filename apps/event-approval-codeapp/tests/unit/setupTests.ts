import '@testing-library/jest-dom/vitest'
import * as React from 'react'

// Configure React 19 test environment
// See: https://react.dev/blog/2022/03/08/react-18-upgrade-guide#configuring-your-testing-environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Provide React and act to global scope for compatibility with react-dom-test-utils
// This fixes "React.act is not a function" errors in React 19
;(globalThis as Record<string, unknown>).React = React
