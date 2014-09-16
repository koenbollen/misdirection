
(function(window, document) {

  function get(path, callback) {
    var r = new XMLHttpRequest();
    r.open("GET", path, true);
    r.onreadystatechange = function () {
      if (r.readyState != 4) {
        return;
      }
      if(r.status != 200) {
        callback(new Error('failed request: ' + r.statusText));
        return;
      }
      var body = r.responseText;
      if(r.headers('content-type') == 'application/json') {
        try {
          body = JSON.parse(body);
        } catch(e) {
          return callback(e);
        }
      }
      callback(null, r, r.responseText);
    };
    r.ontimeout = function() {
      callback(new Error('connection timed out'));
    };
    r.send();
  }

  function debounce(func, wait) {
    var thisArg;
    var args;
    var timeout = null;
    var invoke = function() {
      func.call(thisArg, args);
    };
    return function() {
      args = arguments;
      thisArg = this;
      if(timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(invoke, wait);
    };
  }

  function onTypeChange(e) {
    var extras = document.querySelectorAll('.extra');
    for( var i = 0; i < extras.length; i++ ) {
      extras[i].style.display = 'none';
    }
    var extra = document.querySelector('.extra-'+this.value);
    if(extra !== null) {
      extra.style.display = 'block';
    }
  }

  document.addEventListener("DOMContentLoaded", function() {

    var input = document.querySelector('input[name="name"]');
    input.focus();

    var type = document.querySelector('select[name="type"]');
    type.onchange = onTypeChange;
    onTypeChange.call(type);

  });
})(window, document);
