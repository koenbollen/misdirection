
var url = require('url');

var app = require('../app');
var directions = require('../lib/directions');

exports.route = function(server) {

  server.get(app.config.get('controlpanel:path'), function(req, res) {
    res.render('controlpanel', {req:req});
  });

  server.post(app.config.get('controlpanel:path'), function(req, res) {
    console.log(req.body);
    if(req.body.name !== undefined) {
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
};
