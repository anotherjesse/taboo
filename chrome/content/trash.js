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

function Trash(container) {
  this.trash = true;
  document.body.className = 'trash';

  var deleted = [];

  var deleteAll = DIV({id: 'deleteAll',
                       style: 'visibility: visible; width: 275px; padding-top: 10px; margin: 0 auto 0 auto;'});

  var deleteButton = BUTTON({id: 'deleteButton', style: 'padding: 3px;'},
                            "Permanently delete all of these taboos");

  deleteAll.appendChild(deleteButton);

  deleteButton.onclick = function() {
    for (var i in deleted) {
      // if parentNode doesn't exist, it has already been removed from page
      // eg - it has been undeleted or deleted - but we don't keep deleted
      // array up to date so we need to check.
      if (deleted[i].el.parentNode) {
        controller.tabFinalDelete(deleted[i].tab, deleted[i].el);
      }
    }
  };
  container.appendChild(deleteAll);

  var ul = UL();
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
  };

  this.finish = function() {};

  this.add = function(tab) {
    var box = LI({},
      DIV({},
        SPAN({'class': 'delete', title: 'Permenantly delete this taboo'}),
        SPAN({'class': 'title', title: tab.title}, tab.title),
        SPAN({'class': 'url', title: tab.url}, tab.url),
        SPAN({'class': 'preview'},
          IMG({'class': 'thumb', src: tab.thumbURL})
        )
      )
    );

    box.onclick = function(event) {
      if (event.originalTarget.className == 'delete') {
        controller.tabFinalDelete(tab, box);
      }
      else {
        controller.tabUndelete(tab);
        box.parentNode.removeChild(box);
        undeleted.style.visibility = 'visible';
        setTimeout(function() { undeleted.style.display = 'none'; }, 30000);
      }
    };
    ul.appendChild(box);
    deleted.push({'tab':tab, 'el':box});
  };
}
