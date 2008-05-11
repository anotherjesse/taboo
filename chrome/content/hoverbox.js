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

function Hoverbox(container, footerControls) {
  document.body.className = 'hoverbox';
  
  var ul = UL();
  container.appendChild(ul);

  this.start = function() {
    ul.innerHTML = '';
  }

  this.finish = function() {}

  this.add = function(tab) {
    var box = LI(
      DIV({class: 'thumb'},
        IMG({src: tab.thumbURL})
      ),
      DIV({class: 'preview'},
        IMG({src: tab.imageURL}),
        SPAN(tab.title)
      )
    );

    box.onclick = function(event) {
      SVC.open(tab.url, whereToOpenLink(event));
    }
    
    box.onmouseover = function(event) {
      $('.preview', this).css('top', (box.clientHeight/2-$('.preview', this)[0].clientHeight/2)+'px');
    }
    
    ul.appendChild(box);
  }
}
