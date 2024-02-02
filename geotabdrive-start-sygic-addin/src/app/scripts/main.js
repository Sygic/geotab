import {
  ApiWrapper,
  DimensionsStorage,
  createSygicTruckAttrUrl
} from 'sygic-geotab-utils';

/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.sygic = function (api, state) {
  'use strict';

  // the root container
  let elAddin = document.getElementById('start-sygic-app');

  let truckSettingsUrl = '';
  let sygicAppBaseUri = 'com.sygic.aura://'

  let geotabApi = ApiWrapper(api);

  async function loadDimensions(deviceId) {
    const storage = new DimensionsStorage(geotabApi);
    const myDimensions = await storage.getDimensionsModelAsync(deviceId);
    if (myDimensions) {
      return myDimensions.dimensions;
    }
    return undefined;
  }

  return {
    /**
     * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
     * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
     * is ready for the user.
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
     *        might be doing asynchronous operations, you must call this method when the Add-In is ready
     *        for display to the user.
     */
    initialize: async function (freshApi, freshState, initializeCallback) {
      // Loading translations if available
      if (freshState.translate) {
        freshState.translate(elAddin || '');
      }

      if (window.DEBUG) {
        console.log('initialize', arguments);
      }

      const dimensions = await loadDimensions(freshState.device.id);
      if (dimensions) {
        truckSettingsUrl = createSygicTruckAttrUrl(dimensions);
        let uriElem = document.getElementById('start-sygic-app-uri');
        const backButtonUrl = 'back_button|com.geotab.androidCheckmate';
        uriElem.href = `${sygicAppBaseUri}${truckSettingsUrl}&&&${backButtonUrl}`;
      }

      // MUST call initializeCallback when done any setup
      initializeCallback();
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     *
     * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
     * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
     * the global state of the MyGeotab application changes, for example, if the user changes the global group
     * filter in the UI.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    focus: async function (freshApi, freshState) {
      if (window.DEBUG) {
        console.log('focus', arguments);
      }

      if (window.DEBUG) {
        window.sygic = {
          freshState,
          geotabApi
        }
      }

      window.open(`${sygicAppBaseUri}${truckSettingsUrl}`, '_system');

      //show main content
      elAddin.className = elAddin.className.replace('hidden', '').trim();
    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     *
     * Use this function to save the page state or commit changes to a data store or release memory.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    blur: function () {
      // hide main content
      elAddin.className += ' hidden';

      if (window.DEBUG) {
        console.log('blur', arguments);
      }
    },
  };
};
