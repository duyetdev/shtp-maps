var Point = function(x, y) {}

var Block = function(id, gateway_point, information) {
    var block_info = {
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
window.app = window.app || {};
var app = window.app;

// Active debug
app.debug = true;

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
    for (var i = 0; i < raw.length / 2 + 2; i += 2) {
        var c = [];
        c.push(raw[i], raw[i + 1]);
        result.push(c);
    }

    return result;
}

/**
 * Get directions path, draw in maps
 */
app.getDirection = function(input) {
    if (!input) return false;

    var form_point = input.from.geoloc;
    var to_point = input.to.geoloc;
    var result = [];

    if (!form_point || !to_point) return result;

    console.log('start search ...');

    var start_point_in_route = app.getGeoLoc(form_point);   
    console.log('Gateway is: ', form_point, ' => ', start_point_in_route);

    var results = [];

    getRoute([], start_point_in_route);

    function getRoute(route, point) {
        var nexts = getNext(point);

        for (var i in nexts) {
            var next = nexts[i];

            if (app.isNear(to_point, next)) {
                route.push(next);
                results.push(route);
            } else {
                route.push(next);
                getRoute(route, next);
            }
        }
    }

    function getNext(point) {
        var nexts = [];
        for (var i in app.route) {
            if (app.isNear(app.route[i].start, point)) 
                nexts.push(app.route[i].next);
        }

        return nexts;
    }
}

app.getGeoLoc = function(point) {
    var min_value = 30.0;
    var nearest_point = null;

    point = point || [];

    for (var i in this.route) {
        var distance = this.distance(this.route[i].start, point);

        if (distance < min_value && 
                (nearest_point == null || 
                    (nearest_point != null && nearest_point.distance > distance)
                )
            )
            nearest_point = {
                point: this.route[i],
                distance: distance
            };
    }

    return nearest_point;
}

app.distance = function(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

app.isNear = function(a, b) {
    var d = this.distance(a, b);

    return d < 10;
}

/**
 * Array point to router tools 
 */
app.arrayPointToRouterGeneratorTools = function(data, is_reverse) {
    var t = { start: [], next: [], points: [/* [x, y] */], length: 0 };
    var t_data = JSON.parse(JSON.stringify(data));
    t.start = t_data.shift();
    t.next = t_data.pop();
    t.points = t_data;

    // Calc length 
    var l = 0;
    var data_length = data.length;

    for (var i = 0; i < data_length; i++) {
        var a = data[i];
        var b = data[i + 1];
        if (a && b) {
            l += Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
        }
    }    
    t.length = l;

    console.info('window.app.route.push(' + JSON.stringify(t) + '); ' + (is_reverse ? '/* reverse */': ''));
    if (is_reverse) return;

    var t2_data = [];
    for (var i = data_length - 1; i >= 0; i--) {
        if (data[i]) t2_data.push(data[i]);
    }
    app.arrayPointToRouterGeneratorTools(t2_data, true);   
}
