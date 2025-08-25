import L from 'leaflet';
import MiniMap from 'leaflet-minimap';
import MARKER_SVG from '@assets/marker.svg?inline';
import Util from '@services/util.js';
import Waypoint from '@models/waypoint.js';

import 'leaflet/dist/leaflet.css';
import './geo-map.scss';

/** @constant {object} MODES Map modes. */
export const MODES = { VIEW: 0, ADD_PIN: 1 };

/** constant {object} MARKER_ICON Marker icon.*/
const MARKER_ICON = L.divIcon({
  html: MARKER_SVG,
  // eslint-disable-next-line
  iconSize: [30, 45],
  // eslint-disable-next-line
  iconAnchor: [15, 45],
  // eslint-disable-next-line
  popupAnchor: [0, -40.5],
  // eslint-disable-next-line
  tooltipAnchor: [0, -39]
});

/** @constant {object} MAP_SERVICES Map services. */
const MAP_SERVICES = {
  cartoDB: {
    urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    options: {
      // eslint-disable-next-line
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    }
  },
  esriNATGeoWorldMap: {
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      // eslint-disable-next-line
      attribution: '&copy; Esri, USGS &mdash; Esri, TomTom, FAO, NOAA, USGS &mdash; National Geographic, Esri, Garmin, HERE, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, increment P Corp.',
      maxZoom: 12
    }
  },
  esriWorldPhysicalMap: {
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; Esri, USGS &mdash; Esri, TomTom, FAO, NOAA, USGS &mdash; US National Park Service',
      maxZoom: 8
    }
  },
  esriWorldTopoMap: {
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      // eslint-disable-next-line
      attribution: '&copy; Esri, NLS, NMA, USGS &mdash; Source: Esri, TomTom, Garmin, METI/NASA, USGS | Esri, HERE, Garmin, USGS, METI/NASA, NGA'
    }
  },
  openStreetMap: {
    urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }
  },
  openTopoMap: {
    urlTemplate: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      // eslint-disable-next-line
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, SRTM | &copy; <a href="http://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">(CC BY-SA 3.0)</a>)',
      maxZoom: 17
    }
  },
};

/** @constant {number} DEFAULT_ZOOM_LEVEL Default zoom level. */
const DEFAULT_ZOOM_LEVEL = 13;

/** @constant {number[]} DEFAULT_COORDINATES Default coordinates (H5P Group in Tromsø). */
// eslint-disable-next-line
const DEFAULT_COORDINATES = [69.6456737, 18.9501558];

