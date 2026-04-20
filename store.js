// Lấy key lưu trữ cho một tháng/năm cụ thể
function storageKey(year, month) {
  return `desert_luxe_${year}_${month}`;
}

// Đọc dữ liệu tháng từ localStorage
function loadMonthData(year, month) {
  const raw = localStorage.getItem(storageKey(year, month));
  if (!raw) return { budget: 0, days: {} };
  try { return JSON.parse(raw); } catch { return { budget: 0, days: {} }; }
}

// Lưu dữ liệu tháng vào localStorage
function saveMonthData(year, month, data) {
  localStorage.setItem(storageKey(year, month), JSON.stringify(data));
}

// Định dạng tiền VNĐ chuẩn
function formatVND(amount) {
  if (!amount && amount !== 0) return '0 ₫';
  return Number(amount).toLocaleString('vi-VN') + ' ₫';
}

// Rút gọn tiền cho ô lịch (VD: 50k, 1.2tr)
function shortVND(amount) {
  if (amount >= 1000000) return (amount/1000000).toFixed(1).replace('.0','') + 'tr';
  if (amount >= 1000)    return Math.round(amount/1000) + 'k';
  return amount + '₫';
}

// Tính tổng chi trong tháng
function calcMonthSpent(data) {
  let total = 0;
  Object.values(data.days || {}).forEach(dayArr => {
    (dayArr || []).forEach(e => { total += (e.amount || 0); });
  });
  return total;
}
