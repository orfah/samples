var Lyft = {};

    Lyft.map = new google.maps.Map( document.getElementById("map"), {
    	center: new google.maps.LatLng(37.78965206721971, -122.40148320794106),
    	mapTypeId: google.maps.MapTypeId.ROADMAP,
    	zoom: 15
    });
            
		Lyft.Directions = {};
		Lyft.Polylines = {};
		Lyft.Polylines.config = {
  		  clickable: false,
  		  strokeOpacity: 0.7,
  		  strokeWeight: 5
		};
		Lyft.Polylines.initialize = function() {
  		Lyft.Polylines.red   = $.extend({}, Lyft.Polylines.config, {strokeColor: '#e93a38'});
  		Lyft.Polylines.blue  = $.extend({}, Lyft.Polylines.config, {strokeColor: '#4848fb'});
  		Lyft.Polylines.green = $.extend({}, Lyft.Polylines.config, {strokeColor: '#75f429', zIndex:google.maps.Polyline.MAX_ZINDEX + 1, strokeWeight: 10});
		}();

    Lyft.MapConfig = {};
		Lyft.MapConfig.initialize = function() {
    		Lyft.MapConfig.rendererOptions = {
    			map: Lyft.map,
    			suppressMarkers: true,
    			preserveViewport: true
    		};
    		
	  		Lyft.MapConfig.redRenderer = new google.maps.DirectionsRenderer($.extend({}, Lyft.MapConfig.rendererOptions, {polylineOptions: Lyft.Polylines.red}));
	  		Lyft.MapConfig.blueRenderer = new google.maps.DirectionsRenderer($.extend({}, Lyft.MapConfig.rendererOptions, {polylineOptions: Lyft.Polylines.blue}));
	  		Lyft.MapConfig.greenRenderer = new google.maps.DirectionsRenderer($.extend({}, Lyft.MapConfig.rendererOptions, {polylineOptions: Lyft.Polylines.green}));
		}();

    Lyft.Markers = {};

    // this... kind of sucks. But couldn't think of a better, more programmatic way.
    Lyft.Markers.redCarStartConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(74, 44),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(34, 44),
			optimized: false,
			zIndex: 5
    };
    Lyft.Markers.redCarEndConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(74, 44),
			origin: new google.maps.Point(73, 0),
			anchor: new google.maps.Point(33, 44),      
			optimized: false,
			zIndex: 5
    };

    Lyft.Markers.blueCarStartConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(44, 44),
			origin: new google.maps.Point(146, 0),
			anchor: new google.maps.Point(20, 44),
			optimized: false,
			zIndex: 5
    };
    Lyft.Markers.blueCarEndConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(44, 44),
			origin: new google.maps.Point(189, 0),
			anchor: new google.maps.Point(20, 44),
			optimized: false,
			zIndex: 5
    };
    Lyft.Markers.oneConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(24, 18),
			origin: new google.maps.Point(232, 26),
			anchor: new google.maps.Point(11, 18),
			optimized: false,
			zIndex: 100            
    }
    Lyft.Markers.twoConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(24, 18),
			origin: new google.maps.Point(256, 26),
			anchor: new google.maps.Point(11, 18),
			optimized: false,
			zIndex: 100            
    }
    Lyft.Markers.threeConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(24, 18),
			origin: new google.maps.Point(279, 26),
			anchor: new google.maps.Point(11, 18),
			optimized: false,
			zIndex: 100                        
    }
    Lyft.Markers.fourConfig = {
			url: 'car-markers.png',
			size: new google.maps.Size(24, 18),
			origin: new google.maps.Point(303, 26),
			anchor: new google.maps.Point(11, 18),
			optimized: false,
			zIndex: 100                        
    }
    
    Lyft.Markers.makeMarker = function(iconConfig, location, draggable) {
      var marker = new google.maps.Marker({
              				position: location,
              				map: Lyft.map,
              				icon: iconConfig,
              				draggable: draggable,
              				// optimized solution from http://stackoverflow.com/questions/11845916/google-maps-marker-zindex-doesnt-work-for-two-icon-types-symbol-and-string
              				optimized: false
              			});
      return marker;
    };
    
    // everybody starts at Lyft hq :)
    Lyft.Markers.redCarStart = Lyft.Markers.makeMarker(Lyft.Markers.redCarStartConfig, 
                                                       new google.maps.LatLng(37.78965206721971, -122.40148320794106), true);
    Lyft.Markers.redCarEnd   = Lyft.Markers.makeMarker(Lyft.Markers.redCarEndConfig,   
                                                       new google.maps.LatLng(37.78965206721971, -122.40148320794106), true);
    
    Lyft.Markers.blueCarStart = Lyft.Markers.makeMarker(Lyft.Markers.blueCarStartConfig, 
                                                        new google.maps.LatLng(37.78965206721971, -122.40148320794106), true);
    Lyft.Markers.blueCarEnd   = Lyft.Markers.makeMarker(Lyft.Markers.blueCarEndConfig,   
                                                        new google.maps.LatLng(37.78965206721971, -122.40148320794106), true);

    Lyft.Markers.one = Lyft.Markers.makeMarker(Lyft.Markers.oneConfig,                                                        
                                              new google.maps.LatLng(37.78965206721971, -122.40148320794106), false);
    Lyft.Markers.two = Lyft.Markers.makeMarker(Lyft.Markers.twoConfig,                                                        
                                              new google.maps.LatLng(37.78965206721971, -122.40148320794106), false);
    Lyft.Markers.three = Lyft.Markers.makeMarker(Lyft.Markers.threeConfig,                                                        
                                              new google.maps.LatLng(37.78965206721971, -122.40148320794106), false);
    Lyft.Markers.four = Lyft.Markers.makeMarker(Lyft.Markers.fourConfig,                                                        
                                              new google.maps.LatLng(37.78965206721971, -122.40148320794106), false);

    // some logical groupings
    Lyft.Markers.allMarkers = [Lyft.Markers.redCarStart, Lyft.Markers.redCarEnd, Lyft.Markers.blueCarStart, Lyft.Markers.blueCarEnd,
                              Lyft.Markers.one, Lyft.Markers.two, Lyft.Markers.three, Lyft.Markers.four];
    Lyft.Markers.allCarMarkers = [Lyft.Markers.redCarStart, Lyft.Markers.redCarEnd, Lyft.Markers.blueCarStart, Lyft.Markers.blueCarEnd];
    Lyft.Markers.allPositionMarkers = [Lyft.Markers.one, Lyft.Markers.two, Lyft.Markers.three, Lyft.Markers.four];
    Lyft.Markers.redMarkers = [Lyft.Markers.redCarStart, Lyft.Markers.redCarEnd];
    Lyft.Markers.blueMarkers = [Lyft.Markers.blueCarStart, Lyft.Markers.blueCarEnd];

    Lyft.Markers.setVisibility = function(visible, markers) {
      if (!markers.length) { markers = [markers]; }
      for (var i in markers) {
        markers[i].setVisible(visible);
      }
    };
    Lyft.Markers.allVisible = function(markers) {
      for (var i in markers) {
        if (!markers[i].getVisible()) { return false; }
      }
      return true;
    }
    Lyft.Markers.setPosition = function(marker, lat, lng) {
        var p = new google.maps.LatLng(lat, lng);
        if (marker.getPosition() !== p) marker.setPosition(p);
    };

    Lyft.Markers.initialize = function() {
        Lyft.Markers.setVisibility(true, Lyft.Markers.allMarkers);
        Lyft.Markers.redCarStart.setZIndex(5);
        Lyft.Markers.two.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.three.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.four.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

        Lyft.Markers.one.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.two.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.three.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.four.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        Lyft.Markers.setVisibility(false, Lyft.Markers.allMarkers);
    }();

		Lyft.Distance = {};
		Lyft.Distance.routes = {};
		Lyft.Distance.responses = {};
		
		Lyft.Distance.setRoute = function(response, name) {
		    var distance = 0,
		        legs = response.routes[0].legs,
		        i, routingCompleted = true,
		        shortest = null;

		    for (i in legs) {
  		    distance += +(legs[i].distance.text.replace(' mi', ''));
		    }

  		  Lyft.Distance.routes[name] = distance;
  		  Lyft.Distance.responses[name] = response;

  		  for (i in Lyft.Distance.routes) {
    		  if (!Lyft.Distance.routes[i]) { routingCompleted = false; }
  		  }
        // a pseudo event, since we need to block until the directions requests comes back
  		  if (routingCompleted && Lyft.Markers.allVisible(Lyft.Markers.allCarMarkers)) {
  		    Lyft.Markers.setVisibility(true, Lyft.Markers.allMarkers);
  		    if (Lyft.Distance.routes['red-blue'] < Lyft.Distance.routes['blue-red']) {
    		    shortest = Lyft.Distance.responses['red-blue'];
    		    Lyft.Markers.one.setPosition(Lyft.Markers.redCarStart.getPosition());
    		    Lyft.Markers.two.setPosition(Lyft.Markers.blueCarStart.getPosition());
    		    Lyft.Markers.three.setPosition(Lyft.Markers.blueCarEnd.getPosition());
    		    Lyft.Markers.four.setPosition(Lyft.Markers.redCarEnd.getPosition());
  		    }
  		    else {
    		    shortest = Lyft.Distance.responses['blue-red'];
    		    Lyft.Markers.one.setPosition(Lyft.Markers.blueCarStart.getPosition());
    		    Lyft.Markers.two.setPosition(Lyft.Markers.redCarStart.getPosition());
    		    Lyft.Markers.three.setPosition(Lyft.Markers.redCarEnd.getPosition());
    		    Lyft.Markers.four.setPosition(Lyft.Markers.blueCarEnd.getPosition());
    		    
  		    }
          Lyft.MapConfig.greenRenderer.setDirections(shortest);
  		  }
      Lyft.Distance.updateShortest();
		};
		
		Lyft.Distance.shortestRoute = function() {
  		  return Lyft.Distance.routes['red-blue'] < Lyft.Distance.routes['blue-red'] ? 
  		         Lyft.Distance.routes['red-blue'] : Lyft.Distance.routes['blue-red'];
		};
		Lyft.Distance.updateShortest = function() {
      $('#shortest-distance').text(Lyft.Distance.shortestRoute());  		  
		};
		
		Lyft.Directions.renderer = new google.maps.DirectionsRenderer(Lyft.MapConfig.rendererOptions);
		Lyft.Directions.service = new google.maps.DirectionsService();
		Lyft.Directions.waypoints = function(markers) {
		  var w = [];
		  for (var i in markers) {
  		  w.push( { location: markers[i].getPosition(), stopover: true });
		  }
		  return w;
		};
		Lyft.Directions.route = function(endPoints, renderer, name, waypoints) {
      var request = {
          origin:endPoints[0].getPosition(),
          destination:endPoints[1].getPosition(),
          travelMode: google.maps.DirectionsTravelMode.DRIVING
      };          
      if (waypoints) { request.waypoints = waypoints; }
      Lyft.Distance.routes[name] = null;

      Lyft.Directions.service.route(request, function(response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
              if (renderer) { renderer.setDirections(response); }
              Lyft.Distance.setRoute(response, name);
          }
  		});

    };
    Lyft.Directions.reroute = function(e) {
      if (Lyft.Markers.allVisible(Lyft.Markers.redMarkers)) {
        Lyft.Directions.route(Lyft.Markers.redMarkers, Lyft.MapConfig.redRenderer, 'red');
      }
      if (Lyft.Markers.allVisible(Lyft.Markers.blueMarkers)) {      
        Lyft.Directions.route(Lyft.Markers.blueMarkers, Lyft.MapConfig.blueRenderer, 'blue');
      }

      if (Lyft.Markers.allVisible(Lyft.Markers.allCarMarkers)) {      
          // red to blue to blue to red
          Lyft.Directions.route(Lyft.Markers.redMarkers, null, 'red-blue',
            Lyft.Directions.waypoints(Lyft.Markers.blueMarkers));

          // blue to red to red to blue
          Lyft.Directions.route(Lyft.Markers.blueMarkers, null, 'blue-red',
            Lyft.Directions.waypoints(Lyft.Markers.redMarkers));
      }
    };
    
    Lyft.FormInput = {};
    // real simple, naive validation
    Lyft.FormInput.validLatLng = function(l) {
        var val = l.val().toString().replace(/\s+/g, '');
        // string may only contain numbers, minus sign, and period
        return (val !== '' && /^[\d-\.]*$/.test(val));
    };
    Lyft.FormInput.redraw = function() {
        var redStartPosition, redEndPosition,
            blueStartPosition, blueEndPosition;
       
        $('.car-info ul').each(
            function() {
                var lat = $(this).find('.lat').first(),
                    lng = $(this).find('.lng').first(),
                    startOrEnd = $(this).prop('class'),
                    regex = new RegExp('.*-' + startOrEnd);
                    
                if (Lyft.FormInput.validLatLng(lat) && Lyft.FormInput.validLatLng(lng)) {
                    Lyft.Markers.setPosition($(this).data('marker'), lat.val(), lng.val());
                    $(this).data('marker').setVisible(true);

                    $(this).parent().find('.car-marker').each(function() {
                      if (regex.test($(this).prop('id'))) {
                        $(this).addClass('hidden');
                      }
                    });
                }
            }
        );
        Lyft.Directions.reroute();
    };
    Lyft.FormInput.redrawFromDrag = function() {
        var marker, 
            input,
            position;

        for (var i in Lyft.Markers.allCarMarkers) {
            marker = Lyft.Markers.allCarMarkers[i];
            if (marker.formElement && marker.getVisible()) {
                position = marker.getPosition();
                input = marker.formElement;
                input.find('.lat').first().val(position.lat());
                input.find('.lng').first().val(position.lng());
            }
        }
        Lyft.Directions.reroute();
    };

    Lyft.FormInput.initialize = function() {
        $('input').on('blur', Lyft.FormInput.redraw);
        // attach which marker each input set maps to, so we can go back&forth easily
        $('#car1-info .start').data('marker', Lyft.Markers.redCarStart);
        $('#car1-info .end').data('marker', Lyft.Markers.redCarEnd);
        Lyft.Markers.redCarStart.formElement = $('#car1-info .start');
        Lyft.Markers.redCarEnd.formElement = $('#car1-info .end');
  
        $('#car2-info .start').data('marker', Lyft.Markers.blueCarStart);
        $('#car2-info .end').data('marker', Lyft.Markers.blueCarEnd);
        Lyft.Markers.blueCarStart.formElement = $('#car2-info .start');
        Lyft.Markers.blueCarEnd.formElement = $('#car2-info .end');
    }();


