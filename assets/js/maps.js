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

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
    return query_string;
}();
window.QueryString = QueryString;

// Form input clearable
function tog(v){return v?'addClass':'removeClass';} 
$(document).on('input', '.clearable', function(){
    $(this)[tog(this.value)]('x');
}).on('mousemove', '.x', function( e ){
    // $(this)[tog(this.offsetWidth-18 < e.clientX-this.getBoundingClientRect().left)]('onX');
}).on('touchstart click', '.onX', function( ev ){
    ev.preventDefault();
    $(this).val('').change();
});

// ==========================

/**
 * Define a namespace for the application.
 */
window.app = window.app || {};
var app = window.app;

/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
app.RotateNorthControl = function(opt_options) {

    var options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = 'C';

    var this_ = this;
    var handleRotateNorth = function() {
        var view = this_.getMap().getView();
        function elastic(t) {
          return Math.pow(2, -25 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
        }
        var pan = ol.animation.pan({
            duration: 2000,
            easing: elastic,
            source: /** @type {ol.Coordinate} */ (view.getCenter())
        });
        map.beforeRender(pan);

        app.direction_input = {
            from: {
                id: 'start_point',
                geoloc: app.default_routing_start,
                information: {
                        "TenDoanhNghiep": "Vị trí hiện tại"
                }
            },
            to: null
        };

        document.getElementById('from_place').value = app.direction_input.from && app.direction_input.from.information ? app.direction_input.from.information.TenDoanhNghiep : '';
        document.getElementById('to_place').value = app.direction_input.to  && app.direction_input.to.information ? app.direction_input.to.information.TenDoanhNghiep : '';

        view.setCenter(app.default_routing_start);
        view.setZoom(2.5);
    };

    button.addEventListener('click', handleRotateNorth, false);
    button.addEventListener('touchstart', handleRotateNorth, false);

    var element = document.createElement('div');
    element.className = 'rotate-north ol-control';
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
    for (var i = 0; i < raw.length - 1; i += 2) {
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

    var form_point = input.from;
    var to_point = input.to;
    var result = [];

    if (!form_point || !to_point) return result;

    console.log('start search ...');

    var start_point_in_route = app.getGeoLoc(form_point);   
    // console.log('Start route from: ', form_point, ' => ', start_point_in_route);

    // Fix <to> point not near any route 
    var end_point_in_route = app.getGeoLoc(to_point);

    console.info('Target: ', end_point_in_route);

    // if (!end_point_in_route) return;

    var results = [[form_point]];
    var point = start_point_in_route;

    var shortest = 0;
    var is_finish = false;
    var lasted_result = null;
    var loop_count = 0;
    var result_index = -1;

    while (true) {
        // console.info(' >>>>>>> loop ', loop_count++, '');
        var is_change = false;
        var new_results = [];


        var shortest_index = 0;
        var shortest_l = getLengthOfRoute(results[0]);
        // console.log("results here", JSON.stringify(results));
        for (var i in results) {
            var p = results[i];
            var length = getLengthOfRoute(p); // int 

            if (length < shortest_l) {
                shortest_l = length;
                shortest_index = i;
            }
        }

        var p = results[shortest_index];
        var length = p ? p.length : 0;
        console.info("last point: ", shortest_index, p, length);
        var last_point = p[length - 1]; 
        var nexts = getNext(last_point); console.info('Next:::', nexts);
        
        if (!app.isNear(last_point, to_point) && nexts) {
            for (var j in nexts) { 
                if (!isExists(p, nexts[j])) {
                    is_change = true;
                    var new_current_path = JSON.parse(JSON.stringify(p));

                    console.log('getChildPathOf(',last_point, nexts[j] ,')', getChildPathOf(last_point, nexts[j]))
                    var child = getChildPathOf(last_point, nexts[j]);
                    if (child) {
                        for (var jj in child) {
                            new_current_path.push(child[jj]);
                        }
                    }
                    console.log('After push: ', new_current_path)

                    new_current_path.push(nexts[j]);
                    // console.error(' ~~~~~~~~~~~> ', new_current_path);
                    new_results.push(new_current_path);
                }
            }
        }

        if (new_results.length == 0 && !app.isNear(last_point, to_point)) {
            // console.log(' !! nexts', nexts, last_point);
           is_change = true;
        }

        for (var i in results) {
            if (is_change)
            {
                if(i!=shortest_index) new_results.push(results[i])
            }
            else {
                new_results.push(results[i])
            }

        }

        // console.log('2. Result >>>', results);
        results = new_results;

        if (!is_change) {
            result_index = -1;

            var shortest_index = 0;
            var shortest_l = getLengthOfRoute(results[0]);
            // console.log("results here", JSON.stringify(results));
            for (var i in results) {
                var p = results[i];
                var last_point = p[p.length - 1];
                var length = getLengthOfRoute(p); // int 

                if ((length < shortest_l || result_index == -1) && app.isNear(last_point, to_point)) {
                    shortest_l = length;
                    shortest_index = i;
                    result_index = i;
                }
            }

            break;
        }
    }

    console.log('result: shortest_index', result_index, results)

    // getRoute([form_point], form_point);
    var result = results[result_index];
    // var result = getFullPath(result);
    // result.push(to_point);
    console.info(' Last result : =================> ', result);

    // TODO: Fix here
    // result = getFullPath(result);

    return result;

    function isExists(route, point) {
        for (var i in route) {
            if (app.isNear(point, route[i])) return true;
        }

        return false;
    }

    function getRoute(route, point, ignore) {
        var nexts = getNext(point, ignore);

        for (var i in nexts) {
            var next = nexts[i];

            // var d = app.distance(to_point, next);
            // console.error(' ===> ', d)

            if (app.isNear(to_point, next, 20)) {
                route.push(next);

                // Get finish point 
                route.push(to_point);

                results.push(route);

                console.log('results: ', results);
            } else {
                route_new = JSON.parse(JSON.stringify(route));
                route_new.push(next);
                getRoute(route_new, next, [point]);
            }
        }
    }

    function getNext(point, ignore) {
        var nexts = [];
        ignore = ignore || [];
        for (var i in app.route) {
            if (app.isNear(app.route[i].start, point) 
                && app.checkIgnore(app.route[i].next, ignore)) 
                nexts.push(app.route[i].next);
        }

        return nexts;
    }

    function getBestResult(results) {
        if (!results) return [];
        var result = results[0];
        var best_distance = getDistanceOfRoute(result);
        var l = results.length;

        for (var i = 1; i < l; i++) {
            var d = getDistanceOfRoute(results[i]);
            if (d < best_distance) {
                best_distance = d;
                var result = results[i];
            }
        }

        console.log(' => ', best_distance * 5 , 'm');

        return result;
    }

    function getFullPath (route) {
        var full = [];
        var l = route.length; console.log('route', route)
        for (var i = 0; i < l; i++) {
            if (route[i] && route[i + 1])
                full = merge(full, [route[i]]);
                full = merge(full, getChildPathOf(route[i], route[i + 1]));
                
                full = merge(full, [route[i + 1]]);
        }

        return full;
    }

    function merge(arr1, arr2) {
        var arr = arr1 || [];
        
        for (var i in arr) {
            for (var j in arr2) {
                arr.push(arr2[j]);
            }
        }

        return arr;
    }

    function getChildPathOf(from, to) {
        for (var i in app.route) {
            if (app.route[i] && app.isNear(app.route[i].start, from) && app.isNear(app.route[i].next, to)) {
                return app.route[i].points;
            }
        }

        return [];
    }

    function getLengthOfRoute(route) {
        var distance = 0;
        if (!route) return distance;

        var l = route.length;
        for (var i = 0; i < l; i++) {
            if (typeof route[i] != 'undefined' && typeof route[i + 1] != 'undefined')
                distance += app.distance(route[i], route[i + 1]);
        }

        return distance;
    }
}

app.getGeoLoc = function(point) {
    var min_value = 10.0;
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
    if (!a || !b) return 0;
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

app.isNear = function(a, b, distance) {
    distance = distance || 10.0;
    return this.distance(a, b) < distance;
}

app.checkIgnore = function (a, ignore_list) {
    for (var i in ignore_list) {
        if (this.isNear(ignore_list[i], a,20)) return false;
    }

    return true;
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
    // app.arrayPointToRouterGeneratorTools(t2_data, true);   
}

/**/

      app.buildingBlockStyle = new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: '#319FD3',
          width: 1
        }),
        text: new ol.style.Text({
          font: '12px Calibri,sans-serif',
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          })
        })
      });

