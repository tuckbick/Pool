
//
// App
// -----------------------

var App = Class.extend({

	init: function() {
		var self = this;

		// set the page title
		self.title = 'Pool';
		self.href = document.location.href

		// Set the History
		history.replaceState({ page: 'home', data: {} }, document.title = self.title, self.href);

		// Root Element
		self.$el = $('#content');

		// Uploader utility
		this.uploader = new Uploader();

		// Views
		self.header = new Header(self);
		self.loading = new Loading(self);
		self.photos = new Photos(self);
		self.darkroom = new Darkroom(self);

		// Last Updated
		self.updated = null;

		// Server Connection
		self.socket = io.connect();
		self.socket.on('connect', self.onConnection.bind(self));
		self.socket.on('photos.new', function(files) {
			var args = [files];
			$.publish('photos.new', args);
			self.updated = Date.now();
		});

		// Enable some FAAASSSSSST clicking on mobile devices
		window.addEventListener('load', function() {
			new FastClick(document.body);
		}, false);
	},

	onConnection: function() {
		this.uploader.setSocket(this.socket);
		this.requestPhotos();
	},

	requestPhotos: function() {
		var self = this;
		self.socket.emit('photos', { date: self.updated }, function(filenames) {
			var args = [filenames];
			if (!self.updated) {
				$.publish('photos.reset', args);
			} else {
				$.publish('photos.new', args);
			}
			self.updated = Date.now();
		});
	}

});