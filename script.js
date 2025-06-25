// Array to store all games for searching
let allGames = [];
let filteredGames = [];
const GAMES_PER_PAGE = 50;
let currentPage = 1;
let isListView = false;



// Utility to get unique values for a field
function getUniqueValues(games, field) {
    return [...new Set(games.map(game => game[field]).filter(Boolean))];
}

// Populate filter dropdowns
function populateFilters(games) {
    const platformFilter = document.getElementById('platform-filter');
    const regionFilter = document.getElementById('region-filter');
    // Populate platform
    const platforms = getUniqueValues(games, 'platform');
    platformFilter.innerHTML = '<option value="">All</option>' +
        platforms.map(p => `<option value="${p}">${p}</option>`).join('');
    // Populate region
    const regions = getUniqueValues(games, 'region');
    regionFilter.innerHTML = '<option value="">All</option>' +
        regions.map(r => `<option value="${r}">${r}</option>`).join('');
}







// Load JSON data from file with retry mechanism
async function loadGames(retryCount = 0, fileName = 'games.json') {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    const fallbackFiles = ['games.json', 'gbaroms.json', 'sgame.json']; // Fallback options
    
    try {
        // Show loading message
        updateLoadingMessage(`Loading games... ${retryCount > 0 ? `(Attempt ${retryCount + 1}/${maxRetries + 1})` : ''}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(fileName, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const games = await response.json();
        
        if (!Array.isArray(games)) {
            throw new Error('Invalid data format: Expected array of games');
        }
        
        const validGames = games.filter(game => 
            game && 
            game.download_link !== null && 
            game.title && 
            game.platform && 
            game.thumbnail
        );
        
        if (validGames.length === 0) {
            throw new Error("No valid games found in the data");
        }
        
        // Success! Hide loading and display games
        hideLoadingMessage();
        allGames = validGames;
        filteredGames = validGames;
        populateFilters(validGames);
        displayGames(validGames);
        
        console.log(`✅ Successfully loaded ${validGames.length} games`);
        
    } catch (error) {
        console.error(`❌ Error loading games (attempt ${retryCount + 1}):`, error);
        
        // Determine error type for better user feedback
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The server may be slow or unreachable.';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'Games data file not found on server.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Server error. Please try again later.';
        }
        
        if (retryCount < maxRetries) {
            // Retry after delay with exponential backoff
            const delayTime = retryDelay * Math.pow(2, retryCount); // Exponential backoff
            updateLoadingMessage(`Loading failed. Retrying in ${delayTime/1000}s... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
                loadGames(retryCount + 1, fileName);
            }, delayTime);
        } else {
            // Try fallback files if we haven't tried them yet
            const currentFileIndex = fallbackFiles.indexOf(fileName);
            const nextFileIndex = currentFileIndex + 1;
            
            if (nextFileIndex < fallbackFiles.length) {
                const nextFile = fallbackFiles[nextFileIndex];
                console.log(`🔄 Trying fallback file: ${nextFile}`);
                updateLoadingMessage(`Trying alternative data source: ${nextFile}...`);
                setTimeout(() => {
                    loadGames(0, nextFile); // Reset retry count for new file
                }, 1000);
            } else {
                // All files exhausted, show final error
                showErrorMessage(errorMessage);
            }
        }
    }
}

// Helper functions for loading states
function updateLoadingMessage(message) {
    const gameList = document.getElementById('game-list');
    if (gameList) {
        gameList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--color-accent); font-size: 1.2em; padding: 40px;">
                <div class="loading-spinner" style="margin-bottom: 20px;">🎮</div>
                ${message}
            </div>
        `;
    }
}

function hideLoadingMessage() {
    // Loading will be replaced by actual games, so no need to explicitly hide
}

function showErrorMessage(errorMessage) {
    const gameList = document.getElementById('game-list');
    if (gameList) {
        gameList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div style="color: #ff4444; font-size: 1.2em; margin-bottom: 20px;">
                    ❌ Error Loading Games
                </div>
                <div style="color: var(--color-text); margin-bottom: 20px; font-size: 0.9em;">
                    ${errorMessage}
                </div>
                <div style="margin-bottom: 20px; font-size: 0.8em; color: var(--color-accent); opacity: 0.8;">
                    💡 Try refreshing the page or check your internet connection
                </div>
                <button onclick="retryLoadGames()" class="retry-btn">
                    🔄 Retry Loading
                </button>
            </div>
        `;
    }
}

// Global retry function
function retryLoadGames() {
    console.log('🔄 User initiated retry...');
    loadGames(0); // Reset retry count
}