/* Get direction to point */
window.getDirectionTo = app.getDirectionTo = function(long, lat, e ) {
    e.preventDefault();
    $('#popup').popover('hide');

    if (!app.direction_input.from || !app.direction_input.to) {

        return;
    }

    // app.direction_data

    // if (!app.default_routing_start || !long || !lat) return false;
    // var point = [];
    // point.push(long); 
    // point.push(lat);

    // console.log({from: app.default_routing_start, to: point});



    var direction = app.getDirection({from: app.direction_input.from.geoloc, to: app.direction_input.to.geoloc});

    // console.log('  ~> ', JSON.stringify( [direction]))

    // Start draw direction
    map.removeLayer(app.vector_direction); // Remove old 
    var vectorSource = new ol.source.Vector();
    vectorSource.addFeature(new ol.Feature(
        new ol.geom.MultiLineString([ direction ])
    ));
    app.vector_direction = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#679DF6',
                width: 6,
                lineCap: 'round'
            }),
            fill: new ol.style.Fill({
                color: '#FFF'
            })
        }) 
    });
    map.addLayer(app.vector_direction);
}

/* View information  */

function closeAllModal () {
    console.log('Close button');
    $('#modal').modal('hide');
}

$('.modal-open').on('click touchstart', closeAllModal);

