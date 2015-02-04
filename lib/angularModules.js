/*
 Shim exports for angular modules
 - if no export specified try angular modules (ie. bowman-angular)
 - attempts to reduce down to a single module or returns an object
 - excludes templates (containing '/')
 - removes common prefixes ( 'ui.mask' -> 'mask' )
 - camelCases ('animal.mammal.dog' -> 'animalMammalDog')

     "angular-bootstrap": angular.module('ui.bootstrap'),
     "angular-dragdrop": angular.module('ngDragDrop'),
     "angular-mocks": {
         "animateMock": angular.module('ngAnimateMock'),
         "mock": angular.module('ngMock')"
     },
     "angular-ui-utils": {
         "utils": angular.module('ui.utils'),
         "alias": angular.module('ui.alias'),
         "scroll": angular.module('ui.scroll'),
         "scrollJqlite": angular.module('ui.scroll.jqlite'),
         ...
     }
 */

var _ = require('lodash');

module.exports = function(pkg){
  if(pkg.angular){
    return process(pkg);
  }
}

function process(pkg){
  var mods = _.keys(pkg['angular']);
  mods = reduceModules(mods);
  mods = wrapModules(mods);
  return mods;
}

function reduceModules(modules){
  modules = modules.sort();

  // ignore templates
  modules = _.filter(modules, function(mod){
    if(mod.indexOf('/') !== -1)return false;
    return true;
  });

  // pick 'ui.bootstrap' over 'ui.bootstrap.carousel'
  var prev;
  var reduced = _.filter(modules, function(mod){
    if(mod.indexOf(prev) === 0)return false;
    prev = mod;
    return true;
  });

  if(reduced.length == 1)return reduced[0];

  //return before reduced
  return modules;
}

function wrapModules(modules){
  if(!modules.length){
    return null;
  }
  else if(_.isString(modules)){
    modules = wrap(modules);
  }
  else {
    modules = _.object(unBase(modules), _.map(modules, wrap));
  }

  return modules;
}

// export for a module
function wrap(module){
  return "angular.module('" + module + "')";
}

// remove common base and unCapitalize
function unBase(arr){
  var base = arr.reduce(commonBase, arr[0]);
  return arr.map(function(x){
    x = x.substr(base.length);
    x = x.charAt(0).toLowerCase() + x.substr(1);
    x = camelCase(x);
    return x;
  })
}

// find common base between two strings
function commonBase(s1, s2){

  if(s2.indexOf(s1) === 0)return s1;

  var cnt = 0, len = Math.min(s1.length, s2.length)

  while(cnt < len && s1.charAt(cnt) == s2.charAt(cnt))cnt++;

  return s1.substr(0, cnt);
}

function camelCase(s){
  return s.replace(/[-\.\/]([a-z])/g, function(g){
    return g[1].toUpperCase();
  });
}

