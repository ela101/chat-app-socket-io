//const socket  = io('http://localhost:3000');


var socket = io.connect();
var myTurn = true, symbol;
var matches = ['XXX', 'OOO'];

const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const resumeGameContainer = document.getElementById('resumeGame');

const name = prompt('What is your name?');
appendMessage('You joined');
socket.emit('new-user', name);

socket.on('chat-message', (data) =>{
    console.log('000', data);
    appendMessage(`${data.name}: ${data.message}`);
});

socket.on('user-connected', name =>{
    appendMessage(`${name} connected`);
});

socket.on('user-disconnected', name =>{
    appendMessage(`${name} disconnected`);
});

messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    appendMessage(`You: ${message}`);
    socket.emit('send-chat-message', message);
    messageInput.value = '';
});

resumeGameContainer.addEventListener("click", () => {
    $('.cell').html('').attr('disabled', true);
    $('#symbol').html('Waiting...');
    $('#messages').text('Waiting for opponent to join...');
});

function appendMessage(message, ){
    const messageElement = document.createElement('div');
    const timeElement = document.createElement('span');
    const date = new Date().toLocaleTimeString('en-US');
    //const hour = date.getHours();
    messageElement.innerText = message;
    timeElement.innerText = date;

    messageElement.append(timeElement);
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;

}

function resumeGame(){
    const resumeButton = document.createElement('button');
    resumeButton.innerText = 'Resume Game';
    resumeGameContainer.append(resumeButton);
}

function getBoardState(){
    let obj = {};

    $('.cell').each(function () {
        obj[$(this).attr('id')] = $(this).text() || '';
    });

    console.log("state:", obj);
    return obj;
}

function isGameOver(){
    var state = getBoardState();
    console.log('Board state:', state);

    let rows = [
        state.a0 + state.a1 + state.a2,
        state.b0 + state.b1 + state.b2,
        state.c0 + state.c1 + state.c2,
        state.a0 + state.b1 + state.c2,
        state.a2 + state.b1 + state.c0,
        state.a0 + state.b0 + state.c0,
        state.a1 + state.b1 + state.c1,
        state.a2 + state.b2 + state.c2,
    ];

    for (let i=0; i< rows.length; i++){
        if(rows[i] === matches[0] || rows[i] === matches[1]){
            return true;
        }
    }
    return false;
}

function renderTurnMessage(){
    if (!myTurn){
        $('#messages').text('Your Opponents Turn');
        $('.cell').attr('disabled', true);
    } else {
        $('#messages').text('Your Turn.');
        $('.cell').removeAttr('disabled');
    }
}

function makeMove(e){
    e.preventDefault();
    if(!myTurn){
        return;
    }

    if($(this).text().length){
        return;
    }

    socket.emit('make.move', {
        symbol: symbol,
        position: $(this).attr('id')
    })
}

socket.on('move.made', function(data){
    $('#' + data.position).text(data.symbol);

    myTurn = (data.symbol !== symbol);

    if (!isGameOver()){
        console.log('con');
        return renderTurnMessage();
    }
    console.log('over');

    if (myTurn){
        $('#messages').text('Game Over. You Lost');

    }else {
        $('#messages').text('Game Over. You Won!');
    }

    $('.cell').attr('disabled', true);
   // $('.cell').html('');
});

socket.on('game.begin', function(data){
    $('#symbol').html(data.symbol);
    symbol = data.symbol;

    myTurn = (data.symbol === 'X');
    renderTurnMessage();
});

// Disable the board if the opponent leaves
socket.on('opponent.left', function () {
    $('#messages').text('Your opponent left the game.');
    //$('.board button').attr('disabled', true);
    $('.cell').attr('disabled', true);
    resumeGame();
    appendMessage(`${name} disconnected`);
});

$(function () {
    $('.board button').attr('disabled', true);
    $('.cell').on("click", makeMove);
})
