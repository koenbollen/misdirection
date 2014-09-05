

var assert = require('assert');

process.env.NODE_ENV = 'test';
var app = require('../app');

var directions = require('../lib/directions');

var redis = app.redis;
var ns = app.redis.namespace;

describe('normalize(input)', function() {
  it('trims whitespace', function() {
    assert.equal('isa', directions.normalize('  isa '));
    assert.equal('cas', directions.normalize('cas'));
    assert.equal('tijs', directions.normalize('tijs   '));
  });
  it('converts to lowercase', function() {
    assert.equal('tamar', directions.normalize('Tamar'));
    assert.equal('tim', directions.normalize('TIM'));
    assert.equal('isa', directions.normalize('  IsA '));
  });
  it('replaces [.+ _-] to a /', function() {
    assert.equal('test/url', directions.normalize('test_url'));
    assert.equal('tim/cas/isa', directions.normalize('tim-cas.isa'));
    assert.equal('tamer/tijs/stijn', directions.normalize('tamer+tijs stijn'));
  });
  it('removes dubble slashes //', function() {
    assert.equal('test/url', directions.normalize('test//url'));
    assert.equal('test/url/with/more/slashes', directions.normalize('test//url///with/more//slashes'));
    assert.equal('test/url', directions.normalize('test.+ _-url'));
  });
  it('removes trailing slashes', function() {
    assert.equal('isa', directions.normalize('/isa'));
    assert.equal('cas/tijs', directions.normalize('/cas-tijs/'));
  });
  it('handles weird inputs', function() {
    assert.equal(
      'hallo/koen/test/normalize/function/with/spaces',
      directions.normalize('/hallo koen/test-normalize_function  with  spaces')
    );
  });
});

describe('get(id, callback)', function() {
  before(function(done) {
    redis.multi()
      .set(ns+'alias:administrator', 'admin')
      .sadd(ns+'aliases:admin', 'administrator')
      .hmset(ns+'info:admin',
        'id', 'admin',
        'name', '/admin',
        'url', 'http://admin.koen.it',
        'type', 'redirect')
      .exec(done);
  });
  it('results with info', function(done) {
    directions.get('admin', function(err, info) {
      assert.ifError(err);
      assert.equal('admin', info.id);
      assert.equal('/admin', info.name);
      assert.equal('http://admin.koen.it', info.url);
      assert.equal('redirect', info.type);
      done();
    });
  });
  it('fetches the aliases', function(done) {
    directions.get('admin', function(err, info) {
      assert.ifError(err);
      assert.equal(1, info.aliases.length);
      assert.equal('administrator', info.aliases[0]);
      done();
    });
  });
});

describe('find(name, callback)', function() {
  before(function(done) {
    redis.multi()
      .set(ns+'alias:administrator', 'admin')
      .sadd(ns+'aliases:admin', 'administrator')
      .hmset(ns+'info:admin',
        'id', 'admin',
        'name', '/admin',
        'url', 'http://admin.koen.it',
        'type', 'redirect')
      .exec(done);
  });
  it('uses the alias', function(done) {
    directions.find('administrator', function(err, info) {
      assert.ifError(err);
      assert.equal('admin', info.id);
      done();
    });
  });
});

describe('create(name, info, callback)', function() {
  it('creates a simple direction', function(done) {
    directions.create('/test', {
      type: 'redirect',
      url: 'http://nu.nl/',
      hidden: true
    }, function(err, info, result) {
      assert.ifError(err);
      assert.equal('test', info.id);
      redis.hgetall(ns+'info:test', function(err, result) {
        assert.ifError(err);
        assert.notEqual(null, result);
        assert.equal('/test', result.name);
        assert.equal('redirect', result.type);
        assert.equal('true', result.hidden);
        done();
      });
    });
  });
  it('stores all aliases', function(done) {
    var aliases = ['/test2','/test3'];
    directions.create('/test', {
      type: 'redirect',
      url: 'http://nu.nl/',
      aliases: aliases
    }, function(err, info, result) {
      assert.ifError(err);
      assert.equal('test', info.id);
      redis.multi()
        .smembers(ns+'aliases:test')
        .get(ns+'alias:test2')
        .get(ns+'alias:test3')
        .exec(function(err, results) {
          assert.deepEqual(aliases, results[0]);
          assert.equal('test', results[1]);
          assert.equal('test', results[2]);
          done();
        });
    });
  });
  it('should error when type/url are missing', function(done) {
    directions.create('/test', {
      test: 'ok'
    }, function(err, info, result) {
      assert.notEqual(null, err);
      assert.equal('missing info field: url', err.message);
      assert.equal(null, info);
      done();
    });
  });
});
