import _ from 'underscore';
import {
  User,
  ApiWrapper,
  Dimensions,
  DimensionsStorage,
  DimensionsModel,
} from 'sygic-geotab-utils';

/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.mygeotabSygicPage = function (api, state) {
  'use strict';
  const addinDataGuid = 'ajk3ZmUzNmQtYjNlYS0yMGI';

  // the root container
  var elAddin = document.getElementById('mygeotabSygicPage');
  let templateString = `
  <li class='<%= user.canView ? '' : ' hidden' %>'>
  <div class='g-col checkmateListBuilderRow sygic-vehicle' style='padding-left: 0px'>
    <input type='hidden' class='sygic-vehicle-id' value=<%= vehicle.id %>>
    <div class='g-row'>
        <div class='g-main g-main-col g-main_wider'>
          <div class='g-name'>
            <span class='ellipsis'><%= vehicle.name %></span>
          </div>
          <div class='g-comment'>
            <div class='secondaryData ellipsis'><%= vehicle_groups_string %></div>
          </div>
          <div class='g-comment vehicle-dimensions-comment'>
            <div class='secondaryData ellipsis'><%= vehicle_dimensions_string %></div>
          </div>
        </div>
      <div class='g-ctrl'>
        <a href='#' class='geotabButton geotabButton-empty sygic-edit-dimensions<%= user.canModify ? '' : ' hidden' %>'>
          <svg class='svgIcon geotabButtonIcons'><use xlink:href='#geo-pencil-icon'>
            <svg viewBox='0 0 32 32' id='geo-pencil-icon'><path d='M7.79 29.124l1.878-1.915-4.919-4.919-1.915 1.915v2.253h2.703v2.666H7.79zm10.927-19.45q0-.45-.45-.45-.189 0-.339.15L6.551 20.714q-.15.15-.15.375 0 .45.488.45.188 0 .338-.15l11.377-11.34q.113-.15.113-.375zM17.59 5.657l8.711 8.71L8.88 31.828H.17V23.08zm14.306 2.027q0 1.09-.751 1.878l-3.492 3.492-8.711-8.749L22.434.851q.75-.789 1.877-.789 1.09 0 1.915.789l4.919 4.918q.75.827.75 1.915z'></path></svg>
          </use></svg>
        </a>
      </div>
    </div>
    <div class='g-row hidden sygic-vehicle-dimensions-form'>
      <fieldset class='geotabFieldset sygic-vehicle-dimensions-fieldset' style='background-color: transparent'>
        <% _.each(vehicle_dimensions, dimension => { %>
            <%  if (dimension.key != 'hazmat') { %>
              <%  let name = 'sygic-truck-dimensions-' + dimension.key; %>
              <%  let value = dimension.value; %>
              <%  let label = dimension.label; %>
              <div class='geotabField'>
                <label for=<%= name %>><%= label %></label>
                <input type='number' step=0.1 name=<%= name %> class='geotabFormEditField' value=<%= value %> />
              </div>
            <%  } %>
        <% }) %>
        <div data-name='hazmat-fields'>
            <% _.each(vehicle_hazmat, hazmat => { %>
              <%  let name = 'sygic-truck-hazmat-' + hazmat.key; %>
              <% if (hazmat.key === 'adr_tunnel') { %>
                 <div class='geotabField' <% if (!hazmat.visible) { %> hidden='hidden' <% } %> >
                  <label for=<%= name %>><%= hazmat.label %></label>
                  <select name=<%= name %> class='geotabFormEditField' >
                    <option></option>
                    <% _.each(hazmat.options, option => { %>
                      <option value=<%= option %> <% if (hazmat.value === option) { %> selected='selected' <% } %>  ><%= option %></option>
                    <% }) %>                   
                  </select>
                </div>
              <% } else { %>
                <div class='geotabField'  <% if (!hazmat.visible) { %> hidden='hidden' <% } %> >
                  <label for=<%= name %>><%= hazmat.label %></label>
                  <input type='checkbox' step=0.1 name=<%= name %> class='geotabFormEditField' <% if (hazmat.value) { %> checked <% } %> />
                </div>
              <% } %>
            <% }) %>
        </div>
        <button class='geotabButton sygic-vehicle-dimensions-save' ><%= apply_changes %></button>
      </fieldset>
    </div>
  </div>
</li>
  `;

  let geotabApi = ApiWrapper(api);

  function getDimensionsString(viewModel) {
    let iterator = 0;
    let dimensionDetailsString = '';
    for (const key in viewModel) {
      if (viewModel.hasOwnProperty(key)) {
        const model = viewModel[key];
        if (model.value !== undefined && typeof model.value !== 'object') {
          if (iterator++ > 0) dimensionDetailsString += ', ';
          dimensionDetailsString += `${model.label}: ${model.value}`;
        }
      }
    }
    return dimensionDetailsString;
  }

  function renderDeviceList({ devices, dimensions, user }) {
    let vehicleList = document.getElementById('sygic-vehicle-list');
    let storage = new DimensionsStorage(geotabApi);

    vehicleList.innerHTML = '';

    let template = _.template(templateString);

    for (let index = 0; index < devices.length; index++) {
      const device = devices[index];
      let dimensionDetailsString = '';

      let viewModel = undefined;
      if (dimensions[device.id]) {
        viewModel = dimensions[device.id].getViewModelWithUnits(user.isMetric, state);
        dimensionDetailsString = getDimensionsString(viewModel);
      } else {
        viewModel = DimensionsModel.getEmptyViewModel(user.isMetric, state);
        dimensionDetailsString = 'Dimensions unset';
      }

      let dimensionsTemplateObject = Object.keys(viewModel).map(key => {
        if (key !== 'hazmat') {
          return {
            value: viewModel[key].value,
            key: key,
            label: viewModel[key].label,
          };
        }
        return null;
      }).filter(Boolean);

      let hazmatTemplateObject = Object.keys(viewModel.hazmat.value).map(key => ({
          value: viewModel.hazmat.value[key].value,
          key: key,
          label: viewModel.hazmat.value[key].label,
          visible:  viewModel.hazmat.value[key].visible,
          options:  viewModel.hazmat.value[key].options,
      }));

      let vehicle_groups_string = device.groups.map((c) => c.name).join(', ');
      let result = template({
        vehicle: device,
        vehicle_dimensions_string: dimensionDetailsString,
        vehicle_groups_string: vehicle_groups_string,
        vehicle_dimensions: dimensionsTemplateObject,
        vehicle_hazmat: hazmatTemplateObject,
        user: user,
        apply_changes: state.translate('Apply Changes'),
      });
      vehicleList.innerHTML += result;
    }

    let vehicleRows = document.querySelectorAll('.sygic-vehicle');
    vehicleRows.forEach((row) => {
      let deviceId = row.getElementsByClassName('sygic-vehicle-id')[0].value;
      let editAnchor = row.getElementsByClassName('sygic-edit-dimensions')[0];
      let form = row.getElementsByClassName('sygic-vehicle-dimensions-form')[0];
      let comment = row.getElementsByClassName('vehicle-dimensions-comment')[0];
      editAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        comment.classList.toggle('hidden');
        form.classList.toggle('hidden');
      });

      let fieldSet = row.getElementsByClassName(
        'sygic-vehicle-dimensions-fieldset'
      )[0];
      let sumbitButton = row.getElementsByClassName(
        'sygic-vehicle-dimensions-save'
      )[0];
      sumbitButton.addEventListener('click', async (event) => {
        let dimensionsInputs = Dimensions.getInputValues(fieldSet);
        const dimensionsModel = DimensionsModel.getFromStringInputs(dimensionsInputs, user.isMetric);
        let storedDimensions = await storage.getDimensionsModelAsync(deviceId);
        if (!storedDimensions) {
          await storage.addDimensionsAsync(dimensionsModel, deviceId);
        } else {
          try {
            await storage.setDimensionsAsync(
              dimensionsModel,
              storedDimensions.id,
              deviceId
            );
          } catch (e) {
            //nothing here. It just fails for no reason.
          }
        }
        comment.classList.toggle('hidden');
        form.classList.toggle('hidden');
        const model = dimensionsModel.getViewModelWithUnits(user.isMetric, state);
        comment.innerHTML = getDimensionsString(model);
      });
    });
  }

  async function prepareData() {
    let storage = new DimensionsStorage(geotabApi);

    let devices = await geotabApi.callAsync('Get', {
      typeName: 'Device',
      search: {
        groups: state.getGroupFilter(),
      },
    });

    let groups = await geotabApi.callAsync('Get', {
      typeName: 'Group',
    });

    let groupMap = Object.assign(
      {},
      ...groups.map((group) => {
        return {
          [group.id]: group.name ? group.name : group.id,
        };
      })
    );

    devices.map((device) => {
      device.groups.map((group) => {
        group.name = groupMap[group.id];
      });
    });

    let dimensions = await storage.getAllDimensionsModelsAsync();

    let session = await geotabApi.getSessionAsync();
    let geotabUser = await geotabApi.callAsync('Get', {
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

    let user = new User(geotabUser[0], geotabClearances);
    // user.isMetric = false;
    return { devices, dimensions, user };
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
      elAddin.className = '';
      // show main content

      // await geotabApi.callAsync('Remove', {
      //   typeName: 'AddInData',
      //   entity: {
      //     addInId: 'ajk3ZmUzNmQtYjNlYS0yMGI',
      //     id: 'a0gr0GfY9YkOxnAb7N16fKA',
      //   }
      // })

      let data = await prepareData();
      renderDeviceList(data);
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
    },
  };
};
