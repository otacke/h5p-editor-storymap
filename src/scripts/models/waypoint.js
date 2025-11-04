import Util from '@services/util.js';

export default class Waypoint {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} [params.waypointParams] Waypoint parameters.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onFocusBlur Callback for focus/blur events.
   */
  constructor(params = {}, callbacks = {}) {
    params.waypointParams = Util.extend({
      id: H5P.createUUID(),
      lat: 0,
      lng: 0,
    }, params.waypointParams);

    this.callbacks = Util.extend({
      onFocusBlur: () => {},
    }, callbacks);

    this.params = Util.extend({}, params);

    this.params.waypointParams.title =
      this.params.waypointParams.title || this.params.dictionary.get('l10n.unnamedWaypoint');

    this.formData = this.generateForm(
      this.params.waypointFields,
      this.params.waypointParams,
    );

    this.params.marker.getElement().addEventListener('focus', () => {
      this.callbacks.onFocusBlur(this.getId(), true);
    });

    this.params.marker.getElement().addEventListener('blur', () => {
      this.callbacks.onFocusBlur(this.getId(), false);
    });
  }

  /**
   * Generate form.
   * @param {object} semantics Semantics for form.
   * @param {object} params Parameters for form.
   * @returns {object} Form object with DOM and H5P widget instances.
   */
  generateForm(semantics, params = {}) {
    const form = document.createElement('div');

    H5PEditor.processSemanticsChunk(
      semantics,
      params,
      H5P.jQuery(form),
      this.params.globals.get('waypointsGroupInstance'),
    );

    const waypointsGroupInstance = this.params.globals.get('waypointsGroupInstance');

    return {
      form: form,
      children: waypointsGroupInstance.children,
    };
  }

  /**
   * Get the ID of the waypoint.
   * @returns {string} The ID of the waypoint.
   */
  getId() {
    return this.params.waypointParams.id;
  }

  /**
   * Get the value for a specific field of the form.
   * @param {string} name The name of the field.
   * @returns {object[]|string|undefined} The value of the field.
   */
  getValueForField(name) {
    const fieldInstance = this.formData.children.find((child) => child.field.name === name);
    if (!fieldInstance) {
      return;
    }

    if (fieldInstance.hasOwnProperty('getValue')) {
      return fieldInstance.getValue();
    }
    else if (fieldInstance.hasOwnProperty('value')) {
      return fieldInstance.value;
    }
    else if (fieldInstance.hasOwnProperty('params')) {
      return fieldInstance.params;
    }
  }

  /**
   * Get the title of the waypoint.
   * @returns {string} The title of the waypoint.
   */
  getTitle() {
    return this.getValueForField('title');
  }

  /**
   * Get waypoint description.
   * @returns {string} The description of the waypoint.
   */
  getDescription() {
    const machineNames = (this.params.waypointParams.contents || [])
      .filter((content) => typeof content.action?.library === 'string')
      .map((content) => content.action.library.split(' ')[0]);

    if (machineNames.length === 0) {
      return '';
    }
    else if (machineNames.length === 1) {
      return machineNames[0];
    }
    else {
      return this.params.dictionary.get('l10n.multipleContents');
    }
  }

  /**
   * Get form data.
   * @returns {object} The form data.
   */
  getFormData() {
    return this.formData;
  }

  /**
   * Get the leaflet marker.
   * @returns {object} The leaflet marker.
   */
  getMarker() {
    return this.params.marker;
  }

  /**
   * Get parameters (to be stored) for the waypoint.
   * @returns {object} The parameters for the waypoint.
   */
  getParams() {
    return {
      id: this.getId(),
      latitude: (this.params.marker.getLatLng().lat).toString(),
      longitude: (this.params.marker.getLatLng().lng).toString(),
      title: this.getTitle(),
      contents: this.getValueForField('contents'),
    };
  }

  /**
   * Update marker aria-label.
   */
  updateMarkerAriaLabel() {
    const markerElement = this.params.marker.getElement();
    if (!markerElement) {
      return;
    }

    const ariaLabel = this.getTitle() || this.params.dictionary.get('l10n.unnamedWaypoint');
    markerElement.setAttribute('aria-label', ariaLabel);
  }


  /**
   * Toggle focus on the marker.
   * @param {boolean} setFocus Whether to set focus or not.
   */
  toggleFocus(setFocus) {
    const markerElement = this.params.marker.getElement();
    if (!markerElement) {
      return;
    }

    if (setFocus) {
      markerElement.focus();
    }
    else {
      markerElement.blur();
    }
  }
}
