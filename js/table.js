/**
 * table.js - Bảng giá vàng trong nước
 */

const PriceTable = {
  init(prices) {
    this.render(prices);
    this.updateBanner();
  },

  render(prices) {
    const tbody = document.getElementById('price-table-body');
    tbody.innerHTML = '';

    prices.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>
          ${this.formatVND(item.buy)}
          ${this.renderChange(item.buyChange)}
        </td>
        <td>
          ${this.formatVND(item.sell)}
          ${this.renderChange(item.sellChange)}
        </td>
        <td>${this.formatVND(item.spread)}</td>
      `;
      tbody.appendChild(row);
    });
  },

  formatVND(num) {
    return num.toLocaleString('vi-VN');
  },

  renderChange(change) {
    if (change === 0) return '';
    const isDown = change < 0;
    const arrow = isDown ? '↓' : '↑';
    const cls = isDown ? 'price-down' : 'price-up';
    const formatted = this.formatVND(Math.abs(change));
    return `<span class="${cls}"> ${arrow} ${formatted}</span>`;
  },

  updateBanner() {
    const now = new Date();
    const hours = now.getHours();
    const period = hours < 12 ? 'SÁNG' : 'CHIỀU';
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    document.getElementById('banner-text').textContent =
      `GIÁ VÀNG ${period} NAY ${day}/${month}/${year}`;
  }
};
