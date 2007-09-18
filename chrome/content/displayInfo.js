/*
 * Copyright 2007 Jesse Andrews, Manish Singh, Ian Fischer
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

function DisplayInfo(container) {
  document.body.className = 'about';
  this.info = true;

  var div = document.createElement('div');
  container.appendChild(div);

  this.start = function() {
    div.innerHTML = '<br />To use Taboo, just click on the red "+" icon next to your address bar. This saves the tab for you.<br />' + 
                    'To view your saved taboos, click on the red "T".';
  }

  this.finish = function() {}

  this.add = function(tab) {}
}