import type { DebugInfo, MarketSnapshot } from '../models';
import fixtures from '../fixtures/scenarios.json';
export interface MarketDataAdapter { getSnapshots():Promise<MarketSnapshot[]>; getDebugInfo():DebugInfo }
export class DemoMarketDataAdapter implements MarketDataAdapter { async getSnapshots(){return fixtures as MarketSnapshot[]} getDebugInfo(){return{source:'fixture/demo',websocketIdentified:false,recognizedMessages:0,updatedAt:Date.now()}} }
export class IQOptionMarketDataAdapter implements MarketDataAdapter { async getSnapshots():Promise<MarketSnapshot[]>{return[]} getDebugInfo(){return{source:'IQ Option: captura ainda não validada',websocketIdentified:false,recognizedMessages:0,updatedAt:Date.now()}} }
