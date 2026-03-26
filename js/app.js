/**
 * app.js - Khởi tạo và điều phối tất cả module
 * UI chạy ngay lập tức, API load nền không chặn
 */

let lastRealPrice = 4440;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Đồng hồ - chạy ngay
  Clock.init();

  // 2. Dùng giá SJC thật cho bảng giá + mini chart
  GoldData.domesticPrices = SJCData.getDomesticPrices();
  GoldData.miniChartData = SJCData.getDailyBuyPrices();

  // 3. Hiển thị ngay lập tức
  renderAll(GoldData);

  // 3. Seed nến giả từ fallback để biểu đồ có dữ liệu ngay
  _seedInitialCandles(GoldData.worldPrice.value);
  GoldData.candlestickData = [...GoldAPI._priceHistory];
  GoldData.miniChartData = [...GoldAPI._miniHistory];
  drawCharts();

  // 4. Mô phỏng nến liên tục - chạy ngay, không đợi API
  setInterval(pushSimulatedCandle, 1500);

  // 5. Load API nền (không chặn UI)
  loadRealData();

  // 6. Resize
  window.addEventListener('resize', debounce(drawCharts, 200));
});

/**
 * Load tất cả dữ liệu thật nền - không chặn UI
 */
async function loadRealData() {
  // Fetch giá realtime trước (nhanh nhất)
  fetchAndUpdate();

  // Fetch song song: biểu đồ + tin tức (chậm hơn)
  GoldAPI.fetchChartData().then(() => {
    if (GoldAPI._priceHistory.length > 0) {
      lastRealPrice = GoldAPI._priceHistory[GoldAPI._priceHistory.length - 1].close;
      GoldData.candlestickData = [...GoldAPI._priceHistory];
      // Mini chart giữ data SJC thật, không ghi đè
      drawCharts();
      console.log('Charts updated with real data');
    }
  });

  // Tin tức: hiện mặc định ngay, fetch thật nền
  News.init();

  // Refresh giá mỗi 10s
  setInterval(fetchAndUpdate, 10000);
}

async function fetchAndUpdate() {
  try {
    const data = await GoldAPI.fetchAll();
    if (data) {
      lastRealPrice = data.worldPrice.value;
      GoldData.worldPrice = data.worldPrice;
      GoldData.silverPrice = data.silverPrice;
      GoldData.tickerItems = data.tickerItems;
      // Giữ domesticPrices từ SJCData thật, không ghi đè bằng giá tính toán

      PriceCard.init(data.worldPrice, data.silverPrice);
      Ticker.init(data.tickerItems);
    }
  } catch (err) {
    console.warn('fetchAndUpdate failed:', err);
  }
}

function pushSimulatedCandle() {
  const history = GoldAPI._priceHistory;
  if (history.length === 0) return;

  const lastCandle = history[history.length - 1];
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const timeLabel = now.getHours().toString().padStart(2, '0') + ':' +
                    now.getMinutes().toString().padStart(2, '0');

  const drift = (lastRealPrice - lastCandle.close) * 0.1;
  const noise = (Math.random() - 0.48) * 6;
  const newPrice = lastCandle.close + drift + noise;

  if (GoldAPI._lastCandleMinute !== currentMinute) {
    history.push({
      time: timeLabel,
      open: newPrice,
      high: newPrice + Math.random() * 3,
      low: newPrice - Math.random() * 3,
      close: newPrice,
      v: Math.floor(Math.random() * 800 + 200)
    });
    GoldAPI._lastCandleMinute = currentMinute;
    if (history.length > 150) history.shift();
  } else {
    lastCandle.close = newPrice;
    lastCandle.high = Math.max(lastCandle.high, newPrice);
    lastCandle.low = Math.min(lastCandle.low, newPrice);
    lastCandle.v += Math.floor(Math.random() * 30 + 5);
  }

  GoldData.candlestickData = [...history];

  // Chỉ vẽ lại biểu đồ nến (price card giữ nguyên giá thật từ API)
  CandlestickChart.draw('candlestick-chart', GoldData.candlestickData);
}

function _seedInitialCandles(basePrice) {
  if (GoldAPI._priceHistory.length > 5) return;
  const now = Date.now();
  let price = basePrice - (Math.random() * 20 + 5);

  for (let i = 80; i >= 1; i--) {
    const t = new Date(now - i * 60000);
    const tl = t.getHours().toString().padStart(2, '0') + ':' +
               t.getMinutes().toString().padStart(2, '0');
    const open = price;
    const change = (Math.random() - 0.48) * 10;
    const close = open + change;
    GoldAPI._priceHistory.push({
      time: tl,
      open: +open.toFixed(3),
      high: +(Math.max(open, close) + Math.random() * 5).toFixed(3),
      low: +(Math.min(open, close) - Math.random() * 5).toFixed(3),
      close: +close.toFixed(3),
      v: Math.floor(Math.random() * 1000 + 150)
    });
    price = close;
  }
  GoldAPI._lastCandleMinute = new Date().getHours() * 60 + new Date().getMinutes();

  // Giá SJC VN = quy đổi + premium 28tr
  const sjcBase = basePrice * (37.5 / 31.1035) * 26200 / 1000000 + 28;
  for (let i = 30; i >= 1; i--) {
    GoldAPI._miniHistory.push(Math.round((sjcBase + (Math.random() - 0.5) * 1.5) * 2) / 2);
  }
}

function renderAll(data) {
  PriceCard.init(data.worldPrice, data.silverPrice);
  PriceTable.init(data.domesticPrices);
  Ticker.init(data.tickerItems);
  drawCharts();
}

function drawCharts() {
  CandlestickChart.draw('candlestick-chart', GoldData.candlestickData);
  MiniChart.draw('mini-chart', GoldData.miniChartData);
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
