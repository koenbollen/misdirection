
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
    onTypeChange.call(onTypeChange.select);
  }

  function onSearchKeyUp(e) {
    if(!editing && !selected) {
      var name = document.querySelector('input[name=\'name\']');
      var normalized = normalize(this.value);
      if( normalized.length > 0 ) {
        name.value = '/'+ normalized;
      } else {
        name.value = '';
      }
    }
    if(e && ((e.keyCode == 13) || (e.length && e.length>0 && e[0].keyCode == 13))) {
      document.querySelector('.direction.selected').onclick(e);
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
    get(window.location.href+'/a/search?q='+escape(this.value), function(err, resp, body) {
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
        var urldisplay = d.url;
        if(urldisplay.length > 28) {
          if(urldisplay.indexOf('https://')) {
            urldisplay = urldisplay.substr(9);
          }
          if(urldisplay.indexOf('http://')) {
            urldisplay = urldisplay.substr(8);
          }
          if(urldisplay.length > 28) {
            urldisplay = urldisplay.substr(0,14)+'...'+urldisplay.substr(-14);
          }
        }
        li.innerHTML = '<span class="name">'+d.name+'</span> <small class="type">('+d.type+')</small> → <span class="url">'+urldisplay+'</span>';
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

    var urllabel = document.querySelector('.url-label label');
    var urlinput = document.querySelector('input[name="url"]');
    if(!urllabel.defaultText) {
      urllabel.defaultText = urllabel.innerHTML;
      urlinput.defaultText = urlinput.placeholder;
    }

    if(this.value === 'largetype') {
      urllabel.innerHTML = "Text:";
      urlinput.placeholder = "lorem ipsum";
    } else {
      urllabel.innerHTML = urllabel.defaultText;
      urlinput.placeholder = urlinput.defaultText;
    }
  }

  document.addEventListener("DOMContentLoaded", function() {

    var search = document.querySelector('#search');
    search.focus();
    search.onkeyup = debounce(onSearchKeyUp);

    var type = document.querySelector('select[name="type"]');
    type.onchange = onTypeChange;
    onTypeChange.select = type;
    onTypeChange.call(type);

    // Hook all form inputs so we don't change them while editing:
    var inputs = editform.querySelectorAll('input[type="text"], input[type="number"], select');
    var startEditing = function(e) {
      if([9, 27, 16, 17, 18, 91].indexOf(e.keyCode) != -1) {
        return;
      }
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

      onTypeChange.call(type);
    };

  });
})(window, document);
