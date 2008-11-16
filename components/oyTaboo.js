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
 *
 * Portions are derived from the Mozilla nsSessionStore component:
 *
 * Copyright (C) 2006 Simon Bünzli <zeniko@gmail.com>
 *
 * Contributor(s):
 * Dietrich Ayala <autonome@gmail.com>
 *
 * Other portions derived from Firefox bookmarks code.
 *
 * Copyright (C) 1998 Netscape Communications Corporation.
 *
 * Contributor(s):
 *   Ben Goodger <ben@netscape.com> (Original Author)
 *   Joey Minta <jminta@gmail.com>
 *
 * Other portions derived from Flock favorites code.
 *
 * Copyright (C) 2005-2007 Flock Inc.
 */

const TB_CONTRACTID = '@oy/taboo;1';
const TB_CLASSID    = Components.ID('{962a9516-b177-4083-bbe8-e10f47cf8570}');
const TB_CLASSNAME  = 'Taboo Service';

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

const TABOO_DB_FILENAME = 'taboo.sqlite';
const TABOO_EXPORT_DB_FILENAME = TABOO_DB_FILENAME + '.export';

/* from nspr's prio.h */
const PR_RDONLY      = 0x01;
const PR_WRONLY      = 0x02;
const PR_RDWR        = 0x04;
const PR_CREATE_FILE = 0x08;
const PR_APPEND      = 0x10;
const PR_TRUNCATE    = 0x20;
const PR_SYNC        = 0x40;
const PR_EXCL        = 0x80;

const CAPABILITIES = [
  "Subframes", "Plugins", "Javascript", "MetaRedirects", "Images"
];

const IMAGE_FULL_WIDTH = 500;
const IMAGE_FULL_HEIGHT = 500;

const IMAGE_THUMB_WIDTH = 125;
const IMAGE_THUMB_HEIGHT = 125;

const PREF_DEBUG = 'extensions.taboo.debug';


function getObserverService() {
  return Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);
}

function getBoolPref(prefName, defaultValue) {
  try {
    var prefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefBranch);
    return prefs.getBoolPref(prefName);
  }
  catch (e) {
    return defaultValue;
  }
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

  return ret;
}

function hex_md5(s) {
  var stream = Components.classes["@mozilla.org/io/string-input-stream;1"]
    .createInstance(Components.interfaces.nsIStringInputStream);
  stream.setData(s, s.length);

  return hex_md5_stream(stream);
}


/*
 * Taboo Info Instance
 */

function TabooInfo(url, title, description, favicon, imageURL, thumbURL,
                   created, updated, data) {
  this.url = url;
  this.title = title;
  this.description = description;
  this.favicon = favicon;
  this.imageURL = imageURL;
  this.thumbURL = thumbURL;
  this.created = new Date(created);
  this.updated = new Date(updated);
  this.data = data;
}

TabooInfo.prototype = {
  QueryInterface: function(iid) {
    if (!iid.equals(Ci.nsISupports) &&
        !iid.equals(Ci.oyITabooInfo)) {
      throw Cr.NS_ERROR_NO_INTERFACE;
    }
    return this;
  }
}

/*
 * Taboo Service Component
 */


function snapshot(win, outputWidth, outputHeight) {
  var content = win.content;

  var canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");

  var realW = content.document.body ? content.document.body.clientWidth
                                    : content.innerWidth;
  if (!realW || realW == 0) {
    realW = content.innerWidth;
  }
  var realH = content.innerHeight;

  var pW = outputWidth * 1.0 / realW;
  var pH = outputHeight * 1.0 / realH;

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
  ctx.drawWindow(content, content.scrollX, content.scrollY, realW, realH, "rgb(0,0,0)");

  var imageData = canvas.toDataURL();
  return win.atob(imageData.substr('data:image/png;base64,'.length));
}

function cleanTabState(aState, aClearPrivateData) {
  var sandbox = new Cu.Sandbox('about:blank');
  var tabState = Cu.evalInSandbox('('+aState+')', sandbox);

  var index = (tabState.index ? tabState.index : tabState.entries.length) - 1;
  var entry = tabState.entries[index];

  if (aClearPrivateData) {
    function deletePrivateData(aEntry) {
      delete aEntry.text;
      delete aEntry.postdata;
    }

    deletePrivateData(entry);

    if (entry.children) {
      for (var i=0; i<entry.children.length; i++) {
        deletePrivateData(entry.children[i]);
      }
    }
  }

  tabState.entries = [entry];
  tabState.index = 1;

  var nativeJSON = Cc["@mozilla.org/dom/json;1"].createInstance(Ci.nsIJSON);
  return nativeJSON.encode(tabState);
}


