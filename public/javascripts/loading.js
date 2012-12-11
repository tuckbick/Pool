
//
// Loading Section
// -----------------------

var Loading = Class.extend({

	init: function(parent) {

		// Root Element
		this.$el = parent.$el.find('#loading');

	},

	hide: function() {
		this.$el.hide();
	}
});