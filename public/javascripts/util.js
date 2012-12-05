(function($) {

	var o = $({});

	$.subscribe = function() {
		o.on.apply(o, arguments);
	};

	$.unsubscribe = function() {
		o.off.apply(o, arguments);
	};

	$.publish = function() {
		console.log('triggered: '+arguments[0]);
		o.trigger.apply(o, arguments);
	};

}(jQuery));

var bindAll = function(obj) {
	var funcs = Array.prototype.slice.call(arguments, 1);
	funcs.forEach(function(f) { obj[f] = obj[f].bind(obj) })
	return obj;
};