var Drag = {};
    Drag.target = null;
    Drag.startX = null;
    Drag.startY = null;
    
    Drag.startDrag = function(e) {
      Drag.target = $(e.target);
      Drag.startX = e.clientX;
      Drag.startY = e.clientY;
      Drag.originalOffset = Drag.target.offset();
      $('html').on('mousemove', Drag.dragCar);
    };
    Drag.dragCar = function(e) {
      if (Drag.target) {
        var diffX = e.clientX - Drag.startX,
            diffY = e.clientY - Drag.startY,
            offset = Drag.target.offset(),
            newX = diffX + offset.left,
            newY = diffY + offset.top;
        
        Drag.target.offset({top:newY, left:newX});
        Drag.startX = e.clientX;
        Drag.startY = e.clientY;
      }
    };

    Drag.endDrag = function(e) {
      $('html').off('mousemove', Drag.dragCar);
      var offset = Drag.target.offset();

      // dropped on the map somewhere
      if (offset.left < $('#map').width()) {
        Drag.calculateLatLng();
        Lyft.Directions.reroute();
      }
      else {
        // snap back
        Drag.target.offset(Drag.originalOffset);
      }
      Drag.target = null;
    };
    
    // guestimate for lat/lng, since google.maps.event is opaque, can't trigger appropriately from DOM level.    
    Drag.calculateLatLng = function() {
        var bounds = Lyft.map.getBounds(),
            ne = bounds.getNorthEast(),
            sw = bounds.getSouthWest(),
            mapHeight = $('#map').innerHeight(),
            mapWidth = $('#map').innerWidth(),
            offset = Drag.target.offset(),

            // try to match with the arrow, not the car itself
            fudgeTop = Drag.target.innerHeight(),
            fudgeLeft = Drag.target.innerWidth()/2 - 2,

            dragPoint = {top: offset.top + fudgeTop, left: offset.left + fudgeLeft },

            percentWide = dragPoint.left/mapWidth,
            percentHigh = dragPoint.top/mapHeight,
            
            newLat = (sw.lat() - ne.lat()) * percentHigh + ne.lat(),
            newLng = (ne.lng() - sw.lng()) * percentWide + sw.lng(),
            
            marker = Drag.target.prop('id').match(/-start/) ? 
                    Drag.target.parent().children('ul.start').first().data('marker') :
                    Drag.target.parent().children('ul.end').first().data('marker');
                
        Lyft.Markers.setPosition(marker, newLat, newLng);
        Lyft.Markers.setVisibility(true, marker);
        Drag.target.addClass('hidden');
        Lyft.FormInput.redrawFromDrag();
    };

    Drag.initialize = function() {
      $('.car-marker').on('mousedown', Drag.startDrag);
      $('.car-marker').on('mouseup', Drag.endDrag);

      for (var i in Lyft.Markers.allCarMarkers) {
          google.maps.event.addListener(Lyft.Markers.allCarMarkers[i], 'dragend', Lyft.FormInput.redrawFromDrag);
          google.maps.event.addListener(Lyft.Markers.allCarMarkers[i], 'dragstart', 
            function() { Lyft.Markers.setVisibility(false, Lyft.Markers.allPositionMarkers); });
      }
    }();

// get lat/lon a little easier
google.maps.event.addListener(Lyft.map, 'click', function(e) {
	console.log('{"lat":' + e.latLng.jb + ', "lng":' + e.latLng.kb + '},');
});
