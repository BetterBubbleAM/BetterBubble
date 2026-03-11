const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {}, food = [], viruses = [];
const MAP = 5000;

// Funkcja spawnowania jedzenia (identyczna masa i kolorystyka)
function addFood(n) {
    for(let i=0; i<n; i++) food.push({
        id: Math.random(), 
        x: Math.random()*MAP, 
        y: Math.random()*MAP, 
        color: `hsl(${Math.random()*360}, 100%, 50%)`, 
        mass: 1
    });
}
addFood(800);

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick,
            color: `hsl(${Math.random()*360}, 70%, 50%)`,
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
                added.push({x: c.x, y: c.y, mass: c.mass, bX: Math.cos(p.angle)*50, bY: Math.sin(p.angle)*50, t: Date.now()});
            }
        });
        p.cells.push(...added);
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

// Główny silnik fizyki (30ms = płynność jak w oryginale)
setInterval(() => {
    for (let id in players) {
        let p = players[id];
        p.cells.forEach((c, i) => {
            // Matematyczna prędkość Agar.io
            let speed = 2.2 * Math.pow(c.mass, -0.439) * 45;
            c.x += c.bX + Math.cos(p.angle) * speed;
            c.y += c.bY + Math.sin(p.angle) * speed;
            c.bX *= 0.88; c.bY *= 0.88; // Hamowanie po podziale

            // Zjadanie jedzenia
            food.forEach((f, fi) => {
                if(Math.hypot(c.x-f.x, c.y-f.y) < Math.sqrt(c.mass * 100)) {
                    c.mass += f.mass; food.splice(fi, 1); addFood(1);
                }
            });

            // Łączenie kulek (Merge logic)
            for(let j=i+1; j<p.cells.length; j++){
                let c2 = p.cells[j];
                let dist = Math.hypot(c.x-c2.x, c.y-c2.y);
                if(dist < (Math.sqrt(c.mass*100) + Math.sqrt(c2.mass*100)) * 0.5 && Date.now() - c.t > 30000){
                    c.mass += c2.mass; p.cells.splice(j, 1);
                }
            }
        });
    }
    io.emit('update', { players, food });
}, 30);

http.listen(process.env.PORT || 3000);
