const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let players = {};
let food = [];

// Generujemy 200 kawałków jedzenia na mapie
for(let i=0; i<200; i++) {
    food.push({
        x: Math.random() * 2000, 
        y: Math.random() * 2000, 
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    // Tworzymy kulkę gracza przy połączeniu
    players[socket.id] = {
        x: 1000,
        y: 1000,
        size: 20,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    };

    socket.on('movement', (data) => {
        if(players[socket.id]) {
            // Płynny ruch w stronę myszki
            socket.on('movement', (data) => {
        if(players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
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
http.listen(PORT, () => { console.log('Serwer BetterBubble działa!'); });
