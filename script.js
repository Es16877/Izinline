// Data Staff
const staffData = [
    {
        name: "EGI SETIAWAN",
        id: "C8410298",
        position: "CS",
        email: "egis19453@gmail.com",
        avatar: "ES"
    },
    {
        name: "SAMSUL MAARIF",
        id: "C7008737",
        position: "CS",
        email: "samsulma874@gmail.com",
        avatar: "SM"
    },
    {
        name: "BUDI SANTOSO",
        id: "C1234567",
        position: "KASIR",
        email: "budisantoso@gmail.com",
        avatar: "BS"
    }
];

// Variabel Global
let currentUser = null;
let isOutside = false;
let exitTime = null;
let staffOutside = {
    CS: [],
    KASIR: [],
    KHEMER: [],
    KAPTEN: []
};

// Inisialisasi historyData dengan properti today
let historyData = {
    today: []
};

// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const loginError = document.getElementById('loginError');
const userName = document.getElementById('userName');
const userPosition = document.getElementById('userPosition');
const userEmail = document.getElementById('userEmail');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const clock = document.getElementById('clock');
const currentDate = document.getElementById('currentDate');
const todayDate = document.getElementById('todayDate');
const exitBtn = document.getElementById('exitBtn');
const returnBtn = document.getElementById('returnBtn');
const staffList = document.getElementById('staffList');
const quotaCount = document.getElementById('quotaCount');
const quotaWarning = document.getElementById('quotaWarning');
const historyBody = document.getElementById('historyBody');

// Initialize App
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Set today's date
    const today = new Date();
    todayDate.textContent = formatDate(today);

    // Load data from localStorage
    loadInitialData();

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    exitBtn.addEventListener('click', handleExit);
    returnBtn.addEventListener('click', handleReturn);

    // Check if already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        setupUserInterface();
    }
}

// Load Initial Data
function loadInitialData() {
    // Load staff outside data
    const savedStaffOutside = localStorage.getItem('staffOutside');
    if (savedStaffOutside) {
        staffOutside = JSON.parse(savedStaffOutside);

        // Clean up any expired exits (more than 15 minutes)
        const now = new Date();
        for (const position in staffOutside) {
            staffOutside[position] = staffOutside[position].filter(staff => {
                const exitTime = new Date(staff.exitTime);
                return (now - exitTime) < 15 * 60 * 1000;
            });
        }

        saveStaffOutside();
    }

    // Load history data
    const savedHistory = localStorage.getItem('historyData');
    if (savedHistory) {
        historyData = JSON.parse(savedHistory);

        // Check if we need to move yesterday's data to history
        const today = new Date().toDateString();
        const lastHistoryDate = localStorage.getItem('lastHistoryDate');

        if (lastHistoryDate !== today) {
            // New day, move yesterday's data to history
            if (historyData.today && historyData.today.length > 0) {
                // Save yesterday's data
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayKey = yesterday.toDateString();

                if (!historyData[yesterdayKey]) {
                    historyData[yesterdayKey] = [];
                }

                historyData[yesterdayKey] = historyData.today.concat(historyData[yesterdayKey] || []);

                // Clear today's data
                historyData.today = [];

                // Save the change
                saveHistoryData();
            }

            localStorage.setItem('lastHistoryDate', today);
        }
    } else {
        // Initialize historyData if not exists
        historyData = {
            today: []
        };
    }
}

// Format Date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Format Time
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Update Clock
function updateClock() {
    const now = new Date();

    // Format time with colon separator
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    const dateString = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    clock.textContent = timeString;
    currentDate.textContent = dateString;

    // Update timer if outside
    if (isOutside) {
        const elapsed = Math.floor((new Date() - exitTime) / 1000);
        const remaining = 15 * 60 - elapsed;

        if (remaining <= 0) {
            // Auto return when time is up
            handleReturn();
        } else {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            returnBtn.innerHTML = `IZIN MASUK <span class="timer">(${minutes}:${seconds.toString().padStart(2, '0')})</span>`;
        }
    }
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();

    // Find user
    const user = staffData.find(staff => staff.email.toLowerCase() === email);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        setupUserInterface();
        loginError.style.display = 'none';
    } else {
        loginError.textContent = 'Email tidak terdaftar. Hanya email yang sudah diizinkan yang bisa login.';
        loginError.style.display = 'block';
    }
}

