import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch live market tickers in parallel
    const [cryptoRes, forexRes, stockRes] = await Promise.allSettled([
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT"]', { next: { revalidate: 2 } }).then(r => r.json()),
      fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 60 } }).then(r => r.json()),
      fetch('https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,TSLA,NVDA,MSFT,AMZN,GOOGL,META', { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 10 } 
      }).then(r => r.json())
    ]);

    // 1. Parse Cryptos
    const cryptoData = {
      BTC: { price: 67240.50, change: 2.45, high: 68100.00, low: 65890.00, volume: '18.4K BTC' },
      ETH: { price: 3482.15, change: -1.20, high: 3560.40, low: 3410.20, volume: '142K ETH' },
      SOL: { price: 152.40, change: 3.12, high: 156.20, low: 148.50, volume: '840K SOL' },
      BNB: { price: 585.20, change: 1.45, high: 592.10, low: 575.80, volume: '120K BNB' },
      XRP: { price: 0.6250, change: -0.45, high: 0.6380, low: 0.6120, volume: '45M XRP' },
      ADA: { price: 0.4450, change: -1.15, high: 0.4580, low: 0.4350, volume: '22M ADA' },
      DOGE: { price: 0.1250, change: 4.85, high: 0.1320, low: 0.1180, volume: '180M DOGE' }
    };

    if (cryptoRes.status === 'fulfilled' && Array.isArray(cryptoRes.value)) {
      cryptoRes.value.forEach(val => {
        const baseSymbol = val.symbol.replace('USDT', '');
        if (cryptoData[baseSymbol]) {
          cryptoData[baseSymbol] = {
            price: parseFloat(val.lastPrice) || cryptoData[baseSymbol].price,
            change: parseFloat(val.priceChangePercent) || cryptoData[baseSymbol].change,
            high: parseFloat(val.highPrice) || cryptoData[baseSymbol].high,
            low: parseFloat(val.lowPrice) || cryptoData[baseSymbol].low,
            volume: `${(parseFloat(val.volume) / 1000).toFixed(1)}K ${baseSymbol}`
          };
        }
      });
    }

    // 2. Parse Forex and Commodities
    const forexData = {
      'EUR/USD': { price: 1.0845, change: 0.12, high: 1.0890, low: 1.0812, volume: '85K Lots' },
      'GBP/USD': { price: 1.2825, change: 0.18, high: 1.2910, low: 1.2780, volume: '62K Lots' },
      'USD/JPY': { price: 155.60, change: -0.22, high: 156.40, low: 154.80, volume: '98K Lots' },
      'AUD/USD': { price: 0.6650, change: 0.05, high: 0.6690, low: 0.6610, volume: '44K Lots' },
      'USD/CAD': { price: 1.3720, change: 0.15, high: 1.3780, low: 1.3680, volume: '38K Lots' },
      'USD/CHF': { price: 0.9020, change: -0.10, high: 0.9065, low: 0.8980, volume: '31K Lots' },
      'XAU/USD': { price: 2380.50, change: 0.79, high: 2405.00, low: 2368.00, volume: '38K Lots' }
    };

    if (forexRes.status === 'fulfilled' && forexRes.value && forexRes.value.rates) {
      const rates = forexRes.value.rates;
      
      const updateRate = (pair, rateVal, invert = false) => {
        if (!rateVal) return;
        const rate = invert ? 1 / rateVal : rateVal;
        const decimals = pair.includes('JPY') || pair.includes('XAU') ? 2 : 4;
        
        forexData[pair] = {
          price: parseFloat(rate.toFixed(decimals)),
          change: forexData[pair].change,
          high: parseFloat((rate * (1 + (decimals === 2 ? 0.005 : 0.0025))).toFixed(decimals)),
          low: parseFloat((rate * (1 - (decimals === 2 ? 0.005 : 0.0025))).toFixed(decimals)),
          volume: forexData[pair].volume
        };
      };
      
      updateRate('EUR/USD', rates.EUR, true);
      updateRate('GBP/USD', rates.GBP, true);
      updateRate('USD/JPY', rates.JPY, false);
      updateRate('AUD/USD', rates.AUD, true);
      updateRate('USD/CAD', rates.CAD, false);
      updateRate('USD/CHF', rates.CHF, false);
      updateRate('XAU/USD', rates.XAU, true);
    }

    // 3. Parse Stocks
    const stockData = {
      AAPL: { price: 189.84, change: 1.85, high: 191.20, low: 188.10, volume: '42.5M Shares' },
      TSLA: { price: 180.20, change: -0.85, high: 184.50, low: 178.10, volume: '88M Shares' },
      NVDA: { price: 125.50, change: 4.25, high: 128.90, low: 122.10, volume: '145M Shares' },
      MSFT: { price: 420.10, change: 0.65, high: 423.80, low: 417.20, volume: '22M Shares' },
      AMZN: { price: 185.30, change: 1.15, high: 188.40, low: 183.10, volume: '35M Shares' },
      GOOGL: { price: 175.40, change: -0.32, high: 177.80, low: 174.10, volume: '28M Shares' },
      META: { price: 475.20, change: 2.18, high: 482.50, low: 468.90, volume: '18M Shares' }
    };

    if (stockRes.status === 'fulfilled' && stockRes.value && stockRes.value.quoteResponse && Array.isArray(stockRes.value.quoteResponse.result)) {
      stockRes.value.quoteResponse.result.forEach(val => {
        const sym = val.symbol;
        if (stockData[sym]) {
          stockData[sym] = {
            price: parseFloat(val.regularMarketPrice) || stockData[sym].price,
            change: parseFloat(val.regularMarketChangePercent) || stockData[sym].change,
            high: parseFloat(val.regularMarketDayHigh) || stockData[sym].high,
            low: parseFloat(val.regularMarketDayLow) || stockData[sym].low,
            volume: `${((val.regularMarketVolume || 10000000) / 1000000).toFixed(1)}M Shares`
          };
        }
      });
    }

    return NextResponse.json({
      ...cryptoData,
      ...forexData,
      ...stockData
    });
  } catch (error) {
    console.error('Error fetching real-time prices:', error);
    
    // Graceful full fallback payload
    return NextResponse.json({
      BTC: { price: 67240.50, change: 2.45, high: 68100.00, low: 65890.00, volume: '18.4K BTC' },
      ETH: { price: 3482.15, change: -1.20, high: 3560.40, low: 3410.20, volume: '142K ETH' },
      SOL: { price: 152.40, change: 3.12, high: 156.20, low: 148.50, volume: '840K SOL' },
      BNB: { price: 585.20, change: 1.45, high: 592.10, low: 575.80, volume: '120K BNB' },
      XRP: { price: 0.6250, change: -0.45, high: 0.6380, low: 0.6120, volume: '45M XRP' },
      ADA: { price: 0.4450, change: -1.15, high: 0.4580, low: 0.4350, volume: '22M ADA' },
      DOGE: { price: 0.1250, change: 4.85, high: 0.1320, low: 0.1180, volume: '180M DOGE' },
      'EUR/USD': { price: 1.0845, change: 0.12, high: 1.0890, low: 1.0812, volume: '85K Lots' },
      'GBP/USD': { price: 1.2825, change: 0.18, high: 1.2910, low: 1.2780, volume: '62K Lots' },
      'USD/JPY': { price: 155.60, change: -0.22, high: 156.40, low: 154.80, volume: '98K Lots' },
      'AUD/USD': { price: 0.6650, change: 0.05, high: 0.6690, low: 0.6610, volume: '44K Lots' },
      'USD/CAD': { price: 1.3720, change: 0.15, high: 1.3780, low: 1.3680, volume: '38K Lots' },
      'USD/CHF': { price: 0.9020, change: -0.10, high: 0.9065, low: 0.8980, volume: '31K Lots' },
      'XAU/USD': { price: 2380.50, change: 0.79, high: 2405.00, low: 2368.00, volume: '38K Lots' },
      AAPL: { price: 189.84, change: 1.85, high: 191.20, low: 188.10, volume: '42.5M Shares' },
      TSLA: { price: 180.20, change: -0.85, high: 184.50, low: 178.10, volume: '88M Shares' },
      NVDA: { price: 125.50, change: 4.25, high: 128.90, low: 122.10, volume: '145M Shares' },
      MSFT: { price: 420.10, change: 0.65, high: 423.80, low: 417.20, volume: '22M Shares' },
      AMZN: { price: 185.30, change: 1.15, high: 188.40, low: 183.10, volume: '35M Shares' },
      GOOGL: { price: 175.40, change: -0.32, high: 177.80, low: 174.10, volume: '28M Shares' },
      META: { price: 475.20, change: 2.18, high: 482.50, low: 468.90, volume: '18M Shares' }
    });
  }
}
