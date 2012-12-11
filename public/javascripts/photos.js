
//
// Photos Section
// -----------------------

var Photos = Class.extend({

	init: function(parent) {

		// Root Element
		this.$el = parent.$el.find('#photos');
		this.$ul = this.$el.find('#photos-list');

		// Always execute these methods in this context
		bindAll(this, 'addOne', 'reset', 'addAll', 'handleClick');

		// Events
		$.subscribe('photos.reset', this.reset);
		$.subscribe('photos.new', this.addAll);
		$.subscribe('upload.end', parent.uploader.reset.bind(parent.uploader));
		this.$ul.on('click', 'li', this.handleClick);
	},

	handleClick: function(e) {
		var id = parseInt($(e.currentTarget).data('id'))
		  , photo = this.list[id];

		app.darkroom.showPhoto(photo);
	},

	reset: function(e, filenames) {
		filenames || (filenames = []);
		app.loading.hide();
		this.list = [];
		this.list_id = 0;
		this.$ul.empty();
		this.addAll(filenames);
	},

	addAll: function(e, filenames) {
		if (e instanceof Array) {
			filenames = e;
		}
		filenames.forEach(this.addOne);
	},

	addOne: function(filename) {
		this.list.push(new Photo(filename, this.list_id));
		this.list_id += 1;
	},

});



//
// Photo
// -----------------------

var Photo = Class.extend({

	init: function(filename, id) {
		this.filename = filename;
		this.id = id;
		this.thumb = new ThumbPhoto(this);
	}

});



//
// Photo Size
// -----------------------

var PhotoSize = Class.extend({

	init: function(photo) {
		this.template = $t[this.size];
		this.photo = photo;
		this.src = this.src();
		this.load();
	},

	src: function() {
		return '/i/' + this.size + '/' + this.photo.filename;
	},

	load: function() {
		if (!this.$el) {
			this.render({ id: this.photo.id, src: this.loadingImg });
			var img = new Image();
			img.src = this.src;
			img.onload = this.render.bind(this, { id: this.photo.id, src: img.src });
		} else {
			this.render({ id: this.photo.id, src: this.src });
		}
	}

});



//
// ThumbPhoto, extends PhotoSize
// ------------------------------

var ThumbPhoto = PhotoSize.extend({

	size: 'thumb',
	loadingImg: '/images/loading_sml_img.gif',

	render: function(data) {
		var html = this.template.render(data);
		if (!this.$el) {
			this.$el = $(html);
			app.photos.$ul.append(this.$el);
		} else {
			this.$el.replaceWith(html);
		}
	}
	
});



//
// LargePhoto, extends PhotoSize
// ------------------------------

var LargePhoto = PhotoSize.extend({

	size: 'large',
	loadingImg: '/images/loading_black.gif',

	render: function(data) {
		var html = this.template.render(data);
		this.$el = $(html);
		app.darkroom.$stage.html(this.$el);
	}
	
});