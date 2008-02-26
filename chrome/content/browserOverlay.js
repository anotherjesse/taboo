var tboDebug = false;
var $ = function(x) { return document.getElementById(x); }
var tboPrefs, tboLog;

function Taboo() {
  const SVC = Cc['@oy/taboo;1'].getService(Ci.oyITaboo);

  this.addTaboo = function(event) {
    SVC.save(null);
    $('taboo-toolbarbutton-add').setAttribute('saved', true);
  }

  this.addTabooAndClose = function(event) {
    SVC.save(null);
    $('taboo-toolbarbutton-add').setAttribute('saved', true);

    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec.replace(/#.*/, '');
    if (SVC.isSaved(url)) {
      BrowserCloseTabOrWindow();
    }
  }

  this.removeTaboo = function(event) {
    var url = gBrowser.selectedBrowser.webNavigation.currentURI.spec.replace(/#.*/, '');
    SVC.delete(url);
    $('taboo-toolbarbutton-add').removeAttribute('saved');
  }

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
  }

  this.updateButton = function(url) {
    if (url && SVC.isSaved(url)) {
      $('taboo-toolbarbutton-add').setAttribute('saved', true);
    }
    else {
      $('taboo-toolbarbutton-add').removeAttribute('saved');
    }
  }
}

var taboo;

function taboo_init() {
  if (tboDebug) {
    if (typeof(console)=="undefined") {
      var t = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
      tboLog = function(x) { t.logStringMessage(x); }
    }
    else {
      tboLog = console.log;
    }
  }
  else {
    tboLog = function(x) {};
  }


  tboPrefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.taboo.');

  taboo = new Taboo();

  tboInstallInToolbar();
  tboUpdateKeybindings();

  gBrowser.addProgressListener(tboProgressListener,
                               Ci.nsIWebProgress.NOTIFY_LOCATION);
}

function taboo_uninit() {
  gBrowser.removeProgressListener(tboProgressListener);
}

window.addEventListener("load", taboo_init, false);
window.addEventListener("unload", taboo_uninit, false);

var tboProgressListener = {
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
  onStateChange: function() {},
  onStatusChange: function() {},
  onProgressChange: function() {},
  onSecurityChange: function() {},
};

// Check whether we installed the toolbar button already and install if not
function tboInstallInToolbar() {
	// Make sure not to run this twice
  if (!tboPrefs.getPrefType("setup")) {
		if (!document.getElementById("taboo-toolbarbutton-add")) {
			var insertBeforeBtn = "urlbar-container";
			var toolbar = document.getElementById("nav-bar");
			if (toolbar && "insertItem" in toolbar) {
				var insertBefore = $(insertBeforeBtn);

				if (insertBefore && insertBefore.parentNode != toolbar)
					insertBefore = null;
	
				toolbar.insertItem("taboo-toolbarbutton-add", insertBefore, null, false);
				toolbar.insertItem("taboo-toolbarbutton-view", insertBefore, null, false);
					
				toolbar.setAttribute("currentset", toolbar.currentSet);
				document.persist(toolbar.id, "currentset");
			}
		}
		tboPrefs.setBoolPref("setup", true);
  }
}

function tboUpdateKeybindings() {
  
  function update(key_id, attribute) {
    try {
      if (tboPrefs.getPrefType(key_id + '.' + attribute)) {
        var val = tboPrefs.getCharPref(key_id + '.' + attribute);
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
