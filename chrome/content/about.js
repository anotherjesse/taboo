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

function imageOver(event) {
  console.log('here ' + event.originalTarget);
  var img = event.originalTarget;
  img.style.top = (parseInt(img.style.top) - 24) + 'px';
  console.log('here1 ' + img.style.top);
}

function About(container) {
  document.body.className = 'about';
  this.info = true;

  var div = document.createElement('div');
  container.appendChild(div);

  this.start = function() {
    div.innerHTML = '<iframe src="about.html" style="width: 100%; height: 700px; border: 0;" />';
  }

  this.finish = function() {}

  this.add = function(tab) {}
}
