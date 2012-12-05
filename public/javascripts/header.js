
//
// Header Section
// -----------------------

function Header(parent) {

    // Root Element
    this.$el = parent.$el.find('#header');
    this.$file_input = this.$el.find('#file-input');

    bindAll(this, 'openDialog', 'onFileChange');

    // Events
    this.$el.find('#add-photos').on('click', this.openDialog);
    this.$file_input.on('change', this.onFileChange);

}

Header.prototype.openDialog = function() {
    this.$file_input.click();
}

Header.prototype.onFileChange = function(e) {
    this.uploadImages(this.$file_input.get(0).files);
    this.$file_input.val('');
}

Header.prototype.uploadImages = function(files) {
    
}