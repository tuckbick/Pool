$(function(){

  var HeaderView = Backbone.View.extend({

    events: {
      "click #add-photos" : "openFileDialog",
      "change #file-input": "readImages"
    },

    initialize: function(options) {
      var self = this;

      this.$file_input = this.$el.find('#file-input');
      this.delivery = false;

      delivery.on('delivery.connect',function(delivery){
        self.delivery = delivery;
      });

      socket.on('announce.image',function(path){
        options.parent.images.addNew(path);
      });
    },

    openFileDialog: function() {
      if (self.delivery === false) return;
      this.$file_input.trigger('click');
    },

    readImages: function(e) {
      var file = this.$file_input.get(0).files[0];
      this.delivery.send(file);
    }
  });

  var ImagesView = Backbone.View.extend({

    initialize: function(options) {
      var self = this;

      this.template = _.template(options.parent.$templates.find('#images-template').html())
      this.perRow = 8;
      this.blanks = ['images/blank.gif','images/blank.gif','images/blank.gif','images/blank.gif','images/blank.gif','images/blank.gif','images/blank.gif'];

      socket.emit('init.images', null, function(data) {
        self.data = data;
        self.render(options.parent);          
      });
    },

    render: function(parent) {

      this.data.images = this.data.images.concat(this.blanks);

      var html = this.template(this.data);
      parent.$el.append(html);
      parent.loading.remove();
    }, 

    addNew: function(path) {
      $('#images-list').prepend('<li><img src="'+path+'" /></li>');
    }
  });

  var PoolApp = Backbone.View.extend({

    initialize: function() {
      var self = this;

      this.$templates = $('#templates');

      this.header = new HeaderView({ el: this.$el.find('#header'), parent: this });
      this.loading = new Backbone.View({ el: this.$el.find('#loading') });
      this.images = new ImagesView({ parent: this });
    }
  });

  // var socket = io.connect('http://localhost:3000');
  var socket = io.connect(),
      delivery = new Delivery(socket);
  window.Pool = new PoolApp({ el: $('#content') });

});