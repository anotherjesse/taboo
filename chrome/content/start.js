/*
 * Copyright 2007-2008 Jesse Andrews, Manish Singh, Ian Fischer
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


const Cc = Components.classes;
const Ci = Components.interfaces;
const SVC = Components.classes['@oy/taboo;1']
  .getService(Components.interfaces.oyITaboo);
var tboPrefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService).getBranch('extensions.taboo.');

function init() {
  DomBuilder.apply(window);

  controller = new Controller();

  try {
    var view = tboPrefs.getCharPref("view");
    controller.load(view);
  }
  catch (e) {
    controller.load('Grid');
  }

  var searchBox = document.getElementById('search');
  searchBox.onkeyup = function(event) {
    controller.filter(this.value);
  }
  searchBox.value = '';
  searchBox.focus();
}

window.addEventListener("load", init, false);

function Controller() {
  var content = document.getElementById('content');
  var footerControls = document.getElementById('footer-controls');
  var view = null;

  this.load = function(view_name) {
    var ViewClass = top[view_name];

    content.innerHTML = '';
    footerControls.innerHTML = '';

    view = new ViewClass(content, footerControls);
    if (!view_name.match(/Trash|About/)) {
      tboPrefs.setCharPref("view", view_name);
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
    humanMsg.displayMsg("This taboo has been permanently deleted.");
    el.style.display = "none";
    SVC.reallyDelete(tab.url);
  }

  this.tabUndelete = function(tab) {
    humanMsg.displayMsg("This taboo has been restored.");
    SVC.undelete(tab.url);
  }

  this.displayUndelete = function(tab, el) {
    humanMsg.displayMsg("This taboo has been deleted. View the trashcan to restore or permanently delete taboos.");
    return;
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
