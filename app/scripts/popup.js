'use strict';

//彈出框模塊
angular.module('popApp', [])
  .controller('MasterCtrl', function ($scope, $q) {

    $scope.word = '';
    $scope.status = 0;


    $scope.query = function (w) {
      //設置狀態
      $scope.word = w;
      $scope.status = 1;
      $scope.result = {};

      callBackground(w).then(function (res) {
        $scope.status = 2;
        $scope.result = res;
      }, function () {
        $scope.status = 4;
      })
    }

    function callBackground(w) {
      var d = $q.defer();
      chrome.runtime.sendMessage({
        act: 'popup',
        q: w
      }, function (response) {
        if (chrome.runtime.lastError != null) {
          d.reject(chrome.runtime.lastError);
          return;
        }
        if (response.error) {
          return d.reject((response.error));
        } else {
          return d.resolve(response.result);
        }
      })
      return d.promise;
    }

    //$scope.clickQuery = function () {
    //
    //}

    $scope.openOptions = function () {
      chrome.runtime.sendMessage({act: 'options'});
    }

  }
)