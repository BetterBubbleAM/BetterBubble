const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {}, food = [], viruses = [];
const MAP = 3000;

function addFood(n=1) {
    for(let i=0; i<n; i++) food.push({x: Math.random()*MAP, y: Math.random()*MAP, color: `hsl(${Math.random()*360},100%,50%)`, size: 7});
}
addFood(300);
for(let i=0; i<10; i++) viruses.push({x: Math.random()*MAP, y: Math.random()*MAP, size: 60, mass: 100});

io.on('connection', socket => {
    socket.on('join', nick => {
        players[socket.id] = {
            name: nick, color: `hsl(${Math.random()*360},80%,50%)`,
            cells: [{x: Math.random()*MAP, y: Math.random()*MAP, size: 30, bX: 0, bY: 0, t: Date.now()}],
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
                newCells.push({x: c.x, y: c.y, size: c.size, bX: Math.cos(p.angle)*30, bY: Math.sin(p.angle)*30, t: Date.now()});
            }
        });
        p.cells.push(...newCells);
    });

    socket.on('eject', () => {
        let p = players[socket.id]; if(!p) return;
        p.cells.forEach(c => {
            if(c.size > 40) {
                c.size -= 4;
                food.push({x: c.x + Math.cos(p.angle)*c.size, y: c.y + Math.sin(p.angle)*c.size, color: p.color, size: 12, isE: true, vX: Math.cos(p.angle)*20, vY: Math.sin(p.angle)*20});
            }
        });
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

setInterval(() => {
    for (let id in players) {
        let p = players[id]; let total = 0;
        p.cells.forEach((c, i) => {
            let speed = 4.2 * (30/c.size) + 0.8;
            c.x += c.bX + Math.cos(p.angle)*speed; c.y += c.bY + Math.sin(p.angle)*speed;
            c.bX *= 0.9; c.bY *= 0.9;
            c.x = Math.max(c.size, Math.min(MAP-c.size, c.x));
            c.y = Math.max(c.size, Math.min(MAP-c.size, c.y));
            total += c.size;

            // Zjadanie jedzenia i karmienie wirusów
            food.forEach((f, fi) => {
                let dist = Math.hypot(c.x-f.x, c.y-f.y);
                if(dist < c.size) {
                    c.size += f.isE ? 1.5 : 0.5; food.splice(fi, 1);
                    if(!f.isE) addFood(1);
                }
            });

            // Mechanika Wirusa
            viruses.forEach((v, vi) => {
                if(Math.hypot(c.x-v.x, c.y-v.y) < c.size && c.size > v.size * 1.1) {
                    while(p.cells.length < 16 && c.size > 35) {
                        c.size /= 1.41;
                        p.cells.push({x: c.x, y: c.y, size: c.size, bX: (Math.random()-0.5)*25, bY: (Math.random()-0.5)*25, t: Date.now()});
                    }
                }
            });

            // Zjadanie innych graczy
            for(let oid in players) {
                if(oid === id) continue;
                players[oid].cells.forEach((oc, oi) => {
                    if(c.size > oc.size * 1.25 && Math.hypot(c.x-oc.x, c.y-oc.y) < c.size - oc.size/2) {
                        c.size = Math.sqrt(c.size**2 + oc.size**2);
                        players[oid].cells.splice(oi, 1);
                    }
                });
            }

            // Łączenie kulek
            for(let j=i+1; j<p.cells.length; j++){
                let c2 = p.cells[j];
                let dist = Math.hypot(c.x-c2.x, c.y-c2.y);
                if(dist < (c.size+c2.size)*0.4 && Date.now()-c.t > 15000){
                    c.size = Math.sqrt(c.size**2 + c2.size**2); p.cells.splice(j, 1);
                } else if(dist < c.size + c2.size) {
                    let a = Math.atan2(c.y-c2.y, c.x-c2.x);
                    c.x += Math.cos(a)*2; c.y += Math.sin(a)*2;
                }
            }
        });
        p.score = total;
    }
    food.forEach(f => { if(f.isE) { f.x += f.vX; f.y += f.vY; f.vX *= 0.9; f.vY *= 0.9; } });
    io.emit('update', {players, food, viruses});
}, 30);

http.listen(3000);
