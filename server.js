const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {}, food = [], viruses = [];
const MAP_SIZE = 3000;

// Inicjalizacja świata
function initWorld() {
    food = []; viruses = [];
    for(let i=0; i<300; i++) food.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360}, 100%, 50%)`, size: 8 });
    for(let i=0; i<8; i++) viruses.push({ x: Math.random()*(MAP_SIZE-200)+100, y: Math.random()*(MAP_SIZE-200)+100, size: 60 });
}
initWorld();

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick, color: `hsl(${Math.random()*360}, 70%, 50%)`, score: 30,
            cells: [{ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, size: 30, boostX: 0, boostY: 0, lastSplit: Date.now() }],
            angle: 0
        };
        socket.emit('init', { id: socket.id, mapSize: MAP_SIZE });
    });

    socket.on('move', (angle) => { if(players[socket.id]) players[socket.id].angle = angle; });

    socket.on('split', () => {
        let p = players[socket.id];
        if (!p || p.cells.length >= 16) return;
        let newCells = [];
        p.cells.forEach(cell => {
            if (cell.size >= 50 && p.cells.length + newCells.length < 16) {
                cell.size /= 1.41;
                newCells.push({
                    x: cell.x, y: cell.y, size: cell.size,
                    boostX: Math.cos(p.angle) * 30, boostY: Math.sin(p.angle) * 30,
                    lastSplit: Date.now()
                });
            }
        });
        p.cells.push(...newCells);
    });

    socket.on('eject', () => {
        let p = players[socket.id];
        if (!p) return;
        p.cells.forEach(cell => {
            if (cell.size > 40) {
                cell.size -= 4;
                food.push({ 
                    x: cell.x + Math.cos(p.angle)*(cell.size+20), y: cell.y + Math.sin(p.angle)*(cell.size+20),
                    color: p.color, size: 14, isEjected: true, vX: Math.cos(p.angle)*20, vY: Math.sin(p.angle)*20 
                });
            }
        });
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    for (let id in players) {
        let p = players[id], total = 0;
        p.cells.forEach((cell, idx) => {
            let speed = (4.5 * (30 / cell.size) + 0.8);
            cell.x += cell.boostX + Math.cos(p.angle) * speed;
            cell.y += cell.boostY + Math.sin(p.angle) * speed;
            cell.boostX *= 0.85; cell.boostY *= 0.85;
            cell.x = Math.max(cell.size, Math.min(MAP_SIZE - cell.size, cell.x));
            cell.y = Math.max(cell.size, Math.min(MAP_SIZE - cell.size, cell.y));
            cell.size *= 0.9998; // Naturalny spadek masy
            total += cell.size;

            // Kolizje z jedzeniem
            food.forEach((f, fIdx) => {
                if (Math.hypot(cell.x - f.x, cell.y - f.y) < cell.size) {
                    cell.size += f.isEjected ? 1.5 : 0.4;
                    food.splice(fIdx, 1);
                    if(!f.isEjected) food.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360}, 100%, 50%)`, size: 8 });
                }
            });

            // Wirusy
            viruses.forEach(v => {
                if (Math.hypot(cell.x - v.x, cell.y - v.y) < cell.size && cell.size > v.size * 1.1) {
                    // Rozpad na części
                    while(p.cells.length < 16 && cell.size > 30) {
                        cell.size /= 1.4;
                        p.cells.push({ x: cell.x, y: cell.y, size: cell.size, boostX: (Math.random()-0.5)*20, boostY: (Math.random()-0.5)*20, lastSplit: Date.now() });
                    }
                }
            });

            // Merging (Łączenie)
            for(let j = idx + 1; j < p.cells.length; j++){
                let other = p.cells[j];
                let dist = Math.hypot(cell.x - other.x, cell.y - other.y);
                let canMerge = Date.now() - cell.lastSplit > 15000 && Date.now() - other.lastSplit > 15000;
                if (dist < (cell.size + other.size) * (canMerge ? 0.5 : 0.9)) {
                    if (canMerge) {
                        cell.size = Math.sqrt(cell.size**2 + other.size**2);
                        p.cells.splice(j, 1);
                    } else {
                        let angle = Math.atan2(cell.y - other.y, cell.x - other.x);
                        other.x -= Math.cos(angle) * 2; other.y -= Math.sin(angle) * 2;
                    }
                }
            }
        });
        p.score = total;
    }
    // Fizyka wyrzuconej masy
    food.forEach(f => { if(f.isEjected) { f.x += f.vX; f.y += f.vY; f.vX *= 0.9; f.vY *= 0.9; } });
    io.emit('update', { players, food, viruses });
}, 25);

http.listen(3000, () => { console.log('BetterBubble Master Server Live!'); });