function TabooStorageSQL() {
  this._schema = {
    url         : 'TEXT PRIMARY KEY',
    title       : 'TEXT',
    description : 'TEXT',
    md5         : 'TEXT',
    favicon     : 'TEXT',
    full        : 'TEXT',
    created     : 'INTEGER',
    updated     : 'INTEGER',
    deleted     : 'INTEGER'
  };

  this._tabooDir = Cc['@mozilla.org/file/directory_service;1']
    .getService(Ci.nsIProperties).get('ProfD', Ci.nsILocalFile);
  this._tabooDir.append('taboo');

  if (!this._tabooDir.exists())
    this._tabooDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0700);

  var dbfile = this._tabooDir.clone();
  dbfile.append(TABOO_DB_FILENAME);

  this._db = this._loadDB(dbfile);
  this._store = this._db.taboo_data;
}

TabooStorageSQL.prototype = {
  save: function TSSQL_save(url, description, data, fullImage, thumbImage) {
    var title = data.entries[data.index - 1].title;

    if (!title) {
      var ios = Cc['@mozilla.org/network/io-service;1']
        .getService(Ci.nsIIOService);
      var uri = ios.newURI(url, null, null);

      if (uri.path.length > 1) {
        var parts = uri.path.split('/');
        while (!title && parts.length)
          title = parts.pop();
      }

      if (!title)
        title = uri.host;
    }

    var updated = Date.now();

    var entry = this._store.find(url);
    var exists = Boolean(entry);

    if (!exists) {
      entry = this._store.new();
      entry.url = url;
      entry.md5 = hex_md5(url);
      entry.title = title;
      entry.created = updated;
    } else if (entry.deleted) {
      entry.title = title;
    }

    if (description != null) {
      entry.description = description;
    }

    entry.updated = updated;
    entry.deleted = null;
    entry.full = data.toSource();

    entry.save();

    this._saveImage(fullImage, this._getImageFile(entry.md5));
    this._saveImage(thumbImage, this._getThumbFile(entry.md5));

    return exists;
  },
  saveFavicon: function TSSQL_saveFavicon(url, favicon) {
    var entry = this._store.find(url);
    if (entry) {
      entry.favicon = favicon;
      entry.save();
    }
  },
  exists: function TSSQL_exists(url) {
    var entry = this._store.find(url);
    return (entry && !entry.deleted);
  },
  update: function TSSQL_update(aURL, aTitle, aDescription) {
    var entry = this._store.find(aURL);
    if (!entry || entry.deleted) {
      return false;
    }

    if (aTitle != null || aDescription != null) {
      if (aTitle != null) {
        entry.title = aTitle;
      }

      if (aDescription != null) {
        entry.description = aDescription;
      }

      entry.updated = Date.now();

      entry.save();
    }

    return true;
  },
  delete: function TSSQL_delete(url) {
    this._deleteOp(url, Date.now());
  },
  undelete: function TSSQL_undelete(url) {
    this._deleteOp(url, null);
  },
  reallyDelete: function TSSQL_reallyDelete(url) {
    var entry = this._store.find(url);
    if (entry) {
      entry.destroy();
    }

    try {
      var file, md5 = hex_md5(url);

      file = this._getImageFile(md5);
      file.remove(false);

      file = this._getThumbFile(md5);
      file.remove(false);
    }
    catch (e) { }
  },
  retrieve: function TSSQL_retrieve(url) {
    var entry = this._store.find(url);
    if (!entry)
      return null;

    var ios = Cc['@mozilla.org/network/io-service;1']
      .getService(Ci.nsIIOService);
    var fileHandler = ios.getProtocolHandler('file')
      .QueryInterface(Ci.nsIFileProtocolHandler);

    var imageFile = this._getImageFile(entry.md5);
    var imageURL = fileHandler.getURLSpecFromFile(imageFile);

    var thumbFile = this._getThumbFile(entry.md5);
    var thumbURL;
    if (thumbFile.exists()) {
      thumbURL = fileHandler.getURLSpecFromFile(thumbFile);
    } else {
      thumbURL = imageURL;
    }

    var data = entry.full.replace(/\r\n?/g, '\n');
    return new TabooInfo(url, entry.title, entry.description, entry.favicon,
                         imageURL, thumbURL, entry.created, entry.updated,
                         data);
  },
  getURLs: function TSSQL_getURLs(filter, deleted, aMaxResults) {
    var condition = [];

    var sortkey, sql = '';

    if (filter) {
      sql += '(url LIKE ?1 or title LIKE ?1 or description LIKE ?1) and ';
      // TODO: escape %'s before passing in
      condition.push('%' + filter + '%');
    }

    if (deleted) {
      sql += 'deleted IS NOT NULL';
      sortkey = 'deleted DESC LIMIT ' + aMaxResults;
    } else {
      sql += 'deleted IS NULL';
      sortkey = 'updated DESC LIMIT ' + aMaxResults;
    }

    condition.unshift(sql);

    var results = this._store.find(condition, sortkey);
    return results.map(function(entry) { return entry.url });
  },
  import: function TSSQL__import(aFile) {
    var zipReader = Cc["@mozilla.org/libjar/zip-reader;1"]
                    .createInstance(Ci.nsIZipReader);
    zipReader.open(aFile);

    if (!zipReader.hasEntry(TABOO_EXPORT_DB_FILENAME)) {
      throw "Not a Taboo backup";
    }

    var filesToExtract = [];

    var dbfile = this._tabooDir.clone();
    dbfile.append(TABOO_EXPORT_DB_FILENAME);

    zipReader.extract(TABOO_EXPORT_DB_FILENAME, dbfile);

    var importDB = this._loadDB(dbfile);
    var importStore = importDB.taboo_data;

    var imports = importStore.find(["deleted IS NULL"]);
    for each (var data in imports) {
      var entry = this._store.find(data.url);
      if (entry) {
        if (entry.updated > data.updated) {
          continue;
        }
      } else {
        entry = this._store.new();
      }
      for (var field in this._schema) {
        entry[field] = data[field];
      }
      entry.save();

      filesToExtract.push([ this._getImageFile(entry.md5),
                            this._getThumbFile(entry.md5) ]);
    }

    importDB.close();
    dbfile.remove(false);

    for each (var fileList in filesToExtract) {
      for each (var imageFile in fileList) {
        if (zipReader.hasEntry(imageFile.leafName)) {
          zipReader.extract(imageFile.leafName, imageFile);
        }
      }
    }

    zipReader.close();

    return filesToExtract.length;
  },
  export: function TSSQL__export(aFile) {
    if (aFile.exists()) {
      aFile.remove(false);
    }

    var dbfile = this._tabooDir.clone();
    dbfile.append(TABOO_EXPORT_DB_FILENAME);

    if (dbfile.exists()) {
      dbfile.remove(false);
    }

    var exportDB = this._loadDB(dbfile);
    var exportStore = exportDB.taboo_data;

    var zipWriter = Cc["@mozilla.org/zipwriter;1"]
                    .createInstance(Ci.nsIZipWriter);

    zipWriter.open(aFile, PR_RDWR | PR_CREATE_FILE | PR_TRUNCATE);

    var results = this._store.find(["deleted IS NULL"]);

    for each (var result in results) {
      var entry = exportStore.new();
      for (var field in this._schema) {
        entry[field] = result[field];
      }
      entry.full = cleanTabState(result.full, true);
      entry.save();

      var imageFile = this._getImageFile(result.md5);
      zipWriter.addEntryFile(imageFile.leafName,
                             Ci.nsIZipWriter.COMPRESSION_NONE,
                             imageFile, true);

      var thumbFile = this._getThumbFile(result.md5);
      zipWriter.addEntryFile(thumbFile.leafName,
                             Ci.nsIZipWriter.COMPRESSION_NONE,
                             thumbFile, true);
    }

    exportDB.close();

    zipWriter.addEntryFile(TABOO_EXPORT_DB_FILENAME,
                           Ci.nsIZipWriter.COMPRESSION_NONE,
                           dbfile, true);

    var obs = {
      onStartRequest: function() {},
      onStopRequest: function() {
        zipWriter.close();
        dbfile.remove(false);
      }
    };
    zipWriter.processQueue(obs, null);

    return results.length;
  },
  _getImageFile: function TSSQL__getImageFile(id) {
    var file = this._tabooDir.clone();
    file.append(id + '.png');
    return file;
  },
  _getThumbFile: function TSSQL__getPreviewFile(id) {
    var file = this._tabooDir.clone();
    file.append(id + '-' + IMAGE_THUMB_WIDTH + '.png');
    return file;
  },
  _saveImage: function TSSQL__saveImage(imageData, file) {
    try {
      file.remove(false);
    }
    catch (e) { }

    try {
      var ostream = Cc['@mozilla.org/network/file-output-stream;1']
        .createInstance(Ci.nsIFileOutputStream);
      ostream.init(file, PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE, 0600, 0);

      ostream.write(imageData, imageData.length);
      ostream.close();
    }
    catch (e) { }
  },
  _deleteOp: function TSSQL__deleteOp(url, deleted) {
    var entry = this._store.find(url);
    if (entry) {
      entry.deleted = deleted;
      entry.save();
    }
  },
  _loadDB: function TSSQL__loadDB(aDBFile) {
    var DB = loadSubScript('chrome://taboo/content/sqlite.js').DB;
    var newDB = new DB(aDBFile);
    newDB.Table('taboo_data', this._schema);
    return newDB;
  }
}

