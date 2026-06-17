/**
 * Expenxe - Premium Expense Tracker
 * Core Logic & State Management
 */

// Storage Adapter to make it future-ready
const StorageService = {
    getTransactions: () => JSON.parse(localStorage.getItem('transactions')) || [],
    saveTransactions: (txs) => localStorage.setItem('transactions', JSON.stringify(txs)),
    getSettings: () => JSON.parse(localStorage.getItem('settings')) || { budget: 15000, theme: 'light' },
    saveSettings: (settings) => localStorage.setItem('settings', JSON.stringify(settings)),
    clearAll: () => localStorage.clear()
};

// App State
let state = {
    transactions: StorageService.getTransactions(),
    settings: StorageService.getSettings(),
    currentView: 'dashboard',
    monthlyData: {} // Cache for monthly totals
};

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-IN', options);
};
const getCategoryIcon = (category) => {
    const icons = {
        'Food': 'fas fa-utensils',
        'Transport': 'fas fa-car',
        'Shopping': 'fas fa-shopping-bag',
        'Entertainment': 'fas fa-film',
        'Fun': 'fas fa-film',
        'Health': 'fas fa-heartbeat',
        'Income': 'fas fa-money-bill-wave',
        'Other': 'fas fa-box'
    };
    return icons[category] || 'fas fa-circle';
};
const getMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const formatMonthKey = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const d = new Date(year, parseInt(month) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

// --- Monthly Data Logic ---
function calculateMonthlyData() {
    state.monthlyData = {};
    state.transactions.forEach(t => {
        const mk = getMonthKey(t.date);
        if (!state.monthlyData[mk]) {
            state.monthlyData[mk] = { income: 0, expense: 0, transactions: [] };
        }
        if (t.type === 'income') state.monthlyData[mk].income += t.amount;
        if (t.type === 'expense') state.monthlyData[mk].expense += t.amount;
        state.monthlyData[mk].transactions.push(t);
    });
    // Sort transactions within each month
    Object.keys(state.monthlyData).forEach(mk => {
        state.monthlyData[mk].transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });
}

function getCurrentMonthKey() {
    return getMonthKey(new Date().toISOString());
}

// Mock Data if empty
if (state.transactions.length === 0) {
    const cmk = getCurrentMonthKey();
    const pmk = getMonthKey(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());
    state.transactions = [
        { id: '1', amount: 50000, category: 'Income', date: `${cmk}-01`, type: 'income', description: 'Monthly Salary' },
        { id: '2', amount: 1500, category: 'Food', date: `${cmk}-05`, type: 'expense', description: 'Dinner at Italian Place' },
        { id: '3', amount: 4500, category: 'Shopping', date: `${cmk}-10`, type: 'expense', description: 'New Sneakers' },
        { id: '4', amount: 800, category: 'Transport', date: `${cmk}-12`, type: 'expense', description: 'Uber Ride' },
        { id: '5', amount: 2000, category: 'Entertainment', date: `${cmk}-15`, type: 'expense', description: 'Movie Night & Popcorn' },
        { id: '6', amount: 12000, category: 'Shopping', date: `${pmk}-10`, type: 'expense', description: 'Past Month Shopping' }
    ];
    StorageService.saveTransactions(state.transactions);
}

// --- DOM Elements ---
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    viewTitle: document.getElementById('view-title'),
    addBtnDesktop: document.getElementById('add-transaction-btn-desktop'),
    fabAdd: document.getElementById('fab-add'),
    transactionForm: document.getElementById('transaction-form'),
    dashboardView: document.getElementById('dashboard-view'),
    transactionsView: document.getElementById('transactions-view'),
    historyView: document.getElementById('history-view'),
    settingsView: document.getElementById('settings-view'),
    categoryGridItems: document.querySelectorAll('.cat-grid-item')
};

// --- Bottom Sheet Logic ---
const sheetOverlay = document.getElementById('sheet-overlay');
const bottomSheet = document.getElementById('bottom-sheet');
const sheetDragHandle = document.querySelector('.sheet-drag-handle');
const sheetViews = document.querySelectorAll('.sheet-view');
const closeSheetBtn = document.querySelector('.close-sheet');

let startY = 0;
let currentY = 0;
let isDragging = false;
let sheetHeight = 0;

function openSheet(viewId) {
    sheetViews.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    sheetOverlay.classList.add('active');
    bottomSheet.classList.add('active');
    bottomSheet.style.transform = '';
}

function closeSheet() {
    sheetOverlay.classList.remove('active');
    bottomSheet.classList.remove('active');
    bottomSheet.style.transform = '';
}

function handleTouchStart(e) {
    startY = e.touches[0].clientY;
    isDragging = true;
    bottomSheet.classList.add('dragging');
    sheetHeight = bottomSheet.getBoundingClientRect().height;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
        bottomSheet.style.transform = `translateY(${deltaY}px)`;
    } else {
        bottomSheet.style.transform = `translateY(${deltaY * 0.1}px)`;
    }
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    bottomSheet.classList.remove('dragging');
    if (!currentY) {
        bottomSheet.style.transform = '';
        return;
    }
    const deltaY = currentY - startY;
    if (deltaY > sheetHeight * 0.2 || deltaY > 100) {
        closeSheet();
    } else {
        bottomSheet.style.transform = '';
    }
    currentY = 0;
}

