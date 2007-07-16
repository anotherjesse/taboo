/*
 * Copyright 2007 Jesse Andrews and Manish Singh
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

const TB_CONTRACTID = '@oy/tablets;1';
const TB_CLASSID    = Components.ID('{962a9516-b177-4083-bbe8-e10f47cf8570}');
const TB_CLASSNAME  = 'Tablets Service';


const Cc = Components.classes;
const Ci = Components.interfaces; 
const Cr = Components.results;
const Cu = Components.utils;

/* from nspr's prio.h */
const PR_RDONLY      = 0x01;
const PR_WRONLY      = 0x02;
const PR_RDWR        = 0x04;
const PR_CREATE_FILE = 0x08;
const PR_APPEND      = 0x10;
const PR_TRUNCATE    = 0x20;
const PR_SYNC        = 0x40;
const PR_EXCL        = 0x80;


function getObserverService() {
  return Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);
}


/* MD5 wrapper */
function hex_md5_stream(stream) {   
  var hasher = Components.classes["@mozilla.org/security/hash;1"]
    .createInstance(Components.interfaces.nsICryptoHash);
  hasher.init(hasher.MD5);

  hasher.updateFromStream(stream, stream.available());
  var hash = hasher.finish(false);

  var ret = '';
  for (var i = 0; i < hash.length; ++i) {
    var hexChar = hash.charCodeAt(i).toString(16);
    if (hexChar.length == 1)
      ret += '0';
    ret += hexChar;
  }
}

function hex_md5(s) {
  var stream = Components.classes["@mozilla.org/io/string-input-stream;1"]
    .createInstance(Components.interfaces.nsIStringInputStream);
  stream.setData(s, s.length);

  return hex_md5_stream(stream);
}


/*
 * Tablet Info Instance
 */

function TabletInfo() {
}

TabletInfo.prototype = {
  title: "",
  url: "",
  description: null,
  imageURL: "",
  created: null,
  updated: null,
  QueryInterface: function(iid) {
    if (!iid.equals(Ci.nsISupports) &&
        !iid.equals(Ci.oyITabletInfo)) {
      throw Cr.NS_ERROR_NO_INTERFACE;
    }
    return this;
  }
}

/*
 * Tablets Service Component
 */


function snapshot() {
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  var win = wm.getMostRecentWindow('navigator:browser');
  var content = win.content;

  var canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");

  var realW = content.innerWidth;
  var realH = content.innerHeight;

  var pW = 125.0/realW;
  var pH = 125.0/realH;

  var p = pW;

  if (pH < pW) {
    p = pH;
  }

  var w = p * realW;
  var h = p * realH;

  canvas.setAttribute("width", Math.floor(w));
  canvas.setAttribute("height", Math.floor(h));
  
  var ctx = canvas.getContext("2d");
  ctx.scale(p, p);
  ctx.drawWindow(content, content.scrollX, content.scrollY, content.innerWidth, content.innerHeight, "rgb(0,0,0)");

  return [win, canvas];
}

function TabletStorageFS() {
  this._tabletsDir = Cc['@mozilla.org/file/directory_service;1']
    .getService(Ci.nsIProperties).get('ProfD', Ci.nsILocalFile);
  this._tabletsDir.append('tablets');

  if (!this._tabletsDir.exists())
    this._tabletsDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0700);

  this._tabletsFile = this._tabletsDir.clone();
  this._tabletsFile.append('tablets.js');

  this._loadState();
}

