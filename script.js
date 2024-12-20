
// Load JSON data from file
async function loadGames() {
    const response = await fetch('games.json');
    const games = await response.json();
    displayGames(games);
}

// Display games in a responsive grid
function displayGames(games) {
    const gameList = document.getElementById('game-list');

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

// Load the games data
loadGames();
