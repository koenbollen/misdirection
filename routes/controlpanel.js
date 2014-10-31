
var url = require('url');

var app = require('../app');
var directions = require('../lib/directions');

exports.route = function(server) {

  server.get(app.config.get('controlpanel:path'), function(req, res) {
    res.render('controlpanel', {req:req});
  });

  server.post(app.config.get('controlpanel:path'), function(req, res) {
    if(req.body.name) {
      var name = req.body.name;
      req.body.name = undefined;
      directions.create(name, req.body, function(err, info, result) {
        if(err) {
          res.render('controlpanel', {req:req, err:err});
        } else {
          console.log(info);
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
