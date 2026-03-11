const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let players = {};
let food = [];
const MAP_SIZE = 2000;

// Tworzenie jedzenia na start
for (let i = 0; i < 150; i++) {
    food.push({
        id: i,
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);
    
    // Inicjalizacja gracza
    players[socket.id] = {
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        size: 20,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        name: "Gość"
    };

    socket.on('movement', (data) => {
        const player = players[socket.id];
        if (player) {
            // Obliczanie kierunku ruchu w stronę myszki
            const dx = data.x - player.x;
            const dy = data.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                const speed = 2 + (500 / player.size); // Im większy, tym wolniejszy
                player.x += (dx / dist) * speed;
                player.y += (dy / dist) * speed;
            }

            // Kolizja z jedzeniem
            food.forEach((f, index) => {
                const fdx = player.x - f.x;
                const fdy = player.y - f.y;
                if (Math.sqrt(fdx * fdx + fdy * fdy) < player.size) {
                    player.size += 0.5;
                    food[index] = {
                        id: f.id,
                        x: Math.random() * MAP_SIZE,
                        y: Math.random() * MAP_SIZE,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`
                    };
                }
            });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// Wysyłanie danych do wszystkich 30 razy na sekundę (Tickrate)
setInterval(() => {
    io.emit('gameUpdate', { players, food });
}, 1000 / 30);

server.listen(3000, () => console.log('Serwer działa na porcie 3000'));
