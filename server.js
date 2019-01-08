
// do something to end server and game after some fixed score, most probably less than 1000 and declare the winner color


var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};

nplayer=0;

var star = {
    x: Math.floor(Math.random() * 1380) +20,
    y: Math.floor(Math.random() * 780) +20
  };

var scores = {
    blue: 0,
    red: 0
};
 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
	nplayer++;
    console.log('a user connected');

    // create a new player and add it to our players object
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (nplayer == 1) ? 'red' : 'blue'
    };
    // send the players object to the new player
    socket.emit('currentPlayers', players);

    // send the star object to the new player
    socket.emit('starLocation', star);

    // send the current scores
    socket.emit('scoreUpdate', scores);

     // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);


    socket.on('disconnect', function () {
      console.log('user disconnected');
      nplayer--;	
    
      // remove this player from our players object
        delete players[socket.id];
      // emit a message to all players to remove this player
        io.emit('disconnect', socket.id);

    });
  
 
  // when a player moves, update the player data
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    socket.on('starCollected', function () {
        if (players[socket.id].team === 'red') {
          scores.red += 10;
        } else {
          scores.blue += 10;
        }
        

        //star.x = 16 ;
        //star.y = 16 ;

      

    	use=0;

    	do
    	{

    		star.x = Math.floor(Math.random() * 1410);
        	star.y = Math.floor(Math.random() * 810) ;

        	use=0;
    	

    	  while(star.y<=16&&(star.x<=25||star.x>=1240)) 		// Here out score text is currently printed at these locations, x between 0-25 or x between 1240-1280 and y between 0-16
    	{
    		star.x = Math.floor(Math.random() * 1410);		// So keep changing star's location until it stops coming in text's location
        	star.y = Math.floor(Math.random() * 810) ;
    	}

    	Object.keys(players).forEach(function (id) 
    	{
        if (players[id].x === star.x||players[id].y === star.y) 
        	use++;
        });

    	}
        while(use!=0);

        io.emit('starLocation', star);
        io.emit('scoreUpdate', scores);
    });

});  

server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
