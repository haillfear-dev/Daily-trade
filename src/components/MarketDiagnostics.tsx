import { useMemo } from 'react'
import type { MarketDiagnosticsSnapshot } from '../diagnostics/types'

interface MarketDiagnosticsProps {
  diagnostics: MarketDiagnosticsSnapshot
  onToggle: (enabled: boolean) => void
}

export function MarketDiagnostics({
  diagnostics,
  onToggle,
}: MarketDiagnosticsProps) {
  const summary = useMemo(() => {
    const sources = new Set(diagnostics.events.map((event) => event.source))
    const hosts = new Set(
      diagnostics.events.flatMap((event) => (event.host ? [event.host] : [])),
    )
    const received = diagnostics.events.filter(
      (event) => event.direction === 'received',
    ).length
    const candidates = diagnostics.events.filter(
      (event) => event.marketCandidate,
    )
    return { sources, hosts, received, candidates }
  }, [diagnostics.events])

  return (
    <section
      className="market-diagnostics"
      aria-label="Diagnóstico de fontes de mercado"
    >
      <div className="section-heading">
        <div>
          <span className="kicker">SOMENTE LEITURA</span>
          <h2>Diagnóstico de fontes</h2>
        </div>
        <label className="diagnostics-switch">
          <input
            type="checkbox"
            checked={diagnostics.enabled}
            disabled={diagnostics.tabId === null}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <span>{diagnostics.enabled ? 'Ativado' : 'Desativado'}</span>
        </label>
      </div>
      <div className="diagnostic-counters">
        <div>
          <span>Fontes</span>
          <strong>{summary.sources.size}</strong>
        </div>
        <div>
          <span>Recebidos</span>
          <strong>{summary.received}</strong>
        </div>
        <div>
          <span>Candidatos</span>
          <strong>{summary.candidates.length}</strong>
        </div>
      </div>
      <div className="diagnostic-sources">
        <strong>Fontes detectadas</strong>
        <span>{[...summary.sources].join(', ') || 'Nenhuma nesta sessão'}</span>
        {summary.hosts.size > 0 && (
          <span>Hosts: {[...summary.hosts].join(', ')}</span>
        )}
      </div>
      {summary.candidates.length > 0 && (
        <ul className="diagnostic-events">
          {summary.candidates
            .slice(-8)
            .reverse()
            .map((event) => (
              <li key={event.id}>
                <strong>{event.source}</strong>
                {event.host && <span>{event.host}</span>}
                <span>{event.classifications.join(', ')}</span>
                <small>
                  {event.payloadType} · {event.payloadSize ?? 0} bytes
                </small>
              </li>
            ))}
        </ul>
      )}
      <p className="diagnostic-note">
        Observação passiva: não envia nem altera mensagens. Só detecta fontes
        criadas após o carregamento da instrumentação e mensagens visíveis no
        contexto principal; tráfego interno de workers, protocolos binários e
        conexões abertas antes da ativação podem não ser identificados.
      </p>
    </section>
  )
}
