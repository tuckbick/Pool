
/**
 **  UPLOADER UTILITY
 **/

function Uploader(socket) {
	this.reset();
}

Uploader.prototype.setSocket = function(socket) {
	var self = this;

	self.delivery = new Delivery(socket);

	self.delivery.on('send.success', function(file) {

		self.current_file_idx += 1;

		// see if we are at the end of our queue
		if (self.current_file_idx >= self.queue_length) {
			$.publish('upload.end', self);
			return;
		}

		self.startUploads();
	});
}

/* remember to execute after every batch process */
Uploader.prototype.reset = function() {
	var self = this;

	self.running = false;
	self.current_file_idx = 0;
	self.file_list = [];
	self.queue_length = 0;
}

Uploader.prototype.startUploads = function() {

	var self = this
	  , file = self.file_list[self.current_file_idx];

	/* notify starting image xfer */
	$.publish('upload.xfer', self);

	self.delivery.send(file);
}

Uploader.prototype.uploadImages = function(files) {
	var self = this
	  , len = files.length
	  , i;

	if (self.running) return;
	self.running = true;

	for (i = 0; i < len; i += 1) {
		self.file_list.push(files.item(i));
	}
	self.queue_length = len;

	/* kick off the file queue */
	$.publish('upload.start', self);
	self.startUploads();
}