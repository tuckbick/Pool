
/**
 * Module dependencies.
 */

var express  = require('express')
  , routes   = require('./routes')
  , user     = require('./routes/user')
  , http     = require('http')
  , path     = require('path')
  , socketio = require('socket.io')
  , dl       = require('delivery/lib/delivery.server')
  , fs       = require('fs')
  , easyimg  = require('easyimage')
  , uuid     = require('node-uuid');






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
    UPLOAD_DIR = 'images/uploads/',
    ORIG_DIR = UPLOAD_DIR + 'orig/',
    THUMB_DIR = UPLOAD_DIR + 'thumb/',
    SCRIPT_DIR = __dirname + '/';



// API

var socket_api = {

  'init.images': function(nil, fn) {
    var data = {
      images: []
    }
    fs.readdir( STATIC_DIR + THUMB_DIR, function(err, files) {
      for (var i = 0; i < files.length; i+=1 ) {
        files[i] = THUMB_DIR + files[i];
      }
      data.images = files;
      fn(data);
    })
  }
}

var delivery_api = {

  'receive.success': function(socket, file) {
    var extension = file.name.substr(file.name.lastIndexOf('.'),file.name.length),
        new_filename = uuid.v4() + extension,
        write_path = STATIC_DIR + ORIG_DIR + new_filename;
    fs.writeFile( write_path, file.buffer, function(err){
      if (err) {
        console.log('File could not be saved.');
      } else {
        generateThumbnail(new_filename, function() {
          io.sockets.emit('announce.image', THUMB_DIR + new_filename);
        });
      };
    });
  }
}




// Images

easyimg.fixOrientation = function(image_path, callback) {

  easyimg.exec('identify -format %[EXIF:Orientation] ' + image_path, function(err, stdout, stderr) {

    // check if orientation is correct
    var orientation = parseInt(stdout);
    if (orientation === 1) {
      easyimg.info(image_path, callback);
      return;
    }

    // auto orient
    var imcmd = 'mogrify -auto-orient ' + image_path;
    easyimg.exec(imcmd, function(err, stdout, stderr) {
      if (err) return callback(err);
      easyimg.info(image_path, callback);
    });
  })
}

var generateThumbnail = function(name, callback) {

  var orig_path = SCRIPT_DIR + STATIC_DIR + ORIG_DIR + name;
  var thumb_path = SCRIPT_DIR + STATIC_DIR + THUMB_DIR + name;

  easyimg.fixOrientation( orig_path, function() {

    easyimg.rescrop({
        src: orig_path, dst:thumb_path,
        width:200, height:200,
        fill: true
      }, callback
    );
  });

  // easyimg.rescrop(
  //   {
  //     src: orig_path, dst:thumb_path,
  //     width:200, height:200,
  //     fill: true
  //   },
  //   function(err, stdout, stderr) {
  //       if (err) throw err;

  //       easyimg.fixOrientation( thumb_path, callback );
  //   }
  // );
}




// Socket

var io = socketio.listen(server, {
  // 'transports' : ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
  // 'transports' : ['htmlfile', 'xhr-polling', 'jsonp-polling']
});

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