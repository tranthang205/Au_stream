/**
 * ticker.js - Thanh chạy giá ở dưới cùng
 */

const Ticker = {
  init(items) {
    this.render(items);
  },

  render(items) {
    const container = document.getElementById('ticker-content');
    // Duplicate để tạo hiệu ứng loop liên tục
    const html = this.buildHTML(items);
    container.innerHTML = html + html;
  },

  buildHTML(items) {
    return items.map(item => {
      const isNegative = item.change < 0;
      const changeClass = isNegative ? 'negative' : 'positive';
      const sign = isNegative ? '' : '+';

      let priceStr = '';
      if (item.buy && item.sell) {
        priceStr = `${item.buy.toLocaleString()} / ${item.sell.toLocaleString()}`;
      } else {
        priceStr = item.price.toLocaleString('en-US', { minimumFractionDigits: 2 });
      }

      const changeStr = item.changePercent
        ? `(${sign}${item.changePercent.toFixed(2)}%)`
        : '';

      return `
        <span class="ticker-item">
          <span class="ticker-name">${item.name}</span>
          <span class="ticker-price">${priceStr}</span>
          <span class="ticker-change ${changeClass}">${sign}${item.change} ${changeStr}</span>
        </span>
        <span class="ticker-separator">|</span>
      `;
    }).join('');
  }
};
