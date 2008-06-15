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

  var iframe = document.createElement('iframe');
  iframe.src = sync_url;
  iframe.style.width = '100%';
  iframe.style.height = '800px';
  container.appendChild(iframe);

  iframe.onload = function() {
    if (iframe.contentDocument.location.href == sync_url) {
      alert(iframe.contentDocument.cookie);
    }
  };

  this.start = function() {};
  this.finish = function() {};
  this.add = function(tab) {};
}
