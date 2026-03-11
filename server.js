const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let players = {};
let food = [];

// Generujemy jedzenie na dużej mapie
for(let i=0; i<200; i++) {
    food.push({
        x: Math.random() * 3000, 
        y: Math.random() * 3000, 
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    // Tworzymy gracza od razu po wejściu
    players[socket.id] = {
        x: 1500,
        y: 1500,
        size: 25,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    };

    socket.on('movement', (data) => {
        if(players[socket.id]) {
            // Płynny ruch w stronę myszki
            players[socket.id].x += (data.x - players[socket.id].x) * 0.1;
            players[socket.id].y += (data.y - players[socket.id].y) * 0.1;
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

setInterval(() => {
    io.emit('state', { players, food });
}, 1000 / 60);

const PORT = process.env.PORT || 10000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Serwer BetterBubble działa na porcie ' + PORT);
});
