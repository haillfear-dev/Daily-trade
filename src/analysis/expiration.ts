import type { ExpirationOption } from '../models';
export function selectClosestExpiration(options:ExpirationOption[],preferredSeconds=300){return [...options].sort((a,b)=>Math.abs(a.secondsRemaining-preferredSeconds)-Math.abs(b.secondsRemaining-preferredSeconds))[0];}
