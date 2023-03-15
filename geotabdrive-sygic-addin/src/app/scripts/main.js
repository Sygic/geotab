import _ from 'underscore';
import {
  User,
  ApiWrapper,
  Dimensions,
  DimensionsStorage,
  DimensionsModel
} from 'sygic-geotab-utils';
/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.sygic = function (api, state) {
  'use strict';

  const noDeviceId = 'NoDeviceId';
  let cachedUser = null;
  let addonDeviceId = undefined;
  let addonUser = undefined;

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
  <% for (const key in obj) { %>
    <% if (obj.hasOwnProperty(key)) { %>
      <%  let dimension_label = obj[key].label; %>
      <%  let value = obj[key].value; %>
      <label for='sygic-truck-<%= key %>' class='form-input'>
      <%= dimension_label %>
      <input type='number' name='sygic-truck-<%= key %>' value='<%= value %>' class='form-input' />
      </label>
  <% }} %>
  `;
  let dimensionsDataTemplate = `
  <% for (const key in obj) { %>
    <% if (obj.hasOwnProperty(key)) { %>
      <%  let dimension_label = obj[key].label; %>
      <%  let value = obj[key].value; %>
    <tr><th><%= dimension_label %></th><td><%= value %></td></tr> 
  <% }} %>
  `;

  // the root container
  let elAddin = document.getElementById('sygic-app');

  function showDimensions(viewModel) {
    let summaryTemplate = _.template(dimensionsDataTemplate);
    let formTemplate = _.template(dimensionsFormTemplate);
    let summaryTemplateObject = {};

    for (const key in viewModel) {
      const valueObject = viewModel[key];
      summaryTemplateObject[key] = {
        value: valueObject.value,
        label: valueObject.label,
      };
    }

    document.getElementById('sygic-dimensions-summary-content').innerHTML =
      summaryTemplate(summaryTemplateObject);
    document.getElementById('sygic-dimensions-form-content').innerHTML =
      formTemplate(summaryTemplateObject);
  }

  function toggleDimensionsBox() {
    document.getElementById('sygic-dimensions-form').classList.toggle('hidden');
    document
      .getElementById('sygic-dimensions-summary')
      .classList.toggle('hidden');
  }

  function createSygicTruckNavigateToPointUri(lat, lon) {
    let baseUri = `com.sygic.aura://coordinate|${lon}|${lat}|drive`;
    let truckUri = createSygicTruckAttrUrl();
    //docs: https://www.sygic.com/developers/professional-navigation-sdk/android/api-examples/custom-url
    //example: com.sygic.aura://coordinate|17.1224|48.1450|drive&&&truckSettings|wei=20000&axw=10000&len=14993&wid=2501&hei=3005&rou=tru

    let backUri = '&&&back_button|com.geotab.androidCheckmate';
    let uri = `${baseUri}${truckUri}${backUri}`;
    return uri;
  }

  function createSygicTruckNavigateToItineraryUri(zonePoints) {
    let routeImport = {
      version: '3.1',
      directives: {
        vehicleType: 'truck',
        routeComputeType: 'truck',
      },
      vehicleRestrictions: {},
      routeParts: []
    };

    for (let index = 0; index < zonePoints.length - 1; index++) {
      const fromPoint = zonePoints[index];
      const toPoint = zonePoints[index + 1];
      const toWaypointType = index + 1 == zonePoints.length - 1 ? 'finish' : 'via';
      routeImport.routeParts.push({
        waypointFrom: {
          lat: fromPoint.lat,
          lon: fromPoint.lon,
          type: 'via'
        },
        waypointTo: {
          lat: toPoint.lat,
          lon: toPoint.lon,
          type: toWaypointType
        }
      })
    }

    let dimensions = Dimensions.getInputValues(elAddin);
    if (dimensions.total_weight) {
      routeImport.vehicleRestrictions.weight = dimensions.total_weight;
    }
    if (dimensions.axle_weight) {
      //TODO: co tu?
    }
    if (dimensions.total_length) {
      routeImport.vehicleRestrictions.totalLength = dimensions.total_length;
    }
    if (dimensions.width) {
      routeImport.vehicleRestrictions.width = dimensions.width;
    }
    if (dimensions.height) {
      routeImport.vehicleRestrictions.height = dimensions.height;
    }

    if (window.DEBUG) {
      console.log(routeImport);
    }

    let baseUri = `com.sygic.aura://routeimport|${encodeURIComponent(JSON.stringify(routeImport))}|sif`;
    // let backUri = '&&&back_button|com.geotab.androidCheckmate'; //TODO: nefunguje
    let backUri = '';
    // let truckUri = createSygicTruckAttrUrl();
    let truckUri = '';

    let uri = `${baseUri}${truckUri}${backUri}`;

    if (window.DEBUG) {
      console.log(uri);
    }

    return uri;
  }

  function createSygicTruckAttrUrl() {
    let uri = '';
    let dimensions = Dimensions.getInputValues(elAddin);
    let valueArray = [];
    if (dimensions.total_weight) {
      valueArray.push(`wei=${dimensions.total_weight}`);
    }
    if (dimensions.axle_weight) {
      valueArray.push(`axw=${dimensions.axle_weight}`);
    }
    if (dimensions.total_length) {
      valueArray.push(`len=${dimensions.total_length}`);
    }
    if (dimensions.width) {
      valueArray.push(`wid=${dimensions.width}`);
    }
    if (dimensions.height) {
      valueArray.push(`hei=${dimensions.height}`);
    }

    if (valueArray.length > 0) {
      uri = `&&&truckSettings|${valueArray.join('&')}&rou=tru`;
    }
    return uri;
  }

  function resetView() {
    elAddin.querySelector('#sygic-vehicle').textContent = '-';
    show(document.getElementById('sygic-no-vehicle-warning'));
    hide(document.getElementById('sygic-dimensions-summary'));
    hide(document.getElementById('sygic-edit-dimensions'));
  }

  async function loadDevice(deviceId) {
    if (deviceId !== noDeviceId) {
      let devices = await geotabApi.callAsync('Get', {
        typeName: 'Device',
        search: {
          id: deviceId,
        },
      });

      let device = devices[0];
      elAddin.querySelector('#sygic-vehicle').textContent = device.name;
      return device;
    }
  }

  function formatStopDate(stopDateString) {
    let stopDate = new Date(stopDateString);
    return `${state.translate('at')} ${stopDate.format(
      'HH:mm'
    )} ${state.translate('on')} ${stopDate.format('DD.MM')}`;
  }

  async function loadTrips(device) {

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

    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let myRoutes = await geotabApi.callAsync('Get', {
      typeName: 'Route',
      search: {
        routeType: 'Plan',
        fromDate: today.toISOString(),
        deviceSearch: {
          id: device.id,
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

      createElement(
        'div',
        {
          content: route.name,
        },
        container
      );

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
            let results = await geotabApi.callAsync('Get', {
              typeName: 'Zone',
              search: {
                id: stop.zone.id,
              },
            });
            let zone = results[0];
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
            let lon = center[1];
            zonePoints.push({ lat, lon })

            a.setAttribute('href', '#');
            a.addEventListener('click', (event) => {
              event.preventDefault();
              let location = createSygicTruckNavigateToPointUri(lat, lon);
              window.open(location, '_system');
            });
          }

          let itineraryOpenLink = createElement('button', {
            content: state.translate('Open itinerary')
          }, tableHolder);
          itineraryOpenLink.setAttribute('href', '#');
          itineraryOpenLink.addEventListener('click', (event) => {
            event.preventDefault();
            let location = createSygicTruckNavigateToItineraryUri(zonePoints);
            window.open(location, '_system');
          });

        } else {
          tableHolder.innerHTML = '';
        }
        tableHolder.classList.toggle('hidden');
      });
    });
  }

  async function loadDimensions(deviceId) {
    const storage = new DimensionsStorage(geotabApi);
    const myDimensions = await storage.getDimensionsModelAsync(deviceId);
    if (!myDimensions) {
      showDimensions(DimensionsModel.getEmpty(addonUser.isMetric, state));
    } else {
      showDimensions(myDimensions.dimensions.getViewModel(addonUser.isMetric, state));
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


  async function saveDimensions(deviceId) {
    const storage = new DimensionsStorage(geotabApi);
    const dimensionsInputs = Dimensions.getInputValues(elAddin);
    const myDimensions = await storage.getDimensionsModelAsync(deviceId);
    const dimensionsModel = DimensionsModel.getFromStringInputs(dimensionsInputs, addonUser.isMetric);

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
    await loadDimensions(deviceId);
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
          await saveDimensions(addonDeviceId);
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

      addonUser = await getUser();

      let deviceId = freshState.device.id;
      if (window.DEBUG) {
        window.sygic = {
          freshState,
          DimensionsStorage,
          geotabApi,
          addonUser
        }
      }

      addonDeviceId = deviceId;
      // deviceId = noDeviceId;
      // addonUser.canViewPlans = false;
      // addonUser.canView = false;
      // addonUser.isMetric = false;

      //hide editing functionality if no device is selected
      if (deviceId !== noDeviceId) {
        let device = await loadDevice(deviceId);

        if (addonUser.canViewPlans) {
          await loadTrips(device);
        }

        let dimensions = await loadDimensions(deviceId);

        if (addonUser.canModify) {
          show(document.getElementById('sygic-edit-dimensions'));
        }

        if (window.DEBUG) {
          window.sygic.dimensions = dimensions;
        }

        show(document.getElementById('sygic-dimensions-summary'));
        hide(document.getElementById('sygic-no-vehicle-warning'));
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
