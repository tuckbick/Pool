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
      this.$file_input = this.$el.find('#file-input');
      this.$add_photos = this.$el.find('#add-photos');
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
   **  IMAGES LIST VIEW
   **/

  var ImagesView = Backbone.View.extend({

    list_template: _.template($('#images-template').html()),
    item_template: _.template($('#image-template').html()),

    render: function() {
      var self = this
        , size = self.options.thumb_size;

      var items = _.map(self.data.images, function(filename) {
        return self.item_template({ size: size, filename: filename })
      });

      var html = self.list_template({
        items: items.join('')
      });
      self.p.$el.append(html);
    },

    addNew: function(file_name) {
      var html = this.item_template({ size: this.options.thumb_size, filename: file_name })
      $('#images-list').append(html);
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
      self.images = new ImagesView({ thumb_size: thumb_size });
      self.images.p = self;
    },

    socketConnected: function() {
      var self = this;

      socket.emit('images', function() {
        self.renderImages.apply(self, arguments);
      });

      socket.on('image.new',function(path){
        self.images.addNew(path);
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
        self.reset();
        return;
      }

      self.startUploads();
    });

    this.reset();
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
    self.startUploads();
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

    // Let the app know the socket is now available
    Pool.socketConnected.apply(Pool, arguments);

  });


});