var newSSApi = false;

function TabooService() {
  this._observers = [];

  var obs = getObserverService();
  obs.addObserver(this, 'profile-after-change', false);
}

TabooService.prototype = {
  _init: function TB__init() {
    this._storage = new TabooStorageSQL();

    var ss = Cc['@mozilla.org/browser/sessionstore;1']
      .getService(Ci.nsISessionStore);
    var extMgr = Cc['@mozilla.org/extensions/manager;1']
      .getService(Ci.nsIExtensionManager);

    var TorButtonGUID = '{e0204bd5-9d31-402b-a99d-a6aa8ffebdca}';

    if (!extMgr.getItemForID(TorButtonGUID) && ss.getTabState) {
      newSSApi = true;
    }
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

  addObserver: function TB_addObserver(aObserver) {
    if (this._observers.indexOf(aObserver) == -1) {
      this._observers.push(aObserver);
    }
  },
  removeObserver: function TB_removeObserver(aObserver) {
    var index = this._observers.indexOf(aObserver);
    if (index != -1) {
      this._observers.splice(index, 1);
    }
  },

  saveAll: function TB_saveAll() {
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
    var window = wm.getMostRecentWindow('navigator:browser');

    var tabbrowser = window.getBrowser();

    var browsers = tabbrowser.browsers;
    for (var i = 0; i < browsers.length; i++) {
      var win = browsers[i].contentWindow;

    }

  },

  save: function TB_save(aDescription) {
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
    var win = wm.getMostRecentWindow('navigator:browser');

    var tabbrowser = win.getBrowser();
    var selectedBrowser = tabbrowser.selectedBrowser;
    var selectedTab = tabbrowser.selectedTab;

    var currentTab = -1;
    var browsers = tabbrowser.browsers;
    for (var i = 0; i < browsers.length; i++) {
      if (browsers[i] == selectedBrowser)
        currentTab = i;
    }

    if (currentTab == -1)
      return false;

    var ss = Cc['@mozilla.org/browser/sessionstore;1']
      .getService(Ci.nsISessionStore);

    var state;
    var sandbox = new Cu.Sandbox('about:blank');

    if (newSSApi) {
      var tabJSON = "(" + ss.getTabState(selectedTab) + ")";

      if (getBoolPref(PREF_DEBUG, false))
        dump(tabJSON + "\n");

      state = Cu.evalInSandbox(tabJSON, sandbox);
    } else {
      var winJSON = "(" + ss.getWindowState(win) + ")";

      if (getBoolPref(PREF_DEBUG, false))
        dump(winJSON + "\n");

      var winState = Cu.evalInSandbox(winJSON, sandbox);
      state = winState.windows[0].tabs[currentTab];
    }

    var url = state.entries[state.index - 1].url;
    url = url.replace(/#.*$/, '');

    var fullImage = snapshot(win, IMAGE_FULL_WIDTH, IMAGE_FULL_HEIGHT);
    var thumbImage = snapshot(win, IMAGE_THUMB_WIDTH, IMAGE_THUMB_HEIGHT);

    var exists = this._storage.save(url, aDescription, state,
                                    fullImage, thumbImage);

    var faviconURL = selectedTab.getAttribute('image');
    if (faviconURL) {
      var ios = Cc['@mozilla.org/network/io-service;1']
        .getService(Ci.nsIIOService);
      var faviconURI = ios.newURI(faviconURL, null, null);

      if (Ci.nsIFaviconService) {
        var faviconSvc = Cc['@mozilla.org/browser/favicon-service;1']
          .getService(Ci.nsIFaviconService);

        var dataURL = null;

        try {
          if (faviconSvc.getFaviconDataAsDataURL) {
            dataURL = faviconSvc.getFaviconDataAsDataURL(faviconURI);
          } else {
            var mimeType = {};
            var bytes = faviconSvc.getFaviconData(faviconURI, mimeType, {});
            if (bytes) {
              dataURL = 'data:';
              dataURL += mimeType.value;
              dataURL += ';base64,';
              dataURL += btoa(String.fromCharCode.apply(null, bytes));
            }
          }
        } catch (ex) {
          // do nothing, use default value
        }

        if (dataURL) {
          this._storage.saveFavicon(url, dataURL);
        }
      } else {
        var chan = ios.newChannelFromURI(faviconURI);
        var listener = new tabooFavIconLoadListener(url, faviconURL, chan,
                                                    this._storage);
        chan.notificationCallbacks = listener;
        chan.asyncOpen(listener, null);
      }
    }

    for (var i = 0; i < this._observers.length; i++) {
      this._observers[i].onSave(url, !exists);
    }

    return true;
  },
  isSaved: function TB_isSaved(aURL) {
    return this._storage.exists(aURL);
  },
  update: function TB_update(aURL, aTitle, aDescription) {
    var valid = this._storage.update(aURL, aTitle, aDescription);
    if (!valid) {
      throw 'Taboo for ' + aURL + ' does not exist';
    }
  },
  'delete': function TB_delete(aURL) {
    this._storage.delete(aURL);

    for (var i = 0; i < this._observers.length; i++) {
      this._observers[i].onDelete(aURL);
    }
  },
  undelete: function TB_undelete(aURL) {
    this._storage.undelete(aURL);

    for (var i = 0; i < this._observers.length; i++) {
      this._observers[i].onUndelete(aURL);
    }
  },
  reallyDelete: function TB_reallyDelete(aURL) {
    this._storage.reallyDelete(aURL);

    for (var i = 0; i < this._observers.length; i++) {
      this._observers[i].onReallyDelete(aURL);
    }
  },
  get: function TB_get(filter, deleted) {
    return this._tabEnumerator(this._storage.getURLs(filter, deleted, -1));
  },
  getRecent: function TB_getRecent(aMaxRecent) {
    return this._tabEnumerator(this._storage.getURLs(null, false, aMaxRecent));
  },
  getForURL: function TB_getForURL(aURL) {
    return this._storage.retrieve(aURL);
  },

  import: function TB_import(aFile) {
    var numImported = this._storage.import(aFile);

    // FIXME: Call observers on each url imported
    for (var i = 0; i < this._observers.length; i++) {
      this._observers[i].onSave(null, false);
    }

    return numImported;
  },
  export: function TB_export(aFile) {
    return this._storage.export(aFile);
  },

  _tabEnumerator: function TB__tabEnumerator(aURLs) {
    return {
      _urls: aURLs,
      _storage: this._storage,
      getNext: function() {
        var url = this._urls.shift();
        return this._storage.retrieve(url);
      },
      hasMoreElements: function() {
        return this._urls.length > 0;
      }
    }
  },

  open: function TB_open(aURL, aWhere) {
    var wm = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator);
    var win = wm.getMostRecentWindow('navigator:browser');

    var loadInBackground = getBoolPref("browser.tabs.loadInBackground", true);

    if (aWhere == 'tabforeground') {
      loadInBackground = false;
      aWhere = 'tab';
    }

    if (aWhere == 'tabbackground') {
      loadInBackground = true;
      aWhere = 'tab';
    }

    var tabbrowser = win.getBrowser();

    var tab;
    switch (aWhere) {
      case 'current':
        tab = tabbrowser.mCurrentTab;
        break;
      case 'tabshifted':
        loadInBackground = !loadInBackground;
        // fall through
      case 'tab':
        tab = tabbrowser.loadOneTab('about:blank', null, null, null,
                                    loadInBackground, false);
        break;
      default:
        return;
    }

    this.openInTab(aURL, tab);
  },

  openInTab: function TB_openInTab(aURL, aTab) {
    var info = this._storage.retrieve(aURL);
    if (!info) {
      throw 'Taboo for ' + aURL + ' does not exist';
    }

    var tabData = info.data;

    var ss = Cc['@mozilla.org/browser/sessionstore;1']
             .getService(Ci.nsISessionStore);

    if (newSSApi) {
      ss.setTabState(aTab, tabData);
    } else {
      var win = aTab.ownerDocument.defaultView;
      this._setTabStatePrecursor(win, aTab, tabData, 0);
    }
  },

  /* Because Firefox 2's sessionstore doesn't let us restore a single tab,
   * we cut'n'paste a bunch of code here
   */
  _setTabStatePrecursor: function TB__setTabStatePrecursor(aWindow, aTab, aState, aCount) {
    var tabbrowser = aWindow.getBrowser();

    try {
      if (!tabbrowser.getBrowserForTab(aTab).markupDocumentViewer) {
       throw "Tab not ready";
     }
    }
    catch (ex) {
      if (aCount < 10) {
        var setTabStateFunc = function(self) {
          self._setTabStatePrecursor(aWindow, aTab, aState, aCount + 1);
        };
      }
      aWindow.setTimeout(setTabStateFunc, 100, this);
      return;
    }

    this._setTabState(aWindow, aTab, aState);
  },

  _setTabState: function TB__setTabState(aWindow, aTab, aState) {
    var sandbox = new Cu.Sandbox('about:blank');
    var tabData = Cu.evalInSandbox(aState, sandbox);

    // helper hash for ensuring unique frame IDs
    var idMap = { used: {} };

    var _this = this;

    var tab = aTab;
    var browser = aWindow.getBrowser().getBrowserForTab(tab);
    var history = browser.webNavigation.sessionHistory;

    if (history.count > 0) {
      history.PurgeHistory(history.count);
    }
    history.QueryInterface(Ci.nsISHistoryInternal);

    browser.markupDocumentViewer.textZoom = parseFloat(tabData.zoom || 1);

    for (var i = 0; i < tabData.entries.length; i++) {
      history.addEntry(this._deserializeHistoryEntry(tabData.entries[i], idMap), true);
    }

    // make sure to reset the capabilities and attributes, in case this tab gets reused
    var disallow = (tabData.disallow)?tabData.disallow.split(","):[];
    CAPABILITIES.forEach(function(aCapability) {
      browser.docShell["allow" + aCapability] = disallow.indexOf(aCapability) == -1;
    });
    Array.filter(tab.attributes, function(aAttr) {
      return (_this.xulAttributes.indexOf(aAttr.name) > -1);
    }).forEach(tab.removeAttribute, tab);
    if (tabData.xultab) {
      tabData.xultab.split(" ").forEach(function(aAttr) {
        if (/^([^\s=]+)=(.*)/.test(aAttr)) {
          tab.setAttribute(RegExp.$1, decodeURI(RegExp.$2));
        }
      });
    }

    // notify the tabbrowser that the tab chrome has been restored
    var event = aWindow.document.createEvent("Events");
    event.initEvent("SSTabRestoring", true, false);
    tab.dispatchEvent(event);

    var activeIndex = (tabData.index || tabData.entries.length) - 1;
    try {
      browser.webNavigation.gotoIndex(activeIndex);
    }
    catch (ex) { } // ignore an invalid tabData.index

    // restore those aspects of the currently active documents
    // which are not preserved in the plain history entries
    // (mainly scroll state and text data)
    browser.__SS_restore_data = tabData.entries[activeIndex] || {};
    browser.__SS_restore_text = tabData.text || "";
    browser.__SS_restore_tab = tab;
    browser.__SS_restore = this.restoreDocument_proxy;
    browser.addEventListener("load", browser.__SS_restore, true);
  },
  _deserializeHistoryEntry: function TB__deserializeHistoryEntry(aEntry, aIdMap) {
    var shEntry = Cc["@mozilla.org/browser/session-history-entry;1"].
                  createInstance(Ci.nsISHEntry);

    var ioService = Cc["@mozilla.org/network/io-service;1"].
                    getService(Ci.nsIIOService);
    shEntry.setURI(ioService.newURI(aEntry.url, null, null));
    shEntry.setTitle(aEntry.title || aEntry.url);
    shEntry.setIsSubFrame(aEntry.subframe || false);
    shEntry.loadType = Ci.nsIDocShellLoadInfo.loadHistory;

    if (aEntry.cacheKey) {
      var cacheKey = Cc["@mozilla.org/supports-PRUint32;1"].
                     createInstance(Ci.nsISupportsPRUint32);
      cacheKey.data = aEntry.cacheKey;
      shEntry.cacheKey = cacheKey;
    }
    if (aEntry.ID) {
      // get a new unique ID for this frame (since the one from the last
      // start might already be in use)
      var id = aIdMap[aEntry.ID] || 0;
      if (!id) {
        for (id = Date.now(); aIdMap.used[id]; id++);
        aIdMap[aEntry.ID] = id;
        aIdMap.used[id] = true;
      }
      shEntry.ID = id;
    }

    var scrollPos = (aEntry.scroll || "0,0").split(",");
    scrollPos = [parseInt(scrollPos[0]) || 0, parseInt(scrollPos[1]) || 0];
    shEntry.setScrollPosition(scrollPos[0], scrollPos[1]);

    if (aEntry.postdata) {
      var stream = Cc["@mozilla.org/io/string-input-stream;1"].
                   createInstance(Ci.nsIStringInputStream);
      stream.setData(aEntry.postdata, -1);
      shEntry.postData = stream;
    }

    if (Ci.nsISHEntry_MOZILLA_1_8_BRANCH2 &&
        shEntry instanceof Ci.nsISHEntry_MOZILLA_1_8_BRANCH2 &&
        aEntry.ownerURI)
    {
      shEntry.ownerURI = ioService.newURI(aEntry.ownerURI, null, null);
    }

    if (aEntry.children && shEntry instanceof Ci.nsISHContainer) {
      for (var i = 0; i < aEntry.children.length; i++) {
        shEntry.AddChild(this._deserializeHistoryEntry(aEntry.children[i], aIdMap), i);
      }
    }

    return shEntry;
  },
  restoreDocument_proxy: function TB_restoreDocument_proxy(aEvent) {
    // wait for the top frame to be loaded completely
    if (!aEvent || !aEvent.originalTarget || !aEvent.originalTarget.defaultView || aEvent.originalTarget.defaultView != aEvent.originalTarget.defaultView.top) {
      return;
    }

    var textArray = this.__SS_restore_text ? this.__SS_restore_text.split(" ") : [];
    function restoreTextData(aContent, aPrefix) {
      textArray.forEach(function(aEntry) {
        if (/^((?:\d+\|)*)(#?)([^\s=]+)=(.*)$/.test(aEntry) && (!RegExp.$1 || RegExp.$1 == aPrefix)) {
          var document = aContent.document;
          var node = RegExp.$2 ? document.getElementById(RegExp.$3) : document.getElementsByName(RegExp.$3)[0] || null;
          if (node && "value" in node) {
            node.value = decodeURI(RegExp.$4);

            var event = document.createEvent("UIEvents");
            event.initUIEvent("input", true, true, aContent, 0);
            node.dispatchEvent(event);
          }
        }
      });
    }

    function restoreTextDataAndScrolling(aContent, aData, aPrefix) {
      restoreTextData(aContent, aPrefix);
      if (aData.innerHTML) {
        aContent.setTimeout(function(aHTML) { if (this.document.designMode == "on") { this.document.body.innerHTML = aHTML; } }, 0, aData.innerHTML);
      }
      if (aData.scroll && /(\d+),(\d+)/.test(aData.scroll)) {
        aContent.scrollTo(RegExp.$1, RegExp.$2);
      }
      for (var i = 0; i < aContent.frames.length; i++) {
        if (aData.children && aData.children[i]) {
          restoreTextDataAndScrolling(aContent.frames[i], aData.children[i], i + "|" + aPrefix);
        }
      }
    }

    var content = XPCNativeWrapper(aEvent.originalTarget).defaultView;
    if (this.currentURI.spec == "about:config") {
      // unwrap the document for about:config because otherwise the properties
      // of the XBL bindings - as the textbox - aren't accessible (see bug 350718)
      content = content.wrappedJSObject;
    }
    restoreTextDataAndScrolling(content, this.__SS_restore_data, "");

    // notify the tabbrowser that this document has been completely restored
    var event = this.ownerDocument.createEvent("Events");
    event.initEvent("SSTabRestored", true, false);
    this.__SS_restore_tab.dispatchEvent(event);

    this.removeEventListener("load", this.__SS_restore, true);
    delete this.__SS_restore_data;
    delete this.__SS_restore_text;
    delete this.__SS_restore_tab;
  },
  xulAttributes: [],

  getInterfaces: function TB_getInterfaces(countRef) {
    var interfaces = [Ci.oyITaboo, Ci.nsIObserver, Ci.nsISupports];
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
    if (iid.equals(Ci.oyITaboo) ||
        iid.equals(Ci.nsIObserver) ||
        iid.equals(Ci.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
}


/* This is swiped from bookmarks.js in Firefox. It's only used when we're
 * on Gecko 1.8.x, since Gecko 1.9 has nsIFaviconService.
 */
function tabooFavIconLoadListener(url, faviconurl, channel, storage) {
  this.mURL = url;
  this.mFavIconURL = faviconurl;
  this.mCountRead = 0;
  this.mChannel = channel;
  this.mStorage = storage;
}

tabooFavIconLoadListener.prototype = {
  mURL : null,
  mFavIconURL : null,
  mCountRead : null,
  mChannel : null,
  mBytes : Array(),
  mStream : null,

  QueryInterface: function (iid) {
    if (!iid.equals(Components.interfaces.nsISupports) &&
        !iid.equals(Components.interfaces.nsIInterfaceRequestor) &&
        !iid.equals(Components.interfaces.nsIRequestObserver) &&
        !iid.equals(Components.interfaces.nsIChannelEventSink) &&
        !iid.equals(Components.interfaces.nsIProgressEventSink) && // see below
        !iid.equals(Components.interfaces.nsIStreamListener)) {
      throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
  },

  // nsIInterfaceRequestor
  getInterface: function (iid) {
    try {
      return this.QueryInterface(iid);
    } catch (e) {
      throw Components.results.NS_NOINTERFACE;
    }
  },

  // nsIRequestObserver
  onStartRequest : function (aRequest, aContext) {
    this.mStream = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);
  },

  onStopRequest : function (aRequest, aContext, aStatusCode) {
    var httpChannel = this.mChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
    if ((httpChannel && httpChannel.requestSucceeded) &&
        Components.isSuccessCode(aStatusCode) &&
        this.mCountRead > 0)
    {
      var dataurl;
      // XXX - arbitrary size beyond which we won't store a favicon.  This is /extremely/
      // generous, and is probably too high.
      if (this.mCountRead > 16384) {
        dataurl = "data:";      // hack meaning "pretend this doesn't exist"
      } else {
        // get us a mime type for this
        var mimeType = null;

        const nsICategoryManager = Components.interfaces.nsICategoryManager;
        const nsIContentSniffer = Components.interfaces.nsIContentSniffer;

        var catMgr = Components.classes["@mozilla.org/categorymanager;1"].getService(nsICategoryManager);
        var sniffers = catMgr.enumerateCategory("content-sniffing-services");
        while (mimeType == null && sniffers.hasMoreElements()) {
          var snifferCID = sniffers.getNext().QueryInterface(Components.interfaces.nsISupportsCString).toString();
          var sniffer = Components.classes[snifferCID].getService(nsIContentSniffer);

          try {
            mimeType = sniffer.getMIMETypeFromContent(aRequest, this.mBytes, this.mCountRead);
          } catch (e) {
            mimeType = null;
            // ignore
          }
        }
      }

      if (this.mBytes && this.mCountRead > 0 && mimeType != null) {
        var data = 'data:';
        data += mimeType;
        data += ';base64,';

        var iconData = String.fromCharCode.apply(null, this.mBytes);
        data += base64Encode(iconData);

        this.mStorage.saveFavicon(this.mURL, data);
      }
    }

    this.mChannel = null;
  },

  // nsIStreamObserver
  onDataAvailable : function (aRequest, aContext, aInputStream, aOffset, aCount) {
    // we could get a different aInputStream, so we don't save this;
    // it's unlikely we'll get more than one onDataAvailable for a
    // favicon anyway
    this.mStream.setInputStream(aInputStream);

    var chunk = this.mStream.readByteArray(aCount);
    this.mBytes = this.mBytes.concat(chunk);
    this.mCountRead += aCount;
  },

  // nsIChannelEventSink
  onChannelRedirect : function (aOldChannel, aNewChannel, aFlags) {
    this.mChannel = aNewChannel;
  },

  // nsIProgressEventSink: the only reason we support
  // nsIProgressEventSink is to shut up a whole slew of xpconnect
  // warnings in debug builds.  (see bug #253127)
  onProgress : function (aRequest, aContext, aProgress, aProgressMax) { },
  onStatus : function (aRequest, aContext, aStatus, aStatusArg) { }
}

// From flockFavoritesService.js
function base64Encode(aInput) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  while (aInput.length > 0) {
    output += chars[aInput.charCodeAt(0) >> 2];
    output += chars[((aInput.charCodeAt(0) & 0x03) << 4) |
      (aInput.length > 1 ? ((aInput.charCodeAt(1) & 0xF0) >> 4) : 0)];
    output += chars[aInput.length > 1 ?
      ((aInput.charCodeAt(1) & 0x0F) << 2) |
      (aInput.length > 2 ? ((aInput.charCodeAt(2) & 0xC0) >> 6) : 0) : 64];
    output += chars[aInput.length > 2 ?
      (aInput.charCodeAt(2) & 0x3F) : 64];
    if (aInput.length > 3) {
      aInput = aInput.substr(3);
    } else {
      break;
    }
  }
  return output;
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
      return new GenericComponentFactory(TabooService)

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


function loadSubScript(spec) {
  var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Ci.mozIJSSubScriptLoader);
  var context = {};
  loader.loadSubScript(spec, context);
  return context;
}
