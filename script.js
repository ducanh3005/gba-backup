
let allGames = []; // To store all games for searching

// Load JSON data from file
async function loadGames() {
    const response = await fetch('games.json');
    const games = await response.json();
    allGames = games; // Save all games for searching
    displayGames(games);
}

// Display games in a responsive grid
function displayGames(games) {
    const gameList = document.getElementById('game-list');
    gameList.innerHTML = ''; // Clear previous content

    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.classList.add('game');

        gameItem.innerHTML = `
            <img src="${game.image}" alt="${game.name}">
            <div class="game-info">
                <h3>${game.name}</h3>
                <p>Categories: ${game.categories.join(', ')}</p>
                <a href="${game.downloadLink}" class="download-btn" target="_blank">Download</a>
            </div>
        `;

        gameList.appendChild(gameItem);
    });
}

// Search function
function searchGames() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filteredGames = allGames.filter(game => 
        game.name.toLowerCase().includes(query) || 
        game.categories.some(category => category.toLowerCase().includes(query))
    );
    displayGames(filteredGames);
}

// Load the games data
loadGames();
