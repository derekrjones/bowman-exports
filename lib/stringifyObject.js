var _ = require('lodash');

module.exports = function(modules){
  var isArr = Array.isArray(modules);
  modules = _.map(modules, function(v, k){
    if(isArr)k = v;
    return "'" + k + "': " + v;
  });
  modules = "{ " + modules.join(", ") + " }";
  return modules;
}