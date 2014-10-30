
(function(window, document) {

  function get(path, callback) {
    var r = new XMLHttpRequest();
    r.open("GET", path, true);
    r.onreadystatechange = function () {
      if (r.readyState != 4) {
        return;
      }
      if(r.status != 200) {
        callback(new Error('failed request: ' + r.statusText + ' ('+r.responseText+')'));
        return;
      }
      var body = r.responseText;
      if(r.getResponseHeader('content-type').indexOf('application/json') === 0) {
        try {
          body = JSON.parse(body);
        } catch(e) {
          return callback(e);
        }
      }
      callback(null, r, body);
    };
    r.ontimeout = function() {
      callback(new Error('connection timed out'));
    };
    r.send();
  }

  function display_error(msg, duration, key) {
    var el = document.createElement('div');
    if(key) {
      if(!display_error.keys) {
        display_error.keys = {};
      }
      if(display_error.keys[key]) {
        this.parentNode.removeChild(this);
      }
      display_error.keys[key] = el;
    }
    el.classList.add('error');
    el.innerHTML = msg;
    el.timeout = setTimeout(function() {
      this.parentNode.removeChild(this);
      if(key) {
        display_error.keys[key] = null;
      }
    }.bind(el), duration||1000);
    document.querySelector('.errorlist').appendChild(el);
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

  function onSearchKeyUp(e) {
    if(this.prev === this.value || this.value.trim().length <= 0) {
      return;
    }
    this.prev = this.value;

    get('./a/search?q='+escape(this.value), function(err, resp, body) {
      if(err) {
        return display_error(err + body, 1000, 'auto-search');
      }
      console.log(body);
    });

    console.log(this.value);
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

    var search = document.querySelector('#search');
    search.focus();
    search.onkeyup = debounce(onSearchKeyUp);

    var type = document.querySelector('select[name="type"]');
    type.onchange = onTypeChange;
    onTypeChange.call(type);



  });
})(window, document);
