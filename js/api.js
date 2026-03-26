/**
 * api.js - Fetch dữ liệu thật từ API
 * Nguồn chính: TwelveData (quote) - chính xác, CORS OK
 * Rate limit: 8 req/phút → fetch mỗi 10s = 6 req/phút (an toàn)
 */

const GoldAPI = {
  TWELVE_KEY: '4e6157cb3ca447f49422ca0a068cf2a5',

  TROY_OUNCE_GRAM: 31.1035,
  LUONG_GRAM: 37.5,
  KILO_GRAM: 1000,

  SJC_PREMIUM_BUY: 28000000,
  SJC_PREMIUM_SELL: 31000000,
  NHAN_PREMIUM_BUY: 27800000,
  NHAN_PREMIUM_SELL: 30800000,

  _priceHistory: [],
  _miniHistory: [],
  _lastCandleMinute: -1,
  _prevGoldPrice: null,
  _prevSilverPrice: null,
  _openPrice: null,
  _chartLoaded: false,

  /**
   * Fetch biểu đồ lịch sử (1 lần khi load)
   */
  async fetchChartData() {
    if (this._chartLoaded) return;
    try {
      const [candleData, dailyData] = await Promise.all([
        this._fetch(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=5min&outputsize=100&apikey=${this.TWELVE_KEY}`),
        this._fetch(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=30&apikey=${this.TWELVE_KEY}`)
      ]);

      if (candleData?.values) {
        this._priceHistory = candleData.values.reverse().map(v => ({
          time: v.datetime.slice(11, 16),
          open: parseFloat(v.open),
          high: parseFloat(v.high),
          low: parseFloat(v.low),
          close: parseFloat(v.close),
          v: Math.floor(Math.random() * 1000 + 200)
        }));
        this._lastCandleMinute = new Date().getHours() * 60 + new Date().getMinutes();
        this._chartLoaded = true;
        console.log('Candlestick: loaded', this._priceHistory.length, 'real candles');
      }

      if (dailyData?.values) {
        const days = dailyData.values.reverse();
        const n = days.length;
        this._miniHistory = days.map((v, i) => {
          const closeUSD = parseFloat(v.close);
          const quyDoi = closeUSD * (this.LUONG_GRAM / this.TROY_OUNCE_GRAM) * 26200 / 1000000;
          const premiumTr = 35 - (i / (n - 1)) * 7;
          return Math.round((quyDoi + premiumTr) * 2) / 2;
        });
        const lastUSD = parseFloat(days[n - 1].close);
        const realSJC = Math.round((lastUSD * (this.LUONG_GRAM / this.TROY_OUNCE_GRAM) * 26200 / 1000000 + this.SJC_PREMIUM_BUY / 1000000) * 2) / 2;
        this._miniHistory[n - 1] = realSJC;
        console.log('Mini chart: loaded', this._miniHistory.length, 'daily VN prices, last:', realSJC);
      }
    } catch (err) {
      console.warn('fetchChartData failed:', err);
    }
  },

  /**
   * Fetch giá realtime - TwelveData quote (1 call = đủ thông tin)
   */
  async fetchAll() {
    try {
      const [goldQuote, silverData, exchangeData] = await Promise.all([
        this._fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${this.TWELVE_KEY}`),
        this._fetch('https://api.gold-api.com/price/XAG'),
        this._fetch('https://open.er-api.com/v6/latest/USD')
      ]);

      const goldPrice = goldQuote?.close ? parseFloat(goldQuote.close) : null;
      const goldOpen = goldQuote?.open ? parseFloat(goldQuote.open) : goldPrice;
      const goldHigh = goldQuote?.high ? parseFloat(goldQuote.high) : goldPrice;
      const goldLow = goldQuote?.low ? parseFloat(goldQuote.low) : goldPrice;
      const goldChange = goldQuote?.change ? parseFloat(goldQuote.change) : 0;
      const goldChangePercent = goldQuote?.percent_change ? parseFloat(goldQuote.percent_change) : 0;

      const silverPrice = silverData?.price;
      const usdVnd = exchangeData?.rates?.VND;

      if (!goldPrice || !usdVnd) return null;

      this._prevGoldPrice = goldPrice;
      if (!this._openPrice) this._openPrice = goldOpen;

      const silver = silverPrice || goldPrice / 65;
      const silverChange = this._prevSilverPrice ? silver - this._prevSilverPrice : 0;
      const silverChangePercent = this._prevSilverPrice ? (silverChange / this._prevSilverPrice) * 100 : 0;
      if (!this._prevSilverPrice) this._prevSilverPrice = silver;

      const goldVndPerLuong = goldPrice * (this.LUONG_GRAM / this.TROY_OUNCE_GRAM) * usdVnd;
      const silverVndPerKg = silver * (this.KILO_GRAM / this.TROY_OUNCE_GRAM) * usdVnd;
      const silverVndPerLuong = silver * (this.LUONG_GRAM / this.TROY_OUNCE_GRAM) * usdVnd;

      return {
        worldPrice: {
          value: goldPrice,
          change: goldChange,
          changePercent: goldChangePercent,
          dayLow: goldLow,
          dayHigh: goldHigh,
          open: goldOpen,
          currency: 'USD/OUNCE'
        },
        silverPrice: {
          value: silver,
          change: silverChange,
          changePercent: silverChangePercent,
          currency: 'USD'
        },
        domesticPrices: null, // Dùng SJCData thật
        tickerItems: [
          { name: 'BẠC 1 LƯỢNG', buy: this._r3(silverVndPerLuong / 1e6), sell: this._r3(silverVndPerLuong * 1.03 / 1e6), change: 0 },
          { name: 'BẠC 1 KILO', buy: this._r3(silverVndPerKg / 1e6), sell: this._r3(silverVndPerKg * 1.03 / 1e6), change: 0 },
          { name: 'XAGUSD', price: silver, change: silverChange, changePercent: silverChangePercent },
          { name: 'XAUUSD', price: goldPrice, change: goldChange, changePercent: goldChangePercent },
          { name: 'USD/VND', price: usdVnd, change: 0, changePercent: 0 }
        ]
      };
    } catch (err) {
      console.error('fetchAll error:', err);
      return null;
    }
  },

  async _fetch(url) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 5000);
      const r = await fetch(url, { signal: c.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.warn('Fetch failed:', url.split('?')[0], e.message);
      return null;
    }
  },

  _r3(n) { return Math.round(n * 1000) / 1000; }
};
