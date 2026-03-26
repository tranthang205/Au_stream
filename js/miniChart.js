/**
 * miniChart.js - Biểu đồ line 30 ngày SJC
 * Dùng devicePixelRatio để không bị vỡ khi zoom
 */

const MiniChart = {
  draw(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Resize với devicePixelRatio (fix vỡ khi zoom)
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth - 16;
    const h = Math.max(80, container.clientHeight - 30);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = { top: 10, right: 40, bottom: 20, left: 10 };

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, w, h);

    if (!data || data.length === 0) return;

    const min = Math.min(...data) - 1;
    const max = Math.max(...data) + 1;
    const range = max - min || 1;
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const xScale = (i) => padding.left + (i / (data.length - 1)) * chartW;
    const yScale = (v) => padding.top + chartH - ((v - min) / range) * chartH;

    // Grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const val = max - (range / 4) * i;
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(val.toFixed(0), w - padding.right + 4, y + 3);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(xScale(i), yScale(data[i]));
    }
    ctx.lineTo(xScale(data.length - 1), padding.top + chartH);
    ctx.lineTo(xScale(0), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 99, 99, 0.15)';
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(xScale(i), yScale(data[i]));
    }
    ctx.strokeStyle = '#cc3333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Moving average
    const ma = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - 4);
      const slice = data.slice(start, i + 1);
      ma.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(ma[0]));
    for (let i = 1; i < ma.length; i++) {
      ctx.lineTo(xScale(i), yScale(ma[i]));
    }
    ctx.strokeStyle = '#00aa66';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Giá cuối cùng (điểm đỏ + label)
    const lastVal = data[data.length - 1];
    const lx = xScale(data.length - 1);
    const ly = yScale(lastVal);
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc3333';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(lastVal.toFixed(1), lx - 6, ly - 6);
  }
};
