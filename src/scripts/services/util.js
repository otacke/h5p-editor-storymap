/**
 * Signal mouse usage.
 * @param {HTMLElement} domElement DOM Element to signal mouse usage on.
 */
export const signalMouseUsage = (domElement) => {
  if (!(domElement instanceof HTMLElement)) {
    return;
  }

  domElement.classList.add('using-mouse');
  ['mousedown', 'keydown', 'keyup'].forEach((eventName) => {
    domElement.addEventListener(eventName, (event) => {
      domElement.classList.toggle('using-mouse', event.type === 'mousedown');
    });
  });
};

/** Class for utility functions */
export default class Util {
  /**
   * Add mixins to a class, useful for splitting files.
   * @param {object} [master] Master class to add mixins to.
   * @param {object[]|object} [mixins] Mixins to be added to master.
   */
  static addMixins(master = {}, mixins = []) {
    if (!master.prototype) {
      return;
    }

    if (!Array.isArray(mixins)) {
      mixins = [mixins];
    }

    const masterPrototype = master.prototype;

    mixins.forEach((mixin) => {
      const mixinPrototype = mixin.prototype;
      Object.getOwnPropertyNames(mixinPrototype).forEach((property) => {
        if (property === 'constructor') {
          return; // Don't need constructor
        }

        if (Object.getOwnPropertyNames(masterPrototype).includes(property)) {
          return; // property already present, do not override
        }

        masterPrototype[property] = mixinPrototype[property];
      });
    });
  }

  /**
   * Call callback function once dom element gets visible in viewport.
   * @async
   * @param {HTMLElement} dom DOM element to wait for.
   * @param {function} callback Function to call once DOM element is visible.
   * @param {object} [options] IntersectionObserver options.
   * @returns {IntersectionObserver} Promise for IntersectionObserver.
   */
  static async callOnceVisible(dom, callback, options = {}) {
    if (typeof dom !== 'object' || typeof callback !== 'function') {
      return; // Invalid arguments
    }

    options.threshold = options.threshold || 0;

    return await new Promise((resolve) => {
      // iOS is behind ... Again ...
      const idleCallback = window.requestIdleCallback ?? window.requestAnimationFrame;
      idleCallback(() => {
        // Get started once visible and ready
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.unobserve(dom);
            observer.disconnect();

            callback();
          }
        }, {
          ...(options.root && { root: options.root }),
          threshold: options.threshold,
        });
        observer.observe(dom);

        resolve(observer);
      });
    });
  }

  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Swap two DOM elements.
   * @param {HTMLElement} element1 Element 1.
   * @param {HTMLElement} element2 Element 2.
   */
  static swapDOMElements(element1, element2) {
    const parent1 = element1.parentNode;
    const parent2 = element2.parentNode;

    if (!parent1 || !parent2) {
      return;
    }

    const replacement1 = document.createElement('div');
    const replacement2 = document.createElement('div');

    parent1.replaceChild(replacement1, element1);
    parent2.replaceChild(replacement2, element2);
    parent1.replaceChild(element2, replacement1);
    parent2.replaceChild(element1, replacement2);
  }
}
