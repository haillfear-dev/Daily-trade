import type { MarketContextResponse } from '../messaging/market-context'

interface MarketContextDebugProps {
  market: MarketContextResponse
}

export function MarketContextDebug({ market }: MarketContextDebugProps) {
  const context = market.context
  const updatedAt = context
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(context.updatedAt)
    : '—'
  const statusLabel = {
    connected: 'CONECTADO',
    injecting: 'CONECTANDO…',
    'reload-required': 'RECARREGUE A ABA',
    'no-iq-option-tab': 'SEM ABA IQ OPTION',
  }[market.bridgeStatus]

  return (
    <section className="market-debug" aria-label="Contexto da página IQ Option">
      <div className="section-heading">
        <div>
          <span className="kicker">PONTE IQ OPTION</span>
          <h2>Contexto da página</h2>
        </div>
        <span className={`connection ${market.connected ? 'connected' : ''}`}>
          {statusLabel}
        </span>
      </div>
      <dl>
        <div>
          <dt>Símbolo detectado</dt>
          <dd>{context?.displaySymbol ?? context?.symbol ?? '—'}</dd>
        </div>
        <div>
          <dt>OTC</dt>
          <dd>{context ? (context.isOtc ? 'Sim' : 'Não') : '—'}</dd>
        </div>
        <div>
          <dt>Produto</dt>
          <dd>{context?.product ?? '—'}</dd>
        </div>
        <div>
          <dt>Última atualização</dt>
          <dd>{updatedAt}</dd>
        </div>
      </dl>
      {market.bridgeStatus === 'reload-required' && (
        <p className="bridge-guidance">
          Recarregue a página da IQ Option para que a extensão possa instalar a
          ponte de leitura.
        </p>
      )}
      {market.bridgeStatus === 'injecting' && (
        <p className="bridge-guidance">
          A aba foi encontrada. Inicializando a ponte somente leitura…
        </p>
      )}
    </section>
  )
}
