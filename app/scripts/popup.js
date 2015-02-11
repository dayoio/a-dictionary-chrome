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

      callBackground(w.toLowerCase()).then(function (res) {
        $scope.status = 2;
        $scope.result = res;
      }, function () {
        $scope.status = 3;
      });
    };

    function callBackground(q) {
      var d = $q.defer();
      chrome.runtime.sendMessage({
        act: 'query',
        q: q
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

    $scope.openOptions = function () {
      chrome.runtime.sendMessage({act: 'options'});
    }

    $scope.searchBy = function (method, q) {
      chrome.runtime.sendMessage({act: 'search', method: method, q: q})
    }

    var audio = document.createElement('audio');
    $scope.play_audio = function (t) {
      if (t === 'trans') {
        audio.src = $scope.result.trans_audio;
        audio.play();
      } else if (t === 'orig') {
        audio.src = $scope.result.orig_audio;
        audio.play();
      }
    }

    var b
    chrome.tabs.getSelected(b, function (a) {
      chrome.tabs.sendMessage(a.id,
        {
          act: "get_selection"
        }, function (a) {
          if (a.selection) {
            $scope.word = a.selection;
            $scope.$apply();
            $scope.query(a.selection);
          }
        })
    })

  }
)