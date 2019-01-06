var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1420,
    height: 820,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    } 
  };

 
  var game = new Phaser.Game(config);
   
  function preload() {

    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('back','assets/back.jpg');
    this.load.image('star','assets/star_gold1.png');
    
  }
   
  function create() {

   // this.game.add.image('back').setDisplaySize(1420,820);

    var self = this;
    
//    game.add.image(game.world.centerX, game.world.centerY, 'back').anchor.set(0.5);

    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          addPlayer(self, players[id]);
        } else {
          addOtherPlayers(self, players[id]);
        }
      });
    });

    this.socket.on('newPlayer', function (playerInfo) {
      addOtherPlayers(self, playerInfo);
    });

    this.socket.on('disconnect', function (playerId) {
      self.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerInfo.playerId === otherPlayer.playerId) {
            otherPlayer.setRotation(playerInfo.rotation);
            otherPlayer.setPosition(playerInfo.x, playerInfo.y);
          }
        });
      });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(1245, 16, '', { fontSize: '32px', fill: '#FF0000' });
  
    this.socket.on('scoreUpdate', function (scores) {
        self.blueScoreText.setText('Blue: ' + scores.blue);
        self.redScoreText.setText('Red: ' + scores.red);

        // try to end game using scores
        /*
        if(scores.blue>=20){
          // blue wins

          player.destroy();
          otherPlayers.destroy();

          this.blueWinText = this.add.text(25, 25, '', { fontSize: '40px', fill: '#0000FF'});

          self.blueWinText.setText('BLUE WINS!');
        }

        if(scores.red>=20){
          // red wins

          player.destroy();
          otherPlayers.destroy();

          this.redWinText = this.add.text(25, 25, '', { fontSize: '40px', fill: '#FF0000'});

          self.redWinText.setText('RED WINS!');

        } */


    });

    this.socket.on('starLocation', function (starLocation) {
        if (self.star) self.star.destroy();
        self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star').setDisplaySize(30, 30);;
        self.physics.add.overlap(self.ship, self.star, function () {
          this.socket.emit('starCollected');
        }, null, self);
    });

  }

  function addOtherPlayers(self, playerInfo) {

    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
  }


  function addPlayer(self, playerInfo) {

    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      self.ship.setTint(0x0000ff);
    } else {
      self.ship.setTint(0xff0000);
    }
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);

  }

  
   
  function update() {

    if (this.ship) {

        // emit player movement
        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.rotation;

        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
        }
 
        // save old position data
        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        };

        if (this.cursors.left.isDown) {
          this.ship.setAngularVelocity(-250);
        } else if (this.cursors.right.isDown) {
          this.ship.setAngularVelocity(250);
        } else {
          this.ship.setAngularVelocity(0);
        }
      
        if (this.cursors.up.isDown) {
          this.physics.velocityFromRotation(this.ship.rotation + 0, -200, this.ship.body.acceleration);
        } else {
          this.ship.setAcceleration(0);
        }
      
        this.physics.world.wrap(this.ship, 5);
      }

  }