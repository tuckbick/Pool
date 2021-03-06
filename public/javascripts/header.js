
//
// Header Section
// -----------------------

var Header = Class.extend({

	init: function(parent) {

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
	},

	openDialog: function(e) {
		e.preventDefault();
		this.$file_input.click();
	},

	onFileChange: function(e) {
		e.preventDefault();
		app.uploader.uploadImages(this.$file_input.get(0).files);
		this.$file_input.val('');
		this.closeTopBar();
	},

	toggleMenuButton: function(show) {
		this.$toggle_topbar.toggleClass('hide', show);
	},

	closeTopBar: function() {
		if (this.$topbar.hasClass('expanded')) {
			this.$toggle_topbar.trigger('click');
		} 
	},

	toggleTitle: function(e, up) {
		var showTitle = !this.$title.hasClass('show') && !up.running;
		this.$title.toggleClass('show', showTitle);
		this.$status.toggleClass('show', !showTitle);
		this.toggleMenuButton(!showTitle);
	},

	setXferStatus: function(e, up) {
		this.$status.text('Uploading photo ' + (up.current_file_idx+1) + ' of ' + up.queue_length);
	},

	setDoneStatus: function(e, up) {
		this.$status.text('Done uploading ' + up.queue_length + ' photos!');
		setTimeout(this.toggleTitle.bind(this, null, up), 2000);
	}

});