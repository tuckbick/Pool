
//
// Photos Section
// -----------------------

function Photos(parent) {

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
}

Photos.prototype.handleClick = function(e) {
	var id = parseInt($(e.currentTarget).data('id'))
	  , photo = this.list[id];

	app.darkroom.showPhoto(photo);
}

Photos.prototype.reset = function(e, filenames) {
	filenames || (filenames = []);
	app.loading.hide();
	this.list = [];
	this.list_id = 0;
	this.$ul.empty();
	this.addAll(filenames);
}

Photos.prototype.addAll = function(e, filenames) {
	if (e instanceof Array) {
		filenames = e;
	}
	filenames.forEach(this.addOne);
}

Photos.prototype.addOne = function(filename) {
	this.list.push(new Photo(filename, this.list_id));
	this.list_id += 1;
}


// Photo

function Photo(filename, id) {
	this.filename = filename;
	this.id = id;
	this.thumb = new Thumbnail(this);
}


// Thumbnail

function Thumbnail(photo) {
	this.photo = photo;
	this.src = this.src();
	this.load();
}

Thumbnail.prototype.template = $t['thumb'];

Thumbnail.prototype.size = 'thumb';
Thumbnail.prototype.src = function() {
	return '/i/' + this.size + '/' + this.photo.filename;
}

Thumbnail.prototype.load = function() {
	this.render({ id: this.photo.id, src: 'images/loading_sml_img.gif' });
	var self = this
	  , img = new Image();
	img.src = this.src;
	img.onload = self.render.bind(self, { id: self.photo.id, src: img.src });
}

Thumbnail.prototype.render = function(data) {
	var html = this.template.render(data);
	if (!this.$el) {
		this.$el = $(html);
		app.photos.$ul.append(this.$el);
	} else {
		this.$el.replaceWith(html);
	}
}