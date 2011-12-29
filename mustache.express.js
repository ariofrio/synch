var mustache = require("mustache");

exports.compile = function(str, options) {
  return function(locals) {
      options.partials = options.partials || {};
      if (options.body) { // for express.js > v1.0
          locals.body = options.body;
      }
      return mustache.to_html(
          str, locals, options.partials);
  };
};