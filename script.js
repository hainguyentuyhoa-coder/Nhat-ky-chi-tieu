let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let pickerYear   = currentYear;
let selectedDay  = null;
let selectedCat  = null;

const CATEGORIES = [
  { icon: '🧺', name: 'Đi chợ' }, { icon: '🛒', name: 'Siêu thị' },
  { icon: '⛽', name: 'Đổ xăng' }, { icon: '🏥', name: 'Khám bệnh' },
  { icon: '☕', name: 'Cà phê' }, { icon: '💄', name: 'Làm đẹp' },
  { icon: '🍜', name: 'Ăn uống' }, { icon: '🎓', name: 'Học phí' },
  { icon: '🎁', name: 'Mua sắm' }, { icon: '💡', name: 'Điện nước' },
  { icon: '🏠', name: 'Nhà cửa' }, { icon: '📱', name: 'Điện thoại' }
];

const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4', 'Tháng 5','Tháng 6','Tháng 7','Tháng 8',
  'Tháng 9','Tháng 10','Tháng 11','Tháng 12'
];

function updateHero() {
  const data    = loadMonthData(currentYear, currentMonth);
  const budget  = data.budget || 0;
  const spent   = calcMonthSpent(data);
  const remain  = budget - spent;

  document.getElementById('remaining-amount').textContent = formatVND(remain);
  document.getElementById('budget-display').textContent   = formatVND(budget);
  document.getElementById('spent-display').textContent    = formatVND(spent);
  document.getElementById('monthly-total-display').textContent = formatVND(spent);

  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  document.getElementById('budget-progress-bar').style.width = pct + '%';
  document.getElementById('remaining-amount').style.color = remain < 0 ? 'var(--color-danger)' : 'var(--color-primary)';
}

function renderCalendar() {
  const data = loadMonthData(currentYear, currentMonth);
  const today = new Date();
  const grid  = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day empty';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayKey  = String(d);
    const dayData = data.days[dayKey] || [];
    const daySum  = dayData.reduce((s, e) => s + (e.amount || 0), 0);

    const isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);

    const cell = document.createElement('div');
    cell.className = 'cal-day' + (isToday ? ' today' : '') + (daySum > 0 ? ' has-data' : '');
    cell.setAttribute('data-day', d);
    
    // Đã có text hiển thị tiền + class CSS pointer-events:none giúp bấm thoải mái
    cell.innerHTML = `
      <span class="day-num">${d}</span>
      ${daySum > 0 ? `<span class="day-amt">${shortVND(daySum)}</span>` : ''}
    `;
    
    cell.addEventListener('click', () => openDayModal(d));
    grid.appendChild(cell);
  }
}

function updateMonthDisplay() {
  document.getElementById('month-display').textContent = `${MONTH_NAMES[currentMonth]} / ${currentYear}`;
  document.getElementById('footer-month-label').textContent = MONTH_NAMES[currentMonth];
}

function renderAll() {
  updateMonthDisplay();
  updateHero();
  renderCalendar();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  renderAll();
}

function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }
function closeModalOnBg(event, id) { if (event.target === document.getElementById(id)) closeModal(id); }

function openMonthPicker() { pickerYear = currentYear; renderMonthPickerGrid(); openModal('month-picker-modal'); }
function changePickerYear(delta) { pickerYear += delta; renderMonthPickerGrid(); }

function renderMonthPickerGrid() {
  document.getElementById('picker-year-label').textContent = pickerYear;
  const grid = document.getElementById('month-picker-grid');
  grid.innerHTML = '';
  MONTH_NAMES.forEach((name, idx) => {
    const item = document.createElement('div');
    item.className = 'month-item' + (pickerYear === currentYear && idx === currentMonth ? ' active' : '');
    item.textContent = name;
    item.addEventListener('click', () => { currentYear = pickerYear; currentMonth = idx; closeModal('month-picker-modal'); renderAll(); });
    grid.appendChild(item);
  });
}

function openBudgetForm() {
  const data = loadMonthData(currentYear, currentMonth);
  document.getElementById('budget-input').value = data.budget || '';
  openModal('budget-modal');
  setTimeout(() => document.getElementById('budget-input').focus(), 350);
}

function saveBudget() {
  const val = parseFloat(document.getElementById('budget-input').value) || 0;
  const data = loadMonthData(currentYear, currentMonth);
  data.budget = val;
  saveMonthData(currentYear, currentMonth, data);
  closeModal('budget-modal');
  updateHero();
}

function openDayModal(day) {
  selectedDay = day;
  selectedCat = null;
  document.getElementById('day-modal-title').textContent = `Chi Tiêu Ngày ${day}/${currentMonth+1}/${currentYear}`;
  resetExpenseForm();
  renderCategoryGrid();
  renderDayExpenseList();
  openModal('day-modal');
}

function resetExpenseForm() {
  document.getElementById('exp-note').value = '';
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-edit-index').value = '-1';
  document.getElementById('exp-save-label').textContent = 'Thêm Chi Tiêu';
  selectedCat = null;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
}

function cancelExpenseEdit() { resetExpenseForm(); }

