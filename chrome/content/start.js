/*
 * Copyright 2007 Jesse Andrews, Manish Singh, Ian Fischer
 *
 * This file may be used under the terms of of the
 * GNU General Public License Version 2 or later (the "GPL"),
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 */

function Controller() {
  var content = $('content');
  var view = null;
  
  this.load = function(view_name) {
    var ViewClass = top[view_name];

    content.innerHTML = '';

    view = new ViewClass(content);
    if (!view_name.match(/Trash|About/)) {
      tboPrefs.setCharPref("extensions.taboo.view", view_name);
    }
    this.display();
  }

  this.filter = function(str) {
    if (this._filterStr == str) {
      return;
    }

    this.display(str);
    this._filterStr = str;
  }

  this.tabDelete = function(tab, el) {
    el.style.display = "none";
    this.displayUndelete(tab, el);
    SVC.delete(tab.url);
  }

  this.tabFinalDelete = function(tab, el) {
    el.style.display = "none";
    SVC.reallyDelete(tab.url);
  }

  this.tabUndelete = function(tab) {
    SVC.undelete(tab.url);
  }

  this.displayUndelete = function(tab, el) {
    var a = document.getElementById('undeleteLink');
    var div = document.getElementById('undelete');
    a.onclick = function() { 
      el.style.display = '';
      div.style.visibility = 'hidden';
      SVC.undelete(tab.url);
    };
    div.url = tab.url;
    div.style.visibility = 'visible';    
    setTimeout(function() { 
      if (div.url == tab.url) {
        div.style.visibility = 'hidden';
      }
    }, 30000);
  }

  this.display = function(searchTxt) {
    view.start();

    var taboos = SVC.get(searchTxt, view.trash);
    
    if (!searchTxt && !view.trash && !view.info && !taboos.hasMoreElements()) {
      controller.load(DisplayInfo);
      return;
    }
    
    while (taboos.hasMoreElements()) {
      var tab = taboos.getNext();
      tab.QueryInterface(Components.interfaces.oyITabooInfo);
      view.add(tab);
    }

    view.finish();
  }

}

var controller = new Controller();









function build(elementName, params) {
  var node = document.createElement(elementName);
  if (params) {
    for (var i in params) {
      if (typeof(params[i]) == 'function') {
        node[i] = params[i];
      }
      else {
        node.setAttribute(i, params[i]);
      }
    }
  }
  return node;
}
