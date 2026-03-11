const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {}, food = [], viruses = [];
const MAP = 3000;

// Generuj świat
for(let i=0; i<300; i++) food.push({x: Math.random()*MAP, y: Math.random()*MAP, color: `hsl(${Math.random()*360},100%,50%)`});
for(let i=0; i<8; i++) viruses.push({x: Math.random()*MAP, y: Math.random()*MAP, size: 60});

io.on('connection', socket => {
    socket.on('join', nick => {
        players[socket.id] = {
            name: nick, color: `hsl(${Math.random()*360},80%,50%)`,
            cells: [{x: MAP/2, y: MAP/2, size: 30, bX: 0, bY: 0, t: Date.now()}],
            angle: 0, score: 30
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', a => { if(players[socket.id]) players[socket.id].angle = a; });

    socket.on('split', () => {
        let p = players[socket.id];
        if(!p || p.cells.length >= 16) return;
        let newCells = [];
        p.cells.forEach(c => {
            if(c.size > 50) {
                c.size /= 1.41;
                newCells.push({x: c.x, y: c.y, size: c.size, bX: Math.cos(p.angle)*25, bY: Math.sin(p.angle)*25, t: Date.now()});
            }
        });
        p.cells.push(...newCells);
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

setInterval(() => {
    for (let id in players) {
        let p = players[id]; let total = 0;
        p.cells.forEach((c, i) => {
            let speed = 4 * (30/c.size) + 1;
            c.x += c.bX + Math.cos(p.angle) * speed;
            c.y += c.bY + Math.sin(p.angle) * speed;
            c.bX *= 0.9; c.bY *= 0.9;
            total += c.size;

            // Zjadanie jedzenia
            food.forEach((f, fi) => {
                if(Math.hypot(c.x-f.x, c.y-f.y) < c.size) {
                    c.size += 0.5; food.splice(fi, 1);
                    food.push({x: Math.random()*MAP, y: Math.random()*MAP, color: `hsl(${Math.random()*360},100%,50%)`});
                }
            });

            // Łączenie się kulek
            for(let j=i+1; j<p.cells.length; j++){
                let c2 = p.cells[j];
                if(Math.hypot(c.x-c2.x, c.y-c2.y) < (c.size+c2.size)*0.4 && Date.now()-c.t > 10000){
                    c.size = Math.sqrt(c.size**2 + c2.size**2);
                    p.cells.splice(j, 1);
                }
            }
        });
        p.score = total;
    }
    io.emit('update', {players, food, viruses});
}, 30);

http.listen(3000);
