/*global angular*/

(function () {
  'use strict';

  angular.module("bombshock.gauge", []);

  angular.module("bombshock.gauge").service("gaugeConfig", GaugeConfig);

  GaugeConfig.$inject = [];

  function GaugeConfig() {
    return {
      colors: ["#c25e03", "#b27f1a", "#df9906", "#698a0e", "#ad2725", "#406aae", "#282828", "#e7e7e7", "#666666"],
      gutter: 1.5,
      animationSpeed: {
        build: 700,
        rebuild: 300
      },
      arc: {
        strokeWidth: "20%",
        radius: 190
      },
      easing: Math.easeInOutQuad
    };
  }

  angular.module("bombshock.gauge").directive("gaugeD", GaugeDDirective);

  GaugeDDirective.$inject = [];

  function GaugeDDirective() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        attrs.$observe("gaugeD", function (val) {
          element.attr("d", val);
        });
      }
    };
  }

  angular.module("bombshock.gauge").directive("gaugeY", GaugeYDirective);

  GaugeYDirective.$inject = [];

  function GaugeYDirective() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        attrs.$observe("gaugeY", function (val) {
          element.attr("y", val);
        });
      }
    };
  }

  angular.module("bombshock.gauge").directive("gauge", GaugeDirective);

  GaugeDirective.$inject = ["gaugeConfig", "$window"];

  function GaugeDirective(gaugeConfig, $window) {
    return {
      restrict: 'AE',
      template: '' +
      '<svg class="gauge-container">' +
      '   <path data-ng-repeat="path in $paths" data-ng-style="path.style" data-gauge-d="{{path.d}}" data-ng-mouseover="mouseOver($event, path)" data-ng-mouseleave="mouseLeave($event)"></path>' +
      '   <text x="50%" data-gauge-y="{{$mode == \'circle\' ? \'50%\' : \'75%\'}}" class="hl" style="alignment-baseline: middle; text-anchor: middle; fill: {{$hoverPath.style.stroke}};" data-ng-if="$hoverPath && showSubPercent">{{$hoverPath.percent | number:1}} %</text>' +
      '   <text x="50%" data-gauge-y="{{$mode == \'circle\' ? \'50%\' : \'75%\'}}" class="hl" style="alignment-baseline: middle; text-anchor: middle;" data-ng-if="!$hoverPath && showPercent">{{$progress | number:1}} %</text>' +
      '</svg>',
      replace: true,
      scope: {
        mode: '@',
        data: '=',
        colors: '=',
        gutter: '@',
        max: '@',
        showPercent: '=',
        showSubPercent: '=',
        onHover: '&'
      },
      link: function (scope, element) {
        var svg = element[0];
        var container = element.parent()[0];
        var fullCycle;
        var maxValue = 0;
        var __MODES__ = {
          CIRCLE: "circle",
          GAUGE: "gauge"
        };
        var mode = scope.$mode = scope.mode || __MODES__.CIRCLE;
        var colors = scope.colors || gaugeConfig.colors;
        var gutter = scope.gutter || gaugeConfig.gutter;
        var currentAnimation = null;

        scope.$paths = [];

        $window.addEventListener("resize", init);
        scope.$on("$destroy", function () {
          $window.removeEventListener("resize", init);
        });

        init();
        function init() {
          element.css("width", "auto");
          element.css("height", "auto");

          element.css("width", container.offsetWidth + 'px');
          element.css("height", container.offsetHeight + 'px');

          element.css("display", "block");
          if (scope.mode === __MODES__.GAUGE) {
            svg.setAttribute("viewBox", "0 0 500 250");
          } else {
            svg.setAttribute("viewBox", "0 0 500 500");
          }
        }

        scope.$watch("mode", function (newMode) {
          if (newMode) {
            scope.$mode = mode = newMode || __MODES__.CIRCLE;
            init();
            genFullCycle();
            buildArcs();
          }
        });

        scope.$watch("colors", function (newColors) {
          colors = newColors || gaugeConfig.colors;
        });

        scope.$watch("gutter", function (newVal) {
          gutter = newVal || gaugeConfig.gutter;
          genFullCycle();
        });

        scope.$watchCollection("data", function () {
          genFullCycle();

          maxValue = scope.data.reduce(function (previousValue, currentValue) {
            return previousValue + currentValue;
          });

          if (scope.max) {
            scope.max = parseInt(scope.max);
            scope.$progress = maxValue / scope.max * 100;
          }

          if (scope.max && maxValue <= scope.max) {
            maxValue = scope.max;
          }

          if (scope.$paths.length === scope.data.length) {
            rebuildArcs();
          } else {
            buildArcs();
          }
        });

        scope.mouseOver = function ($event, path) {
          scope.$hoverPath = path;
          scope.onHover({$event: $event, $path: path});
        };

        scope.mouseLeave = function () {
          scope.$hoverPath = null;
        };

        function genFullCycle() {
          if (mode === __MODES__.GAUGE) {
            fullCycle = 180 - ((scope.data.length - 1) * gutter);
          } else {
            fullCycle = 360 - (scope.data.length * gutter);
          }
        }

        function buildArcs() {
          var done = 0;
          scope.$paths = [];

          for (var h = 0; h < scope.data.length; h++) {
            var amount = scope.data[h];
            var angle = amount / maxValue * fullCycle;
            var path = generateArc(done, done + angle, getColor(h));
            path.amount = amount;
            path.percent = amount / maxValue * 100;
            scope.$paths.push(path);
            done += angle + gutter;
          }

          runAnimation(gaugeConfig.animationSpeed.build || 1000);
        }

        function rebuildArcs() {
          var done = 0;

          for (var h = 0; h < scope.data.length; h++) {
            var amount = scope.data[h];
            var path = scope.$paths[h];
            var angle = amount / maxValue * fullCycle;

            path.data.startAngle = done;
            path.data.endAngle = done + angle;
            path.data.angle = angle;
            path.amount = amount;
            path.percent = amount / maxValue * 100;

            done += angle + gutter;
          }

          runAnimation(gaugeConfig.animationSpeed.rebuild || 300);
        }

        function getColor(index) {
          while (index >= colors.length) {
            index -= colors.length;
          }
          return colors[index];
        }

        function generateArc(startAngle, endAngle, color) {
          var path = {};
          path.style = {
            "stroke-width": gaugeConfig.arc.strokeWidth || "20%",
            "stroke": color,
            "stroke-linecap": "butt",
            "fill": "none"
          };
          path.data = {
            startAngleIs: 0,
            endAngleIs: 0,
            startAngle: startAngle,
            endAngle: endAngle,
            angle: endAngle - startAngle
          };
          path.d = describeArc(250, 250, gaugeConfig.arc.radius || 190, path.data.startAngleIs, path.data.endAngleIs);
          return path;
        }

        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
          var angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;

          return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
          };
        }

        function describeArc(x, y, radius, startAngle, endAngle) {

          var start = polarToCartesian(x, y, radius, endAngle);
          var end = polarToCartesian(x, y, radius, startAngle);

          var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

          return [
            "M", start.x, start.y,
            "A", radius, radius, 0, arcSweep, 0, end.x, end.y
          ].join(" ");
        }

        function runAnimation(durration) {
          durration = durration || 300;
          var start = null;

          function animate(timestamp) {
            if (!start) {
              start = timestamp;
            }
            var progress = timestamp - start;

            scope.$paths.forEach(function (path) {
              var startVal = gaugeConfig.easing(progress, path.data.startAngleIs, path.data.startAngle - path.data.startAngleIs, durration);
              var endVal = gaugeConfig.easing(progress, path.data.endAngleIs, path.data.endAngle - path.data.endAngleIs, durration);
              path.data.currentStart = startVal;
              path.data.currentEnd = endVal;
              path.d = describeArc(250, 250, 190, startVal, endVal);
            });

            if (progress < durration) {
              currentAnimation = window.requestAnimationFrame(animate);
            } else {
              currentAnimation = null;
              scope.$paths.forEach(function (path) {
                path.data.startAngleIs = path.data.startAngle;
                path.data.endAngleIs = path.data.endAngle;
                path.d = describeArc(250, 250, 190, path.data.startAngle, path.data.endAngle);
              });
            }

            scope.$apply();
          }

          if (currentAnimation) {
            scope.$paths.forEach(function (path) {
              if (path.data.currentStart) {
                path.data.startAngleIs = path.data.currentStart;
              }
              if (path.data.currentEnd) {
                path.data.endAngleIs = path.data.currentEnd;
              }
            });
            cancelAnimationFrame(currentAnimation);
          }

          currentAnimation = window.requestAnimationFrame(animate);
        }
      }
    };
  }

  /**
   *
   * @param t current time
   * @param b start value
   * @param c change in value
   * @param d duration
   * @returns {*}
   */
  Math.easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
      return c / 2 * t * t + b;
    } else {
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }
  };

})();

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
  'use strict';

  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
}());