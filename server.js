const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let food = [];
let viruses = [];
const MAP_SIZE = 3000;

// Generowanie jedzenia i wirusów na start
function initWorld() {
    for(let i=0; i<300; i++) food.push({x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360},100%,50%)`, size: 8});
    for(let i=0; i<10; i++) viruses.push({x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, size: 60});
}
initWorld();

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick,
            color: `hsl(${Math.random()*360},80%,50%)`,
            cells: [{ x: 1500, y: 1500, size: 32, bX: 0, bY: 0, t: Date.now() }],
            angle: 0,
            score: 32
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', (angle) => { if(players[socket.id]) players[socket.id].angle = angle; });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

// Pętla fizyki 1:1
setInterval(() => {
    for (let id in players) {
        let p = players[id];
        p.cells.forEach((c) => {
            let speed = 4 * (30/c.size) + 1;
            c.x += Math.cos(p.angle) * speed;
            c.y += Math.sin(p.angle) * speed;
            
            // Granice mapy
            c.x = Math.max(c.size, Math.min(MAP_SIZE - c.size, c.x));
            c.y = Math.max(c.size, Math.min(MAP_SIZE - c.size, c.y));

            // Zjadanie kropek
            food.forEach((f, i) => {
                if(Math.hypot(c.x-f.x, c.y-f.y) < c.size) {
                    c.size += 0.5;
                    food.splice(i, 1);
                    food.push({x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360},100%,50%)`, size: 8});
                }
            });
        });
        p.score = p.cells.reduce((sum, cell) => sum + Math.floor(cell.size), 0);
    }
    io.emit('update', { players, food, viruses });
}, 35);

http.listen(process.env.PORT || 3000);
