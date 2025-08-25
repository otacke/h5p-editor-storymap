import Sidebar from '../sidebar/sidebar.js';
import DraggablesList from '../sidebar/draggables-list.js';

export default class MixinSidebar {

  /**
   * Build sidebar.
   */
  buildSidebar() {
    this.listElements = new DraggablesList(
      {
        dictionary: this.params.dictionary,
        title: this.params.dictionary.get('l10n.waypoints'),
        reversed: false
      },
      {
        highlight: (subContentId, state) => {
          window.requestAnimationFrame(() => {
            this.toggleFocusOfWaypoint(subContentId, state);
            this.centerOnWaypoint(subContentId);
          });
        },
        move: (sourceIndex, moveOffset, active) => {
          this.changeWaypointOrder(sourceIndex, moveOffset, active);
        },
        edit: (subContentId) => {
          this.editWaypoint(this.getWaypointById(subContentId));
        },
        remove: (subContentId) => {
          this.removeWaypointIfConfirmed(this.getWaypointById(subContentId));
        }
      }
    );

    this.sidebar = new Sidebar({ subComponents: [this.listElements] });
  }

  /**
   * Handle document mouse down.
   * @param {MouseEvent} event Mouse event.
   */
  handleDocumentMouseDown(event) {
    this.listElements.handleDocumentMouseDown(event);
  }

  /**
   * Toggle the sidebar.
   * @param {boolean} [state] True to show, false to hide.
   */
  toggleSidebar(state) {
    this.isListViewActive = state ?? !this.isListViewActive;

    if (this.isListViewActive) {
      this.sidebar.show();
    }
    else {
      this.sidebar.hide();
    }

    this.resize();
  }
}
