/*global angular*/

(function () {
  'use strict';

  angular.module("demo", ["bombshock.gauge"]);

  angular.module("demo").run(function ($rootScope, $timeout) {
    $rootScope.data = [50, 33, 12, 100, 75];
    $rootScope.max = 500;
    $rootScope.showPercent = false;

    $rootScope.hover = function ($event, path) {
      console.log("$event", $event);
      console.log("path", path);
    };

    $rootScope.randomizedata = function () {
      $rootScope.showPercent = false;
      var len = 5;
      //var len = getRandomInt(3, 10);
      $rootScope.data = [];
      for (var i = 0; i < len; i++) {
        $rootScope.data.push(getRandomInt(10, 100));
      }
      $rootScope.max = $rootScope.data.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
      });
    };

    var loadingMockMax = [];
    $rootScope.preloader = function () {
      $rootScope.showPercent = true;
      $rootScope.data = [0, 0, 0, 0, 0];
      loadingMockMax = [getRandomInt(1, 20) * 100, getRandomInt(1, 20) * 100, getRandomInt(1, 20) * 100, getRandomInt(1, 20) * 100, getRandomInt(1, 20) * 100]; //
      $rootScope.max = loadingMockMax.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
      });
      $timeout(function () {
        fakeLoading();
      }, 350);
    };

    function fakeLoading() {
      for (var i = 0; i < $rootScope.data.length; i++) {
        $rootScope.data[i] += getRandomInt(1, 3) * 100;
        if ($rootScope.data[i] > loadingMockMax[i]) {
          $rootScope.data[i] = loadingMockMax[i];
        }
      }
      var sum = $rootScope.data.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
      });

      if (sum < $rootScope.max) {
        $timeout(fakeLoading, getRandomInt(350, 1000));
      }
    }
  });

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

})();