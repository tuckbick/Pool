
var socketio = require('socket.io')
  , dl       = require('delivery/lib/delivery.server')
  , fs       = require('fs');



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

// map fns
function filename(file) {
    return file.name
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
    this.io = socketio.listen(server);
    this.io.set('log level', 1);
    this.io.sockets.on('connection', this.onConnection.bind(this));
}

Pool.prototype.onConnection = function(client) {

    // keep track of user
    var user = new User(client);
    this.users[client.id] = user;

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