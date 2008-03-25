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
    box.innerHTML = '<div><span class="delete" title="delete taboo"></span><span class="title"><nobr>' +
      tab.title + '</nobr></span><span class="url" href="'+ tab.url +'">' +
      tab.url + '</span><span class="thumb"><img class="preview" src="' + tab.thumbURL + '" full="' + tab.imageURL + '" /></span></div>';
      
    $(box).tooltip({
      delay: 750,
      showURL: false,
      bodyHandler: function() {
        return $('<div/>')
          .append($('<h1/>').text(tab.title))
          .append($("<img/>").attr("src", tab.imageURL))
          .append($('<p/>').text(tab.url));
      }
    });
      

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
