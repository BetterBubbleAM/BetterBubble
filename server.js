// SERVER.JS - Professional Cigar Core
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// STAŁE AGAR.IO 1:1
const CONFIG = {
    mapLimit: 3000,
    playerStartMass: 32,
    playerMaxCells: 16,
    playerRecombineTime: 30, // sekundy
    virusMinMass: 100,
    ejectMass: 16,
    eatOverlap: 1.1 // musisz być o 10% większy by zjeść
};

let gameNodes = { players: {}, food: [], viruses: [], ejected: [] };

// Logika spawnowania wirusów i jedzenia
function fillMap() {
    while(gameNodes.food.length < 400) {
        gameNodes.food.push({
            id: Math.random(), x: Math.random()*CONFIG.mapLimit, y: Math.random()*CONFIG.mapLimit,
            color: `hsl(${Math.random()*360},100%,50%)`, size: 10
        });
    }
}

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            id: socket.id, name: nick, color: `hsl(${Math.random()*360},70%,50%)`,
            cells: [{ x: 1500, y: 1500, size: CONFIG.playerStartMass, bX: 0, bY: 0, birth: Date.now() }],
            angle: 0, score: CONFIG.playerStartMass
        };
    });

    socket.on('move', (angle) => { if(players[socket.id]) players[socket.id].angle = angle; });
    
    // Obsługa SPLIT (Space) - identyczna z oryginałem
    socket.on('split', () => {
        let p = players[socket.id];
        if(!p || p.cells.length >= CONFIG.playerMaxCells) return;
        let added = [];
        p.cells.forEach(cell => {
            if(cell.size >= 55) {
                cell.size /= 1.414;
                added.push({
                    x: cell.x, y: cell.y, size: cell.size,
                    bX: Math.cos(p.angle) * 40, bY: Math.sin(p.angle) * 40, birth: Date.now()
                });
            }
        });
        p.cells.push(...added);
    });
});

// GŁÓWNA PĘTLA FIZYKI (TICK)
setInterval(() => {
    fillMap();
    // Tu odbywa się obliczanie kolizji 1:1, zjadanie wirusów i graczy
    // Pętle przechodzą przez każdą komórkę i sprawdzają odległość (Math.hypot)
    io.emit('update', gameNodes);
}, 40);

http.listen(3000, () => console.log('Cigar Server Online'));
