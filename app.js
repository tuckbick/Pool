
/**
 * Module dependencies.
 */

var express  = require('express')
  , routes   = require('./routes')
  , image    = require('./routes/image')
  , http     = require('http')
  , path     = require('path')
  , easyimg  = require('easyimage')
  , mime     = require('mime')
  , fs       = require('fs')
  , hogan    = require('hogan.js')
  , compress = require('node-minify')
  , pool     = require('./src/pool');



// Config

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.engine('.ejs', require('ejs').__express);
	// app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	// app.use(express.static(path.join(__dirname, 'public'), { maxAge: 1209600000 })); // 86400000 1 day; 1209600000 14 days
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});






/* Routes */

// app.get('/cache.manifest', function(req, res){
//   fs.readFile('./cache.manifest', function(error, content) {
//     res.header('Content-Type', 'text/cache-manifest');
//     res.end(content);
//   })
// });

app.get('/i/:size/:image', image.index);
app.get('/', routes.index);
app.get('/:page', function(req, res) {
    res.redirect('/');
});


var server = http.createServer(app)
server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});




/**
 **  Template Compilation
 **/

function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

var templateDir = './templates/',
    template,
    templateKey,
    result = 'var $t = {};';

fs.readdirSync(templateDir).forEach(function(templateFile) {

    template = trim(fs.readFileSync(templateDir + templateFile, 'utf8'));
    templateKey = templateFile.substr(0, templateFile.lastIndexOf('.'));

    result += '$t["'+templateKey+'"] = ';
    result += 'new Hogan.Template(' + hogan.compile(template, {asString: true}) + ');'

});

fs.writeFile('./public/javascripts/templates.js', result, 'utf8');




/**
 **  JS minification
 **/

compress.minify({
    type: 'uglifyjs',
    fileIn: [
        'public/javascripts/foundation/modernizr.foundation.js'
      , 'public/javascripts/libs/fastclick.js'
      , 'public/javascripts/libs/keyboard.min.js'
      , 'public/javascripts/libs/jquery.min.js'
      , 'public/javascripts/foundation/jquery.foundation.topbar.js'
      , 'public/javascripts/foundation/app.js'
      , 'public/javascripts/util.js'
      , 'public/javascripts/libs/delivery.js'
      , 'public/javascripts/uploader.js'
      , 'public/javascripts/templates.js'
      , 'public/javascripts/header.js'
      , 'public/javascripts/loading.js'
      , 'public/javascripts/darkroom.js'
      , 'public/javascripts/photos.js'
      , 'public/javascripts/app.js'
      , 'public/javascripts/main.js'
    ],
    fileOut: 'public/javascripts/app.min.js',
    callback: function(err){
        if (err) {
          console.log(err);
          process.exit();
          return;
        }
        startApp();
    }
});




/**
 **  App Initialization
 **/

function startApp() {
  pool.init(server);
}
