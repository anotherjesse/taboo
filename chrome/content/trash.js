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
  var inst = this;

  inst.trash = true;
  document.body.className = 'trash';

  var taboos = [];

  var deleteAll = DIV({id: 'deleteAll',
                       style: 'visibility: visible; width: 275px; padding-top: 10px; margin: 0 auto 0 auto;'});

  var deleteButton = BUTTON({id: 'deleteButton', style: 'padding: 3px;'},
                            "Permanently delete all of these taboos");

  deleteAll.appendChild(deleteButton);

  deleteButton.onclick = function() {
    inst.disableUpdate = true;

    for (var i in taboos) {
      controller.tabFinalDelete(taboos[i]);
    }
    // humanMsg.displayMsg("All taboo in trash have been permanently deleted.");

    inst.disableUpdate = false;
    controller.display();
  };
  container.appendChild(deleteAll);

  var ul = UL();
  container.appendChild(ul);

  inst.start = function() {
    taboos = [];
    ul.innerHTML = '';
  };

  inst.finish = function() {};

  inst.add = function(tab) {
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
        controller.tabFinalDelete(tab);
      }
      else {
        controller.tabUndelete(tab);
        controller.display();
      }
    };
    ul.appendChild(box);
    taboos.push(tab);
  };
}