// Setup User Interface
function setupUserInterface() {
    loginSection.style.display = 'none';
    mainContent.style.display = 'block';

    // Set user info
    userName.textContent = currentUser.name;
    userPosition.textContent = `Posisi: ${currentUser.position}`;
    userEmail.textContent = `Email: ${currentUser.email}`;
    userAvatar.textContent = currentUser.avatar;

    // Update quota info
    updateQuotaInfo();

    // Check if user is already outside
    const position = currentUser.position;
    const isUserOutside = staffOutside[position].some(staff => staff.id === currentUser.id);

    if (isUserOutside) {
        isOutside = true;
        exitTime = new Date(staffOutside[position].find(staff => staff.id === currentUser.id).exitTime);
        exitBtn.disabled = true;
        returnBtn.disabled = false;
    }

    // Load staff outside data
    updateStaffList();
    updateHistoryTable();
}

// Update Quota Info
function updateQuotaInfo() {
    const todayExits = getTodayExitCount();
    quotaCount.textContent = todayExits;

    if (todayExits >= 4) {
        quotaWarning.style.display = 'block';
        exitBtn.disabled = true;
    } else {
        quotaWarning.style.display = 'none';
        exitBtn.disabled = isOutside; // Disable if already outside
    }
}

// Get Today's Exit Count for Current User
function getTodayExitCount() {
    if (!currentUser) return 0;

    const today = new Date().toDateString();
    return (historyData.today || []).filter(entry =>
        entry.id === currentUser.id &&
        new Date(entry.exitTime).toDateString() === today
    ).length;
}

// Handle Exit Permission
function handleExit() {
    // Check daily quota
    const todayExits = getTodayExitCount();
    if (todayExits >= 4) {
        alert('Anda sudah mencapai batas maksimal izin keluar hari ini (4 kali)');
        return;
    }

    // Check position limits
    const position = currentUser.position;
    let canExit = true;
    let reason = '';

    if (position === 'CS' && staffOutside.CS.length >= 3) {
        canExit = false;
        reason = 'Staff CS yang keluar sudah mencapai batas maksimal (3 orang)';
    } else if (position === 'KASIR' && staffOutside.KASIR.length >= 3) {
        canExit = false;
        reason = 'Staff Kasir yang keluar sudah mencapai batas maksimal (3 orang)';
    } else if (position === 'KHEMER' && staffOutside.KHEMER.length >= 1) {
        canExit = false;
        reason = 'Staff KHEMER yang keluar sudah mencapai batas maksimal (1 orang)';
    } else if (position === 'KAPTEN' && staffOutside.KAPTEN.length >= 1) {
        canExit = false;
        reason = 'Staff KAPTEN yang keluar sudah mencapai batas maksimal (1 orang)';
    }

    if (!canExit) {
        alert(reason);
        return;
    }

    // Proceed with exit
    isOutside = true;
    exitTime = new Date();

    // Add to staff outside
    staffOutside[position].push({
        name: currentUser.name,
        id: currentUser.id,
        position: currentUser.position,
        avatar: currentUser.avatar,
        exitTime: exitTime
    });

    // Add to history
    if (!historyData.today) {
        historyData.today = [];
    }
    
    historyData.today.push({
        id: currentUser.id,
        name: currentUser.name,
        position: currentUser.position,
        exitTime: exitTime,
        returnTime: null,
        duration: null,
        status: null
    });

    // Save data
    saveStaffOutside();
    saveHistoryData();

    // Update UI
    exitBtn.disabled = true;
    returnBtn.disabled = false;
    updateQuotaInfo();
    updateStaffList();
    updateHistoryTable();
}

