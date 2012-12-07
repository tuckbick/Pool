
//
// Darkroom Overlay
// -----------------------

function Darkroom(parent) {
    var self = this;

    // Root Element
    self.$el = parent.$el.find('#darkroom');
    self.$stage = self.$el.find('.stage');
    self.$img = self.$stage.find('img');

    // UI
    self.controls = new Controls(self);

    var throttle;
    $(window).on('resize', function(e) {
        clearTimeout(throttle);
        setTimeout(self.fitImage.bind(self, e), 200);
    });

    self.$el.on('touchmove', function(e) {
        e.preventDefault();
    });

}
Darkroom.prototype.size = 'large';
Darkroom.prototype.fitImage = function() {
    this.$stage.css({
        lineHeight: window.innerHeight + 'px'
    });
    this.$img.css({
        maxWidth: window.innerWidth,
        maxHeight: window.innerHeight
    });
}

Darkroom.prototype.toggle = function() {
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
}

Darkroom.prototype.show = function() {
    if (this.visible) return;
    history.pushState({ page: 'darkroom', data: {} }, document.title = app.title + ' - Darkroom', location.href + 'darkroom');
    this.controls.registerActivity();
    this.toggle();
}
Darkroom.prototype.showPhoto = function(photo) {
    this.show();
    this.fitImage();
    this.$img.attr('src', '/i/' + this.size + '/' + photo.filename);
}




//
// Darkroom Controls
// -----------------------

function Controls(parent) {
    var self = this;

    // Root Element
    self.$el = parent.$el.find('#controls');
    self.$home = self.$el.find('.go-home');

    // Events
    self.$home.on('click', this.handleBack.bind(this));

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
}

Controls.prototype.handleBack = function(e) {
    history.back();
    e.preventDefault();
}

Controls.prototype.registerActivity = function(e) {
    if (!this.showing) {
        this.show();
    }
    clearTimeout(this.activityTimeout);
    this.activityTimeout = setTimeout(this.hide.bind(this), 4000);
}
Controls.prototype.toggle = function() {
    this.showing ? this.hide() : this.registerActivity();
}
Controls.prototype.show = function() {
    this.showing = true;
    this.$el.stop(true, false).animate({ bottom: 0 }, 100, 'linear');
}
Controls.prototype.hide = function() {
    this.showing = false;
    this.$el.stop(true, false).animate({ bottom: -this.$el.height() }, 100, 'linear');
}