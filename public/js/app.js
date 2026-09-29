/**
 * Student Registry Frontend Application
 * Handles API interaction, DOM updates, toast notifications, theme toggling, and modal controls.
 */

// --- Application State ---
const state = {
  students: [],
  stats: null,
  filters: {
    search: '',
    department: '',
    year: '',
    sortBy: 'createdAt',
    order: 'desc'
  },
  editingId: null,
  deletingTarget: null,
  isLoading: false
};

// --- API Service Layer ---
const API = {
  async getStudents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.department) params.append('department', filters.department);
    if (filters.year) params.append('year', filters.year);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const res = await fetch(`/api/students?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch students');
    return data;
  },

  async getStudent(id) {
    const res = await fetch(`/api/students/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch student');
    return data;
  },

  async createStudent(payload) {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.details ? data.details.join(', ') : (data.error || 'Failed to create student');
      throw new Error(errMsg);
    }
    return data;
  },

  async updateStudent(id, payload) {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.details ? data.details.join(', ') : (data.error || 'Failed to update student');
      throw new Error(errMsg);
    }
    return data;
  },

  async deleteStudent(id) {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete student');
    return data;
  },

  async getStats() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return data;
  },

  async resetDemo() {
    const res = await fetch('/api/students/reset-demo', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to reset demo data');
    return data;
  },

  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  }
};

// --- Toast Notification Engine ---
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-enter pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start space-x-3 text-xs w-80 relative overflow-hidden backdrop-blur-md ${
    type === 'success'
      ? 'bg-emerald-950/95 border-emerald-800/80 text-emerald-200'
      : type === 'error'
      ? 'bg-rose-950/95 border-rose-800/80 text-rose-200'
      : 'bg-slate-900/95 border-slate-800 text-slate-200 dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-zinc-200'
  }`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  const iconColor = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-indigo-400';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 shrink-0 mt-0.5 ${iconColor}"></i>
    <div class="flex-1">
      <p class="font-medium leading-relaxed">${escapeHtml(message)}</p>
    </div>
    <button class="text-zinc-400 hover:text-white shrink-0 p-0.5 rounded transition" aria-label="Dismiss toast">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
    <div class="absolute bottom-0 left-0 right-0 h-0.5 ${
      type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
    } toast-progress-bar"></div>
  `;

  // Dismiss button
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);
  lucide.createIcons({ root: toast });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      setTimeout(() => toast.remove(), 200);
    }
  }, duration);
}

