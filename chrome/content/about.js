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
  document.body.className = 'about';

  var div = document.createElement('div');
  container.appendChild(div);
  div.innerHTML = '<iframe src="about.html" style="width: 100%; height: 600px; border: 0;" />';

  this.start = function() {}
  this.finish = function() {}
  this.add = function(tab) {}
  this.info = true;
}
