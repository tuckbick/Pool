
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , socketio = require('socket.io')
  , dl = require('delivery/lib/delivery.server')
  , fs = require('fs');




// Config

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});




// Routes

app.get('/', routes.index);
// app.get('/users', user.list);





// Http

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


var STATIC_DIR = 'public/',
    UPLOAD_DIR = 'images/uploads/';



// API

var socket_api = {

  'init.images': function(nil, fn) {
    var data = {
      images: []
    }
    fs.readdir( STATIC_DIR + UPLOAD_DIR, function(err, files) {
      for (var i = 0; i < files.length; i+=1 ) {
        files[i] = UPLOAD_DIR + files[i];
      }
      data.images = files;
      fn(data);
    })
  }
}

var delivery_api = {

  'receive.success': function(socket, file) {
    var write_path = STATIC_DIR + UPLOAD_DIR + file.name;
    fs.writeFile(write_path,file.buffer, function(err){
      if (err) {
        console.log('File could not be saved.');
      } else {
        io.sockets.emit('announce.image', UPLOAD_DIR + file.name);
      };
    });
  }
}



// Socket

var io = socketio.listen(server);

io.sockets.on('connection', function (socket) {

  for (var action in socket_api) {
    socket.on( action, socket_api[action] );
  }

  var delivery = dl.listen(socket);
  for (var action in delivery_api) {
    delivery.on( action, function() {
      return delivery_api[action].apply(null, [socket].concat(Array.prototype.slice.call(arguments)));
    })
  }

});