function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  CATEGORIES.forEach((cat, idx) => {
    const btn = document.createElement('div');
    btn.className = 'cat-btn' + (selectedCat === idx ? ' selected' : '');
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>`;
    btn.addEventListener('click', () => {
      selectedCat = idx;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const noteEl = document.getElementById('exp-note');
      if (!noteEl.value) noteEl.value = cat.name;
    });
    grid.appendChild(btn);
  });
}

function renderDayExpenseList() {
  const data = loadMonthData(currentYear, currentMonth);
  const dayData = data.days[String(selectedDay)] || [];
  const listEl = document.getElementById('day-expense-list');

  if (dayData.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div>Chưa có chi tiêu nào<br>Hãy thêm khoản mới bên dưới</div></div>`;
    return;
  }

  listEl.innerHTML = '';
  dayData.forEach((exp, idx) => {
    const cat = CATEGORIES.find(c => c.name === exp.category);
    const icon = cat ? cat.icon : '💰';
    const item = document.createElement('div');
    item.className = 'expense-item animate-fadeup';
    item.innerHTML = `
      <span class="exp-icon">${icon}</span>
      <div class="exp-info">
        <div class="exp-name">${exp.note || exp.category || 'Chi tiêu'}</div>
        <div class="exp-cat">${exp.category || ''}</div>
      </div>
      <span class="exp-amount">${formatVND(exp.amount)}</span>
      <div class="exp-actions">
        <button class="btn-icon btn-edit" onclick="editExpense(${idx})" title="Sửa">
          <i data-lucide="pencil" style="width:14px;height:14px;"></i>
        </button>
        <button class="btn-icon btn-delete" onclick="deleteExpense(${idx})" title="Xoá">
          <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `;
    listEl.appendChild(item);
  });
  lucide.createIcons();
}

function saveExpense() {
  const note = document.getElementById('exp-note').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  const editIdx = parseInt(document.getElementById('exp-edit-index').value);

  if (amount <= 0) { alert('Vui lòng nhập số tiền hợp lệ!'); return; }

  const catObj = selectedCat !== null ? CATEGORIES[selectedCat] : null;
  const expense = {
    category: catObj ? catObj.name : (note || 'Khác'),
    note: note || (catObj ? catObj.name : 'Chi tiêu'),
    amount: amount,
    time: new Date().toISOString()
  };

  const data = loadMonthData(currentYear, currentMonth);
  const dayKey = String(selectedDay);
  if (!data.days[dayKey]) data.days[dayKey] = [];

  if (editIdx >= 0) data.days[dayKey][editIdx] = expense;
  else data.days[dayKey].push(expense);

  saveMonthData(currentYear, currentMonth, data);
  resetExpenseForm();
  renderDayExpenseList();
  updateHero();
  renderCalendar();
}

function editExpense(idx) {
  const data = loadMonthData(currentYear, currentMonth);
  const exp = (data.days[String(selectedDay)] || [])[idx];
  if (!exp) return;

  document.getElementById('exp-note').value = exp.note || '';
  document.getElementById('exp-amount').value = exp.amount || '';
  document.getElementById('exp-edit-index').value = idx;
  document.getElementById('exp-save-label').textContent = 'Cập Nhật';

  const catIdx = CATEGORIES.findIndex(c => c.name === exp.category);
  selectedCat = catIdx >= 0 ? catIdx : null;
  document.querySelectorAll('.cat-btn').forEach((b, i) => b.classList.toggle('selected', i === catIdx));
  document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteExpense(idx) {
  if (!confirm('Xoá khoản chi tiêu này?')) return;
  const data = loadMonthData(currentYear, currentMonth);
  const dayKey = String(selectedDay);
  (data.days[dayKey] || []).splice(idx, 1);
  if (data.days[dayKey].length === 0) delete data.days[dayKey];
  saveMonthData(currentYear, currentMonth, data);
  renderDayExpenseList();
  updateHero();
  renderCalendar();
}

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  renderAll();
  setupBottomSheetSwipe();
});

function setupBottomSheetSwipe() {
  const modals = document.querySelectorAll('.modal-overlay');
  
  modals.forEach(modal => {
    const sheet = modal.querySelector('.bottom-sheet');
    if (!sheet) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    sheet.addEventListener('touchstart', e => {
      if (sheet.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = true;
      sheet.style.transition = 'none';
    }, {passive: true});

    sheet.addEventListener('touchmove', e => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0 && sheet.scrollTop <= 0) {
        if (e.cancelable) e.preventDefault();
        sheet.style.transform = `translateY(${deltaY}px)`;
      }
    }, {passive: false});

    sheet.addEventListener('touchend', e => {
      if (!isDragging) return;
      isDragging = false;
      sheet.style.transition = '';
      const deltaY = currentY - startY;
      
      if (deltaY > 100) {
        closeModal(modal.id);
        setTimeout(() => { sheet.style.transform = ''; }, 320);
      } else {
        sheet.style.transform = ''; 
      }
    });
  });
}

function openSettingsModal() {
  openModal('settings-modal');
}

function exportData() {
  const data = JSON.stringify(localStorage);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nhat_ky_chi_tieu_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  closeModal('settings-modal');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm('Dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn muốn khôi phục?')) {
        localStorage.clear();
        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }
        alert('Khôi phục dữ liệu thành công!');
        location.reload(); 
      }
    } catch (error) {
      alert('Tệp dữ liệu không hợp lệ!');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

