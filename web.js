var _ = require('underscore');

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
var lastStatus = {
  'paused': true,
  'video current time': 0,
  'server utc clock time': Date.now()
};

function reportStatus(socket) {
  updateVideoCurrentTime();
  
  var status = _.clone(lastStatus);
  status['user count'] = userCount;
  socket.emit('status', status);
}

function updateVideoCurrentTime() {
  var newTime = Date.now();
  if(!lastStatus.paused) {
    lastStatus['video current time'] += (newTime - lastStatus['server utc clock time']) / 1000;
    lastStatus['server utc clock time'] = newTime;
  }
}

io.sockets.on('connection', function(socket) {
  userCount++; reportStatus(socket.broadcast);
  reportStatus(socket);

  socket.on('pause', function() {
    if(!lastStatus.paused) {
      updateVideoCurrentTime();
      lastStatus.paused = true;
      reportStatus(socket.broadcast);
    }
  });
  
  socket.on('play', function() {
    if(lastStatus.paused) {
      lastStatus['server utc clock time'] = Date.now();
      lastStatus.paused = false;
      reportStatus(socket.broadcast);
    }
  });

  socket.on('seeked', function(data) {
    lastStatus['video current time'] = data['video current time'];
    lastStatus['server utc clock time'] = Date.now();
    reportStatus(socket.broadcast);
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
