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

function Trash(container) {
  this.trash = true;
  container.className = 'grid';

  var deleted = [];
  
  document.getElementById('undelete').style.visibility = 'hidden';
  
  var div = document.createElement('div');
  div.setAttribute('id', 'deleteAll');
  div.setAttribute('class', 'infoWrap');
  div.style.visibility = 'visible';
  div.style.width = '255px';

  var text = document.createElement('div');
  text.setAttribute('class', 'info');
  text.style.width = '255px';
  div.appendChild(text);

  var a = document.createElement('a');
  a.innerHTML = 'Click here to delete all of these taboos.';
  a.href = '#';
  a.onclick = function() {
    for (var i in deleted) {
      controller.tabFinalDelete(deleted[i].tab, deleted[i].el);
    }
  };
  text.appendChild(a);
  document.getElementById('content').appendChild(div);
  
  document.getElementById('content').appendChild(document.createElement('br'));
  
  div = document.createElement('div');
  div.setAttribute('class', 'infoWrap');
  div.style.width = '400px';

  text = document.createElement('div');
  text.setAttribute('class', 'info');
  text.style.width = '400px';
  text.innerHTML = 'This taboo has been undeleted.  Click another view to see it.'
  div.appendChild(text);

	document.getElementById('content').appendChild(div);

  var ul = document.createElement('ul');
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
  }

  this.finish = function() {}

  this.add = function(tab) {
    var box = document.createElement('li');
    box.innerHTML = '<div title="'+tab.title+'"><span class="delete" title="delete taboo"></span><span class="title"><nobr>' +
      tab.title + '</nobr></span><span class="url" title="'+ tab.url +'">' +
      tab.url + '</span><img class="preview" src="' + tab.imageURL + '" /></div>';

    box.onclick = function(event) {
      if (event.originalTarget.className == 'delete') {
        controller.tabFinalDelete(tab, box);
      }
      else {
        controller.tabUndelete(tab);
        box.style.display = 'none';
        div.style.visibility = 'visible';
        setTimeout(function() { div.style.display = 'none'; }, 30000);   
      }
    }
    ul.appendChild(box);
    deleted.push({'tab':tab, 'el':box});
  }
}
