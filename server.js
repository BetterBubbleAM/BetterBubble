const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let food = [];
const MAP_SIZE = 4000;

for(let i=0; i<400; i++) {
    food.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360}, 100%, 50%)` });
}

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            size: 30,
            color: `hsl(${Math.random()*360}, 70%, 50%)`,
            name: nick || "Gość",
            angle: 0
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', (angle) => {
        if(players[socket.id]) players[socket.id].angle = angle;
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    let ids = Object.keys(players);
    for (let id of ids) {
        let p = players[id];
        if (!p) continue;

        let speed = 4.5 * (30 / p.size) + 0.8;
        p.x += Math.cos(p.angle) * speed;
        p.y += Math.sin(p.angle) * speed;
        p.x = Math.max(0, Math.min(MAP_SIZE, p.x));
        p.y = Math.max(0, Math.min(MAP_SIZE, p.y));

        food.forEach((f, index) => {
            let dist = Math.hypot(p.x - f.x, p.y - f.y);
            if (dist < p.size) {
                p.size += 0.4;
                food[index] = { x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360}, 100%, 50%)` };
            }
        });

        for (let otherId of ids) {
            if (id === otherId) continue;
            let other = players[otherId];
            if (!other) continue;
            let dist = Math.hypot(p.x - other.x, p.y - other.y);
            if (dist < p.size * 0.9 && p.size > other.size * 1.15) {
                p.size += other.size * 0.4;
                io.to(otherId).emit('died');
                delete players[otherId];
            }
        }
    }
    io.emit('update', { players, food });
}, 25);

http.listen(3000, () => { console.log('Serwer BetterBubble działa!'); });
