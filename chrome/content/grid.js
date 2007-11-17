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

function Grid(container) {
  document.body.className = 'grid';

  var ul = document.createElement('ul');
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
  }

  this.finish = function() {}

  this.add = function(tab) {
    var box = build('li');
    var div = build('div', {title: tab.title});
    var span = build('span', {class: 'delete', title: 'delete taboo'});
    div.appendChild(span);
    var span = build('span', {class: 'title'});
    var nobr = build('nobr');
    span.appendChild(nobr);
    nobr.appendChild(document.createTextNode(tab.title));
    div.appendChild(span);
    var span = build('span', {class: 'url'});
    var nobr = document.createElement('nobr');
    span.appendChild(nobr);
    nobr.appendChild(document.createTextNode(tab.url));
    div.appendChild(span);
    var span = build('span', {class: 'thumb'});
    var img = build('img', {class: 'preview', src: tab.thumbURL});
    span.appendChild(img);
    div.appendChild(span);
    box.appendChild(div);

    box.onclick = function(event) {
      if (event.originalTarget.className == 'delete') {
        controller.tabDelete(tab, box);
      }
      else {
        SVC.open(tab.url, whereToOpenLink(event));
      }
    }
    ul.appendChild(box);
  }
}
