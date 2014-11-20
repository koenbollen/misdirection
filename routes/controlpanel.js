
var _ = require('lodash');
var url = require('url');

var app = require('../app');
var directions = require('../lib/directions');

exports.route = function(server) {

  var checkboxes = [
    'hidden',
    'permanent',
  ];

  server.get(app.config.get('controlpanel:path'), function(req, res) {
    res.render('controlpanel', {req:req});
  });

  server.post(app.config.get('controlpanel:path'), function(req, res) {
    if(req.body.name) {
      var name = req.body.name;
      req.body.name = undefined;

      _.each(checkboxes, function(checkbox) {
        if(req.body[checkbox] == 'on') {
          req.body[checkbox] = true;
        } else {
          req.body[checkbox] = false;
        }
      });

      directions.create(name, req.body, function(err, info, result) {
        if(err) {
          res.render('controlpanel', {req:req, err:err});
        } else {
          //console.log(info);
          res.redirect(url.resolve('/',info.name));
        }
      });
    } else {
      res.render('controlpanel', {req:req});
    }
  });

  server.get(app.config.get('controlpanel:path') + '/a/search', function(req, res) {
    if(!req.query.q) {
      res.status(400).send('missing paramater: q');
      return;
    }

    directions.search(req.query.q, function(err, result) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(result);
    });

  });
};