// --- DOM Element References ---
const elements = {
  tableBody: document.getElementById('studentTableBody'),
  emptyState: document.getElementById('emptyState'),
  tableRecordCount: document.getElementById('tableRecordCount'),
  searchInput: document.getElementById('searchInput'),
  departmentFilter: document.getElementById('departmentFilter'),
  yearFilterGroup: document.getElementById('yearFilterGroup'),
  sortSelect: document.getElementById('sortSelect'),
  refreshBtn: document.getElementById('refreshBtn'),
  resetDemoBtn: document.getElementById('resetDemoBtn'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  emptyAddBtn: document.getElementById('emptyAddBtn'),
  
  // Modal / Form elements
  studentDialog: document.getElementById('studentDialog'),
  studentForm: document.getElementById('studentForm'),
  dialogTitle: document.getElementById('dialogTitle'),
  dialogIcon: document.getElementById('dialogIcon'),
  dialogIconBox: document.getElementById('dialogIconBox'),
  closeDialogBtn: document.getElementById('closeDialogBtn'),
  cancelDialogBtn: document.getElementById('cancelDialogBtn'),
  openCreateBtn: document.getElementById('openCreateBtn'),
  studentId: document.getElementById('studentId'),
  studentName: document.getElementById('studentName'),
  studentRoll: document.getElementById('studentRoll'),
  studentDept: document.getElementById('studentDept'),
  saveStudentBtn: document.getElementById('saveStudentBtn'),
  saveBtnText: document.getElementById('saveBtnText'),
  formErrorBanner: document.getElementById('formErrorBanner'),
  formErrorMessage: document.getElementById('formErrorMessage'),

  // Delete modal elements
  deleteConfirmDialog: document.getElementById('deleteConfirmDialog'),
  deleteTargetName: document.getElementById('deleteTargetName'),
  deleteTargetRoll: document.getElementById('deleteTargetRoll'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

  // Docs modal
  apiDocsDialog: document.getElementById('apiDocsDialog'),
  openDocsBtn: document.getElementById('openDocsBtn'),
  closeDocsBtn: document.getElementById('closeDocsBtn'),

  // Stats elements
  statTotal: document.getElementById('statTotal'),
  statDepartments: document.getElementById('statDepartments'),
  statY1: document.getElementById('statY1'),
  statY2: document.getElementById('statY2'),
  statY3: document.getElementById('statY3'),
  statY4: document.getElementById('statY4'),
  apiStatusText: document.getElementById('apiStatusText'),

  // Theme toggle
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeToggleIconContainer: document.getElementById('themeToggleIconContainer')
};

// --- Helper Functions ---
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

/**
 * Extracts clean uppercase initials for Tamil names with initials (e.g. S. Karthik -> SK, P. Dinesh Kumar -> PD)
 */
function getAvatarInitials(name) {
  if (!name) return '??';
  // Strip punctuation like dots/hyphens from name tokens
  const cleanParts = name
    .trim()
    .split(/\s+/)
    .map(p => p.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  if (cleanParts.length >= 2) {
    return (cleanParts[0][0] + cleanParts[1][0]).toUpperCase();
  } else if (cleanParts.length === 1 && cleanParts[0].length >= 2) {
    return cleanParts[0].slice(0, 2).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getGradientForName(name) {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-fuchsia-600'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getYearBadge(year) {
  switch (Number(year)) {
    case 1:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Year 1 &bull; Freshman</span>`;
    case 2:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Year 2 &bull; Sophomore</span>`;
    case 3:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Year 3 &bull; Junior</span>`;
    case 4:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Year 4 &bull; Senior</span>`;
    default:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">Year ${escapeHtml(year)}</span>`;
  }
}

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

// --- Data Fetching & Rendering ---
async function loadStudentsAndStats() {
  state.isLoading = true;
  renderLoadingState();

  try {
    const [studentsResponse, statsResponse] = await Promise.all([
      API.getStudents(state.filters),
      API.getStats()
    ]);

    state.students = studentsResponse.data || [];
    state.stats = statsResponse.data || null;

    renderStats();
    renderTable();
  } catch (err) {
    showToast(err.message, 'error');
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-xs text-rose-500 dark:text-rose-400">
          Failed to load students: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  } finally {
    state.isLoading = false;
  }
}

function renderLoadingState() {
  elements.tableBody.innerHTML = Array(5).fill(0).map(() => `
    <tr class="animate-pulse">
      <td class="py-3.5 px-5"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-32"></div></td>
      <td class="py-3.5 px-5"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-20"></div></td>
      <td class="py-3.5 px-5"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-36"></div></td>
      <td class="py-3.5 px-5"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-24"></div></td>
      <td class="py-3.5 px-5 hidden md:table-cell"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-20"></div></td>
      <td class="py-3.5 px-5 text-right"><div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-14 ml-auto"></div></td>
    </tr>
  `).join('');
}

function renderStats() {
  if (!state.stats) return;
  const { total, departments, yearCounts } = state.stats;

  elements.statTotal.textContent = total;
  elements.statDepartments.textContent = departments;

  elements.statY1.textContent = yearCounts['1'] || 0;
  elements.statY2.textContent = yearCounts['2'] || 0;
  elements.statY3.textContent = yearCounts['3'] || 0;
  elements.statY4.textContent = yearCounts['4'] || 0;
}

function renderTable() {
  const students = state.students;
  elements.tableRecordCount.textContent = `Showing ${students.length} student record${students.length === 1 ? '' : 's'}`;

  if (students.length === 0) {
    elements.tableBody.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    lucide.createIcons({ root: elements.emptyState });
    return;
  }

  elements.emptyState.classList.add('hidden');

  elements.tableBody.innerHTML = students.map(student => {
    const initials = getAvatarInitials(student.name);
    const gradient = getGradientForName(student.name);
    const yearBadge = getYearBadge(student.year);
    const formattedCreated = formatDate(student.createdAt);

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition group" data-id="${student.id}">
        <!-- Student Identity -->
        <td class="py-3.5 px-5">
          <div class="flex items-center space-x-3">
            <div class="h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-1 ring-black/10 dark:ring-white/10 shrink-0">
              ${initials}
            </div>
            <div>
              <div class="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">${escapeHtml(student.name)}</div>
              <div class="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate max-w-[150px] sm:max-w-[220px]">${student.id}</div>
            </div>
          </div>
        </td>

        <!-- Roll Number -->
        <td class="py-3.5 px-5 font-mono font-medium">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700/60 text-[11px] tracking-wide">
            ${escapeHtml(student.rollNumber)}
          </span>
        </td>

        <!-- Department -->
        <td class="py-3.5 px-5">
          <span class="text-slate-700 dark:text-zinc-300 font-medium">${escapeHtml(student.department)}</span>
        </td>

        <!-- Academic Year -->
        <td class="py-3.5 px-5">
          ${yearBadge}
        </td>

        <!-- Created Date -->
        <td class="py-3.5 px-5 hidden md:table-cell text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          ${formattedCreated}
        </td>

        <!-- Actions -->
        <td class="py-3.5 px-5 text-right">
          <div class="inline-flex items-center space-x-1">
            <button 
              class="edit-btn p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              data-id="${student.id}"
              title="Edit record"
            >
              <i data-lucide="pencil" class="w-3.5 h-3.5 pointer-events-none"></i>
            </button>
            <button 
              class="delete-btn p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
              data-id="${student.id}"
              data-name="${escapeHtml(student.name)}"
              data-roll="${escapeHtml(student.rollNumber)}"
              title="Delete record"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons({ root: elements.tableBody });
  bindTableActionButtons();
}

function bindTableActionButtons() {
  // Edit buttons
  elements.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      openEditModal(id);
    });
  });

  // Delete buttons
  elements.tableBody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { id, name, roll } = e.currentTarget.dataset;
      openDeleteModal(id, name, roll);
    });
  });
}

