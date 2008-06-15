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

function Sync(container) {
  document.body.className = 'sync';

  var sync_url = "http://taboosync.appspot.com/";

  var div = document.createElement('div');
  div.style.width = '100%';
  div.style.height = '800px';
  div.style.border = '0';
  container.appendChild(div);
  var req = new XMLHttpRequest();
  req.open('GET', sync_url, true);
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      var resp = req.responseText;
      resp = resp.replace(/"/g, "'")
                 .replace(/action='\//i, "action='" + sync_url)
                 .replace(/\n/g, ' ')
                 .replace(/<!DOCTYPE[^>]*>/i, '')
                 .replace(/<html.*<body>/i, '')
                 .replace(/<\/body.*<\/html>/i, '');
      div.innerHTML = resp;
      console.log(resp);
    }
  }
  req.send(null);

  this.start = function() {}
  this.finish = function() {}
  this.add = function(tab) {}
}