window.modalView = app.modalView = function(id, data, e) {
    e.preventDefault();
    $('#popup').popover('hide');
    $('#modal').modal('show');

    // console.log('>>>>>>', data)

    // // var enterprise = searchEnterprise(id);
    // if (data) {
    //     $('.enterprise_nodata').hide();
    //     $('.enterprise_info').show();

    //     $('#TenDoanhNghiep').html(data.TenDoanhNghiep || '');
    //     $('#TenDuAnDauTu').html(data.TenDuAnDauTu || '');
    //     $('#LinhVucHoatDong').html(data.LinhVucHoatDong || '');
    //     $('#DiaChiTrongKhu').html(data.DiaChiTrongKhu || '');
    //     $('#DienThoai').html(data.DienThoai || '');
    //     $('#Website').html(data.Website || '');
    // } else {
    //     $('.enterprise_nodata').show();
    //     $('.enterprise_info').hide();
    // }
}

/**
 * Search enterprise from ID in address
 */
window.searchEnterprise = function(id_or_something) {
    if (!window.app.enterprise) return false;
    for (var i in window.app.enterprise.enterprise) {
        var item = window.app.enterprise.enterprise[i];

        if (item && item.DiaChiTrongKhu && item.DiaChiTrongKhu.indexOf(id_or_something) > -1) return item;
    }
    return false;
}

/**
 * Get geodata from ID
 */
app.getGeoDataFromBlockID = function(id) {
    for (var i in window.app.enterprise_geodata.features) {
        var item = window.app.enterprise_geodata.features[i];
        if (item.id == id) return item;
    }

    return false;
}

/**
 * Get postion and move to center 
 */
app.getAndMoveTo = function(enterprise ) {
    if (!enterprise) return false;

    var center = enterprise.properties.gateway;
    console.log('Step 4: ', center);

    function elastic(t) {
      return Math.pow(2, -25 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    }
    var pan = ol.animation.pan({
        duration: 2000,
        easing: elastic,
        source: /** @type {ol.Coordinate} */ (view.getCenter())
    });
    map.beforeRender(pan);
    
    view.setCenter(center);
    var element = popup.getElement();
    var coordinate = center;
    $(element).popover('destroy');
    popup.setPosition(coordinate);
    $(element).popover({
      'placement': 'top',
      'animation': true,
      'html': true,
      'content': '<div class="popup-button"><a href="#" class="btn btn-custom" id="view_info" onClick="modalView(\''+ enterprise.id +'\', event)">Thông tin</a>\
        <a href="#" id="get_direction" class="btn btn-custom" onClick="addSearchPlace(\''+ enterprise.id +'\', '+ enterprise.properties.gateway +', event)">Chỉ đường đến đây</a></div>'
    });
    $(element).popover('show');
}

function addSearchPlace(block_id, long, lat, e) {
    // document.getElementById('to_place').value = block_id;
    getDirectionTo(long, lat, e);
}

app.getBlockIdFromAddress = function(address) {
    if (!address) return '';
    var block_id = null;

    if (!block_id) block_id = address.match(/([A-z]-[0-9]{1,2}[a-z]-[0-9]{1,2}[a-z]?)\s?/i);  // I-1d-2
    if (!block_id) block_id = address.match(/([A-z]-[A-z]?[0-9]{1,2})\s?/i); // I-10
    if (!block_id) block_id = address.match(/([A-z][0-9]{1,2}(\.[0-9])?-[A-z][0-9]{1,2})\s?/i);
    if (!block_id) block_id = address.match(/([A-z][0-9]{1,2}-[A-z][0-9]{1,2})\s?/i);
    if (!block_id) block_id = address.match(/[A-z][0-9]{1,2}[a-z]?(-)?\s?/i);
    if (!block_id) block_id = address.match(/([A-z][0-9]{1,2}[a-z]?-[A-z]-[0-9])\s?/i);
    if (!block_id) block_id = address.match(/([A-z][0-9]{1,2}[a-z]?-[0-9\.a-z]{1,4})\s?/i);
    if (!block_id) block_id = address.match(/([A-z][0-9]{1,2})\s?/i);

    if (block_id) return block_id[0];

    return '';
}

app.getCenterPointOfBlock = function(points) {
    var x = 0, nx = 0;
    var y = 0, ny = 0;

    for (var i in points) {
        var point = points[i];
        if (point[0] && point[1]) {
            x += point[0]; nx++;
            y += point[1]; ny++;
        }
    }

    if (nx > 0) return [x / nx, y / ny]
    return [0, 0];
}