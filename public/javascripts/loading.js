
//
// Loading Section
// -----------------------

function Loading(parent) {

    // Root Element
    this.$el = parent.$el.find('#loading');

}

Loading.prototype.hide = function() {
    this.$el.hide();
}