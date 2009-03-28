var debug = false;

const SVC = Cc['@oy/taboo;1']
  .getService(Ci.oyITaboo);

var $ = function $(id) { return document.getElementById(id); };
function nop() {}
var log = nop;
var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService)
.getBranch('extensions.taboo.');

function init() {

  function setupLog() {
    if (debug) {
      if ("undefined" != typeof console) {
        log = console.log;
      } else {
        var t = Cc['@mozilla.org/consoleservice;1']
          .getService(Ci.nsIConsoleService);
        log = function log(x) { t.logStringMessage(x); };
      }
    }
  }


  installInToolbar();
  updateKeybindings();

  if (gBrowser) {
    gBrowser.addProgressListener(progressListener,
                                 Ci.nsIWebProgress.NOTIFY_LOCATION);
  }

}

function uninit() {
  if (gBrowser)
    gBrowser.removeProgressListener(progressListener);
}

window.addEventListener("load", init, false);
window.addEventListener("unload", uninit, false);



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
  onSecurityChange: nop
};

function popInfoTab() {
  var version = Cc["@mozilla.org/extensions/manager;1"]
    .getService(Ci.nsIExtensionManager)
    .getItemForID("taboo@runningfrombears.com").version;
  var STARTUP_SHOW_DELAY = 500;
  var pageURL;
  var lastVersion = prefs.getCharPref("lastversion");
  if (lastVersion == "firstrun") {
    if (prefs.getPrefType("firstRunURL"))
      pageURL = prefs.getCharPref("firstRunURL");
  } else if (lastVersion != version) {
    if (prefs.getPrefType("upgradeURL")) pageURL = prefs.getCharPref("upgradeURL");
  }

  prefs.setCharPref("lastversion", version);
  if (pageURL && pageURL != "null") {
    setTimeout(function(){
                 window.openUILinkIn(pageURL, "tab");
               }, STARTUP_SHOW_DELAY);
  }
}

function decorateWindow() {
  var runtime = Cc['@mozilla.org/xre/app-info;1']
    .getService(Ci.nsIXULRuntime);
  $('taboo-quickShow').setAttribute('OS', runtime.OS);
  $('taboo-details').setAttribute('OS', runtime.OS);
}


// Check whether we installed the toolbar button already and install if not
function installInToolbar() {
  var addId = "taboo-toolbarbutton-add";
  var viewId = "taboo-toolbarbutton-view";

  // exit early -- already installed
  if (prefs.getPrefType("setup") || $(addId)) {
    return;
  }

  var before = $("urlbar-container");
  var toolbar = $("nav-bar");
  if (toolbar && "function" == typeof toolbar.insertItem) {
    if (before && before.parentNode != toolbar)
      before = null;

    toolbar.insertItem(addId, before, null, false);
    toolbar.insertItem(viewId, before, null, false);

    toolbar.setAttribute("currentset", toolbar.currentSet);
    document.persist(toolbar.id, "currentset");
  }

  // The topbar button is Flock-only (if we're not in Flock, personalbar == null)
  var personalbar = $("PersonalToolbar");
  if (personalbar && "function" == typeof personalbar.insertItem) {
    personalbar.insertItem("taboo-toolbarbutton-topbar",
                           $('photos-button'),
                           null,
                           false);
    personalbar.setAttribute("currentset", personalbar.currentSet);
    document.persist(personalbar.id, "currentset");
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

