import _ from 'underscore';
import {PolyUtil} from 'node-geometry-library';
import {
  User,
  ApiWrapper,
  Dimensions,
  DimensionsStorage,
  DimensionsModel,
  createSygicTruckAttrUrl
} from 'sygic-geotab-utils';

/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.sygic = function (api, state) {
  'use strict';

  let cachedUser = null;

  let geotabApi = ApiWrapper(api);

  (function () {
    // Date.prototype.format() - By Chris West - MIT Licensed
    let D = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(
      ','
    ),
      M =
        'January,February,March,April,May,June,July,August,September,October,November,December'.split(
          ','
        );
    Date.prototype.format = function (format) {
      let me = this;
      return format.replace(
        /a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g,
        function (str) {
          let c1 = str.charAt(0),
            ret =
              str == 'a'
                ? me.getHours() < 12
                  ? 'am'
                  : 'pm'
                : str == 'A'
                  ? me.getHours() < 12
                    ? 'AM'
                    : 'PM'
                  : str == 'Z'
                    ? ('+' + -me.getTimezoneOffset() / 60)
                      .replace(/^\D?(\D)/, '$1')
                      .replace(/^(.)(.)$/, '$10$2') + '00'
                    : c1 == 'S'
                      ? me.getMilliseconds()
                      : c1 == 's'
                        ? me.getSeconds()
                        : c1 == 'H'
                          ? me.getHours()
                          : c1 == 'h'
                            ? me.getHours() % 12 || 12
                            : c1 == 'D' && str.length > 2
                              ? D[me.getDay()].slice(0, str.length > 3 ? 9 : 3)
                              : c1 == 'D'
                                ? me.getDate()
                                : c1 == 'M' && str.length > 2
                                  ? M[me.getMonth()].slice(0, str.length > 3 ? 9 : 3)
                                  : c1 == 'm'
                                    ? me.getMinutes()
                                    : c1 == 'M'
                                      ? me.getMonth() + 1
                                      : ('' + me.getFullYear()).slice(-str.length);
          return c1 && str.length < 4 && ('' + ret).length < str.length
            ? ('00' + ret).slice(-str.length)
            : ret;
        }
      );
    };
    Date.prototype.toHoursMins = function () {
      return this.toTimeString().slice(0, 5);
    };
    Date.prototype.dateAdd = function (interval, units) {
      let ret = new Date(this); //don't change original date
      let checkRollover = function () {
        if (ret.getDate() != date.getDate()) ret.setDate(0);
      };
      switch (interval.toLowerCase()) {
        case 'year':
          ret.setFullYear(ret.getFullYear() + units);
          checkRollover();
          break;
        case 'quarter':
          ret.setMonth(ret.getMonth() + 3 * units);
          checkRollover();
          break;
        case 'month':
          ret.setMonth(ret.getMonth() + units);
          checkRollover();
          break;
        case 'week':
          ret.setDate(ret.getDate() + 7 * units);
          break;
        case 'day':
          ret.setDate(ret.getDate() + units);
          break;
        case 'hour':
          ret.setTime(ret.getTime() + units * 3600000);
          break;
        case 'minute':
          ret.setTime(ret.getTime() + units * 60000);
          break;
        case 'second':
          ret.setTime(ret.getTime() + units * 1000);
          break;
        default:
          ret = undefined;
          break;
      }
      return ret;
    };
    Date.prototype.addMinutes = function (minutes) {
      return this.dateAdd('minute', minutes);
    };
  })();

  let dimensionsFormTemplate = `
  <% for (const key in dimensions) { %>
    <% if (dimensions.hasOwnProperty(key)) { %>
      <%  let dimension_label = dimensions[key].label; %>
      <%  let value = dimensions[key].value; %>
      <%  let options = dimensions[key].options; %>
      <% if (options) { %>
        <div class='geotabField'>
          <label for='sygic-truck-dimensions-<%= key %>'> <%= dimension_label %>
            <select name='sygic-truck-dimensions-<%= key %>' style='float:right'>
              <% _.each(options, (option, key) => { %>
                <option value=<%= key %> <% if (value === key) { %> selected='selected' <% } %>  ><%= option %></option>
              <% }) %>                   
            </select>
           </label>
        </div>
      <% } else { %>
        <div class='geotabField'>
        <label for='sygic-truck-dimensions-<%= key %>' class='form-input'>
          <%= dimension_label %>
          <input type='number' step=0.1 name='sygic-truck-dimensions-<%= key %>' value='<%= value %>' class='form-input' />
        </label>
        </div>
      <% } %>
  <% }} %>
  
  <div data-name='hazmat-fields'>
    <% _.each(hazmats, hazmat => { %>
      <%  let name = 'sygic-truck-hazmat-' + hazmat.key; %>
    
      <div class='geotabField' <% if (!hazmat.visible) { %> hidden='hidden' <% } %>>
        <% if (hazmat.key === 'adr_tunnel') { %>
            <label for=<%= name %> ><%= hazmat.label %>
              <select name=<%= name %> style='float: right'>
                <option></option>
                <% _.each(hazmat.options, option => { %>
                  <option value=<%= option %> <% if (hazmat.value === option) { %> selected='selected' <% } %>  ><%= option %></option>
                <% }) %>                   
              </select>
            </label>
        <% } else { %>
            <label for=<%= name %> class='form-input'><%= hazmat.label %>
              <input type='checkbox' step=0.1 name=<%= name %> class='sygic-checkbox' <% if (hazmat.value) { %> checked <% } style="text-align:center; vertical-align:middle" %> />
            </label>
        <% } %>
      </div>
    <% }) %>
  </div>
  `;

  let dimensionsDataTemplate = `
  <% for (const key in dimensions) { %>
    <% if (dimensions.hasOwnProperty(key)) { %>
      <%  let dimension_label = dimensions[key].label; %>
      <%  let value = dimensions[key].value; %>
      <%  let options = dimensions[key].options; %>
      
      <tr><th><%= dimension_label %></th><td>
        <% if (options) { %>
         <%= options[value] %>
        <% } else { %>
          <%= value %>
        <% } %>
      </td></tr> 
  <% }} %>
  
  <% _.each(hazmats, hazmat => { %>
    <% if (hazmat.visible) { %>
      <% if (hazmat.key === 'adr_tunnel') { %>
        <tr><th><%= hazmat.label %></th><td><%=  hazmat.value %></td></tr> 
      <% } else { %>
        <tr><th><%= hazmat.label %></th><td> <% if (hazmat.value) { %>On<% } else { %>Off<% } %> </td></tr> 
      <% } %>
    <% } %>
  <% }) %>
  `;

  // the root container
  let elAddin = document.getElementById('sygic-app');

  function showDimensions(viewModel) {
    let summaryTemplate = _.template(dimensionsDataTemplate);
    let formTemplate = _.template(dimensionsFormTemplate);
    let summaryDimensionsTemplateObject = {};

    for (const key in viewModel) {
      const valueObject = viewModel[key];
      if (key === 'hazmat') {
        continue;
      }
      summaryDimensionsTemplateObject[key] = {
        value: valueObject.value,
        label: valueObject.label,
        options: valueObject.options,
      };
    }

    let hazmatTemplateObject = Object.keys(viewModel.hazmat.value).map(key => ({
      value: viewModel.hazmat.value[key].value,
      key: key,
      label: viewModel.hazmat.value[key].label,
      visible:  viewModel.hazmat.value[key].visible,
      options:  viewModel.hazmat.value[key].options,
    }));

    document.getElementById('sygic-dimensions-summary-content').innerHTML =
      summaryTemplate({dimensions: summaryDimensionsTemplateObject, hazmats: hazmatTemplateObject});
    document.getElementById('sygic-dimensions-form-content').innerHTML =
      formTemplate({dimensions: summaryDimensionsTemplateObject, hazmats: hazmatTemplateObject});
  }

  function toggleDimensionsBox() {
    document.getElementById('sygic-dimensions-form').classList.toggle('hidden');
    document
      .getElementById('sygic-dimensions-summary')
      .classList.toggle('hidden');
  }

  async function createSygicTruckNavigateToPointUri(lat, lon) {
    let baseUri = 'com.sygic.aura://';
    let navigationUri = `coordinate|${lon}|${lat}|drive`;

    let dimensionsInputs = Dimensions.getInputValues(elAddin);
    let user = await getUser();
    const dimensions = DimensionsModel.getFromStringInputs(dimensionsInputs, user.isMetric);
    let truckUri = createSygicTruckAttrUrl(dimensions);
    //docs: https://www.sygic.com/developers/professional-navigation-sdk/android/api-examples/custom-url
    //example: com.sygic.aura://coordinate|17.1224|48.1450|drive&&&truckSettings|wei=20000&axw=10000&len=14993&wid=2501&hei=3005&rou=tru

    let backUri = 'back_button|com.geotab.androidCheckmate';
    let uri = `${truckUri}&&&${navigationUri}&&&${backUri}`;
    return `${baseUri}${encodeURI(uri)}`
  }

  async function createSygicTruckNavigateToItineraryUri(zonePoints) {
    let waypointsPolyline = PolyUtil.encode(zonePoints);
    let dimensionsInputs = Dimensions.getInputValues(elAddin);
    let user = await getUser();
    const dimensions = DimensionsModel.getFromStringInputs(dimensionsInputs, user.isMetric);
    const truckSettingsUri = createSygicTruckAttrUrl(dimensions);

    let baseUri = 'com.sygic.aura://';
    let routeImportUri = `routeimport|${waypointsPolyline}|gwp`;
    let backButtonUri = 'back_button|com.geotab.androidCheckmate';

    let uri = `${truckSettingsUri}&&&${routeImportUri}&&&${backButtonUri}`;
    let encodedUri = `${baseUri}${encodeURI(uri)}`

    if (window.DEBUG) {
      console.log(encodedUri);
    }

    return encodedUri;
  }

  function resetView() {
    elAddin.querySelector('#sygic-vehicle').textContent = '-';
    show(document.getElementById('sygic-no-vehicle-warning'));
    hide(document.getElementById('sygic-dimensions-summary'));
    hide(document.getElementById('sygic-edit-dimensions'));
  }

  async function loadDevice(deviceId) {
    if (deviceId){
      let devices = await geotabApi.callAsync('Get', {
        typeName: 'Device',
        search: {
          id: deviceId,
        },
      });

      if (devices.length > 0) {
        let device = devices[0];
        if (device.id){
          elAddin.querySelector('#sygic-vehicle').textContent = device.name;
          show(document.getElementById('sygic-dimensions-summary'));
          hide(document.getElementById('sygic-no-vehicle-warning'));
          return device;
        }
      }
    }
    return null;
  }

  function formatStopDate(stopDateString) {
    let stopDate = new Date(stopDateString);
    return `${state.translate('at')} ${stopDate.format(
      'HH:mm'
    )} ${state.translate('on')} ${stopDate.format('DD.MM')}`;
  }

  async function loadTrips(deviceId) {

    function createElement(tag, options = {}, parent = null) {
      let el = document.createElement(tag);
      (options.classes || []).forEach((c) => {
        el.classList.add(c);
      });
      if (options.content) {
        el.appendChild(document.createTextNode(options.content));
      }
      if (options.style) {
        el.style = options.style;
      }
      if (parent) {
        parent.appendChild(el);
      }
      return el;
    }

    function calculateCenter(arr) {
      var x = arr.map(xy => xy[0]);
      var y = arr.map(xy => xy[1]);
      var cx = (Math.min(...x) + Math.max(...x)) / 2;
      var cy = (Math.min(...y) + Math.max(...y)) / 2;
      return [cx, cy];
    }

    const zoneCache = new Map();
    const routePointsCache = new Map();

    async function getZoneById(zoneId) {
      if (!zoneId) {
        return null;
      }
      if (zoneCache.has(zoneId)) {
        return zoneCache.get(zoneId);
      }
      let results = await geotabApi.callAsync('Get', {
        typeName: 'Zone',
        search: {
          id: zoneId,
        },
      });
      let zone = results && results[0] ? results[0] : null;
      zoneCache.set(zoneId, zone);
      return zone;
    }

    async function getRouteZonePoints(route) {
      if (!route || !route.id) {
        return [];
      }
      if (routePointsCache.has(route.id)) {
        return routePointsCache.get(route.id);
      }
      let zonePoints = [];
      for (let index = 0; index < route.routePlanItemCollection.length; index++) {
        const stop = route.routePlanItemCollection[index];
        if (!stop.zone || !stop.zone.id) {
          continue;
        }
        let zone = await getZoneById(stop.zone.id);
        if (!zone || !zone.points || zone.points.length === 0) {
          continue;
        }
        let pts = zone.points.map(p => [p.y, p.x]);
        let center = calculateCenter(pts);
        zonePoints.push({ lat: center[0], lng: center[1] });
      }
      routePointsCache.set(route.id, zonePoints);
      return zonePoints;
    }

    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let myRoutes = await geotabApi.callAsync('Get', {
      typeName: 'Route',
      search: {
        routeType: 'Plan',
        fromDate: today.toISOString(),
        deviceSearch: {
          id: deviceId,
        },
      },
    });

    let tripsContainer = elAddin.querySelector('#sygic-my-trips');
    tripsContainer.innerHTML = '';

    myRoutes.forEach((route) => {

      //TODO: Route-Plan search not respecting fromDate parameter!
      if (route.startTime) {
        var routeStartTime = new Date(route.startTime);
        if (routeStartTime < today)
          return;
      }

      let routeListItem = createElement(
        'li',
        {
          classes: ['menu-list__item'],
        },
        tripsContainer
      );

      let container = createElement(
        'div',
        {
          style: 'flex-direction: column;',
        },
        routeListItem
      );

      let headerRow = createElement(
        'div',
        {
          classes: ['route-header'],
        },
        container
      );

      createElement(
        'div',
        {
          content: route.name,
        },
        headerRow
      );

      let quickOpenButton = createElement(
        'button',
        {
          content: state.translate('Open itinerary'),
          classes: ['route-open-button'],
        },
        headerRow
      );
      quickOpenButton.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        quickOpenButton.setAttribute('disabled', 'disabled');
        quickOpenButton.classList.add('route-open-button--loading');
        try {
          let zonePoints = await getRouteZonePoints(route);
          let location = await createSygicTruckNavigateToItineraryUri(zonePoints);
          window.open(location, '_system');
        } finally {
          quickOpenButton.classList.remove('route-open-button--loading');
          quickOpenButton.removeAttribute('disabled');
        }
      });

      let firstStop = route.routePlanItemCollection[0];

      createElement(
        'div',
        {
          content: `${route.routePlanItemCollection.length} ${route.routePlanItemCollection.length == 1
            ? state.translate('stop')
            : state.translate('stops')
            }, ${state.translate('first stop')} ${formatStopDate(
              firstStop.activeFrom
            )}`,
          classes: ['caption'],
        },
        container
      );

      let tableHolder = createElement(
        'div',
        {
          classes: ['hidden']
        },
        container
      )



      routeListItem.addEventListener('click', async (event) => {
        event.preventDefault();

        let table = createElement(
          'table',
          {
            classes: ['route-table'],
          },
          tableHolder
        );

        if (tableHolder.classList.contains('hidden')) {
          let zonePoints = [];
          for (
            let index = 0;
            index < route.routePlanItemCollection.length;
            index++
          ) {
            const stop = route.routePlanItemCollection[index];
            let zone = await getZoneById(stop.zone && stop.zone.id);
            if (!zone) {
              continue;
            }
            let tr = createElement('tr', {}, table);
            tr.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
            });
            let td = createElement('td', {}, tr);
            let a = createElement(
              'a',
              {
                content: `${index + 1}. ${zone.name}`,
              },
              td
            );

            createElement(
              'div',
              {
                content: `${formatStopDate(stop.activeFrom)}`,
                classes: ['caption'],
              },
              td
            );

            let pts = zone.points.map(p => [p.y, p.x]);
            let center = calculateCenter(pts);

            let lat = center[0];
            let lng = center[1];
            zonePoints.push({ lat, lng });

            a.setAttribute('href', '#');
            a.addEventListener('click', async (event) => {
              event.preventDefault();
              let location = await createSygicTruckNavigateToPointUri(lat, lng);
              window.open(location, '_system');
            });
          }

          let itineraryOpenLink = createElement('button', {
            content: state.translate('Open itinerary')
          }, tableHolder);
          itineraryOpenLink.setAttribute('href', '#');
          itineraryOpenLink.addEventListener('click', async (event) => {
            event.preventDefault();
            let cachedPoints = routePointsCache.get(route.id) || zonePoints;
            if (!routePointsCache.has(route.id)) {
              routePointsCache.set(route.id, zonePoints);
            }
            let location = await createSygicTruckNavigateToItineraryUri(cachedPoints);
            window.open(location, '_system');
          });

        } else {
          tableHolder.innerHTML = '';
        }
        tableHolder.classList.toggle('hidden');
      });
    });
  }

  async function loadDimensions(deviceId, isMetric) {
    const storage = new DimensionsStorage(geotabApi);
    const myDimensions = await storage.getDimensionsModelAsync(deviceId);
    if (!myDimensions) {
      showDimensions(DimensionsModel.getEmptyViewModel(isMetric, state));
    } else {
      showDimensions(myDimensions.dimensions.getViewModelWithUnits(isMetric, state));
    }

    return myDimensions;
  }

  async function getUser() {
    if (!cachedUser) {
      const session = await geotabApi.getSessionAsync();
      const geotabUser = await geotabApi.callAsync('Get', {
        typeName: 'User',
        search: {
          name: session.userName,
        },
      });

      const geotabClearances = await geotabApi.callAsync('Get', {
        typeName: 'Group',
        search: {
          id: 'groupSecurityId',
        },
      });
      cachedUser = new User(geotabUser[0], geotabClearances);
    }
    return cachedUser;
  }


  async function saveDimensions(deviceId, isMetric) {
    const storage = new DimensionsStorage(geotabApi);
    const dimensionsInputs = Dimensions.getInputValues(elAddin);
    const myDimensions = await storage.getDimensionsModelAsync(deviceId);
    const dimensionsModel = DimensionsModel.getFromStringInputs(dimensionsInputs, isMetric);

    if (myDimensions) {
      try {
        await storage.setDimensionsAsync(
          dimensionsModel,
          myDimensions.id,
          deviceId
        );
      } catch (e) {
        //don't know what is going on there, but there is an error when updating
      }
    } else {
      await storage.addDimensionsAsync(
        dimensionsModel,
        deviceId
      );
    }
    await loadDimensions(deviceId, isMetric);
    toggleDimensionsBox();
  }

  function show(el) {
    if (el.classList.contains('hidden')) {
      el.classList.toggle('hidden');
    }
  }

  function hide(el) {
    if (!el.classList.contains('hidden')) {
      el.classList.toggle('hidden');
    }
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

      let addonUser = await getUser();

      document
        .getElementById('sygic-edit-dimensions')
        .addEventListener('click', (event) => {
          event.preventDefault();
          toggleDimensionsBox();
        });

      document
        .getElementById('sygic-save-dimensions')
        .addEventListener('click', async function (event) {
          event.preventDefault();
          await saveDimensions(freshState.device.id, addonUser.isMetric);
        });

      document
        .getElementById('sygic-update-maps')
        .addEventListener('click', async function (event) {
          event.preventDefault();
          let location = 'com.sygic.aura://update|all';
          window.open(location, '_system');
        });

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

      resetView();

      let addonUser = await getUser();

      let deviceId = freshState.device.id;
      if (window.DEBUG) {
        window.sygic = {
          freshState,
          DimensionsStorage,
          geotabApi,
          addonUser
        }
      }

      // addonUser.canViewPlans = false;
      // addonUser.canView = false;
      // addonUser.isMetric = false;

      //hide editing functionality if no device is selected
      // deviceId = null;
      await loadDevice(deviceId);

      if (addonUser.canViewPlans) {
        await loadTrips(deviceId);
      }

      if (addonUser.canModify) {
        show(document.getElementById('sygic-edit-dimensions'));
      }

      if (addonUser.canView) {
        let dimensions = await loadDimensions(deviceId, addonUser.isMetric);
        if (window.DEBUG) {
          window.sygic.dimensions = dimensions;
        }
      }

      if (addonUser.canViewPlans === false) {
        show(document.getElementById('sygic-cannot-view-plans-warning'));
      }

      if (addonUser.canView === false) {
        show(document.getElementById('sygic-cannot-view-vehicles-warning'));
        hide(document.getElementById('sygic-no-vehicle-warning'))
      }

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
