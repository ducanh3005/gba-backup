// Array to store all games for searching
let allGames = [];

// Load JSON data from file
async function loadGames() {
    const response = await fetch('games.json');
    const games = await response.json();

    // Filter out games with null download_link
    const validGames = games.filter(game => game.download_link !== null);

    allGames = validGames; // Save all valid games for searching
    displayGames(validGames);
}

// Display games in a responsive grid
function displayGames(games) {
    const gameList = document.getElementById('game-list');
    gameList.innerHTML = ''; // Clear previous content

    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.classList.add('game');

        gameItem.innerHTML = `
            <img src="${game.thumbnail}" alt="${game.title}">
            <div class="game-info">
                <h3>${game.title}</h3>
                <p><strong>Platform:</strong> ${game.platform}</p>
                <p><strong>Region:</strong> ${game.region}</p>
                <p><strong>Version:</strong> ${game.version}</p>
                <p><strong>Release Date:</strong> ${new Date(game.date).toLocaleDateString()}</p>
                <a href="${game.download_link}" class="download-btn" target="_blank">Download</a>
            </div>
        `;

        gameList.appendChild(gameItem);
    });
}

// Search function
function searchGames() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filteredGames = allGames.filter(game => 
        game.title.toLowerCase().includes(query) || 
        game.platform.toLowerCase().includes(query) ||
        game.region.toLowerCase().includes(query)
    );
    displayGames(filteredGames);
}

// Load the games data
loadGames();
