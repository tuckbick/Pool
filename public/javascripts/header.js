
//
// Header Section
// -----------------------

function Header(parent) {

	// Root Element
	this.$el = parent.$el.find('#header');
	this.$topbar = this.$el.find('.top-bar');
	this.$title = this.$topbar.find('.title');
	this.$status = this.$topbar.find('.status');
	this.$toggle_topbar = this.$topbar.find('.toggle-topbar');
	this.$file_input = this.$topbar.find('#file-input');

	bindAll(this, 'openDialog', 'onFileChange', 'toggleTitle', 'setXferStatus', 'setDoneStatus');

	// UI Events
	this.$el.find('#add-photos').on('click', this.openDialog);
	this.$file_input.on('change', this.onFileChange);

	// Status Events
	$.subscribe('upload.start', this.toggleTitle);
	$.subscribe('upload.xfer', this.setXferStatus);
	$.subscribe('upload.end', this.setDoneStatus);
}

Header.prototype.openDialog = function() {
	this.$file_input.click();
}

Header.prototype.onFileChange = function(e) {
	this.uploadImages(this.$file_input.get(0).files);
	this.$file_input.val('');
	this.closeTopBar();
}

Header.prototype.uploadImages = function(files) {
	app.uploader.uploadImages(files);
}

Header.prototype.toggleMenuButton = function(show) {
	this.$toggle_topbar.toggleClass('hide', show);
}

Header.prototype.closeTopBar = function() {
	if (this.$topbar.hasClass('expanded')) {
		this.$toggle_topbar.trigger('click');
	} 
}

Header.prototype.toggleTitle = function(e, up) {
	var showTitle = !this.$title.hasClass('show') && !up.running;
	this.$title.toggleClass('show', showTitle);
	this.$status.toggleClass('show', !showTitle);
	this.toggleMenuButton(!showTitle);
}

Header.prototype.setXferStatus = function(e, up) {
	this.$status.text('Uploading photo ' + (up.current_file_idx+1) + ' of ' + up.queue_length);
}

Header.prototype.setDoneStatus = function(e, up) {
	this.$status.text('Done uploading ' + up.queue_length + ' photos!');
	setTimeout(this.toggleTitle.bind(this, null, up), 2000);
}