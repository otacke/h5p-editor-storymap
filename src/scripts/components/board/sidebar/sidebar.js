import Util from '@services/util.js';

import './sidebar.scss';

export default class Sidebar {

  /**
   * @class
   * @param {object} params Parameters.
   */
  constructor(params = { subComponents: [] }) {
    this.params = Util.extend({}, params);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-editor-storymap-sidebar');

    this.subComponentHeaders = [];

    this.chooser = document.createElement('div');
    this.chooser.classList.add('subcomponent-header');
    this.dom.appendChild(this.chooser);

    this.dom.style.setProperty('--number-of-elements', this.params.subComponents.length);

    this.params.subComponents.forEach((subComponent, index) => {
      const subComponentHeader = document.createElement('div');
      subComponentHeader.classList.add('subcomponent-header-text');
      subComponentHeader.textContent = subComponent.getTitle();
      this.chooser.append(subComponentHeader);

      this.subComponentHeaders.push(subComponentHeader);
      this.dom.appendChild(subComponent.getDOM());
    });

    this.activate(0);
  }

  /**
   * Activate subcomponent incl. button.
   * @param {number} index Index of subcomponent to activate.
   */
  activate(index) {
    this.params.subComponents.forEach((subComponent, i) => {
      if (i === index) {
        subComponent.show();
      }
      else {
        subComponent.hide();
      }
    });

    this.subComponentHeaders.forEach((button, i) => {
      button.classList.toggle('active', i === index);
    });
  }

  /**
   * Get DOM element.
   * @returns {HTMLElement} DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Hide sidebar.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Resize.
   */
  resize() {
    const rect = this.chooser.getBoundingClientRect();
    this.dom.style.setProperty('--chooserHeight', `${rect.height}px`);
  }

  /**
   * Show sidebar.
   */
  show() {
    this.dom.classList.remove('display-none');
  }
}
