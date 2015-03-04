'use strict';

var DashboardController = function($scope, $rootScope, leafletData, services) {
  $scope.currentPage = 1;
  $scope.pageSize = 10;
  $scope.margin_pagination = -15;

  $scope.requestGeoAggregation = function(geom, points, query, timeQuery) {
    leafletData.getMap().then(
      function(map) {
        if (!points && !geom) {
          var bounds = map.getBounds();
          points = services.getNeSwPoints(bounds);
        }

        query = services.getBoolQuery(query, timeQuery);

        var timeStart = new Date();
        services.dashboardGeoAggregation(points, geom, query,
          function(result) {
            var timeEnd = new Date();

            $scope.geoAggList = [];
            $scope.totalCount = result.doc_total;

            var timeElapsed = timeEnd.getTime() - timeStart.getTime();
            $rootScope.$emit('event:updateGeoAggCount', timeElapsed, $scope.totalCount);

            result.buckets.forEach(
              function(bucket) {
                var percent = (bucket.doc_count / result.doc_total) * 100;
                $scope.geoAggList.push({
                  key: bucket.key,
                  value: bucket.doc_count,
                  percent: percent
                });
              }
            );

            if ($scope.geoAggList.length < $scope.pageSize) {
              $scope.margin_pagination = 0;
            } else {
              $scope.margin_pagination = -15;
            }
          }
        );
      }
    );
  };

  $rootScope.$on('event:updateGeoAggregation',
    function(event, geom, points, query, timeQuery) {
      $scope.requestGeoAggregation(geom, points, query, timeQuery);
    }
  );
};
