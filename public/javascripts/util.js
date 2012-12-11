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

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
(function(){var d=!1,g=/xyz/.test(function(){xyz})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(b){function c(){!d&&this.init&&this.init.apply(this,arguments)}var e=this.prototype;d=!0;var f=new this;d=!1;for(var a in b)f[a]="function"==typeof b[a]&&"function"==typeof e[a]&&g.test(b[a])?function(a,b){return function(){var c=this._super;this._super=e[a];var d=b.apply(this,arguments);this._super=c;return d}}(a,b[a]):b[a];c.prototype=f;c.prototype.constructor=c;c.extend=arguments.callee;
return c}})();