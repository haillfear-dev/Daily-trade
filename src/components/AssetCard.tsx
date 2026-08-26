import type { DashboardAsset } from '../dashboard/analysis'
import { translateSignal } from '../dashboard/analysis'

const formatPrice = (value: number) => value.toFixed(5)
const trendLabel = {
  bullish: 'Alta',
  bearish: 'Baixa',
  sideways: 'Lateral',
} as const
const stateLabel = {
  WAITING: 'AGUARDANDO',
  IN_ZONE: 'ENTROU NA ZONA',
  CONFIRMATION: 'CONFIRMAÇÃO',
  ACTIVE: 'SETUP ATIVO',
  INVALIDATED: 'INVALIDADO',
} as const

export interface AssetCardProps {
  asset: DashboardAsset
  debug: boolean
}
export function AssetCard({ asset, debug }: AssetCardProps) {
  const signalClass = asset.signal.toLowerCase()
  return (
    <article className={`asset-card ${signalClass}`} data-symbol={asset.symbol}>
      <div className="card-rank">{asset.rank}º</div>
      <div className="card-main">
        <div className="asset-heading">
          <div>
            <h3>{asset.symbol}</h3>
            <span className="stars" aria-label={`${asset.stars} de 5 estrelas`}>
              {'★'.repeat(asset.stars)}
              {'☆'.repeat(5 - asset.stars)}
            </span>
          </div>
          <span className={`signal ${signalClass}`}>
            {translateSignal(asset.signal)}
          </span>
        </div>
        <div className="decision-grid">
          <div>
            <span>DIREÇÃO</span>
            <strong className={signalClass}>
              {translateSignal(asset.signal)}
            </strong>
          </div>
          <div>
            <span>TIMING</span>
            <strong>{asset.timing}</strong>
          </div>
        </div>
        <div className="zone-line">
          <span>{stateLabel[asset.state]}</span>
          <p>
            Zona {formatPrice(asset.entryZone[0])}–
            {formatPrice(asset.entryZone[1])}
          </p>
        </div>
        <p className="card-callout">{asset.reasons[1] ?? asset.reasons[0]}</p>
        <details>
          <summary>
            Ver análise completa <span>+</span>
          </summary>
          <div className="details-content">
            <div className="metrics">
              <div>
                <span>Preço</span>
                <strong>{formatPrice(asset.price)}</strong>
              </div>
              <div>
                <span>Tendência</span>
                <strong>{trendLabel[asset.trend]}</strong>
              </div>
              <div>
                <span>RSI</span>
                <strong>{asset.rsi.toFixed(0)}</strong>
              </div>
              <div>
                <span>Confiança</span>
                <strong>{asset.confidence}%</strong>
              </div>
              <div>
                <span>EMA9</span>
                <strong>{formatPrice(asset.ema9)}</strong>
              </div>
              <div>
                <span>EMA20</span>
                <strong>{formatPrice(asset.ema20)}</strong>
              </div>
              <div>
                <span>EMA50</span>
                <strong>{formatPrice(asset.ema50)}</strong>
              </div>
              <div>
                <span>Bollinger</span>
                <strong>
                  {formatPrice(asset.bollinger.lower)}–
                  {formatPrice(asset.bollinger.upper)}
                </strong>
              </div>
              <div>
                <span>Suporte</span>
                <strong>
                  {formatPrice(asset.support[0])}–
                  {formatPrice(asset.support[1])}
                </strong>
              </div>
              <div>
                <span>Resistência</span>
                <strong>
                  {formatPrice(asset.resistance[0])}–
                  {formatPrice(asset.resistance[1])}
                </strong>
              </div>
              <div>
                <span>Pullback</span>
                <strong>
                  {asset.pullback ? 'Confirmado' : 'Em observação'}
                </strong>
              </div>
              <div>
                <span>Movimento</span>
                <strong>{asset.extendedMove ? 'Esticado' : 'Saudável'}</strong>
              </div>
              <div>
                <span>Invalidação</span>
                <strong>
                  {formatPrice(asset.invalidationZone[0])}–
                  {formatPrice(asset.invalidationZone[1])}
                </strong>
              </div>
              <div>
                <span>Expiração sugerida</span>
                <strong>{asset.expiration}</strong>
              </div>
            </div>
            <div className="reasons">
              <h4>Motivos</h4>
              <ul>
                {asset.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            {asset.warning && <p className="warning">{asset.warning}</p>}
            {debug && (
              <div className="debug-panel">
                <h4>DEBUG</h4>
                <dl>
                  <div>
                    <dt>source</dt>
                    <dd>{asset.source}</dd>
                  </div>
                  <div>
                    <dt>candles</dt>
                    <dd>{asset.candleCount}</dd>
                  </div>
                  <div>
                    <dt>timestamp</dt>
                    <dd>{asset.timestamp}</dd>
                  </div>
                  <div>
                    <dt>timeframe</dt>
                    <dd>{asset.timeframe}</dd>
                  </div>
                  <div>
                    <dt>score bruto</dt>
                    <dd>{asset.rawScore}</dd>
                  </div>
                  <div>
                    <dt>extendedMove</dt>
                    <dd>{String(asset.extendedMove)}</dd>
                  </div>
                  <div>
                    <dt>pullback confidence</dt>
                    <dd>{asset.pullbackConfidence}%</dd>
                  </div>
                  <div>
                    <dt>patterns</dt>
                    <dd>{asset.patterns.join(', ') || 'nenhum'}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </details>
      </div>
    </article>
  )
}
