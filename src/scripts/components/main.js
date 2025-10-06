import Board from '@components/board/board.js';
import Dialog from '@components/dialog/dialog.js';
import Util from '@services/util.js';

import PreviewOverlay from '@components/preview/preview-overlay.js';
import Readspeaker from '@services/readspeaker.js';

import './main.scss';

export default class Main {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} params.dictionary Dictionary service.
   * @param {object} params.globals Globals service.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onChanged Called when something has changed.
   * @param {function} callbacks.getPreviewParams Called to get the parameters for the preview.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;
    this.callbacks = Util.extend({
      onChanged: () => {},
      getPreviewParams: () => {}
    }, callbacks);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-storymap-main');

    // Board
    this.board = new Board(
      this.params,
      {
        onChanged: (values) => {
          this.callbacks.onChanged(values);
        },
        showFormDialog: (params) => {
          this.dialog.showForm(params);
        },
        togglePreview: () => {
          this.openPreview();
        }
      }
    );
    this.dom.append(this.board.getDOM());

    // Dialog
    this.dialog = new Dialog({
      dictionary: this.params.dictionary,
      globals: this.params.globals
    });
    this.dom.appendChild(this.dialog.getDOM());

    // Preview overlay
    this.previewOverlay = new PreviewOverlay(
      {
        dictionary: this.params.dictionary,
        globals: this.params.globals
      },
      {
        onDone: () => {
          this.closePreview();
        }
      }
    );
    this.dom.append(this.previewOverlay.getDOM());
  }

  /**
   * Open preview.
   */
  openPreview() {
    this.createPreviewInstance();
    if (!this.previewInstance) {
      return;
    }

    this.previewOverlay.show();
    this.previewOverlay.attachInstance(this.previewInstance);
    this.previewInstance.invalidateMap();

    Readspeaker.read(this.params.dictionary.get('a11y.previewOpened'));
  }

  /**
   * Create preview instance.
   */
  createPreviewInstance() {
    const libraryUberName = Object.keys(H5PEditor.libraryLoaded)
      .find((library) => library.split(' ')[0] === 'H5P.StoryMap');

    const contentId = H5PEditor.contentId;
    this.previewInstance = H5P.newRunnable(
      {
        library: libraryUberName,
        params: window.structuredClone(this.callbacks.getPreviewParams()),
      },
      contentId,
      undefined,
      undefined,
      { metadata: { title: this.contentTitle } }
    );

    if (!this.previewInstance) {
      return;
    }
  }

  /**
   * Close preview.
   */
  closePreview() {
    this.previewInstance.resetTask();
    this.previewInstance = null;
    this.previewOverlay.decloak();
    this.previewOverlay.hide();

    Readspeaker.read(this.params.dictionary.get('a11y.previewClosed'));
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Handle document mouse down event.
   * @param {MouseEvent} event Mouse down event.
   */
  handleDocumentMouseDown(event) {
    this.board.handleDocumentMouseDown(event);
  }

  /**
   * Resize board
   */
  resize() {
    this.board.resize();
  }

  /**
   * Set style of the map.
   * @param {object} value The style parameters ({ value: string, label: string }).
   */
  setMapStyle(value) {
    this.board.setMapStyle(value);
  }

  /**
   * Set whether to show paths on the map.
   * @param {boolean} value Whether to show paths or not.
   */
  togglePathVisibility(value) {
    this.board.togglePathVisibility(value);
  }
}
