var Point = function(x, y) {
}

var Block = function(array_points, root_point, information) {
	var block_info =  {
		points: array_points, 
		root_point: root_point,
		information
	};

	function getPoints() {
		return block_info.points;
	}

	return block_info;
}

/**
 * Define a namespace for the application.
 */
window.app = {};
var app = window.app;

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
app.RotateNorthControl = function(opt_options) {

    var options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = 'N';

    var this_ = this;
    var handleRotateNorth = function() {
        this_.getMap().getView().setRotation(0);
    };

    button.addEventListener('click', handleRotateNorth, false);
    button.addEventListener('touchstart', handleRotateNorth, false);

    var element = document.createElement('div');
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(button);

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};
ol.inherits(app.RotateNorthControl, ol.control.Control);

app.getBlockPoint = function(e) {
    if (!e) return false;
    var result = [];

    var raw = e.feature.G.geometry.A;
    for (var i = 0; i < raw.length / 2 + 2; i+=2) {
        result.push({x: raw[i], y: raw[i+1]});        
    }

    return result;
}