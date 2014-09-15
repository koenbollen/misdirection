
var _ = require('lodash');
var async = require('async');

var app = require('../app');

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
  var ns = app.redis.namespace;
  app.redis.multi()
    .hgetall(ns + 'info:' + id)
    .smembers(ns + 'aliases:' + id)
    .exec(function(err, results) {
      if(err) {
        return callback(err);
      }
      var info = results[0];
      if(!info) {
        return callback(null, null);
      }
      info.aliases = results[1];
      callback(null, info);
    });
}

function find(name, callback) {
  var ns = app.redis.namespace;

  name = normalize(name);
  app.redis.get(ns+'alias:'+name, function(err, id) {
    if(err) {
      callback(err);
    } else {
      if(id === null) {
        id = name;
      }
      get(id, callback);
    }
  });
}

function create(name, info, callback) {
  var ns = app.redis.namespace;

  var id = normalize(name);
  var multi = app.redis.multi();

  var err;
  ['type', 'url'].forEach(function(field) {
    if(!_.has(info, field)) {
      err = new Error('missing info field: ' + field);
      return false;
    }
  });
  if(err) {
    return callback(err);
  }

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

function list(prefix, callback) {
  var ns = app.redis.namespace;
  if(callback===undefined) {
    callback = prefix;
    prefix = '';
  }

  app.redis.keys(ns+'info:'+prefix+'*', function(err, keys) {
    async.map(keys, function(key, cb) {
      var id = key.substr(ns.length+5, 1000);
      get(id, cb);
    }, callback);
  });
}

function remove(id, callback) {
  var ns = app.redis.namespace;

  get(id, function(err, info) {
    if(err) {
      return callback(err);
    }
    var multi = app.redis.multi();
    multi.del(ns+'info:'+info.id);
    multi.del(ns+'aliases:'+info.id);
    info.aliases.forEach(function(alias) {
      multi.del(ns+'alias:'+normalize(alias));
    });
    multi.exec(callback);
  });
}

exports.normalize = normalize;
exports.get = get;
exports.find = find;
exports.create = create;
exports.list = list;
exports.remove = remove;
