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
    var box = document.createElement('li');
    var div = document.createElement('div');
    div.setAttribute('title', tab.title);
    var span = document.createElement('span');
    span.setAttribute('class', 'delete');
    span.setAttribute('title', 'delete taboo');
    div.appendChild(span);
    var span = document.createElement('span');
    span.setAttribute('class', 'title');
    var nobr = document.createElement('nobr');
    span.appendChild(nobr);
    nobr.appendChild(document.createTextNode(tab.title));
    div.appendChild(span);
    var span = document.createElement('span');
    span.setAttribute('class', 'url');
    var nobr = document.createElement('nobr');
    span.appendChild(nobr);
    nobr.appendChild(document.createTextNode(tab.url));
    div.appendChild(span);
    var span = document.createElement('span');
    span.setAttribute('class', 'thumb');
    var img = document.createElement('img');
    img.setAttribute('class', 'preview');
    img.setAttribute('src', tab.thumbURL);
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
