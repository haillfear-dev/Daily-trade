import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DemoMarketDataAdapter,
  type MarketDataAdapter,
} from './adapters/demo-market'
import { AssetCard } from './components/AssetCard'
import { translateSignal, type DashboardAsset } from './dashboard/analysis'
import { loadDashboard } from './dashboard/load'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'
export interface AppProps {
  adapter?: MarketDataAdapter
}
export function App({ adapter }: AppProps) {
  const marketAdapter = useMemo(
    () => adapter ?? new DemoMarketDataAdapter(),
    [adapter],
  )
  const [assets, setAssets] = useState<DashboardAsset[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [debug, setDebug] = useState(false)
  const load = useCallback(async () => {
    setState('loading')
    const result = await loadDashboard(marketAdapter)
    setAssets(result.assets)
    setState(result.status)
  }, [marketAdapter])
  useEffect(() => {
    let active = true
    void loadDashboard(marketAdapter).then((result) => {
      if (!active) return
      setAssets(result.assets)
      setState(result.status)
    })
    return () => {
      active = false
    }
  }, [marketAdapter])
  const best = assets[0]
  const summary = useMemo(
    () =>
      best
        ? {
            score: `${best.stars}/5`,
            direction: translateSignal(best.signal),
            status: best.timing
              .replace('AGUARDAR ', 'Aguardar ')
              .replace('SEM CONFIRMAÇÃO CLARA', 'Aguardar confirmação'),
          }
        : null,
    [best],
  )
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">DT</div>
        <div className="brand">
          <p>DAILY TRADE</p>
          <span>Copiloto técnico</span>
        </div>
        <div className="status">
          <span>DEMO</span>
          <small>M5 · Atualizado agora</small>
        </div>
      </header>
      <section className="summary" aria-label="Resumo da análise">
        <div className="section-heading">
          <div>
            <span className="kicker">VISÃO GERAL</span>
            <h1>Radar de mercado</h1>
          </div>
          <span className="live-dot">DEMO AO VIVO</span>
        </div>
        {summary ? (
          <div className="summary-grid">
            <div>
              <span>Ativos analisados</span>
              <strong>{assets.length}</strong>
            </div>
            <div>
              <span>Melhor setup</span>
              <strong>{best.symbol}</strong>
            </div>
            <div>
              <span>Score</span>
              <strong>{summary.score}</strong>
            </div>
            <div>
              <span>Direção</span>
              <strong className={best.signal.toLowerCase()}>
                {summary.direction}
              </strong>
            </div>
            <div className="summary-status">
              <span>Status</span>
              <strong>{summary.status}</strong>
            </div>
          </div>
        ) : (
          <div className="summary-placeholder">Aguardando dados do radar…</div>
        )}
      </section>
      <section className="opportunities">
        <div className="section-title">
          <div>
            <span className="kicker">RANKING M5</span>
            <h2>MELHORES OPORTUNIDADES</h2>
          </div>
          <button
            className="refresh"
            type="button"
            onClick={() => void load()}
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Analisando…' : '↻ Atualizar análise'}
          </button>
        </div>
        {state === 'empty' && (
          <div className="state-card">Nenhum dado de mercado disponível.</div>
        )}
        {state === 'error' && (
          <div className="state-card error">
            Não foi possível concluir a análise.
          </div>
        )}
        {state === 'loading' && assets.length === 0 && (
          <div className="state-card">Carregando snapshots Demo…</div>
        )}
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} debug={debug} />
        ))}
      </section>
      <div className="debug-toggle">
        <label>
          <input
            type="checkbox"
            checked={debug}
            onChange={(event) => setDebug(event.target.checked)}
          />
          <span>Modo Debug</span>
        </label>
      </div>
      <footer>
        <strong>Análise técnica probabilística.</strong>
        <span>A extensão não executa operações automaticamente.</span>
      </footer>
    </main>
  )
}
