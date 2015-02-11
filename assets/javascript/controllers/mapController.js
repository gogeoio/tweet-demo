'use strict';

var MapController = function($scope, $rootScope, $timeout, $window, $compile, services, leafletData, leafletEvents) {
  $scope.drawnItems = new L.FeatureGroup();
  $scope.clusterHull = new L.FeatureGroup();

  $scope.geom = null;
  $scope.newGeom = null;

  $scope.mainGeoAggTotalCount = 0;

  $rootScope.selectedLayer = 'marker'; // cluster or marker

  var drawOptions = {
    draw: {
      draw: {
        polyline: false,
        polygon: false,
        circle: false, // Turns off this drawing tool
        marker: false,
        rectangle: {
          showArea: true
        }
      },
      edit: {
        featureGroup: $scope.drawnItems
      },
      trash: true
    }
  };

  $scope.updateDashboard = function(geoAggregation, polygon, latlng) {
    var pathname = window.location.pathname.trim();

    if (pathname.lastIndexOf('/') !== (pathname.length - 1)) {
      pathname = pathname + '/';
    }

    var path = '\'' + pathname + 'assets/javascript/views/bubble-chart.html\'';
    var content = '<div class="graph-div" ng-controller="ChartsController" ng-include="' + path + '"></div>';

    $scope.geoAggData = [];
    if (geoAggregation) {
      geoAggregation.buckets.forEach(
        function(bucket, index) {
          var item = {
            value: bucket.doc_count,
            name: bucket.key,
            group: 'Hashtags'
          };

          $scope.geoAggData.push(item);
        }
      );
    }

    $scope.$apply(
      function() {
        leafletData.getMap().then(
          function(map) {
            if (!map.hasLayer($scope.clusterHull)) {
              map.addLayer($scope.clusterHull);
            }

            if ($scope.clusterChartPopup) {
              $scope.removeCurrentHull();
              map.closePopup($scope.clusterChartPopup);
            }

            if (polygon) {
              $scope.currentHull = polygon;
              $scope.clusterHull.addLayer(polygon);
            }

            $scope.clusterChartPopup = L.popup()
            .setLatLng(latlng)
            .setContent(content)
            .openOn(map);
          }
        );
      }
    );
  };

  $scope.clickClusterCallback = function(event, clusterData) {
    var polygon = clusterData.polygon;
    var latlng = L.latLng(clusterData.coords[0], clusterData.coords[1]);

    if (typeof polygon === 'array' || polygon.length == 0) {
      polygon = null;
    }

    if (clusterData.count > 3 && polygon) {
      $scope.geojson = polygon.toGeoJSON();

      services.clusterGeoAggregation($scope.geojson.geometry, $scope.query, $scope.timeQuery,
        function(result) {
          $scope.updateDashboard(result, polygon, latlng);
        }
      );
    } else {
      $scope.updateDashboard(null, polygon, latlng);
    }
  };

  $scope.$on('leafletDirectiveMap.popupopen',
    function(event, leafletEvent) {
      $scope.showCustomGeoAggregation = true;
      var newScope = $scope.$new();

      // Put the GeoAggregation data into newScope to ChartsController
      newScope.geoAggData = $scope.geoAggData;

      // Put the TweetData into newScope to TweetPopupController
      newScope.tweetData = $scope.tweetData;

      $compile(leafletEvent.leafletEvent.popup._contentNode)(newScope);
    }
  );

  $scope.$on('leafletDirectiveMap.click',
    function(event, leafletEvent) {
      if ($scope.selectedLayer === 'marker' && $scope.drawnItems.getLayers().length == 0) {
        leafletData.getMap().then(
          function(map) {
            $scope.onMapClick(map, leafletEvent.leafletEvent);
          }
        );
      }
    }
  );

  // Handle the click event
  $scope.onMapClick = function(map, event) {
    services.geosearch(event.latlng, map.getZoom(), $scope.query,
      function(data) {
        $scope.openTweetPopup(data, event.latlng, map);
      }
    );
  };

  $scope.openTweetPopup = function(data, latlng, map) {
    if (data.length > 0) {
      $scope.tweetData = data[0];
      var pathname = window.location.pathname.trim();

      if (pathname.lastIndexOf('/') !== (pathname.length - 1)) {
        pathname = pathname + '/';
      }

      var path = '\'' + pathname + 'assets/javascript/views/tweet-template.html\'';
      var content = '<div class="tweet-popup-div" ng-include="' + path + '"></div>';

      $timeout(
        function() {
          $scope.$apply(
            function() {
              var options = {
                className: 'tweet-popup',
                offset: new L.Point(4, -45)
              };

              $scope.tweetPopup = L.popup(options)
                .setLatLng(latlng)
                .setContent(content)
                .openOn(map);
            }
          );
        },
        0
      );
    }
  };

  $scope.removeCurrentHull = function(event, leafletEvent) {
    if ($scope.clusterHull.hasLayer($scope.currentHull)) {
      $scope.clusterHull.removeLayer($scope.currentHull);
    }
  };

  $scope.$on('leafletDirectiveMap.popupclose', $scope.removeCurrentHull);

  $scope.closePopup = function() {
    if ($scope.clusterChartPopup) {
      leafletData.getMap().then(
        function(map) {
          map.closePopup($scope.clusterChartPopup);
        }
      );
    }

    if ($scope.tweetPopup) {
      leafletData.getMap().then(
        function(map) {
          map.closePopup($scope.tweetPopup);
        }
      );
    }
  };

  // Select which layer will show
  $scope.createLayer = function(geom, query, timeQuery) {
    if ($rootScope.selectedLayer === 'marker') {
      return $scope.createMarkerLayer(geom, query, timeQuery);
    } else {
      return $scope.createClusterLayer(geom, query, timeQuery);
    }
  };

  // Create a cluster layer
  $scope.createClusterLayer = function(geom, query, timeQuery) {
    var options = {
      subdomains: services.config().subdomains,
      useJsonP: false,
      updateCountCallback: function(totalCount) {
        $rootScope.$emit('event:updateClusterCount', totalCount);
      },
      formatCount: function(count) {
        return $.number(count, 0, '.', '.');
      },
      calculateClusterQtd: function(zoom) {
        var qtd = 1;
        if (zoom <= 5) {
          qtd = 2;
        }

        return qtd;
      }
    };

    var clusterUrl = services.clusterUrl(geom, query, timeQuery);
    var cluster = L.tileCluster(clusterUrl, options);

    return  {
      name: 'goGeo Cluster Layer',
      type: 'custom',
      layer: cluster,
      visible: true
    }
  };

  // Create a marker layer
  $scope.createMarkerLayer = function(geom, query, timeQuery) {
    var options = {
      subdomains: services.config().subdomains
    };

    return  {
      name: 'goGeo Tile Layer',
      url: services.pngUrl(geom, query, timeQuery),
      type: 'xyz',
      visible: true
    }
  };

  $scope.gogeoLayers = {
    baselayers: {
      googleRoadmap: {
        name: 'Google Streets',
        layerType: 'ROADMAP',
        type: 'google'
      }
    }
  };

  $rootScope.$on('event:configLoaded',
    function() {
      $scope.gogeoLayers.overlays = {
        cluster: $scope.createLayer()
      };

      L.drawLocal.draw.toolbar.buttons.rectangle = 'Draw an area.';
      L.drawLocal.edit.toolbar.buttons.edit = 'Edit area.'
      L.drawLocal.edit.toolbar.buttons.editDisabled = 'No area to edit.'
      L.drawLocal.edit.toolbar.buttons.remove = 'Delete area.'
      L.drawLocal.edit.toolbar.buttons.removeDisabled = 'No area to delete.'

      L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to draw an area';
      L.drawLocal.edit.handlers.edit.tooltip.text = 'Drag handles to edit area.';
      L.drawLocal.edit.handlers.remove.tooltip.text = 'Click on an area and then save to remove.';

      $scope.$on('leafletDirectiveMap.moveend', $scope.initializeDashboard);
      $scope.initializeDashboard();
    }
  );

  $scope.initializeDashboard = function() {
    var layersDrawn = $scope.drawnItems.getLayers();

    if (layersDrawn.length == 0) {
      leafletData.getMap().then(
        function(map) {
          $scope.points = services.getNeSwPoints(map.getBounds());
          $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.points, $scope.query, $scope.timeQuery);
        }
      );
    }
  };

  angular.extend($scope, {
    center: {
      lat: 44.856596,
      lng: -63.085776,
      zoom: 4
    },
    defaults: {
      minZoom: 4,
      maxZoom: 15
    },
    controls: drawOptions,
    layers: $scope.gogeoLayers
  });

  $scope.$watch('center.zoom',
    function(zoom) {
      $scope.handlerLayers(zoom);
      $scope.closePopup();

      $rootScope.$emit('event:updateZoom', zoom);
    }
  );

  $scope.handlerLayers = function(zoom) {
    if (zoom) {
      $scope.zoom = zoom;
    }

    var toUpdate = false;

    if ($scope.geom !== $scope.newGeom) {
      $scope.geom = $scope.newGeom;
      toUpdate = true;
    }

    if (JSON.stringify($scope.query) !== JSON.stringify($scope.newQuery)) {
      $scope.query = $scope.newQuery;
      toUpdate = true;
    }

    if (JSON.stringify($scope.timeQuery) !== JSON.stringify($scope.newTimeQuery)) {
      $scope.timeQuery = $scope.newTimeQuery;
      toUpdate = true;
    }

    if (toUpdate) {
      $scope.updateLayer();
    }
  };

  $scope.updateLayer = function() {
    var overlays = $scope.gogeoLayers.overlays;

    $timeout(
      function() {
        delete overlays.cluster;
      },
      10
    );

    $timeout(
      function() {
        overlays.cluster = $scope.createLayer($scope.geom, $scope.query, $scope.timeQuery);
        $rootScope.$emit('event:updateGeoAggregation', $scope.geom, $scope.points, $scope.query, $scope.timeQuery);
      },
      100
    );
  };

  $scope.drawHandler = function(event, leafletEvent) {
    var layer = leafletEvent.leafletEvent.layer || $scope.drawnItems.getLayers()[0];

    if ($scope.tweetPopup) {
      $scope.closePopup();
    }

    if (layer) {
      $scope.drawnItems.clearLayers();
      $scope.drawnItems.addLayer(layer);
      $scope.canOpenPopup = true;

      layer.on('click',
        function(clickEvent) {
          if ($scope.selectedLayer === 'marker' && $scope.canOpenPopup) {
            $scope.onMapClick(clickEvent.target._map, clickEvent);
          }
        }
      );
    } else {
      $scope.canOpenPopup = false;
      $scope.closePopup();
      $scope.removeCurrentHull();
    }

    if (layer) {
      var geojson = layer.toGeoJSON();
      $scope.newGeom = JSON.stringify(geojson.geometry);

      if (window._gaq) {
        window._gaq.push(['_trackEvent', services.config().demoName, 'draw:created']);
      }

      var area = (LGeo.area(layer) / 1000000).toFixed(2);
      $rootScope.$emit('event:updateDrawnArea', area);
    } else {
      $scope.newGeom = null;
      $scope.points = null;
      $scope.closePopup();
      $scope.removeCurrentHull();
      $rootScope.$emit('event:updateDrawnArea', null);
    }

    $scope.handlerLayers($scope.zoom);
  };

  $scope.$on('leafletDirectiveMap.draw:created', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:deleted', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:edited', $scope.drawHandler);
  $scope.$on('leafletDirectiveMap.draw:deletestart',
    function() {
      $scope.canOpenPopup = false;
    }
  );

  $rootScope.$on('event:queryChanged',
    function(event, newQuery) {
      $scope.newQuery = newQuery;
      $scope.handlerLayers($scope.zoom);
      $scope.closePopup();
    }
  );

  $rootScope.$on('event:dateUpdated',
    function(event, query) {
      $scope.newTimeQuery = query;
      $scope.handlerLayers($scope.zoom);
      $scope.closePopup();
    }
  );

  $rootScope.$on('event:changeLayer',
    function(event, selectedLayer) {
      $rootScope.selectedLayer = selectedLayer;
      $scope.updateLayer();
    }
  );
};