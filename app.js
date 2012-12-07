
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
 **  App Initialization
 **/

pool.init(server);
