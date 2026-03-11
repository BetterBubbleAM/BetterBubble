const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {}, food = [], viruses = [];
const MAP = 5000;

function spawnFood(n) {
    for(let i=0; i<n; i++) food.push({
        id: Math.random(), 
        x: Math.random()*MAP, 
        y: Math.random()*MAP, 
        color: `hsl(${Math.random()*360}, 100%, 50%)`, 
        mass: 1
    });
}
spawnFood(1000);
for(let i=0; i<15; i++) viruses.push({x: Math.random()*MAP, y: Math.random()*MAP, mass: 100});

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick || "Adrian",
            color: `hsl(${Math.random()*360}, 80%, 50%)`,
            cells: [{ x: MAP/2, y: MAP/2, mass: 32, bX: 0, bY: 0, t: Date.now() }],
            angle: 0
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', a => { if(players[socket.id]) players[socket.id].angle = a; });

    socket.on('split', () => {
        let p = players[socket.id];
        if(!p || p.cells.length >= 16) return;
        let added = [];
        p.cells.forEach(c => {
            if(c.mass >= 35) {
                c.mass /= 2;
                added.push({x: c.x, y: c.y, mass: c.mass, bX: Math.cos(p.angle)*55, bY: Math.sin(p.angle)*55, t: Date.now()});
            }
        });
        p.cells.push(...added);
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

setInterval(() => {
    for (let id in players) {
        let p = players[id];
        p.cells.forEach((c, i) => {
            let speed = 2.2 * Math.pow(c.mass, -0.439) * 42;
            c.x += c.bX + Math.cos(p.angle) * speed;
            c.y += c.bY + Math.sin(p.angle) * speed;
            c.bX *= 0.85; c.bY *= 0.85; 

            c.x = Math.max(0, Math.min(MAP, c.x));
            c.y = Math.max(0, Math.min(MAP, c.y));

            food.forEach((f, fi) => {
                if(Math.hypot(c.x-f.x, c.y-f.y) < Math.sqrt(c.mass * 100)) {
                    c.mass += f.mass; food.splice(fi, 1); spawnFood(1);
                }
            });

            viruses.forEach(v => {
                let dist = Math.hypot(c.x-v.x, c.y-v.y);
                if(dist < Math.sqrt(c.mass*100) && c.mass > v.mass * 1.2) {
                    // Mechanika rozrywania przez wirusa
                    while(p.cells.length < 16 && c.mass > 20) {
                        c.mass /= 1.5;
                        p.cells.push({x: c.x, y: c.y, mass: c.mass, bX: (Math.random()-0.5)*40, bY: (Math.random()-0.5)*40, t: Date.now()});
                    }
                }
            });
        });
    }
    io.emit('update', { players, food, viruses });
}, 30);

http.listen(process.env.PORT || 3000);