// Handle Return Permission
function handleReturn() {
    const returnTime = new Date();
    const duration = Math.round((returnTime - exitTime) / (60 * 1000));
    const isLate = duration > 15;
    const position = currentUser.position;

    // Update history
    const exitRecord = historyData.today.find(record =>
        record.id === currentUser.id &&
        record.returnTime === null
    );

    if (exitRecord) {
        exitRecord.returnTime = returnTime;
        exitRecord.duration = duration;
        exitRecord.status = isLate ? 'late' : 'on-time';
    }

    // Remove from staff outside
    staffOutside[position] = staffOutside[position].filter(
        staff => staff.id !== currentUser.id
    );

    // Save data
    saveStaffOutside();
    saveHistoryData();

    // Update UI
    isOutside = false;
    exitTime = null;
    exitBtn.disabled = getTodayExitCount() >= 4;
    returnBtn.disabled = true;
    returnBtn.innerHTML = 'IZIN MASUK';

    updateStaffList();
    updateHistoryTable();
    updateQuotaInfo();
}

// Update Staff List
function updateStaffList() {
    staffList.innerHTML = '';

    let hasStaffOutside = false;

    for (const position in staffOutside) {
        staffOutside[position].forEach(staff => {
            hasStaffOutside = true;

            const elapsed = Math.floor((new Date() - new Date(staff.exitTime)) / 1000);
            const remaining = Math.max(0, 15 * 60 - elapsed);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;

            const staffCard = document.createElement('div');
            staffCard.className = 'staff-card';

            // Determine card color based on position
            let cardColor = '#3498db';
            if (position === 'KASIR') cardColor = '#e74c3c';
            else if (position === 'KHEMER') cardColor = '#9b59b6';
            else if (position === 'KAPTEN') cardColor = '#f39c12';

            staffCard.innerHTML = `
                <div class="staff-avatar" style="background-color: ${cardColor}">${staff.avatar}</div>
                <div class="staff-info">
                    <h4>${staff.name}</h4>
                    <p>${staff.position} - ${staff.id}</p>
                    <p class="timer">Keluar ${minutes}:${seconds.toString().padStart(2, '0')} yang lalu</p>
                </div>
            `;

            staffList.appendChild(staffCard);
        });
    }

    if (!hasStaffOutside) {
        staffList.innerHTML = `
            <div class="empty-state">
                <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="No staff outside">
                <p>Tidak ada staff yang sedang keluar</p>
            </div>
        `;
    }
}

// Update History Table
function updateHistoryTable() {
    historyBody.innerHTML = '';

    if (!currentUser) return;

    const today = new Date().toDateString();
    const userHistory = (historyData.today || []).filter(entry =>
        entry.id === currentUser.id &&
        new Date(entry.exitTime).toDateString() === today
    ).sort((a, b) => new Date(b.exitTime) - new Date(a.exitTime));

    if (userHistory.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">Belum ada riwayat izin keluar hari ini</td>
            </tr>
        `;
    } else {
        userHistory.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatTime(new Date(entry.exitTime))}</td>
                <td>${entry.returnTime ? formatTime(new Date(entry.returnTime)) : 'Masih di luar'}</td>
                <td>${entry.duration || '-'} menit</td>
                <td>
                    <span class="status ${entry.status || 'on-time'}">
                        ${!entry.returnTime ? 'Sedang keluar' :
                        entry.status === 'late' ? 'Terlambat' : 'Tepat waktu'}
                    </span>
                </td>
            `;
            historyBody.appendChild(row);
        });
    }
}

// Save Staff Outside Data
function saveStaffOutside() {
    localStorage.setItem('staffOutside', JSON.stringify(staffOutside));
}

// Save History Data
function saveHistoryData() {
    localStorage.setItem('historyData', JSON.stringify(historyData));
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    loginSection.style.display = 'block';
    mainContent.style.display = 'none';
    emailInput.value = '';
    loginError.style.display = 'none';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
