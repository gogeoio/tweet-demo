'use strict';

(function() {
  var app = angular.module('gogeoTweets.services', []);

  app.factory('services',
    function($rootScope, $http, $timeout) {

      var pathname = window.location.pathname;

      if (!pathname.endsWith('/')) {
        pathname = pathname + '/';
      }

      $http.get(pathname + 'config.json').then(
        function(result) {
          $rootScope.config = result.data;
          $rootScope.$emit('event:configLoaded');
        }
      );

      return {
        config: function() {
          return $rootScope.config;
        },
        canUseSubdomains: function(serviceName) {
          if ((serviceName === 'cluster.json' || serviceName === 'tile.png') && this.config().subdomains && this.config().subdomains.length > 0) {
            return true;
          }

          return false;
        },
        configureUrl: function(serviceName) {
          var prefix = this.config().prefix;
          if (this.canUseSubdomains(serviceName)) {
            prefix = '{s}.';
          }

          var url = this.config().protocol;

          if (prefix) {
            url = url + prefix;
          }

          url = url + this.config().url;
          return url;
        },
        pngUrl: function(geom, query, timeQuery) {
          var serviceName = 'tile.png';

          var prefix = this.config().prefix;
          if (this.canUseSubdomains(serviceName)) {
            prefix = '{s}.';
          }

          var url = this.configureUrl(prefix);

          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          url = url + '/map/' + database + '/' + collection;
          url = url + '/{z}/{x}/{y}/' + serviceName;
          url = url + '?mapkey=' + mapkey;

          var stylename = this.config().stylename;
          var buffer = 16;

          if (stylename === 'gogeo_heatmap') {
            // Avoid cut tile in heatmap view
            buffer = 32;
          }

          url = url + '&buffer=' + buffer;

          // Prevent angular cache
          url = url + '&_=' + Math.random();

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query) {
            stylename = 'gogeo_overlap';
          }

          if (query || timeQuery) {
            query = this.getBoolQuery(query, timeQuery);

            if (typeof query === 'object') {
              query = JSON.stringify(query);
            }
            url = url + '&q=' + encodeURI(query);
          }

          // Add style to URL
          url = url + '&stylename=' + stylename;

          return url;
        },
        clusterUrl: function(geom, query, timeQuery) {
          var serviceName = 'cluster.json';

          var url = this.configureUrl(serviceName);

          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          url = url + '/map/' + database + '/' + collection;
          url = url + '/{z}/{x}/{y}/' + serviceName;
          url = url + '?mapkey=' + mapkey;

          // Prevent angular cache
          url = url + '&_=1';

          // Add geom to URL
          if (geom) {
            url = url + '&geom=' + geom;
          }

          if (query || timeQuery) {
            query = this.getBoolQuery(query, timeQuery);
            if (typeof query === 'object') {
              query = JSON.stringify(query);
            }
            url = url + '&q=' + query;
          }

          url = url + '&cluster_qtd={cq}';

          return url;
        },
        geoAggUrl: function() {
          var serviceName = 'geoagg';
          var url = this.configureUrl(serviceName);
          var geoAggUrl = [url, serviceName, this.config().database, this.config().collection].join('/');
          return geoAggUrl;
        },
        clusterGeoAggregation: function(geometry, query, timeQuery, callback) {
          var url = this.geoAggUrl();

          query = this.getBoolQuery(query, timeQuery);

          var params = {
            mapkey: this.config().mapkey,
            geom: geometry,
            agg_size: 50,
            field: this.config().clusterGeoAgg
          };

          if (query) {
            if (typeof query === 'string') {
              query = JSON.parse(query);
            }

            params['q'] = query;
          }

          $http.post(url, params).success(
            function(result) {
              $timeout(
                function() {
                  callback.call(null, result);
                }
              );
            }
          );
        },
        dashboardGeoAggregation: function(points, geometry, query, callback) {
          var url = this.geoAggUrl();

          var params = {
            mapkey: this.config().mapkey,
            agg_size: 100,
            field: this.config().dashboardGeoAgg
          };

          if (geometry) {
            params['geom'] = JSON.parse(geometry);
          } else {
            params['points'] = {
              top_right: points[0],
              bottom_left: points[1]
            };
          }

          if (query) {
            params['q'] = query;
          }

          $http.post(url, params).success(
            function(result) {
              $timeout(
                function() {
                  callback.call(null, result);
                }
              );
            }
          );
        },
        geosearch: function(latlng, zoom, query, callback) {
          var point = {
            type: 'Point',
            coordinates: [latlng.lng, latlng.lat]
          };

          // Determine the pixel distance in kilometers to a given latitude and zoom level
          // See "http://wiki.openstreetmap.org/wiki/Zoom_levels" for details
          var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2,(zoom + 8));

          var host = this.configureUrl('geosearch');
          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;

          var geoSearchUrl = host + '/geosearch/' + database + '/' + collection + '?mapkey=' + mapkey;

          var options = {
            limit: 1, // How many items to return
            buffer: pixelDist * 16, // Define a buffer with haf marker size
            buffer_measure: 'kilometer',
            geom: point,
            fields: [
              'id',
              'created_at',
              'user.name',
              'user.screen_name',
              'text',
              'place.full_name',
              'user.profile_image_url'
            ]
          };

          if (query) {
            options.q = JSON.stringify(query);
          }

          $http.post(geoSearchUrl, options).success(callback);
        },
        getSuggestion: function(query, points, currentQuery, callback) {
          var fields = [];

          if (query[0] === '@') {
            query = query.slice(1);
            fields = ['user.screen_name'];
          } else if (query[0] === '#') {
            query = query.slice(1);
            fields = ['entities.hashtags.text'];
          } else {
            fields = ['text'];
          }

          var host = this.configureUrl('geosearch');
          var database = this.config().database;
          var collection = this.config().collection;
          var mapkey = this.config().mapkey;
          var urlParams = '/geosearch/' + database + '/' + collection + '?mapkey=' + mapkey;

          var geoSearchQuery = {
            query: {
              query_string: {
                query: query + '*',
                fields: fields
              }
            }
          };

          if (currentQuery) {
            geoSearchQuery = this.getBoolQuery(currentQuery, geoSearchQuery);
          }

          var geojson = this.pointsToGeojson(points);

          var url = host + urlParams;
          var params = {
            geom: geojson,
            q: JSON.stringify(geoSearchQuery),
            fields: fields,
            limit: 30
          };

          var params = {
            url: url,
            method: 'POST',
            data: JSON.stringify(params),
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          };

          return $http(params).then(
            function(result) {
              var data = result.data;
              var array = [];

              data.forEach(
                function(item) {
                  var text = item['entities.hashtags.text'] || item['user.screen_name'] || item['text'];

                  var obj = {
                    id: item['user.id'] || item['id'],
                    text: text
                  };

                  var contains = false;

                  for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    if (item.text === obj.text || item.id === obj.id) {
                      contains = true;
                      break;
                    }
                  }

                  if (!contains) {
                    array.push(obj);
                  }
                }
              );

              array.splice(0, 0, { id: null, text: query });
              callback(array);
            }
          );
        },
        getNeSwPoints: function(bounds) {
          var ne = [bounds._northEast.lng, bounds._northEast.lat];
          var sw = [bounds._southWest.lng, bounds._southWest.lat];

          return [ne, sw];
        },
        pointsToGeojson: function(points) {
          var ne = points[0];
          var sw = points[1];

          var nw = [sw[0], ne[1]];
          var se = [ne[0], sw[1]];

          var coordinates = [
            [
              sw, nw, ne, se, sw
            ]
          ];

          return {
            type: "Polygon",
            coordinates: coordinates
          }
        },
        getBoolQuery: function(query, timeQuery) {
          var boolQuery = null;

          if (query && timeQuery) {
            boolQuery = {
              query: {
                bool: {
                  must: [ timeQuery.query, query.query ]
                }
              }
            };
          } else if (query) {
            boolQuery = query;
          } else if (timeQuery) {
            boolQuery = timeQuery;
          }

          return boolQuery;
        }
      }
    }
  )
})();
