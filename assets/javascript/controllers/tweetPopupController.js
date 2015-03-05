'use strict';

var TweetPopupController = function($scope, $rootScope, $http) {
  $scope.tweetData['user.profile_image_url'] = $scope.tweetData['user.profile_image_url'].replace('_normal', '');

  var string = $scope.tweetData['text'];
  string = string.replaceAll('"@', '" @');
  $scope.tweetData['text'] = window.linkify(string);
};