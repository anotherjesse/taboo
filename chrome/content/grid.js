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

function Grid(container, footerControls) {
  document.body.className = 'grid';

  var size = 125;
  
  function setSize(newSize) {
    if (newSize < 100) return;
    if (newSize > 500) return;
    
    var class = 's'+newSize+' ';
    if (newSize < 200) {
      class += 'small'
    }
    else {
      class += 'large'
    }
    
    ul.className = class
    size = newSize;
  }

  function zoomIn() {
    setSize(size+25);
    event.preventDefault();
  }

  function zoomOut(event) {
    setSize(size - 25);
    event.preventDefault();
  }

  var span = document.createElement('span');
  span.innerHTML = '+'
  span.onclick = zoomIn;
  footerControls.appendChild(span);

  var span = document.createElement('span');
  span.innerHTML = '-'
  span.onclick = zoomOut;
  footerControls.appendChild(span);

  var style = document.createElement('style');
  container.appendChild(style)

  var ul = document.createElement('ul');
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
    setSize(100)
  }

  this.finish = function() {}

  this.add = function(tab) {
    var box = LI({},
      DIV({}, 
        SPAN({class: 'delete', title: 'delete taboo'}),
        SPAN({class: 'title', title: tab.title}, tab.title),
        SPAN({class: 'url', href: tab.url, title: tab.url}, tab.url),
        SPAN({class: 'preview'},
          IMG({class: 'thumb', src: tab.thumbURL}),
          IMG({class: 'large', src: tab.imageURL})
        )
      )
    );

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
