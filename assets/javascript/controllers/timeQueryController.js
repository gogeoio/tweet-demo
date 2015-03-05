'use strict';

var TimeQueryController = function($scope, $rootScope, services) {
  $rootScope.$on('event:configLoaded',
    function() {
      var min = new Date(services.config().timeRange.min).getTime() + 86400000;
      var max = new Date(services.config().timeRange.max).getTime() + 86400000;

      $scope.timelimit = {
        range: {
          min: min,
          max: max
        },
        minTimeRange: min,
        maxTimeRange: max
      };
    }
  );

  $scope.updateDate = function() {
    var minTimeRange = new Date($scope.timelimit.minTimeRange);
    var maxTimeRange = new Date($scope.timelimit.maxTimeRange);

    var query = {
      query: {
        range: {
          created_at: {
            gte: $scope.formatDateString(minTimeRange),
            lte: $scope.formatDateString(maxTimeRange)
          }
        }
      }
    };

    $rootScope.$emit('event:dateUpdated', query);
  };

  $scope.formatDateString = function(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    return year + '-' + month + '-' + day;
  };
};