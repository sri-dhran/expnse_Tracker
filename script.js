/**
 * Expenxe - Premium Expense Tracker
 * Core Logic & State Management
 */

// App State
let state = {
    transactions: JSON.parse(localStorage.getItem('transactions')) || [],
    settings: JSON.parse(localStorage.getItem('settings')) || {
        budget: 15000,
        theme: 'light'
    },
    currentView: 'dashboard',
    charts: {
        pie: null,
        line: null
    }
};

// Mock Data if empty
if (state.transactions.length === 0) {
    state.transactions = [
        { id: '1', amount: 50000, category: 'Income', date: '2026-03-01', type: 'income', description: 'Monthly Salary' },
        { id: '2', amount: 1500, category: 'Food', date: '2026-03-05', type: 'expense', description: 'Dinner at Italian Place' },
        { id: '3', amount: 4500, category: 'Shopping', date: '2026-03-10', type: 'expense', description: 'New Sneakers' },
        { id: '4', amount: 800, category: 'Transport', date: '2026-03-12', type: 'expense', description: 'Uber Ride' },
        { id: '5', amount: 2000, category: 'Entertainment', date: '2026-03-15', type: 'expense', description: 'Movie Night & Popcorn' }
    ];
    localStorage.setItem('transactions', JSON.stringify(state.transactions));
}

// DOM Elements
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    viewTitle: document.getElementById('view-title'),
    addBtn: document.getElementById('add-transaction-btn'),
    modal: document.getElementById('transaction-modal'),
    closeModal: document.querySelector('.close-modal'),
    transactionForm: document.getElementById('transaction-form'),
    dashboardView: document.getElementById('dashboard-view'),
    transactionsView: document.getElementById('transactions-view'),
    settingsView: document.getElementById('settings-view')
};

// --- Initialization ---
function init() {
    applyTheme();
    renderCurrentView();
    setupEventListeners();
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
    saveSettings();
    applyTheme();
}

// --- Persistence ---
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(state.transactions));
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(state.settings));
}

// --- Navigation & Routing ---
function switchView(viewName) {
    state.currentView = viewName;
    
    // Update Sidebar
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update Content
    elements.viewSections.forEach(section => {
        section.classList.toggle('active', section.id === `${viewName}-view`);
    });

    // Update Header
    elements.viewTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    
    renderCurrentView();
}

// --- View Rendering ---
function renderCurrentView() {
    if (state.currentView === 'dashboard') {
        renderDashboard();
    } else if (state.currentView === 'transactions') {
        renderTransactions();
    } else if (state.currentView === 'settings') {
        renderSettings();
    }
}

