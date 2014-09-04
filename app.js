
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var express = require('express');
var forms = require('forms');
var fields = forms.fields;
var validations = forms.validations;
var methodOverride = require('method-override');
var morgan = require('morgan');
var redis = require('redis');
var multer = require('multer');
var nconf = require('nconf');
var path = require('path');
var session = require('express-session');

var config = nconf.env().argv().file('localconfig.json').defaults({
  PORT: 3000,
  redis: {
    namespace: 'misdirection:'
  },
  adminPath: '/admin',
  sessionSecret: '017b856lz'
});

var app = express();

if('test'==process.env.NODE_ENV) {
  redis = require('fakeredis');
}
var db = redis.createClient();
db.namespace = config.get('redis:namespace');

// all environments
app.set('port', config.get('PORT'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: config.get('sessionSecret') }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

// development only
if ('development' == app.get('env')) {
  app.use(morgan('dev'));
  app.use(errorHandler());
  app.use(config.get('adminPath'), express.static(path.join(__dirname, 'public')));
}


app.get(config.get('adminPath'), function(req, res) {
  var form = forms.create({
    key: fields.string({required:true, placeHolder: '/path-key'})
  });
  form.handle(req, {
    success: function(form) {
    },
    error: function(form) {
      res.send(form.toHTML());
    },
    empty: function(form) {
      res.send(form.toHTML());
    },
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
