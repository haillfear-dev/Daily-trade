import type { MarketSnapshot, TechnicalAnalysis, TradeEntry } from './models';
export interface AIAnalysis { summary:string }
export interface AIAnalysisProvider { analyze(snapshot:MarketSnapshot,technical:TechnicalAnalysis):Promise<AIAnalysis> }
export class DisabledAIProvider implements AIAnalysisProvider { async analyze(){return{summary:'IA desativada. A análise atual é 100% local.'}} }
export interface TradeJournalProvider { saveTrade(trade:TradeEntry):Promise<void>; updateTrade(trade:TradeEntry):Promise<void>; listTrades():Promise<TradeEntry[]> }
const KEY='daily-trade-journal';
export class LocalTradeJournalProvider implements TradeJournalProvider {async listTrades(){if(typeof chrome!=='undefined'&&chrome.storage)return (await chrome.storage.local.get(KEY))[KEY]??[];return JSON.parse(localStorage.getItem(KEY)??'[]') as TradeEntry[]}async saveTrade(t:TradeEntry){const all=await this.listTrades();await this.write([t,...all])}async updateTrade(t:TradeEntry){await this.write((await this.listTrades()).map(x=>x.id===t.id?t:x))}private async write(all:TradeEntry[]){if(typeof chrome!=='undefined'&&chrome.storage)await chrome.storage.local.set({[KEY]:all});else localStorage.setItem(KEY,JSON.stringify(all))}}
export class GoogleSheetsTradeJournalProvider implements TradeJournalProvider {private unavailable():never{throw new Error('Google Sheets estará disponível após autenticação via backend.')}async saveTrade(){this.unavailable()}async updateTrade(){this.unavailable()}async listTrades(){return this.unavailable()}}
