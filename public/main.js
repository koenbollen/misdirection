
(function(window, document) {

  var editing = false;
  var selected = false;

  var editform = document.getElementById('edit');
  var result_list = document.querySelector('ul.directions');

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

  function clearDirectionsStyle() {
    Array.prototype.forEach.call(document.querySelectorAll('.directions .direction'), function(direction) {
      direction.classList.remove('selected');
      direction.classList.remove('editing');
    });
  }

  function onDirectionClick(e) {
    if(editing) {
      return;
    }
    selected = true;
    editform.selected = this.direction;
    clearDirectionsStyle();
    this.classList.add('selected');
    this.classList.add('editing');
    for( var key in this.direction ) {
      var input = editform.querySelector('[name="'+key+'"]');
      if(input) {
        if(input.type == 'checkbox') {
          input.checked = this.direction[key] == 'true' ? 'checked' : undefined;
        } else {
          input.value = this.direction[key];
        }
      } else {
        console.warn('couldn\'t find input for field: ' + key);
      }
    }
  }

  function onSearchKeyUp(e) {
    if(!editing && !selected) {
      var name = document.querySelector('input[name=\'name\']');
      name.value = '/'+ normalize(this.value);
    }
    if(this.prev === this.value ) {
      return;
    }
    this.prev = this.value;

    if(!editing && selected) {
      selected = false;
      editing = false;
      editform.direction = undefined;
      editform.reset();
    }

    result_list.innerHTML = '';


    if(this.value.trim().length <= 0) {
      return;
    }
    get('./a/search?q='+escape(this.value), function(err, resp, body) {
      if(err) {
        return display_error(err + body, 1000, 'auto-search');
      }
      //console.log(body);
      result_list.innerHTML = '';
      var first = true;
      body.forEach(function(d) {
        var li = document.createElement('li');
        li.classList.add('direction');
        if(first) {
          li.classList.add('selected');
          first = false;
        }
        li.innerHTML = '<span class="name">'+d.name+'</span> <small class="type">('+d.type+')</small> → <span class="url">'+d.url+'</span>';
        li.direction = d;
        li.onclick = onDirectionClick;
        result_list.appendChild(li);
      });
    });
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

    // Hook all form inputs so we don't change them while editing:
    var inputs = editform.querySelectorAll('input, select');
    var startEditing = function() {
      if(!editing) {
        editform.querySelector('.save').disabled = false;
        editform.querySelector('.editing').style.display = '';
      }
      editing = true;
    };
    Array.prototype.forEach.call(inputs, function(input) {
      input.onkeydown = startEditing;
    });

    editform.querySelector('input.cancel').onclick = function(e) {
      clearDirectionsStyle();
      selected = false;
      editing = false;
      editform.direction = undefined;
      editform.reset();

      editform.querySelector('.save').disabled = true;
    editform.querySelector('.editing').style.display = 'none';
    };

  });
})(window, document);
