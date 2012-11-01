$(function(){



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
      if (this.p.delivery === false) return;
      this.$file_input.trigger('click');
    },

    readImages: function(e) {
      this.p.readImages(e);
      e.target.value = '';
    }
  });



  var ImagesView = Backbone.View.extend({

    template: _.template($('#images-template').html()),

    render: function() {
      var html = this.template(this.data);
      this.p.$el.append(html);
    },

    addNew: function(path) {
      $('#images-list').append('<li><img src="'+path+'" /></li>');
    }
  });



  var PoolApp = Backbone.View.extend({

    initialize: function() {
      var self = this;

      this.$templates = $('#templates');

      this.header = new HeaderView({ el: this.$el.find('#header') });
      this.header.p = this;
      this.loading = new Backbone.View({ el: this.$el.find('#loading') });
      this.images = new ImagesView();
      this.images.p = this;

      socket.emit('init.images', null, _.bind(this.renderImages, this));

      socket.on('announce.image',function(path){
        self.images.addNew(path);
      });

      this.render();
    },

    readImages: function(e) {

      Uploader.uploadFiles(e.target.files, this.header);

      // fr.onloadstart = function(e) {
      //   self.header.fileStart.call(self.header, e);
      // }
      // fr.onprogress = function(e) {
      //   self.header.fileProgress.call(self.header, e);
      // }
      // fr.onloadend = function(e) {
      //   self.header.fileEnd.call(self.header, e);
      // }
    },

    render: function() {
      this.header.render();
    },

    renderImages: function(data) {
      this.images.data = data;
      this.images.render();
      this.loading.remove();
    }
  });



  var Uploader = (function() {

    var uploadRunning = false;

    var uploadFiles = function(files) {

      var file_list = [];
      for (var i = 0; i < files.length; i += 1) {
        file_list.push(files.item(i));
      }

      if (uploadRunning) return;
      uploadRunning = true;

      startUploads(0, file_list);
    }

    var startUploads = function(i, file_list) {

      // see if we are at the end of the file list
      if (i >= file_list.length) {
        uploadRunning = false;
        return;
      }

      var file = file_list[i];
      var fr = delivery.send(file).reader;

      fr.onloadend = function() {
        i += 1;
        startUploads(i, file_list);
      }
    }

    return {
      uploadFiles: uploadFiles
    }
  })()



  var socket = io.connect(),
      delivery = new Delivery(socket);
  window.Pool = new PoolApp({ el: $('#content') });

});