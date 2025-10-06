

/**
 * Get uber name of library.
 * @param {string} machineName Machine name of library (e.g. H5P.Foobar).
 * @returns {string} Uber name of a StoryMap library (e.g. H5P.Foobar 1.4).
 */
export const getUberName = (machineName = '') => {
  return Object
    .keys(H5PEditor.libraryLoaded)
    .find((library) => library.split(' ')[0] === machineName);
};

/**
 * Check if the user is using a mouse.
 * @param {string} [selector] The selector to check for the using-mouse class.
 * @param {Document} [baseDocument] The document to check.
 * @returns {boolean|undefined} Undefined if cannot be determined, True if the user is using a mouse, false otherwise.
 */
export const isUsingMouse = (selector = '.h5p-content', baseDocument) => {
  return (baseDocument ?? document).querySelector(selector)?.classList.contains('using-mouse');
};
