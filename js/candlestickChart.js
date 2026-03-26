/**
 * candlestickChart.js - Biểu đồ nến TradingView-style
 * Có: MA20, EMA9, SMA50, Bollinger Bands, Volume, Crosshair, Animation
 */

const CandlestickChart = {
  // Colors
  UP: '#089981',
  DOWN: '#F23645',
  UP_A: 'rgba(8,153,129,',
  DOWN_A: 'rgba(242,54,69,',
  BG: '#ffffff',
  GRID: '#f0f0f0',
  TEXT: '#999',
  MA20_COLOR: '#FF9800',
  EMA9_COLOR: '#2962FF',
  SMA50_COLOR: '#AB47BC',
  BB_COLOR: 'rgba(128,128,128,0.12)',
  BB_LINE: 'rgba(128,128,128,0.35)',

  // Layout
  PRICE_RIGHT: 65,
  VOL_H_RATIO: 0.18,
  PADDING_TOP: 10,
  PADDING_BOT: 18,

  // State
  _mouseX: -1,
  _mouseY: -1,
  _canvas: null,
  _ctx: null,
  _data: null,
  _W: 0,
  _H: 0,
  _bound: false,

  draw(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this._canvas = canvas;
    this._ctx = ctx;
    this._data = data;

    // Resize with devicePixelRatio
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._W = rect.width - 8;
    this._H = rect.height - 8;
    canvas.width = this._W * dpr;
    canvas.height = this._H * dpr;
    canvas.style.width = this._W + 'px';
    canvas.style.height = this._H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Bind mouse events once
    if (!this._bound) {
      this._bound = true;
      canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        this._mouseX = e.clientX - r.left;
        this._mouseY = e.clientY - r.top;
        this._render();
      });
      canvas.addEventListener('mouseleave', () => {
        this._mouseX = -1;
        this._mouseY = -1;
        this._render();
      });
    }

    this._render();
  },

  _render() {
    const ctx = this._ctx;
    const data = this._data;
    const W = this._W;
    const H = this._H;
    if (!ctx || !data || data.length === 0) return;

    ctx.clearRect(0, 0, W, H);

    const n = data.length;
    const chartW = W - this.PRICE_RIGHT;
    const volH = H * this.VOL_H_RATIO;
    const candleH = H - volH;

    // Candle dimensions
    const candleFullW = chartW / n;
    const candleBodyW = Math.max(candleFullW * 0.65, 3);
    const wickW = Math.max(1, candleBodyW < 6 ? 1 : 1.5);

    // Price range
    let pMin = Infinity, pMax = -Infinity;
    for (const c of data) {
      pMin = Math.min(pMin, c.low);
      pMax = Math.max(pMax, c.high);
    }
    const pPad = (pMax - pMin) * 0.08 || 1;
    pMin -= pPad;
    pMax += pPad;
    const pRange = pMax - pMin || 1;

    // Volume range
    let vMax = 0;
    for (const c of data) vMax = Math.max(vMax, c.v || 0);
    if (vMax === 0) vMax = 1;

    // Scale functions
    const py = p => this.PADDING_TOP + (1 - (p - pMin) / pRange) * (candleH - this.PADDING_TOP - this.PADDING_BOT);
    const vy = v => candleH + (1 - v / vMax) * volH * 0.9;

    // ---- Background ----
    ctx.fillStyle = this.BG;
    ctx.fillRect(0, 0, chartW, H);

    // ---- Grid ----
    ctx.strokeStyle = this.GRID;
    ctx.lineWidth = 0.5;
    const nGridH = 6;
    for (let i = 0; i <= nGridH; i++) {
      const y = this.PADDING_TOP + i * (candleH - this.PADDING_TOP - this.PADDING_BOT) / nGridH;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke();
    }
    // Vertical grid
    const nGridV = Math.max(Math.floor(n / 12), 1);
    for (let i = 0; i < n; i += nGridV) {
      const x = i * candleFullW + candleFullW / 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // Volume separator
    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath(); ctx.moveTo(0, candleH); ctx.lineTo(chartW, candleH); ctx.stroke();

    // ---- Volume bars ----
    for (let i = 0; i < n; i++) {
      const c = data[i];
      const vol = c.v || Math.random() * 500 + 100;
      const x = i * candleFullW + (candleFullW - candleBodyW) / 2;
      const bullish = c.close >= c.open;
      ctx.fillStyle = bullish ? this.UP_A + '0.25)' : this.DOWN_A + '0.25)';
      const vY = vy(vol);
      ctx.fillRect(x, vY, candleBodyW, H - vY - this.PADDING_BOT);
    }

    // ---- Bollinger Bands ----
    const sma20 = this._calcSMA(data, 20);
    const bbUpper = [], bbLower = [];
    for (let i = 0; i < n; i++) {
      if (sma20[i] === null) { bbUpper.push(null); bbLower.push(null); continue; }
      let sq = 0;
      for (let j = i - 19; j <= i; j++) { const d = data[j].close - sma20[i]; sq += d * d; }
      const std = Math.sqrt(sq / 20);
      bbUpper.push(sma20[i] + 2 * std);
      bbLower.push(sma20[i] - 2 * std);
    }
    // Fill between bands
    ctx.fillStyle = this.BB_COLOR;
    ctx.beginPath();
    let bbStarted = false;
    for (let i = 0; i < n; i++) {
      if (bbUpper[i] === null) continue;
      const x = i * candleFullW + candleFullW / 2;
      if (!bbStarted) { ctx.moveTo(x, py(bbUpper[i])); bbStarted = true; }
      else ctx.lineTo(x, py(bbUpper[i]));
    }
    for (let i = n - 1; i >= 0; i--) {
      if (bbLower[i] === null) continue;
      ctx.lineTo(i * candleFullW + candleFullW / 2, py(bbLower[i]));
    }
    ctx.closePath(); ctx.fill();
    this._drawLine(ctx, data, bbUpper, py, candleFullW, this.BB_LINE, 0.8);
    this._drawLine(ctx, data, bbLower, py, candleFullW, this.BB_LINE, 0.8);

    // ---- Candles ----
    for (let i = 0; i < n; i++) {
      const c = data[i];
      const cx = i * candleFullW + candleFullW / 2;
      const bullish = c.close >= c.open;
      const color = bullish ? this.UP : this.DOWN;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = wickW;
      ctx.beginPath();
      ctx.moveTo(cx, py(c.high));
      ctx.lineTo(cx, py(c.low));
      ctx.stroke();

      // Body
      const bodyTop = py(Math.max(c.open, c.close));
      const bodyBot = py(Math.min(c.open, c.close));
      const bodyH = Math.max(bodyBot - bodyTop, 1);
      ctx.fillStyle = color;
      ctx.fillRect(cx - candleBodyW / 2, bodyTop, candleBodyW, bodyH);
    }

    // ---- MA lines ----
    this._drawLine(ctx, data, sma20, py, candleFullW, this.MA20_COLOR, 1.5);
    this._drawLine(ctx, data, this._calcEMA(data, 9), py, candleFullW, this.EMA9_COLOR, 1.2);
    if (n > 50) {
      this._drawLine(ctx, data, this._calcSMA(data, 50), py, candleFullW, this.SMA50_COLOR, 1.2);
    }

    // ---- Price scale (right) ----
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(chartW, 0, this.PRICE_RIGHT, H);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartW, 0); ctx.lineTo(chartW, H); ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#777';
    ctx.textAlign = 'center';
    for (let i = 0; i <= nGridH; i++) {
      const y = this.PADDING_TOP + i * (candleH - this.PADDING_TOP - this.PADDING_BOT) / nGridH;
      const price = pMax - i * pRange / nGridH;
      ctx.fillText(price.toFixed(3), chartW + this.PRICE_RIGHT / 2, y + 4);
    }

    // ---- Current price label ----
    const last = data[n - 1];
    const lastY = py(last.close);
    const bullish = last.close >= last.open;
    const labelColor = bullish ? this.UP : this.DOWN;

    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = labelColor + '88';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, lastY); ctx.lineTo(chartW, lastY); ctx.stroke();
    ctx.setLineDash([]);

    // Price box
    const lbW = this.PRICE_RIGHT - 4, lbH = 20;
    const lbX = chartW + 2, lbY = lastY - lbH / 2;
    ctx.fillStyle = labelColor;
    ctx.fillRect(lbX, lbY, lbW, lbH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(last.close.toFixed(3), lbX + lbW / 2, lbY + lbH / 2);
    ctx.textBaseline = 'alphabetic';

    // ---- Time labels ----
    ctx.fillStyle = this.TEXT;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    const step = Math.max(Math.floor(n / 10), 1);
    for (let i = 0; i < n; i += step) {
      const c = data[i];
      const label = c.time || '';
      const x = i * candleFullW + candleFullW / 2;
      ctx.fillText(label, x, H - 2);
    }

    // ---- Crosshair ----
    if (this._mouseX >= 0 && this._mouseX < chartW) {
      this._drawCrosshair(ctx, data, chartW, H, candleH, candleFullW, pMin, pMax, pRange, py);
    }
  },

  _drawCrosshair(ctx, data, chartW, H, candleH, candleFullW, pMin, pMax, pRange, py) {
    const mx = this._mouseX, my = this._mouseY;
    const n = data.length;

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(chartW, my); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
    ctx.setLineDash([]);

    // Price at cursor
    if (my < candleH) {
      const price = pMax - (my - this.PADDING_TOP) / (candleH - this.PADDING_TOP - this.PADDING_BOT) * pRange;
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(chartW + 1, my - 10, this.PRICE_RIGHT - 2, 20);
      ctx.fillStyle = '#333';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(price.toFixed(3), chartW + this.PRICE_RIGHT / 2, my + 4);
    }

    // Highlight candle
    const idx = Math.floor(mx / candleFullW);
    if (idx >= 0 && idx < n) {
      const c = data[idx];
      // Time label
      ctx.fillStyle = '#555';
      ctx.fillRect(mx - 25, H - 14, 50, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(c.time || '', mx, H - 3);

      // Tooltip OHLC
      if (my < candleH) {
        const tx = Math.min(mx + 10, chartW - 130);
        const ty = Math.max(my - 60, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(tx, ty, 120, 52);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('O: ' + c.open.toFixed(3), tx + 6, ty + 13);
        ctx.fillText('H: ' + c.high.toFixed(3), tx + 6, ty + 25);
        ctx.fillText('L: ' + c.low.toFixed(3), tx + 6, ty + 37);
        ctx.fillStyle = c.close >= c.open ? this.UP : this.DOWN;
        ctx.fillText('C: ' + c.close.toFixed(3), tx + 6, ty + 49);
      }
    }
  },

  _calcSMA(data, period) {
    const r = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { r.push(null); continue; }
      let s = 0;
      for (let j = i - period + 1; j <= i; j++) s += data[j].close;
      r.push(s / period);
    }
    return r;
  },

  _calcEMA(data, period) {
    const r = [];
    const k = 2 / (period + 1);
    for (let i = 0; i < data.length; i++) {
      if (i === 0) { r.push(data[i].close); continue; }
      r.push(data[i].close * k + r[i - 1] * (1 - k));
    }
    for (let i = 0; i < period - 1; i++) r[i] = null;
    return r;
  },

  _drawLine(ctx, data, values, py, candleFullW, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === null) continue;
      const x = i * candleFullW + candleFullW / 2;
      const y = py(values[i]);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
};
