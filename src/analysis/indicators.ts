import type { BollingerBands } from '../models';

export function ema(values:number[], period:number):number {
  if (!values.length) return 0;
  const k=2/(period+1); return values.slice(1).reduce((v,n)=>n*k+v*(1-k),values[0]);
}
export function rsi(values:number[], period=14):number {
  if(values.length<2)return 50; const changes=values.slice(1).map((v,i)=>v-values[i]); const recent=changes.slice(-period);
  const gain=recent.reduce((s,v)=>s+Math.max(v,0),0)/recent.length; const loss=recent.reduce((s,v)=>s+Math.max(-v,0),0)/recent.length;
  return loss===0?(gain===0?50:100):100-100/(1+gain/loss);
}
export function bollinger(values:number[], period=20, deviations=2):BollingerBands {
  const sample=values.slice(-period); const middle=sample.reduce((a,b)=>a+b,0)/sample.length; const sd=Math.sqrt(sample.reduce((s,v)=>s+(v-middle)**2,0)/sample.length); const upper=middle+deviations*sd,lower=middle-deviations*sd,price=values.at(-1)??middle;
  const position=price>upper?'above':price<lower?'below':price>middle+sd?'near-upper':price<middle-sd?'near-lower':'middle'; return {middle,upper,lower,position};
}
