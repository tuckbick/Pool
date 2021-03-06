
//
// Darkroom Overlay
// -----------------------

var Darkroom = Class.extend({

	init: function(parent) {
		var self = this;

		// Root Element
		self.$el = parent.$el.find('#darkroom');
		self.$stage = self.$el.find('#stage');
		self.$img = self.$stage.find('img');

		// UI
		self.controls = new Controls(self);

		var throttle;
		$(window).on('resize', function(e) {
			if (!self.visible) return;
			clearTimeout(throttle);
			setTimeout(self.fitImage.bind(self, e), 200);
		});

		self.$el.on('touchmove', function(e) {
			e.preventDefault();
		});
	},

	size: 'large',
	fitImage: function() {
		this.$stage.css({
			lineHeight: window.innerHeight + 'px'
		});
		this.current_photo.large.$el.css({
			maxWidth: window.innerWidth,
			maxHeight: window.innerHeight
		});
	},

	toggle: function() {
		var self = this;

		self.visible = !self.visible;

		if (self.visible) {
			self.$el.css('zIndex','9999');
		} else {
			setTimeout(function() {
				self.$el.css('zIndex','-9999');
			}, 250) // same as css transition length
		}
		this.$el.toggleClass('show', this.visible);
	},

	show: function() {
		if (this.visible) return;
		history.pushState({ page: 'darkroom', data: {} }, document.title = app.title + ' - Darkroom', app.href + 'darkroom');
		this.controls.registerActivity();
		this.toggle();
	},

	showPhoto: function(photo) {
		this.show();
		if (!photo.large) {
			photo.large = new LargePhoto(photo);
		} else {
			photo.large.load();
		}
		this.current_photo = photo;
		this.fitImage();
	}

});




//
// Darkroom Controls
// -----------------------

var Controls = Class.extend({

	init: function(parent) {
		var self = this;

		// Root Element
		self.$el = parent.$el.find('#controls');
		self.$play = self.$el.find('#go-play');
		self.$stop = self.$el.find('#go-stop');
		self.$left = self.$el.find('#go-left');
		self.$home = self.$el.find('#go-home');
		self.$right = self.$el.find('#go-right');

		// Always execute these methods in this context
		bindAll(this, 'handleLeft', 'handleBack', 'handleRight', 'handlePlay', 'handleStop');

		// Events
		self.$el.on('click', '#go-left', this.handleLeft)
				.on('click', '#go-play', this.handlePlay)
				.on('click', '#go-stop', this.handleStop)
				.on('click', '#go-home', this.handleBack)
				.on('click', '#go-right', this.handleRight);

		// 'popstate' occurs when we press the browser or the UI back button
		window.addEventListener('popstate', function(e) {
			if (!e.state) return;
			if (e.state.page !== 'darkroom') {
				parent.toggle();
			}
		});

		// Set up 'sleep' functionality
		parent.$el.on('mousemove touchmove', this.registerActivity.bind(this));
		parent.$el.on('click', this.toggle.bind(this));

		self.$el.on('click', function(e) {
			e.stopPropagation();
		});

		KeyboardJS.on('left', self.handleLeft);
		KeyboardJS.on('esc', self.handleBack);
		KeyboardJS.on('right', self.handleRight);
	},

	handleLeft: function() {
		var len = app.photos.list.length
		  , id = app.darkroom.current_photo.id - 1;
		id = (id + len) % app.photos.list.length;
		app.darkroom.showPhoto(app.photos.list[id]);
	},

	handlePlay: function() {
		this.playInterval = setInterval(this.handleRight, 10000);
		this.$play.toggleClass('hide');
		this.$stop.toggleClass('hide');
	},

	handleStop: function() {
		clearInterval(this.playInterval);
		this.$play.toggleClass('hide');
		this.$stop.toggleClass('hide');
	},

	handleBack: function() {
		history.back();
	},

	handleRight: function() {
		var len = app.photos.list.length
		  , id = app.darkroom.current_photo.id + 1;
		id = (id + len) % app.photos.list.length;
		app.darkroom.showPhoto(app.photos.list[id]);
	},

	registerActivity: function() {
		if (!this.showing) {
			this.show();
		}
		clearTimeout(this.activityTimeout);
		this.activityTimeout = setTimeout(this.hide.bind(this), 4000);
	},

	toggle: function() {
		this.showing ? this.hide() : this.registerActivity();
	},
	show: function() {
		this.showing = true;
		this.$el.stop(true, false).animate({ bottom: 0 }, 100, 'linear');
	},
	hide: function() {
		this.showing = false;
		this.$el.stop(true, false).animate({ bottom: -this.$el.height() }, 100, 'linear');
	}

});