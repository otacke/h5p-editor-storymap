import Util from '@services/util.js';
import GeoMap from './geo-map.js';
import './waypoint-area.scss';

export default class WaypointArea {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} callbacks Callback functions.
   * @param {function} callbacks.onWaypointAdded Called when a waypoint is added.
   * @param {function} callbacks.onMarkerRemoved Called when a marker is removed.
   * @param {function} callbacks.onWaypointFocusBlur Called when a waypoint is focused or blurred.
   * @param {function} callbacks.onChanged Called when the state changes.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onWaypointAdded: () => {},
      onMarkerRemoved: () => {},
      onWaypointFocusBlur: () => {},
      onChanged: () => {},
    }, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-storymap-waypoint-area-wrapper-inner');

    this.lastKnownScrollPosition = 0;
    this.ticking = false;

    this.geoMap = new GeoMap(
      {
        globals: this.params.globals,
        dictionary: this.params.dictionary,
        waypoints: this.params.waypoints,
        waypointFields: this.params.waypointFields,
        zoomLevelDefault: this.params.zoomLevelDefault,
      },
      {
        onWaypointAdded: (waypoint) => {
          this.callbacks.onWaypointAdded(waypoint);
        },
        showFormDialog: (waypoint, mode) => {
          this.callbacks.showFormDialog(waypoint, mode);
        },
        onWaypointFocusBlur: (id, state) => {
          this.callbacks.onWaypointFocusBlur(id, state);
        },
        onChanged: (values) => {
          this.callbacks.onChanged(values);
        },
      },
    );

    this.waypointArea = document.createElement('div');
    this.waypointArea.classList.add('h5p-editor-storymap-waypoint-area');

    this.id = H5P.createUUID();
    this.dom.setAttribute('id', this.id);
    this.dom.append(this.waypointArea);

    this.waypointArea.append(this.geoMap.getDOM());
  }

  /**
   * Append to DOM.
   * @param {HTMLElement} dom DOM element.
   */
  appendElement(dom) {
    this.waypointArea.append(dom);
  }

  /**
   * Center map on waypoint.
   * @param {string} id Id of waypoint to center on.
   */
  centerOnWaypoint(id) {
    this.geoMap.centerOnWaypoint(id);
  }

  /**
   * Change waypoint order.
   * @param {number} sourceIndex Source index.
   * @param {number} moveOffset Move offset.
   */
  changeWaypointOrder(sourceIndex, moveOffset) {
    this.geoMap.changeWaypointOrder(sourceIndex, moveOffset);
  }

  /**
   * Edit waypoint.
   * @param {object} waypoint Waypoint to edit.
   */
  editWaypoint(waypoint) {
    this.callbacks.showFormDialog(waypoint, 'edit');
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get element area ID.
   * @returns {string} ID.
   */
  getId() {
    return this.id;
  }

  /**
   * Get index of element.
   * @param {HTMLElement} element Element to find index of.
   * @returns {number} Index of element.
   */
  getIndexOf(element) {
    return Array.from(this.waypointArea.children).indexOf(element);
  }

  /**
   * Get waypoint by ID.
   * @param {string} id ID of waypoint to get.
   * @returns {object|null} Waypoint object or null if not found.
   */
  getWaypointById(id) {
    return this.geoMap.getWaypointById(id);
  }

  /**
   * Get waypoint parameters.
   * @returns {object} Waypoint parameters.
   */
  getWaypointsParams() {
    return this.geoMap.getWaypointsParams();
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Remove waypoint.
   * @param {object} waypoint Waypoint to remove.
   */
  removeWaypoint(waypoint) {
    this.geoMap.removeWaypoint(waypoint);
  }

  /**
   * Set map style.
   * @param {object} value Map style value ({ value: string, label: string }).
   */
  setMapStyle(value) {
    this.geoMap.setMapStyle(value);
  }

  /**
   * Set show paths.
   * @param {boolean} value Show paths.
   */
  togglePathVisibility(value) {
    this.geoMap.togglePathVisibility(value);
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Swap elements.
   * @param {number} index1 Index of first element.
   * @param {number} index2 Index of second element.
   */
  swapElements(index1, index2) {
    const dom1 = this.waypointArea.children[index1];
    const dom2 = this.waypointArea.children[index2];

    Util.swapDOMElements(dom1, dom2);
  }

  /**
   * Toggle focus of waypoint.
   * @param {string} id ID of waypoint to toggle focus of.
   * @param {boolean} state New focus state.
   */
  toggleFocusOfWaypoint(id, state) {
    this.geoMap.toggleFocusOfWaypoint(id, state);
  }

  /**
   * Toggle map mode.
   */
  toggleMapMode() {
    this.geoMap.toggleMode();
  }

  /**
   * Toggle mini map.
   * @param {boolean} state New mini map state.
   */
  toggleMiniMapVisibility(state) {
    this.geoMap.toggleMiniMapVisibility(state);
  }

  /**
   * Update size properties to be used by children.
   */
  updateSizeProperties() {
    const { height, width } = this.getSize();

    this.dom.style.setProperty('--waypoint-area-computed-width', `${width}px`);
    this.dom.style.setProperty('--waypoint-area-computed-height', `${height}px`);
  }

  /**
   * Get board size.
   * @returns {object} Height and width of board.
   */
  getSize() {
    const clientRect = this.waypointArea.getBoundingClientRect();
    return { height: clientRect.height, width: clientRect.width };
  }

  /**
   * Get current zoom level of the map.
   * @returns {number} Zoom level.
   */
  getZoomLevel() {
    return this.geoMap.getZoomLevel();
  }
}
