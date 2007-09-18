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
    div.innerHTML = '<h1>Using Taboo</h1>' +
										'<ul><li>To use Taboo, just click on the <img src="chrome://taboo/skin/toolbar-add.png" id="taboo-toolbarbutton-add" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
										' icon next to your address bar. This saves the tab for you.</li>' + 
										'<li>Saved Taboos display <img src="chrome://taboo/skin/toolbar-added.png" id="taboo-toolbarbutton-add-saved" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; instead.</li>' +
                    '<li>To view your saved taboos, click on the <img src="chrome://taboo/skin/toolbar-view.png" id="taboo-toolbarbutton-view" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; icon.</li></ul>';
    
  }

  this.finish = function() {}

  this.add = function(tab) {}
}