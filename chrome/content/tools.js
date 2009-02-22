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

function Tools(container) {
  this.info = true;
  document.body.className = 'tools';

  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance(Ci.nsIXMLHttpRequest);
  req.open("GET", 'chrome://taboo/content/tools.html');
  req.onload = function() {
    container.innerHTML = req.responseText;
  };
  req.send(null);
}


function getFile(mode, msg, filterDesc, defaultName) {
  var defaultExt = defaultName.split('.')[1];
  var fp = Cc["@mozilla.org/filepicker;1"]
    .createInstance(Ci.nsIFilePicker);
  fp.init(window, msg, mode);
  fp.defaultExtension = defaultExt;
  fp.defaultString = defaultName;
  fp.appendFilter(filterDesc + " (" + defaultExt.toUpperCase() + ")",
                  "*." + defaultExt);
  var res = fp.show();
  if (res == Ci.nsIFilePicker.returnOK) {
    return fp.file;
  }
}

function importer() {
  var file = getFile(Ci.nsIFilePicker.modeOpen,
                     "Choose Taboo Backup to Import",
                     "Taboo Backups",
                     "taboos.zip",
                     "zip");
  var numImported;
  try {
    if (file) {
      numImported = SVC.import(file);
      if (numImported) {
        // humanMsg.displayMsg('Successfully imported ' + numImported + ' taboos');
      }
    }
  }
  catch (e) {
    // humanMsg.displayMsg('Failed to import taboos.');
  }
}

function exporter() {
  var file = getFile(Ci.nsIFilePicker.modeSave,
                     "Choose Where to Save Backup",
                     "Taboo Backups",
                     "taboos.zip");
  var numExported;
  try {
    if (file) {
      numExported = SVC.export(file);
      if (numExported) {
        // humanMsg.displayMsg('Successfully exported ' + numExported + ' taboos');
      }
    }
  }
  catch (e) {
    // humanMsg.displayMsg('Failed to export taboos.');
  }
}

function exportAsHTML() {
  var file = getFile(Ci.nsIFilePicker.modeSave,
                     "Choose Where to Save Backup HTML",
                     "Taboo HTML",
                     "taboos.html");
  var numExported;
  try {
    if (file) {
      numExported = SVC.exportAsHTML(file);
      if (numExported) {
        //humanMsg.displayMsg('Successfully exported ' + numExported + ' taboos');
      }
    }
  }
  catch (e) {
    // humanMsg.displayMsg('Failed to export taboos.');
  }
}
