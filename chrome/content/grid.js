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

  if (!tboPrefs.getPrefType('grid-size')) {
    tboPrefs.setIntPref('grid-size', 125);
  }

  var size = tboPrefs.getIntPref('grid-size');

  function setSize(newSize) {
    if (newSize < 100) return;
    if (newSize > 500) return;

    var className = 's'+newSize+' ';
    if (newSize < 200) {
      className += 'small';
    }
    else {
      className += 'large';
    }

    ul.className = className;
    size = newSize;
    tboPrefs.setIntPref('grid-size', size);
  }

  function zoomIn() {
    setSize(size+25);
  }

  function zoomOut() {
    setSize(size-25);
  }

  footerControls.appendChild(BUTTON({onclick: zoomOut}, 'zoom out'));
  footerControls.appendChild(BUTTON({onclick: zoomIn}, 'zoom in'));

  var ul = UL();
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
    setSize(size);
  };

  this.finish = function() {};

  this.add = function(tab) {
    var box = LI(
      DIV(
        SPAN({'class': 'delete nohue', title: 'delete taboo'}),
        SPAN({'class': 'title'}, (tab.title || 'untitled')),
        SPAN({'class': 'url', href: tab.url}, tab.url),
        SPAN({'class': 'preview'},
          IMG({'class': 'thumb', src: tab.thumbURL}),
          IMG({'class': 'large', src: tab.imageURL})
        )
      )
    );

    box.onmouseover = function(event) {
      jQuery(document.body).trigger('hue.over', [
                                      DIV(
                                          SPAN({'class': 'title'}, (tab.title || 'untitled')),
                                          IMG({src: tab.imageURL}),
                                          SPAN({'class': 'description'}, (tab.description || ''))
                                      ),
				      function(event) {
					SVC.open(tab.url, whereToOpenLink(event));
                                      }
                                      ]);
    };

    box.onmouseout = function(event) {
      jQuery(document.body).trigger('hue.out');
    };

    box.onclick = function(event) {
      if (event.originalTarget.className.search('delete') != -1) {
        controller.tabDelete(tab, box);
      }
      else {
        SVC.open(tab.url, whereToOpenLink(event));
      }
    };
    ul.appendChild(box);
  };
}
