const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serwowanie plików gry (grafika, index.html)
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('Nowy gracz dołączył!');

    // Tutaj dodamy logikę poruszania się kulek i jedzenia
    socket.on('disconnect', () => {
        console.log('Gracz wyszedł z gry.');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Serwer BetterBubble działa na porcie ' + PORT);
});
