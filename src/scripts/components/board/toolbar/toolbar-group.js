import Util from '@services/util.js';
import ToolbarButton from './toolbar-button.js';
import './toolbar-group.scss';

export default class ToolbarGroup {

  /**
   * @class
   * @param {object} params Parameters.
   * @param {string} [params.className] Additional class names.
   * @param {object} [params.a11y] Accessibility options.
   * @param {string} [params.ariaControlsId] ID of the element controlled by the toolbar.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.onKeydown Key down callback.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      buttons: [],
      a11y: {},
    }, params);

    this.callbacks = Util.extend({
      onKeydown: () => {},
    }, callbacks);

    this.buttons = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-storymap-toolbar-group');
    if (this.params.position) {
      this.dom.classList.add(`position-${this.params.position}`);
    }

    this.dom.setAttribute('role', 'toolbar');
    if (params.className) {
      this.dom.classList.add(params.className);
    }
    if (params.a11y.toolbarLabel) {
      this.dom.setAttribute('aria-label', params.a11y.toolbarLabel);
    }
    if (params.ariaControlsId) {
      this.dom.setAttribute('aria-controls', params.ariaControlsId);
    }

    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });

    if (this.params.buttons.length) {
      this.params.buttons.forEach((button) => {
        this.addButton(button);
      });
    }

    // Make first button active one
    Object.values(this.buttons).forEach((button, index) => {
      button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    this.currentButtonIndex = 0;
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
      this.moveButtonFocus(-1);
    }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
      this.moveButtonFocus(1);
    }
    else if (event.code === 'Home') {
      this.moveButtonFocus(0 - this.currentButtonIndex);
    }
    else if (event.code === 'End') {
      this.moveButtonFocus(
        Object.keys(this.buttons).length - 1 - this.currentButtonIndex,
      );
    }
    else {
      return;
    }

    event.preventDefault();
  }

  /**
   * Move button focus.
   * @param {number} offset Offset to move position by.
   */
  moveButtonFocus(offset) {
    if (typeof offset !== 'number') {
      return;
    }

    if (
      this.currentButtonIndex + offset < 0 ||
      this.currentButtonIndex + offset > Object.keys(this.buttons).length - 1
    ) {
      return; // Don't cycle
    }

    Object.values(this.buttons)[this.currentButtonIndex]
      .setAttribute('tabindex', '-1');
    this.currentButtonIndex = this.currentButtonIndex + offset;
    const focusButton = Object.values(this.buttons)[this.currentButtonIndex];
    focusButton.setAttribute('tabindex', '0');
    focusButton.focus();
  }

  /**
   * Add button.
   * @param {object} [button] Button parameters.
   */
  addButton(button = {}) {
    if (typeof button.id !== 'string') {
      return; // We need an id at least
    }

    this.buttons[button.id] = new ToolbarButton(
      {
        id: button.id,
        ...(button.a11y && { a11y: button.a11y }),
        classes: ['toolbar-button', `toolbar-button-${button.id}`],
        ...(typeof button.disabled === 'boolean' && {
          disabled: button.disabled,
        }),
        ...(button.keyshortcuts && { keyshortcuts: button.keyshortcuts }),
        ...(button.tooltip && { tooltip: button.tooltip }),
        ...(button.active && { active: button.active }),
        ...(button.type && { type: button.type }),
        ...(button.pulseStates && { pulseStates: button.pulseStates }),
        ...(button.pulseIndex && { pulseIndex: button.pulseIndex }),
      },
      {
        ...(typeof button.onClick === 'function' && {
          onClick: (event, params) => {
            button.onClick(event, params);
          },
        }),
      },
    );

    this.dom.append(this.buttons[button.id].getDOM());
  }

  /**
   * Disable.
   */
  disable() {
    for (const id in this.buttons) {
      this.disableButton(id);
    }
  }

  /**
   * Disable button.
   * @param {string} id Button id.
   */
  disableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].disable();
  }

  /**
   * Enable.
   */
  enable() {
    for (const id in this.buttons) {
      this.enableButton(id);
    }
  }

  /**
   * Enable button.
   * @param {string} id Button id.
   */
  enableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].enable();
  }

  /**
   * Focus whatever should get focus.
   */
  focus() {
    Object.values(this.buttons)[this.currentButtonIndex]?.focus();
  }

  /**
   * Focus a button.
   * @param {string} id Button id.
   */
  focusButton(id = '') {
    if (!this.buttons[id] || this.buttons[id].isCloaked()) {
      return; // Button not available
    }

    this.buttons[id].focus();
  }

  /**
   * Force button state.
   * @param {string} id ID
   * @param {boolean} active Active state
   * @param {object} options Options
   */
  forceButton(id = '', active, options) {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].force(active, options);
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
    this.dom.classList.add('display-none');
  }

  /**
   * Hide button.
   * @param {string} id Button id.
   */
  hideButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].hide();
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Show button.
   * @param {string} id Button id.
   */
  showButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].show();
  }
}