TabletStorageFS.prototype = {
  save: function TSFS_save(url, data, preview) {
    this._data[url] = data;
    this._saveState();
  },
  delete: function TSFS_delete(url) {
    try {
      var file = this._getPreviewFile(url);
      file.remove(false);
    }
    catch (e) { }

    delete this._data[url];
    this._saveState();
  },
  retrieve: function TSFS_retrieve(url) {
    return this._data[url];
  },
  getURLs: function TSFS_getURLs() {
    var urls = [];
    for (var url in this._data)
      urls.push(url);
    return urls;
  },
  _getPreviewFile: function TSFS__getPreviewFile(url) {
    var id = hex_md5(url);
    var file = this._tabletDir.clone();
    file.append(id + '.png');
    return file;
  },
  _saveState: function TSFS__saveState() {
    try {
      var file = this._tabletFile;

      var ostream = Cc['@mozilla.org/network/safe-file-output-stream;1']
        .createInstance(Ci.nsIFileOutputStream);
      ostream.init(file, PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE, 0600, 0);

      var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter']
        .createInstance(Ci.nsIScriptableUnicodeConverter);
      converter.charset = 'UTF-8';

      var convdata = converter.ConvertFromUnicode(data) + converter.Finish();
      ostream.write(convdata, convdata.length);

      if (ostream instanceof Ci.nsISafeOutputStream) {
        ostream.finish();
      } else {
        ostream.close();
      }
    }
    catch (e) { }
  },
  _loadState: function TSFS__loadState() {
    try { 
      var file = this._tabletFile;
 
      var stream = Cc['@mozilla.org/network/file-input-stream;1']
          .createInstance(Ci.nsIFileInputStream);
      stream.init(file, PR_RDONLY, 0, 0);

      var cvstream = Cc['@mozilla.org/intl/converter-input-stream;1']
        .createInstance(Ci.nsIConverterInputStream);
      cvstream.init(stream, 'UTF-8', 1024,
                    Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

      var content = '';
      var data = {};
      while (cvstream.readString(4096, data)) {
        content += data.value;
      }

      cvstream.close();

      this._data = content.replace(/\r\n?/g, '\n');
    }
    catch (e) {
      this._data = {};
    }
  },
}


function TabletsService() {
  var obs = getObserverService();
  obs.addObserver(this, 'profile-after-change', false);
}

TabletsService.prototype = {
  _init: function TB__init() {
    this._storage = new TabletStorageFS();
  },
  observe: function TB_observe(subject, topic, state) {
    var obs = getObserverService();

    switch (topic) {
      case 'profile-after-change':
        obs.removeObserver(this, 'profile-after-change');
        this._init();
        break;
    }
  },

  save: function TB_save(aDescription) {
    var win, canvas;
    [win, canvas] = snapshot();

    var tabbrowser = win.getBrowser();
    var selectedBrowser = tabbrowser.selectedBrowser;

    var currentTab = -1;
    var browsers = tabbrowser.browsers;
    for (var i = 0; i < browsers.length; i++) {
      var browser = browsers[i];
      if (browsers[i] == tabbrowser.selectedBrowser)
        currentTab = i;
    }

    if (currentTab == -1)
      return false;

    var ss = Cc['@mozilla.org/browser/sessionstore;1']
      .getService(Ci.nsISessionStore);
    var winJSON = "(" + ss.getWindowState(win) + ")";

    var sandbox = new Cu.Sandbox("about:blank");
    var winState = Cu.evalInSandbox(winJSON, sandbox);

    var state = winState.windows[0].tabs[currentTab];

    var url = selectedBrowser.currentURI.spec;
    var preview = canvas.toDataURL();

    this._storage.save(url, state, preview);

    return true;
  },
  delete: function TB_delete(aURL) {
    this._storage.delete(aURL);
  },
  open: function TB_open(aURL, aWhere) {
  },
  getTablets: function TB_getTablets() {
    var cur = 0;
    return {
      getNext: function() {
        var tab = new TabletInfo();
        tab.url = 'http://test.com';
        tab.title = 'test'
        tab.imageURL = tabs[cur];
        cur = cur + 1;
        return tab;
      },
      hasMoreElements: function() {
        return (cur < tabs.length);
      }
    }
  },

  getInterfaces: function TB_getInterfaces(countRef) {
    var interfaces = [Ci.oyITablets, Ci.nsIObserver, Ci.nsISupports];
    countRef.value = interfaces.length;
    return interfaces;
  },
  getHelperForLanguage: function TB_getHelperForLanguage(language) {
    return null;
  },
  contractID: TB_CONTRACTID,
  classDescription: TB_CLASSNAME,
  classID: TB_CLASSID,
  implementationLanguage: Ci.nsIProgrammingLanguage.JAVASCRIPT,
  flags: Ci.nsIClassInfo.SINGLETON,

  QueryInterface: function TB_QueryInterface(iid) {
    if (iid.equals(Ci.oyITablets) ||
        iid.equals(Ci.nsIObserver) ||
        iid.equals(Ci.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
}

function GenericComponentFactory(ctor) {
  this._ctor = ctor;
}

GenericComponentFactory.prototype = {

  _ctor: null,

  // nsIFactory
  createInstance: function(outer, iid) {
    if (outer != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
    return (new this._ctor()).QueryInterface(iid);
  },

  // nsISupports
  QueryInterface: function(iid) {
    if (iid.equals(Ci.nsIFactory) ||
        iid.equals(Ci.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  },
};

var Module = {
  QueryInterface: function(iid) {
    if (iid.equals(Ci.nsIModule) ||
        iid.equals(Ci.nsISupports))
      return this;

    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  getClassObject: function(cm, cid, iid) {
    if (!iid.equals(Ci.nsIFactory))
      throw Cr.NS_ERROR_NOT_IMPLEMENTED;

    if (cid.equals(TB_CLASSID))
      return new GenericComponentFactory(TabletsService)

    throw Cr.NS_ERROR_NO_INTERFACE;
  },

  registerSelf: function(cm, file, location, type) {
    var cr = cm.QueryInterface(Ci.nsIComponentRegistrar);
    cr.registerFactoryLocation(TB_CLASSID, TB_CLASSNAME, TB_CONTRACTID,
                               file, location, type);

    var catman = Cc['@mozilla.org/categorymanager;1']
      .getService(Ci.nsICategoryManager);
    catman.addCategoryEntry('app-startup', TB_CLASSNAME,
                            'service,' + TB_CONTRACTID,
                            true, true);
  },

  unregisterSelf: function(cm, location, type) {
    var cr = cm.QueryInterface(Ci.nsIComponentRegistrar);
    cr.unregisterFactoryLocation(TB_CLASSID, location);
  },

  canUnload: function(cm) {
    return true;
  },
};

function NSGetModule(compMgr, fileSpec)
{
  return Module;
}
