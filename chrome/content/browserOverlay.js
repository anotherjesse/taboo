var taboo;

(function() { // keep our privates to ourselves

var $ = function $(id) { return document.getElementById(id); };
var log = function log(msg) {}; // maybe overridden in init
var debug = false;
var prefs;

function Taboo() {
  const SVC = Cc['@oy/taboo;1'].getService(Ci.oyITaboo);

  function saved(state) {
    if ($('taboo-toolbarbutton-add')) {
      if (state) {
        $('taboo-toolbarbutton-add').setAttribute('saved', true);
      }
      else {
        $('taboo-toolbarbutton-add').removeAttribute('saved');
      }
    }
  }

  this.gotoRecent = function(targetNode, event) {
    event.preventDefault();
    event.stopPropagation();
    SVC.open(targetNode.getAttribute('url'), 'tabforeground');
  };

  this.showRecentList = function(domId) {
    var popup = $(domId);
    while (popup.firstChild) {
      popup.removeChild(popup.firstChild);
    };

    function addRecent(tab) {
      var item = document.createElement('menuitem');
      item.setAttribute('class', 'menuitem-iconic');
      item.setAttribute('label', tab.title);
      item.setAttribute('oncommand', 'taboo.gotoRecent(this, event);');
      item.setAttribute('url', tab.url);
      item.setAttribute('image', tab.favicon);
      item.setAttribute('tooltiptext', tab.url);
      popup.appendChild(item);
    }

    var taboos = SVC.getRecent(15);

    if (taboos.hasMoreElements()) {
      while (taboos.hasMoreElements()) {
        var tab = taboos.getNext();
        tab.QueryInterface(Components.interfaces.oyITabooInfo);
        addRecent(tab);
      }
    }
    else {
      var item = document.createElement('menuitem');
      item.setAttribute('label', 'No Tabs Saved');
      item.setAttribute('disabled', true);
      popup.appendChild(item);
    }
  };

  this.toggleTaboo = function(event) {
    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec.replace(/#.*/, '');

    if (SVC.isSaved(url)) {
      SVC.delete(url);
      saved(false);
    } else {
      SVC.save(null);
      saved(true);
    }
  };

  this.addTaboo = function(event) {
    SVC.save(null);
    saved(true);
  };

  this.addTabooAndClose = function(event) {
    SVC.save(null);
    saved(true);

    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec.replace(/#.*/, '');
    if (SVC.isSaved(url)) {
      BrowserCloseTabOrWindow();
    }
  };

  this.removeTaboo = function(event) {
    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec.replace(/#.*/, '');
    SVC.delete(url);
    saved(false);
  };

  this.show = function(event) {
    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec;
    if (event.shiftKey ||
        url == 'about:blank' ||
        url == 'chrome://taboo/content/start.html') {
      openUILinkIn('chrome://taboo/content/start.html', 'current');
    }
    else {
      openUILinkIn('chrome://taboo/content/start.html', 'tab');
    }
  };

  this.updateButton = function(url) {
    if (url && SVC.isSaved(url)) {
      saved(true);
    }
    else {
      saved(false);
    }
  };
}

function init() {
  if (debug) {
    if ("undefined" != typeof console) {
      log = console.log;
    } else {
      var t = Cc['@mozilla.org/consoleservice;1'].
        getService(Ci.nsIConsoleService);
      log = function log(x) { t.logStringMessage(x); };
    }
  }

  prefs = Cc['@mozilla.org/preferences-service;1'].
    getService(Ci.nsIPrefService).getBranch('extensions.taboo.');

  taboo = new Taboo();

  installInToolbar();
  updateKeybindings();

  gBrowser.addProgressListener(progressListener,
                               Ci.nsIWebProgress.NOTIFY_LOCATION);
}

function uninit() {
  gBrowser.removeProgressListener(progressListener);
}

window.addEventListener("load", init, false);
window.addEventListener("unload", uninit, false);

function nop() {}

var progressListener = {
  last: 'none',
  onLocationChange: function(aWebProgress, aRequest, aLocation) {
    var url;
    try {
      url = aLocation.spec.replace(/#.*/, '');
    } catch (e) {}
    if (url != this.last) {
      taboo.updateButton(url);
      this.last = url;
    }
  },
  onStateChange: nop,
  onStatusChange: nop,
  onProgressChange: nop,
  onSecurityChange: nop,
};

// Check whether we installed the toolbar button already and install if not
function installInToolbar() {
  var addid = "taboo-toolbarbutton-add";
  var viewid = "taboo-toolbarbutton-view";
  if (prefs.getPrefType("setup") || $(addid))
    return; // exit early -- already installed

  var before = $("urlbar-container");
  var toolbar = $("nav-bar");
  if (toolbar && "function" == typeof toolbar.insertItem) {
    if (before && before.parentNode != toolbar)
      before = null;

    toolbar.insertItem(addid, before, null, false);
    toolbar.insertItem(viewid, before, null, false);

    toolbar.setAttribute("currentset", toolbar.currentSet);
    document.persist(toolbar.id, "currentset");
  }

  prefs.setBoolPref("setup", true); // Done! Never do this again.
}

function updateKeybindings() {

  function update(key_id, attribute) {
    try {
      if (prefs.getPrefType(key_id + '.' + attribute)) {
        var val = prefs.getCharPref(key_id + '.' + attribute);
        if (val && val.length > 0) {
          var binding = document.getElementById(key_id);
          binding.setAttribute(attribute, val);
        }
      }
    } catch (e) {}
  }

  ["key_showTaboos", "key_addTaboo", "key_addTabooAndClose", "key_removeTaboo"].forEach(function(key_id) {
    update(key_id, 'key');
    update(key_id, 'modifiers');
  });
}

})();
