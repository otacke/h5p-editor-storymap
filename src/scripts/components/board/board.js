import Util from '@services/util.js';
import MixinWaypointArea from './board-mixins/mixin-waypoint-area.js';
import MixinSidebar from './board-mixins/mixin-sidebar.js';
import MixinToolbar from './board-mixins/mixin-toolbar.js';

import './board.scss';

export default class Board {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} params.dictionary Dictionary service.
   * @param {object} params.globals Globals service.
   * @param {object[]} [params.waypoints] Initial waypoints.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onChanged] Called when the board is changed.
   * @param {function} [callbacks.showFormDialog] Called to show the form dialog.
   * @param {function} [callbacks.togglePreview] Called to toggle the preview.
   */
  constructor(params = {}, callbacks = {}) {
    Util.addMixins(Board, [MixinWaypointArea, MixinSidebar, MixinToolbar]);

    this.params = Util.extend({
      waypoints: []
    }, params);

    this.callbacks = Util.extend({
      onChanged: () => {},
      showFormDialog: () => {},
      togglePreview: () => {}
    }, callbacks);

    this.elements = [];

    this.buildComponents();

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-storymap-board');
    this.dom.append(this.toolbar.getDOM());
    this.dom.append(this.mainArea);

    this.toggleSidebar(false); // mixin
  }

  /**
   * Build components.
   */
  buildComponents() {
    // Mixins
    this.buildSidebar();
    this.buildWaypointArea();
    this.buildToolbar();

    // Main area
    this.mainArea = document.createElement('div');
    this.mainArea.classList.add('h5p-editor-storymap-board-main-area');
    this.mainArea.append(this.waypointArea.getDOM());
    this.mainArea.append(this.sidebar.getDOM());
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Hide.
   */
  hide() {
    this.toolbar.hide();
    this.waypointArea.hide();
    this.sidebar.hide();
  }

  /**
   * Resize board.
   */
  resize() {
    window.clearTimeout(this.pinWrapperTimeout);
    this.pinWrapperTimeout = window.requestAnimationFrame(() => {
      this.dom.style.setProperty('--boardMaxHeight', `${this.waypointArea.getSize().height}px`);
      this.waypointArea.updateSizeProperties();
      this.sidebar.resize();
    });

    this.params.globals.get('resize')();
  }

  /**
   * Show.
   */
  show() {
    this.toolbar.show();
    this.waypointArea.show();
    if (this.isListViewActive) {
      this.sidebar.show();
    }
  }
}