export default class GeoMap {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} callbacks Callback functions.
   * @param {function} callbacks.onWaypointAdded Called when a waypoint is added.
   * @param {function} callbacks.showFormDialog Called to show the form dialog.
   * @param {function} callbacks.onWaypointFocusBlur Called when a waypoint is focused or blurred.
   * @param {function} callbacks.onChanged Called when the state changes.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({}, params);

    this.callbacks = Util.extend({
      onWaypointAdded: () => {},
      showFormDialog: () => {},
      onWaypointFocusBlur: () => {},
      onChanged: () => {}
    }, callbacks);

    this.waypoints = [];
    this.paths = [];

    this.buildDOM();
    this.buildMap();
    this.rebuildWaypoints();

    if (this.waypoints.length > 0) {
      this.centerOnWaypoint(this.waypoints[0].getId());
    }
  }

  /**
   * Build DOM elements for the map.
   */
  buildDOM() {
    this.dom = document.createElement('div');
    this.dom.className = 'geo-map';
  }

  /**
   * Build the map.
   */
  buildMap() {
    this.map = L.map(this.dom).setView(DEFAULT_COORDINATES, DEFAULT_ZOOM_LEVEL);

    this.map.on('click', (event) => {
      this.putWaypointOnMap(event);
    });

    this.dom.append(this.map);
    this.overrideLeafletZoomButtons();
  }

  /**
   * Handle map click.
   * @param {MouseEvent} event Event.
   */
  putWaypointOnMap(event) {
    if (this.mode !== MODES.ADD_PIN) {
      return;
    }

    const waypoint = this.addWaypoint({
      id: H5P.createUUID(),
      latitude: event.latlng.lat,
      longitude: event.latlng.lng
    });

    if (!waypoint) {
      return;
    }

    this.removeAllPaths();
    this.connectMarkersWithPaths();

    this.callbacks.onWaypointAdded(waypoint);
    this.callbacks.showFormDialog(waypoint, 'add');
  }

  /**
   * Add a waypoint to the map.
   * @param {object} params Parameters for the waypoint.
   * @returns {Waypoint|null|undefined} The created waypoint or null if not created.
   */
  addWaypoint(params = {}) {
    if (this.mode !== MODES.ADD_PIN) {
      return;
    }

    const marker = L.marker([params.latitude, params.longitude], { icon: MARKER_ICON, draggable: true });
    marker.addTo(this.map);

    const waypoint = new Waypoint(
      {
        globals: this.params.globals,
        dictionary: this.params.dictionary,
        marker: marker,
        waypointParams: {
          id: params.id || H5P.createUUID(),
          latitude: params.latitude,
          longitude: params.longitude,
          title: params.title,
          contents: params.contents || []
        },
        waypointFields: this.params.waypointFields
      },
      {
        onFocusBlur: (id, state) => {
          this.callbacks.onWaypointFocusBlur(id, state);
        }
      }
    );

    this.waypoints.push(waypoint);

    marker.on('drag', () => {
      this.connectMarkersWithPaths();
      this.callbacks.onChanged();
    });

    marker.on('keydown', (event) => {
      if (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ') {
        this.callbacks.showFormDialog(waypoint, 'edit');
      }
    });

    marker.on('dblclick', () => {
      this.callbacks.showFormDialog(waypoint, 'edit');
    });

    this.callbacks.onChanged({ waypoints: this.getWaypointsParams() });

    return waypoint;
  }

  /**
   * Connect markers with paths.
   */
  connectMarkersWithPaths() {
    this.removeAllPaths();

    for (let i = 0; i < this.waypoints.length; i++) {
      if (i === 0) {
        continue;
      }

      this.addPath(this.waypoints[i - 1].getMarker().getLatLng(), this.waypoints[i].getMarker().getLatLng());
    }
  }

  /**
   * Remove all paths.
   */
  removeAllPaths() {
    this.paths.forEach((path) => {
      this.removePath(path);
    });
  }

  /**
   * Remove path from the map and internal list.
   * @param {L.Polyline} path Path to remove.
   */
  removePath(path) {
    this.map.removeLayer(path);
    this.paths = this.paths.filter((p) => p !== path);
  }

  /**
   * Add path between two points.
   * @param {L.LatLng} latLng1 First point.
   * @param {L.LatLng} latLng2 Second point.
   */
  addPath(latLng1, latLng2) {
    const path = L.polyline([latLng1, latLng2]);
    path.addTo(this.map);
    this.paths.push(path);
  }

  /**
   * Get waypoint parameters.
   * @returns {object} Array of waypoint parameters.
   */
  getWaypointsParams() {
    return this.waypoints.map((waypoint) => waypoint.getParams());
  }

  /**
   * Override leaflet's zoom buttons to make translatable.
   */
  overrideLeafletZoomButtons() {
    const zoomInButton = this.dom.querySelector('.leaflet-control-zoom-in');
    zoomInButton.setAttribute('aria-label', this.params.dictionary.get('a11y.buttonZoomIn'));
    zoomInButton.removeAttribute('title');
    H5P.Tooltip?.(zoomInButton, { position: 'right' });

    const zoomOutButton = this.dom.querySelector('.leaflet-control-zoom-out');
    zoomOutButton.setAttribute('aria-label', this.params.dictionary.get('a11y.buttonZoomOut'));
    zoomOutButton.removeAttribute('title');
    H5P.Tooltip?.(zoomOutButton, { position: 'right' });
  }

  /**
   * Rebuild waypoints from saved parameters.
   */
  rebuildWaypoints() {
    this.mode = MODES.ADD_PIN;
    this.params.waypoints.forEach((waypointParams) => {
      const restoredWaypoint = this.addWaypoint(waypointParams);
      if (restoredWaypoint) {
        this.callbacks.onWaypointAdded(restoredWaypoint);
      }
    });
    this.mode = MODES.VIEW;

    this.connectMarkersWithPaths();
  }

  /**
   * Center the map on waypoint with a certain ID.
   * @param {string} id ID of the waypoint to center on.
   */
  centerOnWaypoint(id) {
    const waypoint = this.getWaypointById(id);
    if (!waypoint) {
      return;
    }

    this.map.panTo(waypoint.getMarker().getLatLng());
  }

  /**
   * Get waypoint by ID.
   * @param {string} id ID of the waypoint to get.
   * @returns {object|null} Waypoint object or null if not found.
   */
  getWaypointById(id) {
    return this.waypoints.find((waypoint) => waypoint.getId() === id);
  }

  /**
   * Change order of waypoints.
   * @param {number} sourceIndex Index of waypoint to move.
   * @param {number} targetIndex Index to move waypoint to.
   */
  changeWaypointOrder(sourceIndex, targetIndex) {
    [this.waypoints[sourceIndex], this.waypoints[targetIndex]] =
      [this.waypoints[targetIndex], this.waypoints[sourceIndex]];

    this.connectMarkersWithPaths();
  }

  /**
   * Get the DOM element of the map.
   * @returns {HTMLElement} The DOM element of the map.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Remove waypoint.
   * @param {Waypoint} waypoint Waypoint to remove.
   */
  removeWaypoint(waypoint) {
    if (!waypoint || !(waypoint instanceof Waypoint)) {
      return;
    }

    this.map.removeLayer(waypoint.getMarker());
    this.waypoints = this.waypoints.filter((w) => w !== waypoint);

    this.connectMarkersWithPaths();

    this.callbacks.onChanged({ waypoints: this.getWaypointsParams() });
  }

  /**
   * Set map style.
   * @param {object} mapStyle Map style ({ value: string, label: string }).
   */
  setMapStyle(mapStyle) {
    if (!MAP_SERVICES[mapStyle]) {
      return;
    }

    const mapServiceData = MAP_SERVICES[mapStyle];

    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    this.tileLayer = L.tileLayer(mapServiceData.urlTemplate, mapServiceData.options);
    this.tileLayer.addTo(this.map);

    if (this.miniMapLayer) {
      this.map.removeLayer(this.miniMapLayer);
      this.dom.querySelector('.leaflet-control-minimap')?.remove(); // Removing layer fails (?)
    }

    this.miniMapLayer = new L.TileLayer(mapServiceData.urlTemplate, mapServiceData.options);
    this.miniMap = new MiniMap(this.miniMapLayer, {
      height: '', // Allows to use CSS without restriction to px and without !important
      width: '', // Allows to use CSS without restriction to px and without !important
      position: 'bottomleft'
    });

    this.miniMap.addTo(this.map);

    if (this.miniMapVisible === undefined) {
      this.toggleMiniMapVisibility(false);
    }
  }

  /**
   * Toggle focus of waypoint.
   * @param {string} id ID of the waypoint to toggle focus for.
   * @param {boolean} state True to focus the waypoint, false to blur.
   */
  toggleFocusOfWaypoint(id, state) {
    const waypoint = this.getWaypointById(id);
    if (!waypoint) {
      return;
    }

    waypoint.toggleFocus(state);
  }

  /**
   * Toggle mini map visibility.
   * @param {boolean} state True to show mini map, false to hide.
   */
  toggleMiniMapVisibility(state) {
    this.miniMapVisible = (typeof state === 'boolean') ? state : !this.miniMapVisible;

    this.dom.querySelector('.leaflet-control-minimap')?.classList.toggle('visibility-hidden', !this.miniMapVisible);
  }

  /**
   * Toggle map interaction mode.
   * @param {number} mode Mode to set.
   */
  toggleMode(mode) {
    if (mode) {
      if (!Object.values(MODES).includes(mode)) {
        return;
      }
      this.mode = mode;
    }
    else {
      if (this.mode === MODES.VIEW) {
        this.mode = MODES.ADD_PIN;
      }
      else {
        this.mode = MODES.VIEW;
      }
    }

    this.dom.classList.toggle('add-pin-mode', this.mode === MODES.ADD_PIN);
  }

  /**
   * Toggle path visibility.
   * @param {boolean} showPaths True to show paths.
   */
  togglePathVisibility(showPaths) {
    if (showPaths) {
      this.dom.style.setProperty('--path-color', 'var(--path-color-active)');
      this.dom.style.setProperty('--path-stroke-dash', 'var(--path-stroke-dash-active)');
    }
    else {
      this.dom.style.setProperty('--path-color', 'var(--path-color-inactive)');
      this.dom.style.setProperty('--path-stroke-dash', 'var(--path-stroke-dash-inactive)');
    }
  }
}
