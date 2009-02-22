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

function About(container) {
  this.info = true;
  document.body.className = 'about';

  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance(Ci.nsIXMLHttpRequest);
  req.open("GET", 'chrome://taboo/content/about.html');
  req.onload = function() {
    container.innerHTML = req.responseText;
  };
  req.send(null);
}
