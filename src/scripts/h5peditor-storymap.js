import Main from '@components/main.js';
import Dictionary from '@services/dictionary.js';
import Globals from '@services/globals.js';
import { getUberName } from '@services/h5p-util.js';
import Util, { signalMouseUsage } from '@services/util.js';
import '@styles/h5peditor-storymap.scss';

// TODO: Add option to search for locations
// TODO: Add option to set default zoom level for map

/** Class for StoryMap H5P widget */
export default class StoryMap extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    super();

    this.parent = parent;
    this.field = field;
    this.params = Util.extend({
      waypoints: [],
      zoomLevelDefault: 12,
    }, params);
    this.setValue = setValue;

    this.dictionary = new Dictionary();
    this.fillDictionary();

    this.globals = new Globals();
    this.globals.set('mainInstance', this);
    this.globals.set('showConfirmationDialog', (params) => {
      this.showConfirmationDialog(params);
    });
    this.globals.set('resize', () => {
      this.trigger('resize');
    });

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    // Instantiate original field (or create your own and call setValue)
    this.fieldInstance = new H5PEditor.widgets[this.field.type](
      this.parent, this.field, this.params, this.setValue
    );

    // DOM
    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-storymap');

    this.$container = H5P.jQuery(this.dom); // TODO: Replace once H5P Group removes jQuery from H5P core
    signalMouseUsage(this.$container[0]);

    // Relay changes
    this.fieldInstance.changes?.push(() => {
      this.handleFieldChange();
    });

    this.buildMain();

    document.addEventListener('mousedown', (event) => {
      this.main?.handleDocumentMouseDown(event);
    });

    window.addEventListener('resize', () => {
      this.main?.resize();
    });

    this.parent.ready(() => {
      this.passReadies = false;
      this.initFieldHandlers();
    });
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations = H5PEditor.language['H5PEditor.StoryMap'].libraryStrings || {};
    const translations = {};

    Object.entries(plainTranslations).forEach(([key, value]) => {
      const splits = key.split(/[./]+/);
      const lastSplit = splits.pop();

      const current = splits.reduce((acc, split) => {
        if (!acc[split]) {
          acc[split] = {};
        }
        return acc[split];
      }, translations);

      current[lastSplit] = value;
    });

    this.dictionary.fill(translations);
  }

  /**
   * Show confirmation dialog.
   * @param {object} [params] Parameters.
   */
  showConfirmationDialog(params = {}) {
    const confirmationDialog = new H5P.ConfirmationDialog({
      headerText: params.headerText,
      dialogText: params.dialogText,
      cancelText: params.cancelText,
      confirmText: params.confirmText,
      hideCancel: !params.cancelText,
    });
    confirmationDialog.on('confirmed', () => {
      params.callbackConfirmed?.();
    });
    confirmationDialog.on('canceled', () => {
      params.callbackCanceled?.();
    });

    confirmationDialog.appendTo(this.dom);
    confirmationDialog.show();
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  /**
   * Build main component.
   */
  async buildMain() {
    // Create instance for waypoints group field
    const waypointsGroup = this.field.fields.find((field) => field.name === 'waypoints').field;
    const waypointFields = H5P.cloneObject(waypointsGroup.fields, true);

    this.globals.set('waypointsGroupInstance', new H5PEditor.widgets[waypointsGroup.type](
      this, waypointsGroup, this.params.waypoints, () => {} // No setValue needed
    ));

    this.main = new Main(
      {
        dictionary: this.dictionary,
        globals: this.globals,
        waypoints: this.params.waypoints,
        waypointFields: waypointFields,
        zoomLevelDefault: this.params.zoomLevelDefault
      },
      {
        onChanged: (values) => {
          this.setValues(values);
        },
        getPreviewParams: () => {
          return ({
            a11y: this.parent.commonFields[getUberName('H5P.StoryMap')].a11y.params,
            editor: { waypoints: this.params.waypoints, zoomLevelDefault: this.params.zoomLevelDefault },
            behaviour: this.parent.params.behaviour,
            visual: this.parent.params.visual
          });
        }
      }
    );
    this.dom.append(this.main.getDOM());
  }

  /**
   * Set values and store them.
   * @param {object} values Values to set for respective keys.
   */
  setValues(values) {
    for (const key in values) {
      this.params[key] = values[key];
    }

    this.setValue(this.field, this.params);
  }

  /**
   * Initialize handlers of H5P editor fields outside of this widget.
   * Can be called multiple times by different init functions running asynchronously.
   */
  initFieldHandlers() {
    this.initMapStyleSelectFieldHandler();
    this.initShowPathsFieldHandler();
  }

  /**
   * Initialize handler for map style select field.
   */
  initMapStyleSelectFieldHandler() {
    if (!this.mapStyleSelectFieldInstance) {
      this.mapStyleSelectFieldInstance = H5PEditor.findField('visual/mapStyle', this.parent);
      this.mapStyleSelectFieldInstance?.changes.push(() => {
        this.setMapStyle(this.mapStyleSelectFieldInstance.value);
      });
    }

    if (this.mapStyleSelectFieldInstance) {
      this.setMapStyle(this.mapStyleSelectFieldInstance.value);
    }
  }

  /**
   * Set map style.
   * @param {object} value Value of select field ({ value: string, label: string }).
   */
  setMapStyle(value) {
    this.main.setMapStyle(value);
  }

  /**
   * Initialize handler for show paths field.
   */
  initShowPathsFieldHandler() {
    if (!this.showPathsFieldInstance) {
      this.showPathsFieldInstance = H5PEditor.findField('behaviour/showPaths', this.parent);
      this.showPathsFieldInstance?.changes.push(() => {
        this.togglePathVisibility(this.showPathsFieldInstance.value);
      });
    }

    if (this.showPathsFieldInstance) {
      this.togglePathVisibility(this.showPathsFieldInstance.value);
    }
  }

  /**
   * Set show paths.
   * @param {boolean} value Value of show paths field.
   */
  togglePathVisibility(value) {
    this.main.togglePathVisibility(value);
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.dom);
  }

  /**
   * Ready handler.
   * @param {function} ready Ready callback.
   */
  ready(ready) {
    if (!this.passReadies) {
      ready();
      return;
    }

    this.parent.ready(ready);
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.dom.remove();
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }
}
