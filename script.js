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







// Load JSON data from file
async function loadGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
        }
        const games = await response.json();
        const validGames = games.filter(game => game.download_link !== null);
        
        if (validGames.length === 0) {
            console.error("No valid games found in the data");
            return;
        }
        
        allGames = validGames;
        filteredGames = validGames;
        populateFilters(validGames);
        
        displayGames(validGames);
    } catch (error) {
        console.error("Error loading games:", error);
        document.getElementById('game-list').innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #f357a8; font-size: 1.2em;">Error loading games. Please try again later.</div>';
    }
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

// Load the games data
loadGames();
