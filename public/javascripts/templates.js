
//
// Images Section
// -----------------------

function Templates() {

    // Root Element
    var $root = $('#templates')
      , compiled = {}
      , self = this;

    $root.children().each(function(i, el) {
        compiled[el.id] = Hogan.compile(self.trim(el.innerHTML));
    });

    return compiled;
}

Templates.prototype.trim = function(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

var $t = new Templates();