const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let food = [];
const MAP_SIZE = 3000;

for(let i=0; i<250; i++) {
    food.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: `hsl(${Math.random()*360}, 100%, 50%)` });
}

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            size: 30,
            color: `hsl(${Math.random()*360}, 80%, 55%)`,
            name: nick || "Gość",
            angle: 0
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', (angle) => {
        if(players[socket.id]) players[socket.id].angle = angle;
    });

    socket.on('split', () => {
        let p = players[socket.id];
        if (p && p.size >= 60) {
            p.size /= 1.5; // Podstawowy mechanizm podziału (zmniejszenie)
        }
    });

    socket.on('eject', () => {
        let p = players[socket.id];
        if (p && p.size > 40) {
            p.size -= 2;
            food.push({ 
                x: p.x + Math.cos(p.angle) * (p.size + 30), 
                y: p.y + Math.sin(p.angle) * (p.size + 30), 
                color: p.color 
            });
        }
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => {
    for (let id in players) {
        let p = players[id];
        let speed = 4.5 * (30 / p.size) + 1;
        p.x += Math.cos(p.angle) * speed;
        p.y += Math.sin(p.angle) * speed;

        p.x = Math.max(0, Math.min(MAP_SIZE, p.x));
        p.y = Math.max(0, Math.min(MAP_SIZE, p.y));

        food.forEach((f, index) => {
            if (Math.hypot(p.x - f.x, p.y - f.y) < p.size) {
                p.size += 0.5;
                food[index] = { x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: f.color };
            }
        });
        
        // Zjadanie innych graczy
        for (let otherId in players) {
            if (id === otherId) continue;
            let other = players[otherId];
            let dist = Math.hypot(p.x - other.x, p.y - other.y);
            if (dist < p.size * 0.9 && p.size > other.size * 1.15) {
                p.size += other.size * 0.5;
                delete players[otherId];
                io.to(otherId).emit('died');
            }
        }
    }
    io.emit('update', { players, food });
}, 25);

http.listen(3000, () => { console.log('BetterBubble.am Live!'); });