function renderPagination(totalGames, currentPage) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalGames / GAMES_PER_PAGE);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    let html = '';
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `<button class="pagination-btn${i === currentPage ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span style="color:#bdb6c5;">...</span>';
        }
    }
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    pagination.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayGames(filteredGames);
    renderPagination(filteredGames.length, currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Display games in a responsive grid
function displayGames(games) {
    const gameList = document.getElementById('game-list');
    gameList.innerHTML = '';
    if (games.length === 0) {
        gameList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f357a8; font-size: 1.2em;">No games found.</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    const end = start + GAMES_PER_PAGE;
    const pageGames = games.slice(start, end);
    pageGames.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.classList.add('game');
        if (isListView) gameItem.classList.add('list-item');
        gameItem.innerHTML = isListView ? `
            <img src="${game.thumbnail}" alt="${game.title}">
            <div class="game-info">
                <h3>${game.title}</h3>
                <p><strong>Platform:</strong> ${game.platform}</p>
                <a href="${game.download_link}" class="download-btn" target="_blank">Download</a>
            </div>
        ` : `
            <img src="${game.thumbnail}" alt="${game.title}">
            <div class="game-info">
                <h3>${game.title}</h3>
                <p><strong>Platform:</strong> ${game.platform}</p>
                <a href="${game.download_link}" class="download-btn" target="_blank">Download</a>
            </div>
        `;
        setTimeout(() => {
            const btn = gameItem.querySelector('.download-btn');
            btn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                const rect = btn.getBoundingClientRect();
                ripple.style.left = (e.clientX - rect.left) + 'px';
                ripple.style.top = (e.clientY - rect.top) + 'px';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        }, 0);
        gameList.appendChild(gameItem);
    });
    renderPagination(games.length, currentPage);
}

// Main filter function
function filterGames() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const platform = document.getElementById('platform-filter').value;
    const region = document.getElementById('region-filter').value;
    filteredGames = allGames.filter(game => {
        const matchesSearch =
            game.title.toLowerCase().includes(searchQuery) ||
            game.platform.toLowerCase().includes(searchQuery);
        const matchesPlatform = !platform || game.platform === platform;
        const matchesRegion = !region || game.region === region;
        return matchesSearch && matchesPlatform && matchesRegion;
    });
    currentPage = 1;
    displayGames(filteredGames);
    renderPagination(filteredGames.length, currentPage);
}

// Search function (delegates to filter)
function searchGames() {
    filterGames();
}

function toggleView() {
    isListView = !isListView;
    const grid = document.getElementById('game-list');
    const btn = document.getElementById('toggle-view-btn');
    const iconGrid = btn.querySelector('.icon-grid');
    const iconList = btn.querySelector('.icon-list');
    if (isListView) {
        grid.classList.add('list-view');
        btn.classList.add('active');
        iconGrid.style.display = 'none';
        iconList.style.display = 'inline';
    } else {
        grid.classList.remove('list-view');
        btn.classList.remove('active');
        iconGrid.style.display = 'inline';
        iconList.style.display = 'none';
    }
    displayGames(filteredGames);
}

// Theme toggle logic
function setTheme(isLight) {
    const body = document.body;
    const btn = document.getElementById('theme-toggle-btn');
    if (isLight) {
        body.classList.add('light-mode');
        btn.querySelector('.theme-icon').textContent = '☀️';
        btn.querySelector('.theme-label').textContent = 'Light';
    } else {
        body.classList.remove('light-mode');
        btn.querySelector('.theme-icon').textContent = '🌙';
        btn.querySelector('.theme-label').textContent = 'Dark';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    const btn = document.getElementById('theme-toggle-btn');
    let isLight = false;
    btn.addEventListener('click', function() {
        isLight = !isLight;
        setTheme(isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        isLight = true;
        setTheme(true);
    }
    // Loading overlay
    const overlay = document.getElementById('loading-overlay');
    let overlayHidden = false;
    function hideOverlay() {
        if (!overlayHidden) {
            overlayHidden = true;
            overlay.classList.add('hide');
            setTimeout(() => overlay.style.display = 'none', 600);
        }
    }
    window.addEventListener('load', function() {
        setTimeout(hideOverlay, 400);
    });
    setTimeout(hideOverlay, 3000); // fallback in case load event is slow
});

// Enhanced initialization with network detection
function initializeApp() {
    // Check if we're online
    if (!navigator.onLine) {
        showErrorMessage('No internet connection. Please check your network and try again.');
        return;
    }
    
    // Load the games data
    loadGames();
}

// Add online/offline event listeners
window.addEventListener('online', function() {
    console.log('🌐 Connection restored');
    if (document.getElementById('game-list').innerHTML.includes('No internet connection')) {
        loadGames();
    }
});

window.addEventListener('offline', function() {
    console.log('📡 Connection lost');
    showErrorMessage('Connection lost. Please check your internet connection.');
});

// Initialize app
initializeApp();
