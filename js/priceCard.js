/**
 * priceCard.js - Hiển thị thẻ giá vàng thế giới + giá SJC VN
 */

const PriceCard = {
  // Hằng số quy đổi
  TROY_TO_LUONG: 37.5 / 31.1035,
  SJC_PREMIUM: 28, // triệu VND

  init(worldPrice, silverPrice) {
    this.updateWorld(worldPrice);
    this.updateSJC(worldPrice);
  },

  updateWorld(data) {
    document.getElementById('price-value').textContent = this.formatNumber(data.value, 3);

    const changeEl = document.getElementById('price-change');
    const isNegative = data.change < 0;
    changeEl.textContent = `${isNegative ? '' : '+'}${data.changePercent.toFixed(2)}% (${Math.abs(data.change).toFixed(2)})`;
    changeEl.className = `price-change ${isNegative ? 'negative' : 'positive'}`;

    // Range bar
    document.getElementById('range-low').textContent = this.formatNumber(data.dayLow, 0) + '...';
    document.getElementById('range-high').textContent = this.formatNumber(data.dayHigh, 0) + '...';

    const rangePct = ((data.value - data.dayLow) / (data.dayHigh - data.dayLow)) * 100;
    document.getElementById('range-fill').style.width = `${Math.max(5, Math.min(95, rangePct))}%`;

    // Cập nhật giá SJC
    this.updateSJC(data);
  },

  /**
   * Tính và hiển thị giá SJC VND/lượng từ giá thế giới
   * Công thức: giá USD × (37.5/31.1035) × tỷ giá + premium
   */
  updateSJC(worldData) {
    // Lấy giá SJC thật từ SJCData nếu có
    if (typeof SJCData !== 'undefined' && SJCData.current?.sjc) {
      const sjc = SJCData.current.sjc;
      document.getElementById('secondary-value').textContent = sjc.buy.toFixed(3);
    } else {
      // Fallback: tính từ giá thế giới
      const usdVnd = 26200; // tỷ giá ước tính
      const sjcTr = (worldData.value * this.TROY_TO_LUONG * usdVnd / 1000000) + this.SJC_PREMIUM;
      document.getElementById('secondary-value').textContent = sjcTr.toFixed(3);
    }
  },

  formatNumber(num, decimals) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
};
