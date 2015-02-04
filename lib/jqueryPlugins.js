var _ = require('lodash');

module.exports = function(pkg){
  var inName = ((pkg.name || "").toLowerCase().indexOf('jquery') !== -1);
  var deps = _.keys(pkg.dependencies);
  var asDependency = (pkg.dependencies && pkg.dependencies['jquery']);

  if(inName && asDependency){
    return 'jQuery';
  }
}