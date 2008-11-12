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

function FF3() {
  var ss = Cc['@mozilla.org/browser/sessionstore;1']
    .getService(Ci.nsISessionStore);
  return ss.getTabState;
}

function init() {
  if (FF3()) {
    $('#tools').show();
  }

  DomBuilder.apply(window);

  controller = new Controller();

  try {
    var view = tboPrefs.getCharPref("view");
    var taboos = SVC.get('', view.trash);
    if (!view.trash && !view.info && !taboos.hasMoreElements()) {
      controller.load('About');
      return;
    }
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

  jQuery.fn.hue();
}

function uninit() {
  controller.unload();
}

window.addEventListener("load", init, false);
window.addEventListener("unload", uninit, false);

function Controller() {
  var content = document.getElementById('content');
  var footerControls = document.getElementById('footer-controls');
  var view = null;
  var inst = this;

  this.tabooObserver = {
    onSave: function (aURL, aIsNew) {
      inst.display();
    },

    onDelete: function (aURL) {
      inst.display();
    },

    onUndelete: function(aURL) {
      inst.display();
    },

    onReallyDelete: function(aURL) {
      inst.display();
    }
  };

  this.load = function(view_name) {
    var ViewClass = window.top[view_name];

    content.innerHTML = '';
    footerControls.innerHTML = '';

    view = new ViewClass(content, footerControls);
    if (!view_name.match(/Trash|About/)) {
      tboPrefs.setCharPref("view", view_name);
    }
    this.display();

    SVC.addObserver(this.tabooObserver);
  }

  this.unload = function() {
    SVC.removeObserver(this.tabooObserver);
  };

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

  this.tabFinalDelete = function(tab) {
    SVC.reallyDelete(tab.url);
  }

  this.tabUndelete = function(tab) {
    humanMsg.displayMsg("This taboo has been restored.");
    SVC.undelete(tab.url);
  }

  this.displayUndelete = function(tab, el) {
    humanMsg.displayMsg("This taboo has been deleted.<br /><small>View the trashcan to restore or permanently delete taboos.</small>");
    return;
  }

  this.display = function(searchTxt) {
    view.start();

    var taboos = SVC.get(searchTxt, view.trash);

    while (taboos.hasMoreElements()) {
      var tab = taboos.getNext();
      tab.QueryInterface(Components.interfaces.oyITabooInfo);
      view.add(tab);
    }

    view.finish();
  }
}
