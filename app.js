
/**
 * Module dependencies.
 */

var express  = require('express')
  , routes   = require('./routes')
  , image    = require('./routes/image')
  , http     = require('http')
  , path     = require('path')
  , socketio = require('socket.io')
  , dl       = require('delivery/lib/delivery.server')
  , fs       = require('fs')
  , easyimg  = require('easyimage')
  , uuid     = require('node-uuid')
  , mime     = require('mime')
  , queue    = require('./queue');


var STATIC_DIR = 'public/'
  , UPLOAD_DIR = 'images/uploads/'
  , ORIG_DIR   = 'orig/'
  , IMAGE_DIR  = 'image'
  , SCRIPT_DIR = __dirname + '/';

var ORIG_PATH  = STATIC_DIR + UPLOAD_DIR + ORIG_DIR;


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
  // app.use(express.static(path.join(__dirname, 'public'), { maxAge: 1209600000 })); // 86400000 1 day; 1209600000 14 days
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});




RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};


/* Routes */

// app.get('/cache.manifest', function(req, res){
//   fs.readFile('./cache.manifest', function(error, content) {
//     res.header('Content-Type', 'text/cache-manifest');
//     res.end(content);
//   })
// });

app.get('/', routes.index);
app.get('/i/:size/:image', image.index);


var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});






// Socket

easyimg.fixOrientation = function(image_path, callback) {

  easyimg.exec('identify -format %[EXIF:Orientation] ' + image_path, function(err, stdout, stderr) {

    // check if orientation is correct
    var orientation = parseInt(stdout);
    if (orientation === 1) {
      callback();
      return;
    }

    // auto orient
    var imcmd = 'mogrify -auto-orient ' + image_path;
    easyimg.exec(imcmd, callback);
  })
}






// Socket

var io = socketio.listen(server, {
  // 'transports' : ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
  // 'transports' : ['htmlfile', 'xhr-polling', 'jsonp-polling']
});
io.set('log level', 1);


io.sockets.on('connection', function(socket) {

  var client = new PoolClient(socket)
    , delivery = dl.listen(socket)
    , store = new PoolDelivery(delivery);

  delivery.on('receive.success', store.receiveSuccess);

});






  /**
   **  DELIVERY CLIENT
   **/

function PoolDelivery(delivery) {
  this.delivery = delivery;
}

var job = function(file, done) {
  var extension = file.name.substr(file.name.lastIndexOf('.'),file.name.length),
      new_filename = uuid.v4() + extension,
      file_path = STATIC_DIR + UPLOAD_DIR + ORIG_DIR + new_filename;

  // write the image to the file system
  fs.writeFile( file_path, file.buffer, function(err){
    if (err) {
      console.log('File could not be saved.');
      return;
    }

    // fix the image orientation
    easyimg.fixOrientation( file_path, function(err) {
      if (err) {
        console.log('Could not fix image orientation.');
      }

      // advance the process queue
      done();

      // announce a new image to all clients
      io.sockets.emit('image.new', new_filename);
    });
  });
}

PoolDelivery.prototype.receiveSuccess = function(file) {

  queue.addJob(job, file);
}






  /**
   **  POOL CLIENT
   **/

function PoolClient(socket) {
  var self = this;

  self.socket = socket;

  // send client a list of images
  self.socket.on('images', function() {
    self.getPhotos.apply(self, arguments);
  });
}

PoolClient.prototype.getPhotos = function(reply) {

  fs.readdir( ORIG_PATH, function(err, files) {
    reply({ images: files });
  })
}

