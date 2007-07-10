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

  return canvas.toDataURL(); 
}

function TabletsService() {
}

var tabs = [];

TabletsService.prototype = {
  save: function TB_save(aIndex, aDescription) {
    tabs.push( snapshot() );
    return true;
  },
  delete: function TB_delete(aURL) {
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
    var interfaces = [Ci.oyITablets, Ci.nsISupports];
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
