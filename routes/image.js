var easyimg  = require('easyimage')
  , fs       = require('fs')
  , path     = require('path')
  , mime     = require('mime')
  , queue    = require('../src/queue');

var IMG_DIR = 'public/images/uploads/';






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






var job = function(req, res, done) {
  var self = this;

  var size = req.params.size
    , filename = req.params.image
    , orig_path = IMG_DIR + 'orig/' + filename
    , img_path = IMG_DIR + size + '/' + filename

  easyimg.rescrop({
      src: orig_path, dst:img_path,
      width: size, height: size,
      fill: true

    }, function() {

      serve(res, img_path);
      done();
    }
  );
}

function serve(res, img_uri) {
  fs.readFile( img_uri, function( err, img ) {

    var exp_date = new Date();
    exp_date.setDate( exp_date.getDate() + 31 );

    res.writeHead(200, {
        'Content-Type' : mime.lookup(img_uri)
      , 'Expires'      : exp_date.toUTCString()
    });
    res.end(img, 'binary');

  });
}






exports.index = function(req, res) {

  var img_path = IMG_DIR + req.params.size + '/' + req.params.image;

  if (path.existsSync( img_path )) {

    serve( res, img_path );

  } else {

    queue.addJob(job, req, res);

  }
}