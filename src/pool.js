
var socketio = require('socket.io')
  , dl       = require('delivery/lib/delivery.server')
  , easyimg  = require('easyimage')
  , uuid     = require('node-uuid')
  , fs       = require('fs')
  , queue    = require('./queue');



var STATIC_DIR = 'public/'
  , UPLOAD_DIR = 'images/uploads/'
  , ORIG_DIR   = 'orig/'
  , IMAGE_DIR  = 'image'
  , SCRIPT_DIR = __dirname + '/';

var ORIG_PATH  = STATIC_DIR + UPLOAD_DIR + ORIG_DIR;


/**
 **  Util
 **/

var logOn = true;
function info() {
	if (!logOn) return;
	var args = Array.prototype.slice.call(arguments);
	args.forEach(function(msg) {
		console.log('INFO: ' + msg);;
	});
}




/**
 **  Files
 **/

function FileSystem() {
	this.runIndex();
}

FileSystem.prototype.runIndex = function() {
	// analyze files and populate our virtual file index
	this.files = fs.readdirSync( ORIG_PATH )

		.map(function( filename ) { 
			return {
				name: filename,
				time: fs.statSync(ORIG_PATH + filename).mtime.getTime()
			}; 
		})
		.sort(function(a, b) { return a.time - b.time });

	this.filenames = this.files.map(function( file ) {
						 return file.name
					 });
}

FileSystem.prototype.getFilenames = function(date) {
	
	// if no date was specified, return all
	if (!date) {
		return this.files.map(function( file ) {
			return file.name
		});
	}

	// else return all files modified after the specified date
	return this.files.filter(function( file ) {
		return file.time > date
	}).map(function( file ) {
		return file.name
	});

}

FileSystem.prototype.uploadJob = function(file, next) {
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
			next();

			// announce a new image to all clients
			pool.io.sockets.emit('photos.new', [new_filename]);
			pool.fs.runIndex();

		});
	});
}

FileSystem.prototype.saveImage = function(file) {
	queue.addJob(this.uploadJob, file);
}




/**
 **  User
 **/

function User(socket) {
	this.socket = socket;
	this.id = socket.id;

	// requests coming from the client
	socket.on('photos', pool.photos.bind(pool));
}




/**
 **  Pool
 **/

function Pool(server) {
	var self = this;

	self.users = {};
	self.fs = new FileSystem();
}

Pool.prototype.init = function(server) {
	var self = this;

	// Socketssss
	self.io = socketio.listen(server);
	self.io.set('log level', 1);
	self.io.sockets.on('connection', self.onConnection.bind(self));
}

Pool.prototype.onConnection = function(client) {

	// keep track of user
	var user = new User(client);
	this.users[client.id] = user;

	// File Delivery
	this.delivery = dl.listen(client);
	this.delivery.on('receive.success', this.fs.saveImage.bind(this.fs));

	// notify everyone
	info(client.id + ' joined');

	// attach events to client socket connection
	client.on('disconnect', this.onDisconnect.bind(this, user));
}

Pool.prototype.onDisconnect = function(client) {

	// free up some memory
	delete this.users[client.id];

	// notify
	info(client.id + ' left');
}




// Requests

Pool.prototype.photos = function(meta, ack) {
	var files = this.fs.getFilenames(meta.date);
	ack(files);
}




// Exports

module.exports = pool = new Pool();