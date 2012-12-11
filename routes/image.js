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



var copyFileSync = function(srcFile, destFile) {
  var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
  BUF_LENGTH = 64 * 1024;
  buff = new Buffer(BUF_LENGTH);
  fdr = fs.openSync(srcFile, 'r');
  fdw = fs.openSync(destFile, 'w');
  bytesRead = 1;
  pos = 0;
  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, buff, 0, bytesRead);
    pos += bytesRead;
  }
  fs.closeSync(fdr);
  return fs.closeSync(fdw);
};




var job = function(req, res, done) {
  var self = this;

  var size = req.params.size
    , filename = req.params.image
    , orig_path = IMG_DIR + 'orig/' + filename
    , img_path = IMG_DIR + size + '/' + filename

  if (size === 'thumb') {
    size = 160;

    // resize and crop to a small image
    easyimg.rescrop({
        src: orig_path, dst:img_path,
        width: size, height: size,
        fill: true

      }, function() {

        serve(res, img_path);
        done();
      }
    );
    return;
  }

  if (size === 'large') {
    size = 1136;

    easyimg.info(orig_path, function(err, info, stderr) {

      // if the image is already small enough, copy it, and serve it up
      if (info.width <= size && size >= info.height) {
        copyFileSync(orig_path, img_path);
        serve(res, img_path);
        done();
        return;
      };

      // resize to a large image, not cropping
      easyimg.resize({
          src: orig_path, dst:img_path,
          width: size, height: size,

        }, function() {

          serve(res, img_path);
          done();
        }
      );

    })

    // // resize to a large image, not cropping
    // easyimg.resize({
    //     src: orig_path, dst:img_path,
    //     width: size, height: size,

    //   }, function() {

    //     serve(res, img_path);
    //     done();
    //   }
    // );
    return;
  }
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

  var dir_path = IMG_DIR + req.params.size
    , img_path = dir_path + '/' + req.params.image;


  // see if image directory exists
  fs.exists( dir_path, function(dir_exists) {

    // if it doesn't exist, create it
    if (!dir_exists) {
      fs.mkdir( dir_path, null, function() {

        // obviously the image doesn't exists, so queue it up
        queue.addJob(job, req, res);

      });

    } else { // the dir exists

      // does the image exist?
      fs.exists( img_path, function(img_exists) {

        // if it does, serve it up
        if (img_exists) {
          serve( res, img_path );

        } else { // if it doesn't, queue it up
          queue.addJob(job, req, res);
        }

      })
    }
  })

}