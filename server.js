const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let players = {};
let food = [];

for(let i=0; i<150; i++) {
    food.push({
        x: Math.random() * 2000, 
        y: Math.random() * 2000, 
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    players[socket.id] = {
        x: 1000, y: 1000, size: 25,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        targetX: 1000, targetY: 1000
    };

    socket.on('movement', (data) => {
        if(players[socket.id]) {
            players[socket.id].targetX = data.x;
            players[socket.id].targetY = data.y;
        }
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

// Silnik serwera - płynne przesuwanie pozycji na serwerze
setInterval(() => {
    for(let id in players) {
        let p = players[id];
        p.x += (p.targetX - p.x) * 0.15;
        p.y += (p.targetY - p.y) * 0.15;
    }
    io.emit('state', { players, food });
}, 1000 / 30); // 30 FPS wystarczy dla płynności przy interpolacji

const PORT = process.env.PORT || 10000;
http.listen(PORT, '0.0.0.0');
