$(function(){






  /**
   **  HEADER VIEW
   **/

  var HeaderView = Backbone.View.extend({

    events: {
      "click #add-photos" : "openFileDialog",
      "change #file-input": "readImages"
    },

    initialize: function(opt) {
      var self = this;
      self.$file_input = self.$el.find('#file-input');
      self.$add_photos = self.$el.find('#add-photos');
      self.$title = self.$el.find('.title');
      self.$status = self.$el.find('.status');
    },

    setupUploadEvents: function() {
      uploader.on('image.send', this.imageSend, this);
      uploader.on('batch.start', this.batchStart, this);
      uploader.on('batch.success', this.batchSuccess, this);
    },

    batchStart: function() {
      this.$add_photos.hide();
      this.$title.hide();
      this.$status.show();
    },

    imageSend: function() {
      this.updateName();
    },

    batchSuccess: function() {
      var self = this;
      self.updateName();
      setTimeout(function() {
        self.$status.hide();
        self.$title.show();
        self.updateName(' ');
        self.$add_photos.show();
      }, 2000);
    },

    updateName: function(text) {
      this.$status.text(text || uploader.status);
    },

    openFileDialog: function() {
      if (delivery === false) return;
      this.$file_input.trigger('click');
    },

    readImages: function(e) {
      this.p.readImages(e);
      e.target.value = '';
    }
  });






  /**
   **  THUMB IMAGE VIEW
   **/

  var ThumbImageView = Backbone.View.extend({

    loadingTemplate: $('#loading-template').html(),
    imageTemplate: _.template($('#image-template').html()),

    load: function() {
      var self = this
        , img = new Image();
      img.src = '/i/' + self.options.size + '/' + self.options.src;
      img.onload = function() {
        var html = self.imageTemplate({ size: self.options.size, src: img.src });
        self.$el.replaceWith(html);
      }
    },

    render: function() {
      var $el = $(this.loadingTemplate);
      this.setElement($el);
      this.load();
      return this;
    }
  });






  /**
   **  IMAGES LIST VIEW
   **/

  var ImagesView = Backbone.View.extend({

    initialize: function() {
      this.list = this.$el.find('#images-list');
    },

    render: function() {
      _.each(this.data.images, this.addOne, this);
    },

    addOne: function(src) {
      var thumb = new ThumbImageView({ size: this.options.thumb_size, src: src });
      this.list.append( thumb.render().el );
    }
  });






  /**
   **  APP VIEW
   **/

  var PoolApp = Backbone.View.extend({

    initialize: function() {
      var self = this;

      var thumb_size = self.getThumbSize();

      self.$templates = $('#templates');

      self.header = new HeaderView({ el: self.$el.find('#header') });
      self.header.p = self;
      self.loading = new Backbone.View({ el: self.$el.find('#loading') });
      self.images = new ImagesView({ el: self.$el.find('#images'), thumb_size: thumb_size });
      self.images.p = self;
    },

    socketConnected: function() {
      var self = this;

      socket.emit('images', function() {
        self.renderImages.apply(self, arguments);
      });

      socket.on('image.new',function(path){
        self.images.addOne(path);
      });
    },

    readImages: function(e) {
      uploader.uploadImages(e.target.files, this.header);
    },

    renderImages: function(data) {
      this.images.data = data;
      this.images.render();
      this.loading.remove();
    },

    // TODO: thumb size depends on device resolution ( pixel density * width )
    getThumbSize: function() {
      return 160;
    }
  });






  /**
   **  UPLOADER UTILITY
   **/

  function Uploader() {
    var self = this;

    delivery.on('send.success', function(file) {

      self.current_file += 1;

      // see if we are at the end of our queue
      if (self.current_file >= self.len) {
        self.status = 'Done uploading ' + self.len + ' photos!';
        self.trigger('batch.success');
        setTimeout(function() {
          self.reset();
        }, 2000);
        return;
      }

      self.startUploads();
    });

    self.reset();

    // pub/sub implementation
    self.actions = {};
  }

  Uploader.prototype.reset = function() {
    var self = this;

    self.running = false;
    self.current_file = 0;
    self.status = '';
    self.file_list = [];
    self.len = 0;
  }

  Uploader.prototype.startUploads = function() {

      var self = this
        , file = self.file_list[self.current_file];

      self.status = 'Uploading photo ' + (self.current_file+1) + ' of ' + self.len;
      self.trigger('image.send');

      delivery.send(file);
  }

  Uploader.prototype.uploadImages = function(files) {
    var self = this
      , len = files.length
      , i;

    for (i = 0; i < len; i += 1) {
      self.file_list.push(files.item(i));
    }
    self.len = len;

    if (self.running) return;
    self.running = true;

    /* kick off the file queue */
    self.trigger('batch.start');
    self.startUploads();
  }


  // pub/sub implementation
  Uploader.prototype.on = function(action, fn, context) {
    var self = this;
    if (!self.actions[action]) {
      self.actions[action] = [];
    }
    self.actions[action].push({
      fn: fn,
      ctx: context || this
    });
  }

  Uploader.prototype.trigger = function(action) {
    var self = this;
    if (!self.actions[action])
      return;
    var evts = self.actions[action]
      , len = evts ? evts.length : 0;
    while (len--) {
      var evt = evts[len];
      evt.fn.call(evt.ctx);
    }
    return this;
  }






  /**
   **  APP INITIALIZING
   **/

  // kick off app
  window.Pool = new PoolApp({ el: $('#content') });

  // request a socket connection
  var socket = io.connect()
    , delivery
    , uploader;

  socket.on('connect', function() {

    // make sure we aren't always calling socketConnected if the app reconnects
    if (socket.connected) return;
    socket.connected = true;

    delivery = new Delivery(socket);
    uploader = new Uploader();

    Pool.header.setupUploadEvents();

    // Let the app know the socket is now available
    Pool.socketConnected.apply(Pool, arguments);

  });


});