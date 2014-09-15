
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var express = require('express');
var methodOverride = require('method-override');
var morgan = require('morgan');
var multer = require('multer');
var nconf = require('nconf');
var path = require('path');
var redis = require('redis');
var session = require('express-session');
var url = require('url');

var config = nconf.env().argv().file('localconfig.json').defaults({
  PORT: 3000,
  redis: {
    namespace: 'misdirection:'
  },
  adminPath: '/admin',
  sessionSecret: 'please change the sessionSecret in the localconfig.json'
});

var directions = require('./lib/directions');

var app = express();

if('test'==process.env.NODE_ENV) {
  redis = require('fakeredis');
}
var db = redis.createClient();
db.namespace = config.get('redis:namespace');

app.set('port', config.get('PORT'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(methodOverride());

var sessionSecret = config.get('sessionSecret');
if(sessionSecret.indexOf('please')===0) {
  console.error('warning:', sessionSecret);
}
app.use(session({
  name: 'misdirection.sid',
  resave: true,
  saveUninitialized: true,
  secret: sessionSecret
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

if ('development' == app.get('env')) {
  app.use(morgan('dev'));
  app.use(errorHandler());
  app.use(config.get('adminPath'), express.static(path.join(__dirname, 'public')));
}

app.use(function(req, res) {
  directions.find(req.path, function(err, info) {
    if(!info) {
      res.send(404);
      return;
    }
    switch(info.type) {
      case 'redirect':
        res.redirect(info.url);
        break;
      case 'frame':
        res.render('frame', info);
        break;
      case 'largetype':
        res.render('largetype', info);
        break;
    }
  });
});

exports.config = config;
exports.server = app;
exports.redis = db;

if (require.main === module) {
  app.listen(app.get('port'), function(){
    console.log('server listening on port ' + app.get('port'));
  });
}
