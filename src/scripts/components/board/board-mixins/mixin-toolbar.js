import ToolbarMain from '../toolbar/toolbar-main.js';
import ToolbarGroup from '../toolbar/toolbar-group.js';

import MARKER_SVG from '@assets/marker.svg';

export default class MixinToolbar {
  /**
   * Build toolbar.
   */
  buildToolbar() {
    // Toolbar components
    const toolbarButtonsContents = [
      {
        id: 'waypoint',
        type: 'toggle',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonWaypointActive'),
          inactive: this.params.dictionary.get('a11y.buttonWaypointInactive'),
        },
        onClick: () => {
          this.toggleMapMode();
        },
      },
    ];

    this.contentsButtons = new ToolbarGroup({
      buttons: toolbarButtonsContents,
      className: 'h5p-editor-storymap-toolbar-content',
      a11y: {
        toolbarLabel: this.params.dictionary.get('a11y.toolbarLabelWaypoints'),
      },
      ariaControlsId: this.waypointArea.getId(),
    }, {});

    const toolbarButtonsActions = [
      {
        id: 'set-zoom-level',
        type: 'pulse',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonSetZoomLevelActive'),
        },
        onClick: () => {
          this.callbacks.onChanged({ zoomLevelDefault: this.waypointArea.getZoomLevel() });
        },
      },
      {
        id: 'mini-map',
        type: 'toggle',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonMiniMapActive'),
          inactive: this.params.dictionary.get('a11y.buttonMiniMapInactive'),
        },
        onClick: () => {
          this.toggleMiniMapVisibility();
        },
      },
      {
        id: 'list-view',
        type: 'toggle',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonListViewActive'),
          inactive: this.params.dictionary.get('a11y.buttonListViewInactive'),
        },
        onClick: () => {
          this.toggleSidebar();
        },
      },
      {
        id: 'preview',
        type: 'pulse',
        a11y: {
          active: this.params.dictionary.get('a11y.buttonPreview'),
        },
        onClick: () => {
          this.callbacks.togglePreview();
        },
      },
    ];

    this.actionButtons = new ToolbarGroup({
      buttons: toolbarButtonsActions,
      className: 'h5p-editor-storymap-toolbar-action',
      a11y: {
        toolbarLabel: this.params.dictionary.get('a11y.toolbarLabelActions'),
      },
      ariaControlsId: this.waypointArea.getId(),
    }, {});

    this.toolbar = new ToolbarMain(
      {
        contentButtonsDOM: this.contentsButtons.getDOM(),
        actionButtonsDOM: this.actionButtons.getDOM(),
      },
    );
  }
}
