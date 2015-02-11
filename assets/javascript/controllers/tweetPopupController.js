'use strict';

var TweetPopupController = function($scope, $rootScope, $http) {
  $scope.tweetData['user.profile_image_url'] = $scope.tweetData['user.profile_image_url'].replace('_normal', '');
  $scope.tweetData['text'] = window.linkify($scope.tweetData['text']);
};