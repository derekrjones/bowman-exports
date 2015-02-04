var _ = require("lodash")
  , fs = require("fs")
  , path = require("path")
  , Q = require("q")
  , findGlobals = require("./lib/findGlobals")
  , stringifyObject = require('./lib/stringifyObject')
  , angularModules = require('./lib/angularModules')
  , jqueryPlugins = require('./lib/jqueryPlugins')

var PLUGIN_NAME = 'BOWMAN-EXPORTS';
var PLUGIN_FIELD = 'bowman-exports';

module.exports = function(bow, opts){

  var overrides = opts;

  var exposed = exposes(bow);

  var a = exposed
    .then(function(exposed){
      //console.log(PLUGIN_NAME, 'EXPOSED', _.pick(exposed, _.identity));
      return exposed;
    })
    .then(bow.assign.bind(bow, 'exposes'))

  var b = exposed
    .then(_.partialRight(_.mapValues, selectShim))
    .then(_.partialRight(_.mapValues, function(shim, pkgName){
      return defaultShim(shim, bow.package(pkgName));
    }))
    .then(_.partialRight(_.assign, overrides))
    .then(function(shims){
      //console.log(PLUGIN_NAME, 'EXPORTS', _.pick(shims, _.identity));
      //console.log(PLUGIN_NAME, 'UN-EX', _.keys(_.omit(shims, _.identity)));
      return shims;
    })
    .then(bow.assign.bind(bow, 'exports'))

  return Q.all([a, b]);
}

function defaultShim(shim, pkg){
  if(!shim){
    shim = angularModules(pkg) || jqueryPlugins(pkg) || shim;
  }
  if(_.isArray(shim) || _.isObject(shim)){
    shim = stringifyObject(shim);
  }
  return shim;
}

function exposes(bow){
  // TODO CLEAN UP
  var root = bow.root;
  var util = bow.util;
  var packages = bow.root.packages;

  var tree = util.tree(root);
  var deps = tree.flat;
  var sorted = tree.sorted;
  var depsSorted = tree.full;

  var srcs = util.fullPaths(root, null, 'scripts');
  srcs = _.mapValues(srcs, function(scripts){
    return _.map(scripts, readFile)
  });

  return Q.all(_.map(sorted, detectExposed))
    .then(_.partial(_.object, sorted))
    .then(resolveExposed)
    .then(checkConflicts)

  function detectExposed(pkgName){
    var orderedPkgs = tree.resolve(pkgName);

    var files = _.pick(srcs, orderedPkgs);
    files = _.flatten(_.values(files));
    return findGlobals(files)
      .fail(function(err){
        console.error(PLUGIN_NAME, pkgName, err);
      })

  }

  function resolveExposed(ALL){
    return _.mapValues(ALL, function(exposed, pkgName){
      var deps = depsSorted[pkgName];

      // exposed of the dependencies
      var depExposed = _.chain(ALL)
        .pick(deps)
        .values()
        .flatten()
        .uniq()
        .value()

      exposed = _.difference(exposed, depExposed);

      return exposed;
    });
  }

  function checkConflicts(ALL){
    // globals exposed by more than one component
    var duplicates = _.chain(ALL)
      .values()
      .flatten()
      .countBy(_.identity)
      .pick(function(x){
        return x > 1
      })
      .keys()
      .value();

    if(duplicates.length){
      // components containg duplicates
      var comps = _.map(duplicates, function(varName){
        return _.keys(_.pick(ALL, function(vars){
          return _.contains(vars, varName);
        }));
      })

      var conflicts = _.object(duplicates, comps);

      console.log(PLUGIN_NAME, 'global namespace collisions', JSON.stringify(conflicts, null, 2));
    }

    return ALL;
  }

}

function selectShim(exposed, name){

  if(!exposed || !exposed.length)return false;

  if(exposed.length == 1)return exposed[0];

  var sName = simpleName(name);

  // matches 'Holder' from 'holderjs'
  var match = _.find(exposed, function(varName){
    return sName == simpleName(varName);
  });

  // matches 'io' from 'socket.io-client'
  if(!match){
    var names = splitName(name);
    match = _.find(exposed, function(varName){
      return _.contains(names, simpleName(varName));
    });
  }

  return match || exposed;
}

/**
 * HELPERS
 */

  // 'A.B_C-123' -> 'ABC123'
function simpleName(name){
  return name
    .toLowerCase()
    .replace(/\.*(js|css)*$/g, "")
    .replace(/[^\w\d]*/g, "")
}

// 'A.B_C-123' -> ['A','B','C','123']
function splitName(name){
  return name
    .toLowerCase()
    .replace(/\.*(js|css)*$/g, "")
    .split(/[\.\-\_]/g);
}

function asArray(x){
  return _.isString(x) ? [x] : _.toArray(x);
}

function readFile(fPath){
  try {
    return fs.readFileSync(fPath)
  } catch(err){
    err = (err.code == 'ENOENT') ? ('file not found: ' + err.path) : err;
    console.error(PLUGIN_NAME, err);
    return "";
  }
}