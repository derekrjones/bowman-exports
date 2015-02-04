var _ = require("lodash")
  , jsdom = require("jsdom")
  , Q = require("q")

var EMPTY_HTML = "<html><body></body></html>";

function resolveGlobals(src, omit, cb){
  src = src || [];
  omit = omit || [];

  jsdom.env({
    html: EMPTY_HTML,
    src: src,
    //scripts: ["http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"],
    done: function(err, window){
      if(err){
        var errors = _.map(err, function(e){
          return (e.data && e.data.error) || e
        })
        cb(errors);
      } else {
        var declaredVars = _.difference(_.keys(window), omit);
        cb(null, declaredVars);
      }
      window.close();
    }
  });
}

var resolve = function(src, omit){
  return Q.nfcall(resolveGlobals, src, omit);
}

var baseGlobals = resolve();

module.exports = function(src){
  return baseGlobals.then(function(base){
    return resolve(src, base);
  });
}
