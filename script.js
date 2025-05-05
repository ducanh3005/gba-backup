// Array to store all games for searching
let allGames = [];
let filteredGames = [];
const GAMES_PER_PAGE = 50;
let currentPage = 1;
let isListView = false;

// List of hot franchises for category buttons
const hotFranchises = [
    'All', 'Pokemon', 'Mario', 'Zelda', 'Metroid', 'Castlevania', 'Fire Emblem', 'Advance Wars', 'Mega Man', 'Sonic', 'Kirby', 'Dragon Ball', 'Harvest Moon', 'Yu-Gi-Oh', 'Golden Sun', 'Bomberman', 'Contra', 'Street Fighter', 'King of Fighters', 'Tactics Ogre', 'Astro Boy', 'Pac-Man', 'Rayman', 'Star Wars', 'F-Zero', 'Super Monkey Ball', 'Gunstar', 'Ninja Turtles', 'Mortal Kombat', 'Tony Hawk', 'Crash Bandicoot', 'Spyro', 'Sims', 'Simpsons', 'Shrek', 'Spongebob', 'Monster Rancher', 'Medabots', 'Beyblade', 'Bionicle', 'Hamtaro', 'Muppet', 'Muppets', 'Madden', 'NBA', 'FIFA', 'NHL', 'Yu Yu Hakusho', 'Yoshi', 'Earthbound', 'Mother'
];

let currentHotCategory = 'All';
let currentHotGames = [];

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

// Identify hot games: random 12 games each day, consistent for the same day
function getHotGames(games) {
    const HOT_GAMES_COUNT = 12;
    // Use the current date as a seed (YYYY-MM-DD)
    const today = new Date();
    const seed = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    // Simple seeded random generator
    function seededRandom(seedStr) {
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        return function() {
            hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
            hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
            hash ^= hash >>> 16;
            return (hash >>> 0) / 4294967296;
        };
    }
    const rand = seededRandom(seed);
    // Shuffle games array using seeded random
    const shuffled = games.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const hotGames = shuffled.slice(0, HOT_GAMES_COUNT);
    hotGames.forEach(game => game.category = 'gamehot');
    return hotGames;
}

function renderHotCategories() {
    const hotCategoriesDiv = document.getElementById('hot-categories');
    if (!hotCategoriesDiv) return;
    hotCategoriesDiv.innerHTML = '';
    hotFranchises.forEach(franchise => {
        const btn = document.createElement('button');
        btn.className = 'hot-category-btn' + (franchise === currentHotCategory ? ' active' : '');
        btn.textContent = franchise;
        btn.onclick = () => {
            currentHotCategory = franchise;
            renderHotCategories();
            // Filter allGames by category
            let filtered;
            if (franchise === 'All') {
                filtered = allGames;
            } else {
                const keyword = franchise.toLowerCase();
                filtered = allGames.filter(game => game.title && game.title.toLowerCase().includes(keyword));
            }
            filteredGames = filtered;
            currentPage = 1;
            displayGames(filteredGames);
            // Hot games should be random daily from filtered list
            currentHotGames = getHotGames(filtered);
            renderHotGames(currentHotGames);
        };
        hotCategoriesDiv.appendChild(btn);
    });
}

function renderHotGames(hotGames) {
    const hotGamesList = document.getElementById('hot-games');
    if (!hotGamesList) return;
    hotGamesList.innerHTML = '';
    // Filter by currentHotCategory if not 'All'
    let filtered = hotGames;
    if (currentHotCategory !== 'All') {
        const keyword = currentHotCategory.toLowerCase();
        filtered = hotGames.filter(game => game.title && game.title.toLowerCase().includes(keyword));
    }
    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'hot-game-card';
        card.innerHTML = `
            <img src="${game.thumbnail}" alt="${game.title}">
            <div class="hot-game-info">
                <h3>${game.title}</h3>
                <p><strong>Platform:</strong> ${game.platform}</p>
                <a href="${game.download_link}" class="download-btn" target="_blank">Download</a>
            </div>
        `;
        setTimeout(() => {
            const btn = card.querySelector('.download-btn');
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (btn.disabled) return;
                btn.disabled = true;
                const originalText = btn.textContent;
                let count = 5;
                btn.textContent = `Wait ${count}...`;
                const interval = setInterval(() => {
                    count--;
                    if (count > 0) {
                        btn.textContent = `Wait ${count}...`;
                    } else {
                        clearInterval(interval);
                        btn.textContent = originalText;
                        btn.disabled = false;
                        window.open(game.download_link, '_blank');
                    }
                }, 1000);
            });
            btn.addEventListener('click', function(e) {
                // Ripple effect
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                const rect = btn.getBoundingClientRect();
                ripple.style.left = (e.clientX - rect.left) + 'px';
                ripple.style.top = (e.clientY - rect.top) + 'px';
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        }, 0);
        hotGamesList.appendChild(card);
    });
}

// Load JSON data from file
async function loadGames() {
    const response = await fetch('games.json');
    const games = await response.json();
    const validGames = games.filter(game => game.download_link !== null);
    allGames = validGames;
    filteredGames = validGames;
    populateFilters(validGames);
    // Hot games
    currentHotGames = getHotGames(validGames);
    renderHotCategories();
    renderHotGames(currentHotGames);
    displayGames(validGames);
    const hotGamesSection = document.getElementById('hot-games-section');
    if (hotGamesSection) hotGamesSection.style.display = '';
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
    // Show or hide hot games section based on page
    const hotGamesSection = document.getElementById('hot-games-section');
    if (hotGamesSection) {
        if (currentPage === 1) {
            hotGamesSection.style.display = '';
        } else {
            hotGamesSection.style.display = 'none';
        }
    }
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
    function hideOverlay() {
        if (!overlay.classList.contains('hide')) {
            overlay.classList.add('hide');
            setTimeout(() => overlay.style.display = 'none', 600);
        }
    }
    window.addEventListener('load', function() {
        setTimeout(hideOverlay, 400);
    });
    setTimeout(hideOverlay, 3000); // fallback in case load event is slow
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(hideOverlay, 800);
    });
});

// Load the games data
loadGames();
