var socket = io();

var places = ["Downtown","Pirates Cove","Morro Bay","Pismo Beach","The \"P\"","Bishop's Peak","Avila Beach","805 Kitchen","Architecture Graveyard","Poly Canyon Village","Baker Bldg 180","Sierra Madre","Slo Do Co","Firestone","Woodstocks","Madonna Peak","Serenity Swing","The REC","The PAC","Airplane","Bank","Cathedral","Corporate Party","Crusader Army","Casino","Day Spa","Embassy","Hospital","Rock Wall","Hotel","Military Base","Movie Studio","Mission SLO","Ocean Liner","Passenger Train","Pirate Ship","Polar Station","Police Station","Restaurant","School","Service Station","Space Station","Submarine","Subway","Tu Taco","Chick-fil-a","Supermarket","Theater","University","The UU"]
var players = [];

var time = 8*60;

socket.on('alert', function (data) {
    alert(data.msg);
});

/*
CREATE OR JOIN FAILURES
 */

var casting = false;

socket.on('createFailed', function (data) {
    alert('game with that ID already exists');
    document.getElementById('create').style.display = 'block';
});
socket.on('joinFailed', function (data) {
    alert('game with that ID does not exist');
    document.getElementById('join').style.display = 'block';
});

/*
CREATE OR JOIN SUCCESS
 */
socket.on('createSuccess', function (data) {
    document.getElementById('lobby').style.display = 'block';
});
socket.on('joinSuccess', function (data) {
    document.getElementById('lobby').style.display = 'block';
});
socket.on('lobbyUpdate', function (data) {
    document.getElementById('lobbyList').innerHTML=data.html;
    players = data.players;
});

socket.on('vote', function (data) {
    var name = data.player;
    document.getElementById('votedPlayer').innerHTML='Player under vote: '+name;
    document.getElementById('voteCaster').style.display='block';
});

socket.on('voteOnSpy', function (data) {
    var result = data.result;
    if(result == 'right'){
        alert('That\'s right, players win! '+data.score);
        endGame();
    }else if(result == 'wrong'){
        alert('That\'s wrong, spy wins! '+data.score)
        endGame();
    }else{
        document.getElementById('voteCaster').style.display='none';
    }
});

socket.on('startGame', function (data) {
    time=8*60;
    timeDownID = setInterval(timeDown, 1000);
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    var spy = data.spy;
    var location = data.location;
    if(spy){
        document.getElementById('infoSection').innerHTML=
            "<p style=\"width: 100%; text-align: center\">You are the spy.</p>"
    }else{
        document.getElementById('infoSection').innerHTML=
            "<p style=\"width: 100%; text-align: center\">You are not the spy</p>" +
            "<p style=\"width: 100%; text-align: center\">Location:"+location+"</p>"
    }

    //Location list
    var html = "<table cellpadding='0' cellspacing='0' border='1' width='100%'>";
    for(var place in places){
        if(place%3==0){
            html+="<tr>"
        }
        html+="<td id='Place#"+place+"' onclick='toggle("+place+")' height='4ch' style='text-align: center; width: 33% '>"+places[place]+"</td>";
        if(place%3==2){
            html+="</tr>"
        }
    }
    html+="</table>";
    document.getElementById('locationList').innerHTML=html;

    //Player list
    html = "<table cellpadding='0' cellspacing='0' border='1' width='100%'>";
    for(var player in players){
        if(player%3==0){
            html+="<tr>"
        }
        html+="<td id='Player#"+player+"' onclick='togglePlayer("+player+")' height='4ch' style='text-align: center; width: 33% '>"+players[player]+"</td>";
        if(player%3==2){
            html+="</tr>"
        }
    }
    html+="</table>";
    document.getElementById('playerList').innerHTML=html;
});

var toggle = function (place) {
    var element = document.getElementById("Place#"+place);
    if(element.style.textDecoration=='line-through'){
        element.bgColor='#FFFFFF';
        element.style.textDecoration='none'
    }else{
        element.bgColor='#C0C0C0';
        element.style.textDecoration='line-through'
    }

}

var togglePlayer = function (place) {
    var element = document.getElementById("Player#"+place);
    if(casting){
        socket.emit('vote', {player:place});
        document.getElementById('voteButton').innerHTML="Cast a Vote";
        casting=false;
    }else if(element.style.textDecoration=='line-through'){
        element.bgColor='#FFFFFF';
        element.style.textDecoration='none'
    }else{
        element.bgColor='#C0C0C0';
        element.style.textDecoration='line-through'
    }

}

var join = function () {
    document.getElementById('buttons').style.display = 'none';
    document.getElementById('join').style.display = 'block';
};

var create = function () {
    document.getElementById('buttons').style.display = 'none';
    document.getElementById('create').style.display = 'block';
};

var cancelJoin = function () {
    document.getElementById('join').style.display = 'none'
    document.getElementById('buttons').style.display = 'block'
};

var cancelCreate = function () {
    document.getElementById('create').style.display = 'none'
    document.getElementById('buttons').style.display = 'block'
};

var joinGame = function () {
    document.getElementById('join').style.display = 'none';
    socket.emit('join',{
        name:document.getElementById('nicknamejoin').value,
        gameID:document.getElementById('gameIDjoin').value,
    });
};

var startGame = function () {
    socket.emit('startGame', {})
};

var createGame = function () {
    document.getElementById('create').style.display = 'none'
    socket.emit('create',{
        name:document.getElementById('nickname').value,
        gameID:document.getElementById('gameID').value,
    });
};

var timeDown = function () {
    time--;
    if (time < 0) {
        alert('Time has run out, the spy has won!');
        endGame();
        return;
    }
    var secs = time%60;
    var mins = Math.floor(time/60);
    document.getElementById('timer').innerHTML=mins+":"+(secs<10?"0":"")+secs;
};

var showHideInfo = function () {
    if(document.getElementById('infoSection').style.display!='block'){
        document.getElementById('infoSection').style.display='block';
    }else{
        document.getElementById('infoSection').style.display='none'
    }
};

var castVote = function () {
    if(document.getElementById('voteButton').innerHTML=='Cast a Vote'){
        casting = true;
        document.getElementById('voteButton').innerHTML='Cancel'
    }else{
        casting = false;
        document.getElementById('voteButton').innerHTML='Cast a Vote'
    }
};

var voteSpy = function (isSpy) {
    socket.emit('voteOnSpy', {isSpy:isSpy});
    document.getElementById('voteCaster').style.display='none';
};

var endGame = function () {
    document.getElementById('game').style.display='none';
    document.getElementById('lobby').style.display='block';
    clearInterval(timeDownID);
};