// --- Modal Handlers ---
function openCreateModal() {
  state.editingId = null;
  elements.studentId.value = '';
  elements.studentForm.reset();
  hideFormError();

  elements.dialogTitle.textContent = 'Add Student Record';
  elements.saveBtnText.textContent = 'Create Student';
  elements.dialogIcon.setAttribute('data-lucide', 'user-plus');
  elements.dialogIconBox.className = 'p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';

  // Default select year 1
  const firstYearRadio = elements.studentForm.querySelector('input[name="studentYear"][value="1"]');
  if (firstYearRadio) firstYearRadio.checked = true;

  lucide.createIcons({ root: elements.dialogIconBox });
  elements.studentDialog.showModal();
  setTimeout(() => elements.studentName.focus(), 50);
}

async function openEditModal(id) {
  try {
    const res = await API.getStudent(id);
    const student = res.data;
    if (!student) return;

    state.editingId = student.id;
    elements.studentId.value = student.id;
    elements.studentName.value = student.name;
    elements.studentRoll.value = student.rollNumber;
    elements.studentDept.value = student.department;

    const yearRadio = elements.studentForm.querySelector(`input[name="studentYear"][value="${student.year}"]`);
    if (yearRadio) yearRadio.checked = true;

    hideFormError();
    elements.dialogTitle.textContent = 'Edit Student Record';
    elements.saveBtnText.textContent = 'Save Changes';
    elements.dialogIcon.setAttribute('data-lucide', 'pencil');
    elements.dialogIconBox.className = 'p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';

    lucide.createIcons({ root: elements.dialogIconBox });
    elements.studentDialog.showModal();
    setTimeout(() => elements.studentName.focus(), 50);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeStudentModal() {
  elements.studentDialog.close();
}

function showFormError(messages) {
  elements.formErrorBanner.classList.remove('hidden');
  const msgList = Array.isArray(messages) ? messages : [messages];
  elements.formErrorMessage.innerHTML = msgList.map(m => `<div>&bull; ${escapeHtml(m)}</div>`).join('');
  lucide.createIcons({ root: elements.formErrorBanner });
}

function hideFormError() {
  elements.formErrorBanner.classList.add('hidden');
  elements.formErrorMessage.innerHTML = '';
}

// --- Form Submission ---
async function handleFormSubmit(e) {
  e.preventDefault();
  hideFormError();

  const name = elements.studentName.value.trim();
  const rollNumber = elements.studentRoll.value.trim();
  const department = elements.studentDept.value;
  const selectedYear = elements.studentForm.querySelector('input[name="studentYear"]:checked');
  const year = selectedYear ? Number(selectedYear.value) : null;

  // Client validation
  const errors = [];
  if (!name || name.length < 2) errors.push('Full name must be at least 2 characters');
  if (!rollNumber) errors.push('Roll number is required');
  if (!department) errors.push('Please select a department');
  if (!year || year < 1 || year > 4) errors.push('Please select a valid academic year (1-4)');

  if (errors.length > 0) {
    showFormError(errors);
    return;
  }

  // Set saving state
  elements.saveStudentBtn.disabled = true;
  elements.saveBtnText.textContent = state.editingId ? 'Saving...' : 'Creating...';

  try {
    const payload = { name, rollNumber, department, year };

    if (state.editingId) {
      await API.updateStudent(state.editingId, payload);
      showToast(`Student ${name} updated successfully!`, 'success');
    } else {
      await API.createStudent(payload);
      showToast(`Student ${name} created successfully!`, 'success');
    }

    closeStudentModal();
    await loadStudentsAndStats();
  } catch (err) {
    showFormError(err.message);
    showToast(err.message, 'error');
  } finally {
    elements.saveStudentBtn.disabled = false;
    elements.saveBtnText.textContent = state.editingId ? 'Save Changes' : 'Create Student';
  }
}

// --- Delete Record Modal Handlers ---
function openDeleteModal(id, name, roll) {
  state.deletingTarget = { id, name, roll };
  elements.deleteTargetName.textContent = name;
  elements.deleteTargetRoll.textContent = roll;
  elements.deleteConfirmDialog.showModal();
}

function closeDeleteModal() {
  state.deletingTarget = null;
  elements.deleteConfirmDialog.close();
}

async function handleConfirmDelete() {
  if (!state.deletingTarget) return;
  const { id, name } = state.deletingTarget;

  elements.confirmDeleteBtn.disabled = true;
  elements.confirmDeleteBtn.textContent = 'Deleting...';

  try {
    await API.deleteStudent(id);
    showToast(`Student ${name} deleted successfully!`, 'success');
    closeDeleteModal();
    await loadStudentsAndStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.confirmDeleteBtn.disabled = false;
    elements.confirmDeleteBtn.textContent = 'Delete Record';
  }
}

// --- Filter & Search Handlers ---
let searchDebounceTimer = null;

function setupFilterEvents() {
  // Search input
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      loadStudentsAndStats();
    }, 250);
  });

  // Department dropdown
  elements.departmentFilter.addEventListener('change', (e) => {
    state.filters.department = e.target.value;
    loadStudentsAndStats();
  });

  // Year pills
  elements.yearFilterGroup.querySelectorAll('.year-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.yearFilterGroup.querySelectorAll('.year-pill').forEach(b => {
        b.className = 'year-pill px-2.5 py-1.5 rounded-md font-medium text-xs transition text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white';
      });
      btn.className = 'year-pill px-2.5 py-1.5 rounded-md font-medium text-xs transition bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm';

      state.filters.year = btn.dataset.year;
      loadStudentsAndStats();
    });
  });

  // Sort dropdown
  elements.sortSelect.addEventListener('change', (e) => {
    const [sortBy, order] = e.target.value.split('-');
    state.filters.sortBy = sortBy;
    state.filters.order = order;
    loadStudentsAndStats();
  });

  // Refresh
  elements.refreshBtn.addEventListener('click', () => {
    loadStudentsAndStats();
    showToast('Student records refreshed', 'info', 1500);
  });

  // Reset Demo
  elements.resetDemoBtn.addEventListener('click', async () => {
    if (confirm('Reset student records to the default Tamil demo dataset?')) {
      try {
        await API.resetDemo();
        showToast('Reset back to default Tamil demo records', 'success');
        await loadStudentsAndStats();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Clear filters
  elements.clearFiltersBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.departmentFilter.value = '';
    state.filters.search = '';
    state.filters.department = '';
    state.filters.year = '';
    
    elements.yearFilterGroup.querySelectorAll('.year-pill').forEach((b, idx) => {
      if (idx === 0) {
        b.className = 'year-pill px-2.5 py-1.5 rounded-md font-medium text-xs transition bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm';
      } else {
        b.className = 'year-pill px-2.5 py-1.5 rounded-md font-medium text-xs transition text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white';
      }
    });

    loadStudentsAndStats();
  });

  elements.emptyAddBtn.addEventListener('click', openCreateModal);

  // Keyboard shortcut '/' to search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== elements.searchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });
}

// --- Theme Management ---
function setupTheme() {
  const saved = localStorage.getItem('sr_theme');
  const isLight = saved === 'light';
  applyTheme(isLight);

  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      const isCurrentlyLight = !document.documentElement.classList.contains('dark');
      applyTheme(!isCurrentlyLight);
    });
  }
}

