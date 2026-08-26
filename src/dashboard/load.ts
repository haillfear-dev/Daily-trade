import type { MarketDataAdapter } from '../adapters/demo-market'
import { rankAssets, type DashboardAsset } from './analysis'

export type DashboardLoadResult =
  | { status: 'ready'; assets: DashboardAsset[] }
  | { status: 'empty'; assets: [] }
  | { status: 'error'; assets: []; error: unknown }

export async function loadDashboard(
  adapter: MarketDataAdapter,
): Promise<DashboardLoadResult> {
  try {
    const snapshots = await adapter.loadSnapshots()
    if (snapshots.length === 0) return { status: 'empty', assets: [] }
    return {
      status: 'ready',
      assets: rankAssets(snapshots, snapshots[0].candles.at(-1)!.timestamp),
    }
  } catch (error) {
    return { status: 'error', assets: [], error }
  }
}
