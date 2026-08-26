import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/scenarios.json';
import type { Candle, MarketSnapshot } from '../models';
import { analyze, detectPatterns, detectPullback, detectZones } from './engine';
import { selectClosestExpiration } from './expiration';
import { bollinger, ema, rsi } from './indicators';

describe('indicadores locais',()=>{
  it('calcula EMA dando mais peso ao preço recente',()=>expect(ema([1,2,3,4,5],3)).toBeCloseTo(4.0625));
  it('calcula RSI neutro, sobrecomprado e sobrevendido',()=>{expect(rsi([1,1,1])).toBe(50);expect(rsi([1,2,3,4])).toBe(100);expect(rsi([4,3,2,1])).toBe(0)});
  it('calcula média e bandas de Bollinger',()=>{const b=bollinger(Array.from({length:20},(_,i)=>i+1));expect(b.middle).toBe(10.5);expect(b.upper).toBeGreaterThan(b.middle);expect(b.lower).toBeLessThan(b.middle)});
});
describe('estruturas técnicas',()=>{
  it('agrupa pivôs em zonas com força limitada',()=>{const z=detectZones((fixtures[2] as MarketSnapshot).candles);expect(z.length).toBeGreaterThan(0);expect(z.every(x=>x.strength<=100&&x.min<x.max)).toBe(true)});
  it('reconhece doji e martelo sem tratá-los como previsão',()=>{const c:Candle={timestamp:1,open:10,close:10.02,high:10.021,low:9};expect(detectPatterns([c])).toContain('martelo')});
  it('detecta pullback no fixture de tendência',()=>{const s=fixtures[1] as MarketSnapshot,a=analyze(s);expect(detectPullback(s.candles,a.trend,a.technical.zones).detected).toBe(true)});
  it('produz scoring de uma a cinco estrelas e evita entrada lateral',()=>{const analyses=(fixtures as MarketSnapshot[]).map(analyze);expect(analyses.every(a=>a.score>=1&&a.score<=5)).toBe(true);expect(analyses[2].bias).toBe('WAIT')});
});
describe('expiração',()=>it('seleciona a opção mais próxima de cinco minutos',()=>expect(selectClosestExpiration([{timestamp:1,secondsRemaining:60},{timestamp:2,secondsRemaining:278},{timestamp:3,secondsRemaining:600}])?.timestamp).toBe(2)));
