import { classifyPayload, sanitizeUrl } from './classifier'
import type { DiagnosticSource, MarketDiagnosticEvent } from './types'

const DIAGNOSTICS_BRIDGE_SOURCE = 'daily-trade:market-diagnostics' as const
type MainBridgeMessage =
  | {
      source: typeof DIAGNOSTICS_BRIDGE_SOURCE
      type: 'control'
      enabled: boolean
    }
  | {
      source: typeof DIAGNOSTICS_BRIDGE_SOURCE
      type: 'event'
      event: MarketDiagnosticEvent
    }

const mainWorldState = globalThis as typeof globalThis & {
  __dailyTradeDiagnosticsLoaded?: boolean
}

if (!mainWorldState.__dailyTradeDiagnosticsLoaded) {
  mainWorldState.__dailyTradeDiagnosticsLoaded = true
  let enabled = false
  let sequence = 0

  function emit(event: Omit<MarketDiagnosticEvent, 'id' | 'timestamp'>) {
    if (!enabled) return
    const message: MainBridgeMessage = {
      source: DIAGNOSTICS_BRIDGE_SOURCE,
      type: 'event',
      event: {
        ...event,
        id: `${Date.now().toString(36)}-${++sequence}`,
        timestamp: Date.now(),
      },
    }
    // This bridge contains sanitized metadata only. It never forwards page data.
    window.postMessage(message, window.location.origin)
  }

  function created(source: DiagnosticSource, rawUrl: unknown) {
    const location = sanitizeUrl(String(rawUrl))
    emit({
      source,
      direction: 'created',
      ...location,
      classifications: [],
      marketCandidate: false,
    })
    return location
  }

  function received(
    source: DiagnosticSource,
    data: unknown,
    location?: ReturnType<typeof sanitizeUrl>,
  ) {
    emit({
      source,
      direction: 'received',
      ...location,
      ...classifyPayload(data),
    })
  }

  function instrumentWebSocket() {
    const Native = window.WebSocket
    window.WebSocket = new Proxy(Native, {
      construct(target, args, newTarget) {
        const socket = Reflect.construct(target, args, newTarget) as WebSocket
        const location = created('websocket', args[0])
        socket.addEventListener('message', (event) =>
          received('websocket', event.data, location),
        )
        return socket
      },
    })
  }

  function instrumentWorker() {
    const Native = window.Worker
    window.Worker = new Proxy(Native, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker
        const location = created('worker', args[0])
        worker.addEventListener('message', (event) =>
          received('worker', event.data, location),
        )
        return worker
      },
    })
  }

  function instrumentSharedWorker() {
    if (!window.SharedWorker) return
    const Native = window.SharedWorker
    window.SharedWorker = new Proxy(Native, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(
          target,
          args,
          newTarget,
        ) as SharedWorker
        const location = created('shared-worker', args[0])
        worker.port.addEventListener('message', (event) =>
          received('shared-worker', event.data, location),
        )
        return worker
      },
    })
  }

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (
      event.source !== window ||
      !event.data ||
      typeof event.data !== 'object'
    )
      return
    const message = event.data as Partial<MainBridgeMessage>
    if (
      message.source === DIAGNOSTICS_BRIDGE_SOURCE &&
      message.type === 'control'
    ) {
      enabled = message.enabled === true
    }
  })

  instrumentWebSocket()
  instrumentWorker()
  instrumentSharedWorker()
}
