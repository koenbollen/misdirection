
var _ = require('lodash');

var app = require('../app');

var redis = app.redis;
var ns = app.redis.namespace;

function normalize(input) {
  var norm = input.trim().toLowerCase();
  norm = norm.replace(/[\/.+ _-]+/g, '/');
  if(norm[0]=='/') {
    norm = norm.substr(1,norm.length);
  }
  if(norm[norm.length-1]=='/') {
    norm = norm.substr(0,norm.length-1);
  }
  return norm;
}

function get(id, callback) {
  redis.multi()
    .hgetall(ns + 'info:' + id)
    .smembers(ns + 'aliases:' + id)
    .exec(function(err, results) {
      if(err) {
        return callback(err);
      }
      var info = results[0];
      info.aliases = results[1];
      callback(null, info);
    });
}

function find(name, callback) {
  name = normalize(name);
  redis.get(ns+'alias:'+name, function(err, id) {
    if(err) {
      callback(err);
    } else {
      get(id, callback);
    }
  });
}

function create(name, info, callback) {
  var id = normalize(name);
  var multi = redis.multi();

  ['type', 'url'].forEach(function(field) {
    if(!_.has(info, field)) {
      throw new Exception('missing info field: ' + field);
    }
  });

  info = _.assign(info, {
    id: id,
    name: name,
    creation: new Date()
  });

  _.keys(info).forEach(function(key) {
    multi.hset(ns+'info:'+id, key, info[key].toString());
  });

  if(_.isArray(info.aliases)) {
    info.aliases.forEach(function(alias) {
      multi.set(ns+'alias:'+normalize(alias), id);
    });
    multi.sadd(ns+'aliases:'+id, info.aliases);
  }

  multi.exec(function(err, result) {
    callback(err, info, result);
  });
}


exports.normalize = normalize;
exports.get = get;
exports.find = find;
exports.create = create;
