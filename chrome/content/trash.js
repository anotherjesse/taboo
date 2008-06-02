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

  document.getElementById('undelete').style.visibility = 'hidden';

  var deleteAll = DIV({id: 'deleteAll', 'class': 'infoWrap',
		       style: 'visibility: visible; width: 255px'},
		      "Click here to delete all of these taboos.");

  deleteAll.onclick = function() {
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


  var undeleted = DIV({'class': 'infoWrap', style: 'width: 400px'},
    'This taboo has been restore');

  container.appendChild(undeleted);

  var ul = UL();
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
  };

  this.finish = function() {};

  this.add = function(tab) {
    var box = LI({},
      DIV({},
        SPAN({'class': 'delete', title: 'permenantly delete taboo'}),
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
