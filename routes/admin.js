
var forms = require('forms');
var fields = forms.fields;
var validations = forms.validations;
var widgets = forms.widgets;

var app = require('../app');

exports.route = function(app) {

  app.get(app.config.get('adminPath'), function(req, res) {
    var form = forms.create({
      key: fields.string({required:true, placeHolder: '/path-key'}),

      type: fields.string({
        required:true,
        widget: widgets.select,
        options:['redirect', 'frame', 'largetype']
      })
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

};
