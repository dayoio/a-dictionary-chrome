'use strict';

angular.module('opApp', [])
  .controller('optionsCtrl', function ($scope, $timeout) {

    //默認
    var def_options = {
      language: 'en',
      dbclick: false,
      select: true,
      dbclick_key: 'ctrl',
      select_key: 'ctrl'
    }

    //獲取設置
    chrome.storage.sync.get(def_options, function (items) {
      $scope.options = items;
      $scope.$apply();
    });

    $scope.options_saved = true;

    //保存設置
    $scope.saveOptions = function () {
      $scope.options_saved = false;
      chrome.storage.sync.set($scope.options, function () {
        console.log('options saved');
        $timeout(function () {
          $scope.options_saved = true;
          $scope.$apply();
        }, 1500)
      })
    };

  })
