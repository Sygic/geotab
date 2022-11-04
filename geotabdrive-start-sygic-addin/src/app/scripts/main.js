/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.sygic = function (api, state) {
  'use strict';

  // the root container
  let elAddin = document.getElementById('sygic-app');

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

      if (window.DEBUG){
        console.log('initialize', arguments);
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
      
      if (window.DEBUG){
        console.log('focus', arguments);
      }
      
      if (window.DEBUG){
        window.sygic = {
          freshState,
          DimensionsStorage,
          geotabApi
        }
      }

            // window.open('com.sygic.aura://', '_system');
      window.open('https://www.google.com', '_system');
      
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

      if (window.DEBUG){
        console.log('blur', arguments);
      }
    },
  };
};
