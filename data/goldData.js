/**
 * goldData.js - Dữ liệu giá vàng
 * Tách riêng để dễ cập nhật hoặc thay bằng API thật
 */

const GoldData = {
  // Giá vàng thế giới
  worldPrice: {
    value: 4444.575,
    change: -62.27,
    changePercent: -1.38,
    dayLow: 4415.0,
    dayHigh: 4544.0,
    currency: 'USD/OUNCE'
  },

  // Giá bạc
  silverPrice: {
    value: 99.690,
    change: 0.053,
    changePercent: 0.05,
    currency: 'USD'
  },

  // Bảng giá vàng trong nước
  domesticPrices: [
    {
      name: 'SJC MI HỒNG',
      buy: 169500000,
      sell: 171500000,
      buyChange: -2000000,
      sellChange: -2000000,
      spread: 2000000
    },
    {
      name: 'NHẪN 99,9 MI HỒNG',
      buy: 169500000,
      sell: 171500000,
      buyChange: -2000000,
      sellChange: -2000000,
      spread: 2000000
    },
    {
      name: 'VÀNG MIẾNG VRTL BTMC',
      buy: 168000000,
      sell: 171000000,
      buyChange: -1500000,
      sellChange: -1500000,
      spread: 3000000
    },
    {
      name: 'SJC 1L, 5C',
      buy: 169500000,
      sell: 171500000,
      buyChange: -2000000,
      sellChange: -2000000,
      spread: 2000000
    },
    {
      name: 'VÀNG NỮ TRANG 24K',
      buy: 168000000,
      sell: 170000000,
      buyChange: -1000000,
      sellChange: -1000000,
      spread: 2000000
    }
  ],

  // Dữ liệu ticker chạy dưới
  tickerItems: [
    { name: 'BẠC PHÚ QUÝ 1 LƯỢNG', buy: 2.599, sell: 2.679, change: -0.074 },
    { name: 'BẠC PHÚ QUÝ 1 KILO', buy: 69.306, sell: 71.440, change: -1.97 },
    { name: 'XAGUSD', price: 69.24005, change: -2.01, changePercent: -2.82 },
    { name: 'XAUUSD', price: 4444.575, change: -62.27, changePercent: -1.38 },
    { name: 'DXY', price: 104.25, change: 0.35, changePercent: 0.34 },
    { name: 'USD/VND', price: 25485, change: 15, changePercent: 0.06 }
  ],

  // Dữ liệu candlestick mẫu (OHLC)
  candlestickData: generateCandlestickData(),

  // Dữ liệu mini chart 30 ngày
  miniChartData: generateMiniChartData()
};

function generateCandlestickData() {
  const data = [];
  let price = 4500;
  for (let i = 0; i < 50; i++) {
    const open = price + (Math.random() - 0.5) * 20;
    const close = open + (Math.random() - 0.55) * 30;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    data.push({ open, high, low, close });
    price = close;
  }
  return data;
}

function generateMiniChartData() {
  const data = [];
  let value = 190;
  for (let i = 0; i < 30; i++) {
    value += (Math.random() - 0.55) * 5;
    value = Math.max(160, Math.min(195, value));
    data.push(value);
  }
  return data;
}