function renderDashboard() {
    const { totalIncome, totalExpenses, balance } = calculateTotals();
    const recentTransactions = state.transactions.slice(-5).reverse();
    const highestCategory = getHighestExpenseCategory();
    const budgetPercent = Math.min((totalExpenses / state.settings.budget) * 100, 100);
    const budgetStatusClass = budgetPercent > 90 ? 'danger' : budgetPercent > 70 ? 'warning' : '';

    elements.dashboardView.innerHTML = `
        <div class="dashboard-grid">
            <div class="stats-cards">
                <div class="card glass stat-card">
                    <div class="stat-icon income"><i class="fas fa-arrow-up"></i></div>
                    <div class="stat-info">
                        <p class="stat-label">Total Income</p>
                        <h3 class="stat-value">${formatCurrency(totalIncome)}</h3>
                    </div>
                </div>
                <div class="card glass stat-card">
                    <div class="stat-icon expense"><i class="fas fa-arrow-down"></i></div>
                    <div class="stat-info">
                        <p class="stat-label">Total Expenses</p>
                        <h3 class="stat-value">${formatCurrency(totalExpenses)}</h3>
                    </div>
                </div>
                <div class="card glass stat-card highlight">
                    <div class="stat-icon balance"><i class="fas fa-wallet"></i></div>
                    <div class="stat-info">
                        <p class="stat-label">Current Balance</p>
                        <h3 class="stat-value">${formatCurrency(balance)}</h3>
                    </div>
                </div>
            </div>

            <div class="card glass budget-status-card">
                <div class="budget-header">
                    <h3>Monthly Budget Status</h3>
                    <span class="budget-meta">${formatCurrency(totalExpenses)} of ${formatCurrency(state.settings.budget)} Spent</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar ${budgetStatusClass}" style="width: ${budgetPercent}%"></div>
                </div>
                <p class="budget-meta">${(100 - budgetPercent).toFixed(1)}% remaining this month</p>
            </div>

            <div class="charts-grid">
                <div class="card glass chart-card">
                    <h3>Expenses by Category</h3>
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
                <div class="card glass chart-card">
                    <h3>Expense Trend</h3>
                    <div class="chart-container">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="dashboard-main-grid">
                <div class="card glass recent-transactions-card">
                    <div class="card-header">
                        <h3>Recent Transactions</h3>
                        <button class="btn-text" onclick="switchView('transactions')">View All</button>
                    </div>
                    <div class="transaction-list">
                        ${recentTransactions.length > 0 ? recentTransactions.map(t => `
                            <div class="transaction-item">
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
                        `).join('') : '<p class="empty-state">No recent transactions</p>'}
                    </div>
                </div>

                <div class="card glass category-analysis-card">
                    <h3>Top Spending</h3>
                    <div class="analysis-content">
                        ${highestCategory ? `
                            <div class="highest-category">
                                <div class="h-icon category-${highestCategory.name.toLowerCase()}">
                                    <i class="${getCategoryIcon(highestCategory.name)}"></i>
                                </div>
                                <h4>${highestCategory.name}</h4>
                                <p>${formatCurrency(highestCategory.amount)} spent</p>
                            </div>
                        ` : '<p class="empty-state">No expenses found</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize charts after a short delay to ensure canvas is in DOM
    setTimeout(initCharts, 0);
}

function renderTransactions() {
    elements.transactionsView.innerHTML = `
        <div class="card glass transactions-table-card">
            <div class="table-controls">
                <div class="filter-group">
                    <select id="filter-category" onchange="handleFilterSort()">
                        <option value="all">All Categories</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Health">Health</option>
                        <option value="Income">Income</option>
                        <option value="Other">Other</option>
                    </select>
                    <select id="sort-order" onchange="handleFilterSort()">
                        <option value="latest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Amount</option>
                        <option value="lowest">Lowest Amount</option>
                    </select>
                </div>
                <div class="filter-group">
                    <div class="date-range">
                        <label>From:</label>
                        <input type="date" id="filter-date-from" onchange="handleFilterSort()">
                    </div>
                    <div class="date-range">
                        <label>To:</label>
                        <input type="date" id="filter-date-to" onchange="handleFilterSort()">
                    </div>
                </div>
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="transaction-search" placeholder="Search transactions..." oninput="handleFilterSort()">
                </div>
            </div>
            <div class="table-responsive">
                <table class="transactions-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="transactions-body">
                        <!-- Rows will be injected by handleFilterSort -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    handleFilterSort();
}

function renderSettings() {
    elements.settingsView.innerHTML = `
        <div class="card glass settings-card">
            <div class="settings-group">
                <h3>Monthly Budget</h3>
                <p class="settings-desc">Set your total monthly spending limit (in ₹) to receive alerts.</p>
                <div class="budget-input-group">
                    <span>₹</span>
                    <input type="number" id="monthly-budget" value="${state.settings.budget}" step="500">
                    <button class="btn btn-primary" onclick="updateBudget()">Update</button>
                </div>
            </div>

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
                <p class="settings-desc">Permanently delete all transaction data and reset settings.</p>
                <button class="btn btn-danger" onclick="clearAllData()">
                    <i class="fas fa-trash-alt"></i>
                    <span>Clear All Data</span>
                </button>
            </div>
        </div>
    `;
}

// --- Event Handlers & Logic ---
function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Modal
    elements.addBtn.addEventListener('click', () => {
        elements.transactionForm.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('modal-title').textContent = 'Add Transaction';
        elements.modal.classList.add('active');
    });

    elements.closeModal.addEventListener('click', () => {
        elements.modal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.modal) elements.modal.classList.remove('active');
    });

    // Form Submission
    elements.transactionForm.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;

    if (id) {
        // Edit existing
        const index = state.transactions.findIndex(t => t.id === id);
        state.transactions[index] = { id, amount, category, date, type, description };
    } else {
        // Create new
        const newTransaction = {
            id: Date.now().toString(),
            amount,
            category,
            date,
            type,
            description
        };
        state.transactions.push(newTransaction);
        checkBudgetAlert(newTransaction);
    }

    saveTransactions();
    elements.modal.classList.remove('active');
    renderCurrentView();
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveTransactions();
        renderCurrentView();
    }
}

