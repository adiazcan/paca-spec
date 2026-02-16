export type DataMode = 'mock' | 'dataverse'

const DEFAULT_DATA_MODE: DataMode = 'mock'

const validDataModes: ReadonlySet<DataMode> = new Set(['mock', 'dataverse'])

export function isDataMode(value: string | undefined): value is DataMode {
  return typeof value === 'string' && validDataModes.has(value as DataMode)
}

export function resolveDataMode(
  rawValue = import.meta.env.VITE_APP_DATA_MODE,
): DataMode {
  if (isDataMode(rawValue)) {
    return rawValue
  }

  return DEFAULT_DATA_MODE
}