function applyTheme(light) {
  if (light) {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light-theme');
    localStorage.setItem('sr_theme', 'light');
    if (elements.themeToggleIconContainer) {
      elements.themeToggleIconContainer.innerHTML = `<i data-lucide="sun" class="w-4 h-4 text-amber-500"></i>`;
      lucide.createIcons({ root: elements.themeToggleIconContainer });
    }
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light-theme');
    localStorage.setItem('sr_theme', 'dark');
    if (elements.themeToggleIconContainer) {
      elements.themeToggleIconContainer.innerHTML = `<i data-lucide="moon" class="w-4 h-4 text-zinc-400"></i>`;
      lucide.createIcons({ root: elements.themeToggleIconContainer });
    }
  }
}

// --- Dialog Backdrops & Listeners ---
function setupModals() {
  elements.openCreateBtn.addEventListener('click', openCreateModal);
  elements.closeDialogBtn.addEventListener('click', closeStudentModal);
  elements.cancelDialogBtn.addEventListener('click', closeStudentModal);
  elements.studentForm.addEventListener('submit', handleFormSubmit);

  // Close when clicking outside of dialog container
  [elements.studentDialog, elements.deleteConfirmDialog, elements.apiDocsDialog].forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        dialog.close();
      }
    });
  });

  // Delete modal
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Docs modal
  elements.openDocsBtn.addEventListener('click', () => {
    elements.apiDocsDialog.showModal();
  });
  elements.closeDocsBtn.addEventListener('click', () => {
    elements.apiDocsDialog.close();
  });
}

// --- Periodic Health Monitor ---
async function startHealthMonitor() {
  const check = async () => {
    const isHealthy = await API.checkHealth();
    if (elements.apiStatusText) {
      elements.apiStatusText.textContent = isHealthy ? 'API Online' : 'API Offline';
    }
  };
  check();
  setInterval(check, 30000);
}

// --- Application Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  setupTheme();
  setupModals();
  setupFilterEvents();
  loadStudentsAndStats();
  startHealthMonitor();
});
