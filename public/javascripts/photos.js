
//
// Photos Section
// -----------------------

function Photos(parent) {

	// Root Element
	this.$el = parent.$el.find('#photos');
	this.$ul = this.$el.find('#photos-list');

	// always execute these methods in this context
	bindAll(this, 'addOne', 'reset', 'addAll');

	// Events
	$.subscribe('photos.reset', this.reset);
	$.subscribe('photos.new', this.addAll)
}

Photos.prototype.reset = function(e, filenames) {
	filenames || (filenames = []);
	app.loading.hide();
	this.images = [];
	this.$ul.empty();
	this.addAll(filenames);
}

Photos.prototype.addAll = function(filenames) {
	filenames.forEach(this.addOne);
}

Photos.prototype.addOne = function(filename) {
	this.images.push(new Photo(filename))
}


// Photos

function Photo(filename) {
	this.filename = filename;
	this.thumb = new Thumbnail(filename);
	this.thumb.load();
}


// Thumbnail

function Thumbnail(filename) {
	this.filename = filename;
	this.src = this.src();
}

Thumbnail.prototype.placeholder = $t['thumb-loading'].render();
Thumbnail.prototype.size = 160;
Thumbnail.prototype.src = function() {
	return '/i/' + this.size + '/' + this.filename;
}

Thumbnail.prototype.load = function() {
	this.renderPlaceholder();
	var self = this
	  , img = new Image();
	img.src = this.src;
	img.onload = self.showImage.bind(self, { src: img.src });
}

Thumbnail.prototype.renderPlaceholder = function() {
	this.$el = $(this.placeholder);
	app.photos.$ul.append(this.$el);
}

Thumbnail.prototype.showImage = function(data) {
	var $li = $($t['thumb'].render(data));
	this.$el.replaceWith($li);
	this.$el = $li;
}