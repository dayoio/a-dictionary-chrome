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

    $scope.ctrlSign = (window.navigator.platform.toLowerCase().indexOf("mac") !== -1) ? "Command" : "Ctrl";

    //獲取設置
    chrome.storage.sync.get(def_options, function (items) {
      $scope.options = items;
      $scope.$apply();
    });

    $scope.options_saved = false;

    //保存設置
    $scope.saveOptions = function () {
      $scope.options_saved = true;
      chrome.storage.sync.set($scope.options, function () {
        console.log('options saved');
        $timeout(function () {
          $scope.options_saved = false;
          $scope.$apply();
        }, 1500)
      })
    };

  })
