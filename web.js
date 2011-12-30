var express = require('express');
var app = express.createServer(express.logger());

// set up Hogan template engine
var hogan = require('hogan.js');
app.register('html', {
  'compile': function(str, options) {
    var template = hogan.compile(str, options);
    return function(params) {
      return template.render(params);
    };
  }
});
app.set('view engine', 'html');

// routes
app.get('/', function(req, res){
  res.render('index', {'url': req.param('url'), 'layout': false});
});

// socket.io time synchronization
var io = require('socket.io').listen(app);

var userCount = 0;
var currentTime = 0;
var paused = true;

function reportStatus(socket) {
  socket.emit('status', {'paused': paused, 'video current time': currentTime, 'user count': userCount});
}

io.sockets.on('connection', function(socket) {
  userCount++; reportStatus(socket.broadcast);
  reportStatus(socket);

  socket.on('pause', function() {
    paused = true;
    reportStatus(socket.broadcast);
  });
  
  socket.on('play', function() {
    paused = false;
    reportStatus(socket.broadcast);
  });

  socket.on('seeked', function(data) {
    currentTime = data['video current time'];
    reportStatus(socket.broadcast);
  });

  socket.on('timeupdate', function(data) {
    currentTime = data['video current time'];
  });

  socket.on('disconnect', function() {
    userCount--;
    reportStatus(socket.broadcast);
  });
});

// yay! let's listen
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
