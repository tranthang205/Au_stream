/**
 * news.js - Tin tức thời sự
 * Hiện tin mặc định ngay, thay bằng tin thật khi API trả về
 */

const News = {
  API_KEY: '62a50d0bf6960dab10ccb46bccb99b36',
  _cache: null,

  // Tin mặc định hiện ngay (không đợi API)
  _defaultNews: [
    { time: '--:--', title: 'Giá vàng SJC hôm nay biến động mạnh', source: 'VnExpress' },
    { time: '--:--', title: 'Thị trường vàng thế giới giảm sâu', source: 'VietNamNet' },
    { time: '--:--', title: 'Tỷ giá USD/VND cập nhật mới nhất', source: 'CafeF' },
    { time: '--:--', title: 'Nhà đầu tư bán chốt lời vàng', source: 'Dân Trí' },
    { time: '--:--', title: 'Giá vàng nhẫn 9999 giảm theo thế giới', source: 'Người Lao Động' },
  ],

  init() {
    // Hiện tin mặc định ngay lập tức
    this._renderItems(this._defaultNews);

    // Fetch tin thật nền (không chặn)
    this.fetch();

    // Refresh mỗi 10 phút
    setInterval(() => this.fetch(), 600000);
  },

  async fetch() {
    try {
      const url = `https://gnews.io/api/v4/top-headlines?category=business&lang=vi&country=vn&max=10&apikey=${this.API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('GNews error: ' + res.status);
      const data = await res.json();

      if (data.articles && data.articles.length > 0) {
        this._cache = data.articles;
        const items = data.articles.map(a => {
          const t = new Date(a.publishedAt);
          return {
            time: t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0'),
            title: a.title,
            source: a.source.name
          };
        });
        this._renderItems(items);
        console.log('News: loaded', items.length, 'articles');
      }
    } catch (err) {
      console.warn('News fetch failed:', err.message);
    }
  },

  _renderItems(items) {
    const container = document.getElementById('news-content');
    if (!container) return;

    const html = items.map(item => `
      <span class="news-item">
        <span class="news-time">${this._esc(item.time)}</span>
        <span class="news-title">${this._esc(item.title)}</span>
        <span class="news-source">${this._esc(item.source)}</span>
      </span>
      <span class="news-dot">●</span>
    `).join('');

    container.innerHTML = html + html;
  },

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
};
