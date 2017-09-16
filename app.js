var express = require('express');
var app = express();
var serv = require('http').Server(app);

var sockets = [];

var places = ["Downtown","Pirates Cove","Morro Bay","Pismo Beach","The \"P\"","Bishop's Peak","Avila Beach","805 Kitchen","Architecture Graveyard","Poly Canyon Village","Baker Bldg 180","Sierra Madre","Slo Do Co","Firestone","Woodstocks","Madonna Peak","Serenity Swing","The REC","The PAC","Airplane","Bank","Cathedral","Corporate Party","Crusader Army","Casino","Day Spa","Embassy","Hospital","Rock Wall","Hotel","Military Base","Movie Studio","Mission SLO","Ocean Liner","Passenger Train","Pirate Ship","Polar Station","Police Station","Restaurant","School","Service Station","Space Station","Submarine","Subway","Tu Taco","Chick-fil-a","Supermarket","Theater","University","The UU"]

var games = [];
var numPlayers = 0;
app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});

app.use('', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Spyfall 2.0 Started");

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id=numPlayers++;
    sockets[socket.id] = socket;
    numPlayers%=10000;
    console.log('socket '+socket.id+' connected');
    socket.on('create', function(data){
        if(games[data.gameID]!=null){
            socket.emit('createFailed', {});
        }else {
            games[data.gameID] = {
                players: [{
                    id: socket.id,
                    name: data.name
                }],
                votesFor:0,
                votesAgainst:0,
                isSpy:false,
                spyID:-1,
                timeoutID:0
            };
            socket.gameID = data.gameID;
            socket.emit('createSuccess', {});
            var innerHTML = "";
            var players = [];
            for(var i in games[data.gameID].players){
                innerHTML+="<p>"+games[data.gameID].players[i].name+"</p><br/>"
                players[i]=games[data.gameID].players[i].name;
            }
            for(var i in games[data.gameID].players){
                var playerSocket = sockets[games[data.gameID].players[i].id];
                playerSocket.emit('lobbyUpdate', {html:innerHTML,players:players});
            }
        }
    });

    var countVotes = function () {
        var score = "\n"+games[socket.gameID].votesFor+" - "+games[socket.gameID].votesAgainst;
        if(games[socket.gameID].votesFor>games[socket.gameID].votesAgainst){
            if(games[socket.gameID].isSpy) {
                for (var i in games[socket.gameID].players) {
                    var playerSocket = sockets[games[socket.gameID].players[i].id];
                    playerSocket.emit('voteOnSpy', {result: "right",score:score});
                }
            }else{
                for (var i in games[socket.gameID].players) {
                    var playerSocket = sockets[games[socket.gameID].players[i].id];
                    playerSocket.emit('voteOnSpy', {result: "wrong",score:score});
                }
            }
        }else{
            for(var i in games[socket.gameID].players){
                var playerSocket = sockets[games[socket.gameID].players[i].id];
                playerSocket.emit('voteOnSpy', {result:"cancel",score:score});
            }
        }
        games[socket.gameID].votesFor=0;
        games[socket.gameID].votesAgainst=0;
    };

    socket.on('vote', function (data) {
        var playerID = data.player;
        games[socket.gameID].isSpy=playerID==games[socket.gameID].spyID;
        var player = games[socket.gameID].players[playerID];
        var name = player.name;
        console.log(name);
        for(var i in games[socket.gameID].players){
            var playerSocket = sockets[games[socket.gameID].players[i].id];
            playerSocket.emit('vote', {player:name});
        }
        games[socket.gameID].timeoutID = setTimeout(countVotes, 15000);
    });

    socket.on('voteOnSpy', function (data) {
        if(data.isSpy){
            games[socket.gameID].votesFor++;
        }else{
            games[socket.gameID].votesAgainst++;
        }
        if(games[socket.gameID].votesFor + games[socket.gameID].votesAgainst == games[socket.gameID].players.length){
            clearTimeout(games[socket.gameID].timeoutID);
            countVotes();
        }
    });

    socket.on('startGame', function (data) {
        if(games[socket.gameID]==null)return;
        var players = games[socket.gameID].players;
        var selected = Math.floor(Math.random()*players.length);
        var curr=0;
        var selLoc = Math.floor(Math.random()*places.length);
        var loc = places[selLoc];
        games[socket.gameID].spyID = selected;
        for(var player in players){
            sockets[players[player].id].emit('startGame',{
                spy:curr==selected,
                location:curr==selected?"unknown":loc
            });
            curr++;
        }
    });
    socket.on('join', function (data) {
        if(games[data.gameID]!=null){
            socket.gameID = data.gameID;
            games[data.gameID].players[games[data.gameID].players.length]={
                id:socket.id,
                name: data.name
            };
            socket.emit('joinSuccess',{});
            var innerHTML = "";
            var players = [];
            for(var i in games[data.gameID].players){
                innerHTML+="<p>"+games[data.gameID].players[i].name+"</p><br/>"
                players[i]=games[data.gameID].players[i].name;
            }
            for(var i in games[data.gameID].players){
                var playerSocket = sockets[games[data.gameID].players[i].id];
                playerSocket.emit('lobbyUpdate', {html:innerHTML,players:players});
            }
        }else{
            socket.emit('joinFailed',{});
        }
    });
    socket.on('disconnect', function() {
        console.log('socket ' + socket.id+' disconnected');
        for(var i in games){
            if(games[i]!=null)
                for(var j in games[i].players){
                    if(games[i].players[j].id == socket.id){
                        games[i].players.splice(games[i].players.indexOf(j), 1);
                    }
                }
        }
        if(socket.gameID==null)return;
        var innerHTML = "";
        for(var i in games[socket.gameID].players){
            innerHTML+="<p>"+games[socket.gameID].players[i].name+"</p>"
        }
        for(var i in games[socket.gameID].players){
            var playerSocket = sockets[games[socket.gameID].players[i].id];
            playerSocket.emit('lobbyUpdate', {html:innerHTML});
        }
    });
});

setInterval(function () {
    for(var i in games){
        if(games[i]!=null && games[i].players.length==0){
            games[i]=null;
        }
    }
}, 1000);