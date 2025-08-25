

/**
 * Get uber name of library.
 * @param {string} machineName Machine name of library (e.g. H5P.Foobar).
 * @returns {string} Uber name of Storymap library (e.g. H5P.Foobar 1.4).
 */
export const getUberName = (machineName = '') => {
  return Object
    .keys(H5PEditor.libraryLoaded)
    .find((library) => library.split(' ')[0] === machineName);
};