function editTransaction(id) {
    const t = state.transactions.find(t => t.id === id);
    document.getElementById('edit-id').value = t.id;
    document.getElementById('amount').value = t.amount;
    document.getElementById('category').value = t.category;
    document.getElementById('date').value = t.date;
    document.getElementById('type').value = t.type;
    document.getElementById('description').value = t.description;
    
    document.getElementById('modal-title').textContent = 'Edit Transaction';
    elements.modal.classList.add('active');
}

function handleFilterSort() {
    const categoryFilter = document.getElementById('filter-category').value;
    const sortOrder = document.getElementById('sort-order').value;
    const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    let filtered = [...state.transactions];

    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchTerm) || 
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    if (dateFrom) {
        filtered = filtered.filter(t => t.date >= dateFrom);
    }

    if (dateTo) {
        filtered = filtered.filter(t => t.date <= dateTo);
    }

    filtered.sort((a, b) => {
        if (sortOrder === 'latest') return new Date(b.date) - new Date(a.date);
        if (sortOrder === 'oldest') return new Date(a.date) - new Date(b.date);
        if (sortOrder === 'highest') return b.amount - a.amount;
        if (sortOrder === 'lowest') return a.amount - b.amount;
        return 0;
    });

    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td><span class="tag tag-${t.category.toLowerCase()}">${t.category}</span></td>
            <td class="t-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
            <td>
                <div class="action-btns">
                    <button onclick="editTransaction('${t.id}')" class="btn-icon edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTransaction('${t.id}')" class="btn-icon delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// --- Helpers & Calculations ---
function calculateTotals() {
    let totalIncome = 0;
    let totalExpenses = 0;

    state.transactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpenses += t.amount;
    });

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}

function getHighestExpenseCategory() {
    const expenses = state.transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return null;

    const categories = {};
    expenses.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    let maxAmount = 0;
    let maxName = '';

    for (const [name, amount] of Object.entries(categories)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            maxName = name;
        }
    }

    return { name: maxName, amount: maxAmount };
}

function getCategoryIcon(category) {
    const icons = {
        'Food': 'fas fa-utensils',
        'Transport': 'fas fa-car',
        'Shopping': 'fas fa-shopping-bag',
        'Entertainment': 'fas fa-film',
        'Health': 'fas fa-heartbeat',
        'Income': 'fas fa-money-bill-wave',
        'Other': 'fas fa-box'
    };
    return icons[category] || 'fas fa-dollar-sign';
}

function formatDate(dateStr) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function initCharts() {
    const pieCtx = document.getElementById('categoryChart')?.getContext('2d');
    const lineCtx = document.getElementById('trendChart')?.getContext('2d');

    if (!pieCtx || !lineCtx) return;

    // Prepare data for Pie Chart
    const expenses = state.transactions.filter(t => t.type === 'expense');
    const categories = {};
    expenses.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const pieLabels = Object.keys(categories);
    const pieData = Object.values(categories);

    // Prepare data for Line Chart (Trend - last 7 days with activity)
    const dailyExpenses = {};
    expenses.forEach(t => {
        const date = t.date;
        dailyExpenses[date] = (dailyExpenses[date] || 0) + t.amount;
    });

    const sortedDates = Object.keys(dailyExpenses).sort();
    const lineLabels = sortedDates.slice(-7).map(d => formatDate(d));
    const lineData = sortedDates.slice(-7).map(d => dailyExpenses[d]);

    // Pie Chart
    state.charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: [
                    '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#64748b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } }
            }
        }
    });

    // Line Chart
    state.charts.line = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Expenses',
                data: lineData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false },
                x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } }
            }
        }
    });
}

function updateBudget() {
    const budget = parseFloat(document.getElementById('monthly-budget').value);
    state.settings.budget = budget;
    saveSettings();
    alert('Monthly budget updated!');
    renderCurrentView();
}

function checkBudgetAlert(newTransaction) {
    if (newTransaction.type === 'expense' && state.settings.budget > 0) {
        const { totalExpenses } = calculateTotals();
        if (totalExpenses > state.settings.budget) {
            alert(`⚠️ Budget Alert! You have exceeded your monthly budget of ${formatCurrency(state.settings.budget)}.`);
        }
    }
}

function clearAllData() {
    if (confirm('Are you serious? This will delete all your transactions and reset settings.')) {
        state.transactions = [];
        state.settings.budget = 0;
        saveTransactions();
        saveSettings();
        renderCurrentView();
    }
}

// Start the app
init();
