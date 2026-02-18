export type PerfMetricName =
  | 'submit-request'
  | 'dashboard-load'
  | 'request-detail-load'
  | 'decision-propagation'
  | 'history-retrieval'

export interface PerfMetricSample {
  name: PerfMetricName
  durationMs: number
  startedAt: string
  endedAt: string
}

interface ActiveMetric {
  name: PerfMetricName
  startTime: number
  startedAt: string
}

const activeMetrics = new Map<string, ActiveMetric>()
const samples: PerfMetricSample[] = []

function getNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function startPerfMetric(name: PerfMetricName): () => void {
  const startedAt = new Date().toISOString()
  const token = `${name}:${startedAt}:${Math.random().toString(16).slice(2)}`

  activeMetrics.set(token, {
    name,
    startTime: getNow(),
    startedAt,
  })

  return () => {
    const metric = activeMetrics.get(token)
    if (!metric) {
      return
    }

    const endedAt = new Date().toISOString()
    const durationMs = Number((getNow() - metric.startTime).toFixed(2))

    samples.push({
      name: metric.name,
      durationMs,
      startedAt: metric.startedAt,
      endedAt,
    })

    activeMetrics.delete(token)
  }
}

export async function recordPerfMetric<T>(
  name: PerfMetricName,
  operation: () => Promise<T>,
): Promise<T> {
  const stop = startPerfMetric(name)

  try {
    return await operation()
  } finally {
    stop()
  }
}

export function getPerfMetrics(name?: PerfMetricName): PerfMetricSample[] {
  const items = name ? samples.filter((item) => item.name === name) : samples
  return items.map((item) => ({ ...item }))
}

export function clearPerfMetrics(): void {
  activeMetrics.clear()
  samples.length = 0
}
