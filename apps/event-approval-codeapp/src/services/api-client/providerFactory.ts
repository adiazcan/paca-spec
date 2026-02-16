import {
  resolveDataMode,
  type DataMode,
} from '@/services/api-client/environment'
import { DataverseDataProvider } from '@/services/dataverse/dataverseDataProvider'
import { MockDataProvider } from '@/services/mocks/mockDataProvider'

import type { IDataProvider } from './types'

export interface ProviderFactoryOptions {
  mode?: DataMode
}

let cachedMode: DataMode | null = null
let cachedProvider: IDataProvider | null = null

function instantiateProvider(mode: DataMode): IDataProvider {
  return mode === 'dataverse'
    ? new DataverseDataProvider()
    : new MockDataProvider()
}

export function createDataProvider(
  options?: ProviderFactoryOptions,
): IDataProvider {
  const mode = options?.mode ?? resolveDataMode()

  if (!cachedProvider || cachedMode !== mode) {
    cachedProvider = instantiateProvider(mode)
    cachedMode = mode
  }

  return cachedProvider
}

export function resetDataProviderCache(): void {
  cachedMode = null
  cachedProvider = null
}