sheetDragHandle.addEventListener('touchstart', handleTouchStart);
sheetDragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
sheetDragHandle.addEventListener('touchend', handleTouchEnd);
sheetOverlay.addEventListener('click', closeSheet);
if(closeSheetBtn) closeSheetBtn.addEventListener('click', closeSheet);

// --- Initialization ---
function init() {
    applyTheme();
    calculateMonthlyData();
    renderCurrentView();
    setupEventListeners();
    
    // PWA Support
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
}

// --- Theme Management ---
function applyTheme() {
    if (state.settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}

function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    StorageService.saveSettings(state.settings);
    applyTheme();
}

// --- Navigation & Routing ---
function switchView(viewName) {
    state.currentView = viewName;
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
    elements.viewSections.forEach(section => {
        section.classList.toggle('active', section.id === `${viewName}-view`);
    });
    elements.viewTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    renderCurrentView();
}

function renderCurrentView() {
    calculateMonthlyData();
    if (state.currentView === 'dashboard') renderDashboard();
    else if (state.currentView === 'transactions') renderTransactions();
    else if (state.currentView === 'history') renderHistory();
    else if (state.currentView === 'settings') renderSettings();
}

// --- View Rendering ---
function renderDashboard() {
    const cmk = getCurrentMonthKey();
    const cmData = state.monthlyData[cmk] || { income: 0, expense: 0, transactions: [] };
    
    // Calculate total balance across all time
    let totalBalance = 0;
    state.transactions.forEach(t => {
        totalBalance += t.type === 'income' ? t.amount : -t.amount;
    });
    
    const cmSavings = cmData.income - cmData.expense;
    const recentTransactions = state.transactions.slice(-5).reverse();

    elements.dashboardView.innerHTML = `
        <div class="dashboard-grid">
            <div class="card glass stat-card highlight" style="flex-direction: column; align-items: flex-start; padding: 2rem;">
                <p class="stat-label" style="font-size: 1rem;">Total Balance</p>
                <h3 class="stat-value" style="font-size: 2.5rem; margin-top: 0.5rem;">${formatCurrency(totalBalance)}</h3>
            </div>
            
            <div class="stats-cards" style="grid-template-columns: 1fr 1fr;">
                <div class="card glass stat-card" style="padding: 1.5rem;">
                    <div class="stat-icon income"><i class="fas fa-arrow-up"></i></div>
                    <div class="stat-info">
                        <p class="stat-label">This Month Income</p>
                        <h3 class="stat-value" style="font-size: 1.25rem;">${formatCurrency(cmData.income)}</h3>
                    </div>
                </div>
                <div class="card glass stat-card" style="padding: 1.5rem;">
                    <div class="stat-icon expense"><i class="fas fa-arrow-down"></i></div>
                    <div class="stat-info">
                        <p class="stat-label">This Month Expense</p>
                        <h3 class="stat-value" style="font-size: 1.25rem;">${formatCurrency(cmData.expense)}</h3>
                    </div>
                </div>
            </div>

            <div class="card glass stat-card" style="padding: 1.5rem;">
                <div class="stat-icon balance"><i class="fas fa-piggy-bank"></i></div>
                <div class="stat-info">
                    <p class="stat-label">This Month Savings</p>
                    <h3 class="stat-value" style="font-size: 1.25rem; color: ${cmSavings >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(cmSavings)}</h3>
                </div>
            </div>

            <div class="card glass recent-transactions-card">
                <div class="card-header">
                    <h3>Recent Transactions</h3>
                    <button class="btn-text" onclick="switchView('transactions')">View All</button>
                </div>
                <div class="transaction-list">
                    ${recentTransactions.length > 0 ? recentTransactions.map(t => renderTransactionItem(t)).join('') : '<p class="empty-state">No recent transactions</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderTransactionItem(t) {
    return `
        <div class="transaction-item" onclick="editTransaction('${t.id}')">
            <div class="t-icon category-${t.category.toLowerCase()}">
                <i class="${getCategoryIcon(t.category)}"></i>
            </div>
            <div class="t-details">
                <p class="t-desc">${t.description}</p>
                <p class="t-meta">${t.category} • ${formatDate(t.date)}</p>
            </div>
            <div class="t-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </div>
        </div>
    `;
}

function renderTransactions() {
    elements.transactionsView.innerHTML = `
        <div class="card glass transactions-table-card">
            <div class="table-controls">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="transaction-search" placeholder="Search transactions..." oninput="handleSearch()">
                </div>
            </div>
            <div class="transaction-list" id="all-transactions-list" style="margin-top: 1rem;">
                ${state.transactions.length > 0 ? [...state.transactions].reverse().map(t => renderTransactionItem(t)).join('') : '<p class="empty-state">No transactions</p>'}
            </div>
        </div>
    `;
}

function handleSearch() {
    const query = document.getElementById('transaction-search').value.toLowerCase();
    const filtered = state.transactions.filter(t => 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query)
    );
    document.getElementById('all-transactions-list').innerHTML = filtered.length > 0 
        ? filtered.reverse().map(t => renderTransactionItem(t)).join('') 
        : '<p class="empty-state">No matching transactions</p>';
}

function renderHistory() {
    const months = Object.keys(state.monthlyData).sort().reverse();
    
    elements.historyView.innerHTML = `
        <div class="dashboard-grid analytics-grid">
            ${months.length > 0 ? months.map(mk => {
                const data = state.monthlyData[mk];
                return `
                    <div class="month-card" onclick="viewMonthDetails('${mk}')">
                        <div class="month-info">
                            <h3 class="month-name">${formatMonthKey(mk)}</h3>
                            <p class="t-meta">${data.transactions.length} transactions</p>
                        </div>
                        <div class="month-total">
                            ${formatCurrency(data.expense)}
                        </div>
                    </div>
                `;
            }).join('') : '<p class="empty-state">No history available</p>'}
        </div>
    `;
}

// Global function to attach to onclick
window.viewMonthDetails = function(mk) {
    const data = state.monthlyData[mk];
    if(!data) return;
    
    // Quick hack: Render transactions view filtered by this month
    elements.historyView.innerHTML = `
        <div class="card glass">
            <div class="card-header" style="margin-bottom: 1rem;">
                <h3>${formatMonthKey(mk)}</h3>
                <button class="btn-text" onclick="renderHistory()"><i class="fas fa-arrow-left"></i> Back</button>
            </div>
            <div class="stats-cards" style="grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;">
                <div class="card stat-card" style="padding: 1rem;">
                    <p class="stat-label">Income</p>
                    <h3 class="stat-value" style="font-size: 1.1rem; color: var(--success)">${formatCurrency(data.income)}</h3>
                </div>
                <div class="card stat-card" style="padding: 1rem;">
                    <p class="stat-label">Expense</p>
                    <h3 class="stat-value" style="font-size: 1.1rem; color: var(--danger)">${formatCurrency(data.expense)}</h3>
                </div>
            </div>
            <div class="transaction-list">
                ${data.transactions.map(t => renderTransactionItem(t)).join('')}
            </div>
        </div>
    `;
};

function renderSettings() {
    elements.settingsView.innerHTML = `
        <div class="card glass settings-card">
            <div class="settings-group">
                <h3>Theme Settings</h3>
                <p class="settings-desc">Choose between light and dark visual themes.</p>
                <button class="btn btn-secondary" onclick="toggleTheme()">
                    <i class="fas ${state.settings.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                    <span>Switch to ${state.settings.theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                </button>
            </div>

            <div class="settings-group danger-zone">
                <h3>Danger Zone</h3>
                <p class="settings-desc">Permanently delete all transaction data.</p>
                <button class="btn btn-danger" onclick="clearAllData()">
                    <i class="fas fa-trash-alt"></i>
                    <span>Clear All Data</span>
                </button>
            </div>
        </div>
    `;
}

window.clearAllData = function() {
    if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
        StorageService.clearAll();
        location.reload();
    }
};

// --- Form & Events ---
function setupEventListeners() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    const triggerAddSheet = () => {
        elements.transactionForm.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('category').value = '';
        elements.categoryGridItems.forEach(i => i.classList.remove('selected'));
        openSheet('sheet-transaction-form');
    };
    
    if (elements.fabAdd) elements.fabAdd.addEventListener('click', triggerAddSheet);
    if (elements.addBtnDesktop) elements.addBtnDesktop.addEventListener('click', triggerAddSheet);

    // Category Grid Selection
    elements.categoryGridItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.categoryGridItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            document.getElementById('category').value = item.dataset.value;
            
            // Auto-set type based on category
            if(item.dataset.value === 'Income') {
                document.getElementById('type').value = 'income';
            } else {
                document.getElementById('type').value = 'expense';
            }
        });
    });

    // Form Submission
    elements.transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const type = document.getElementById('type').value;
        const description = document.getElementById('description').value;

        if (!category) {
            alert('Please select a category.');
            return;
        }

        const transaction = {
            id: id || generateId(),
            amount,
            category,
            date,
            type,
            description
        };

        if (id) {
            const index = state.transactions.findIndex(t => t.id === id);
            if (index !== -1) state.transactions[index] = transaction;
        } else {
            state.transactions.push(transaction);
        }

        StorageService.saveTransactions(state.transactions);
        closeSheet();
        renderCurrentView();
    });
}

window.editTransaction = function(id) {
    const t = state.transactions.find(tx => tx.id === id);
    if (!t) return;

    document.getElementById('edit-id').value = t.id;
    document.getElementById('amount').value = t.amount;
    document.getElementById('date').value = t.date;
    document.getElementById('type').value = t.type;
    document.getElementById('description').value = t.description;
    document.getElementById('category').value = t.category;

    elements.categoryGridItems.forEach(i => {
        i.classList.remove('selected');
        if (i.dataset.value === t.category) i.classList.add('selected');
    });

    openSheet('sheet-transaction-form');
};

// Start the app
init();
