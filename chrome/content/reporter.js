const appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                          .getService(Components.interfaces.nsIXULAppInfo);
const runtime = Components.classes["@mozilla.org/xre/app-info;1"]
                           .getService(Components.interfaces.nsIXULRuntime);

const extMgr = Components.classes["@mozilla.org/extensions/manager;1"]
                         .getService(Components.interfaces.nsIExtensionManager);
const RDFS = Components.classes['@mozilla.org/rdf/rdf-service;1']
                       .getService(Components.interfaces.nsIRDFService);

function extensions() {
  var info = [];

  var ds = extMgr.datasource;
  ds.QueryInterface(Components.interfaces.nsIRDFDataSource);

  // Get list of incompatibles add-ons
  var incompatibles = {};

  var results = extMgr.getIncompatibleItemList(appInfo.ID, appInfo.version, 2, true, {});
  for (var i = 0; i < results.length; i++) {
    incompatibles[results[i].id] = true;
  }

  // get the list of all extensions
  var results = extMgr.getItemList(2, {});
  for (var i = 0; i < results.length; i++) {

    var item = results[i];
    var skip = false;

    // check if they are disabled

    var target = ds.GetTarget(RDFS.GetResource("urn:mozilla:item:" + item.id),
                                 RDFS.GetResource("http://www.mozilla.org/2004/em-rdf#isDisabled"),
                                 true);

    if ((target instanceof Components.interfaces.nsIRDFLiteral) &&
         (target.Value == 'true')) {
      skip = true;
    }

    if (incompatibles[item.id]) {
      skip = true;
    }

    if (!skip) {
      info.push({name: item.name, version: item.version, id: item.id})
    }
  }
  return info;
}

function sysInfo() {
  var info = [];
  info.push(['ID', appInfo.ID]);
  info.push(['vendor', appInfo.vendor]);
  info.push(['name', appInfo.name]);
  info.push(['version', appInfo.version]);
  info.push(['appBuildID', appInfo.appBuildID]);
  info.push(['platformVersion', appInfo.platformVersion]);
  info.push(['platformBuildID', appInfo.platformBuildID]);
  info.push(['OS', runtime.OS]);
  return info;
}


