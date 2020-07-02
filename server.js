const PORT = process.env.PORT || 3005;
const express = require('express');
const app = express();
const http = require('http').Server(app);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, function () {
    console.log(`Tic-tac-toe game server running on port ${PORT}`);
});

const io = require('socket.io')(http);

let unmatched;
let username;
const players = {};

function joinGame(socket){
    players[socket.id] = {
        opponent: unmatched,
        symbol: 'X',
        socket: socket,
        name: username,
    }
    debugger;
    if (unmatched){
        players[socket.id].symbol = 'O';
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

function getOpponent(socket){
    if (!players[socket.id].opponent){
        return;
    }
    return players[players[socket.id].opponent].socket;
}

io.on('connection', function (socket) {
    console.log('Connections established....', socket.id);

    socket.on('new-user', name =>{
        players[socket.id].name = name;
        socket.broadcast.emit('user-connected', name)
    });

    joinGame(socket);
    socket.on('send-chat-message', function (message) {
        socket.broadcast.emit('chat-message', {message: message, name: players[socket.id].name});
    });

    // socket.on('disconnect', () =>{
    //     socket.broadcast.emit('user-disconnected', players[socket.id]);
    //     delete players[socket.id]
    // });


    if (getOpponent(socket)){
        socket.emit('game.begin', {
            symbol: players[socket.id].symbol
        });
        getOpponent(socket).emit('game.begin', {
            symbol: players[getOpponent(socket).id].symbol
        })
    }

    socket.on('make.move', function (data) {
        if (!getOpponent(socket)){
            return;
        }
        console.log('move made by:', data);
        socket.emit('move.made', data);
        getOpponent(socket).emit('move.made', data);
    })

    socket.on('disconnect', function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit('opponent.left');
            console.log("000", players[getOpponent(socket).id]);
            delete players[getOpponent(socket).id];
            console.log(players);
            joinGame(socket);
        }
    });
});
