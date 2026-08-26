// Ponte mínima e passiva. Não intercepta WebSocket nem altera elementos da corretora.
chrome.runtime.sendMessage({type:'DAILY_TRADE_PAGE_DETECTED',url:location.href,at:Date.now()}).catch(()=>undefined);
