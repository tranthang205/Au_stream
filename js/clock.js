/**
 * clock.js - Đồng hồ realtime
 */

const Clock = {
  init() {
    this.update();
    setInterval(() => this.update(), 1000);
  },

  update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;

    document.getElementById('clock-time').textContent = timeStr;
    document.getElementById('clock-suffix').textContent = `${suffix}\n${seconds}`;
  }
};
