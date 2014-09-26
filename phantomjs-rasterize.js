// !! NOTE: This is a PhantomJS script, which is a runtime that operates
// within a much more restricted environment. Consult it's documentation before
// making any changes

var page = require('webpage').create();
var args = require('system').args;

var srcPath = args[1];
var dstPath = args[2];
var width = args[3];
var height = args[4];

page.viewportSize = {
    width: Number(width),
    height: Number(height)
};

page.open(srcPath, function(status) {
    if (status === 'error') {
        phantom.exit(1);
    }
    page.render(dstPath);
    phantom.exit();
});
