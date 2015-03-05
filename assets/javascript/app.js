'use strict';

var app = angular.module('gogeoTweets', ['ngSanitize', 'leaflet-directive', 'gogeoTweets.services', 'angularUtils.directives.dirPagination', 'mgcrea.ngStrap', 'ui-rangeSlider', 'ui.select']);

// From http://stackoverflow.com/questions/280634/endswith-in-javascript
String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// From http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

// From http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
String.prototype.replaceAll = function(find, replace) {
  return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

app.filter('capitalize',
  function() {
    return function(input, all) {
      return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
  }
);

app.filter('formatPercent',
  function() {
    return function(input, size) {
      if (size === 'undefined') {
        size = 2;
      }

      if (size > 0) {
        return $.number(input, size);
      } else {
        return $.number(input, 0, '.', '.')
      }
    }
  }
);

app.filter('propsFilter',
    function() {
    return function(items, props) {
      var out = [];

      if (angular.isArray(items)) {
        items.forEach(
          function(item) {
            var itemMatches = false;

            var keys = Object.keys(props);
            for (var i = 0; i < keys.length; i++) {
              var prop = keys[i];
              var text = props[prop].toLowerCase();

              var prefix = '';
              if (text[0] === '@' || text[0] === '#') {
                prefix = text[0];
                text = text.slice(1);
              }

              if (item[prop] && item[prop].toString().toLowerCase().indexOf(text) != (-1)) {
                if (!item.name) {
                  item.name = prefix + item[prop];
                }

                if (!item.prefix) {
                  item.prefix = prefix;
                }

                itemMatches = true;
                break;
              }
            }

            if (itemMatches) {
              out.push(item);
            }
          }
        );
      } else {
        // Let the output be the input untouched
        out = items;
      }

      return out;
    };
  }
);