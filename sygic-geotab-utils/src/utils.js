import _ from 'underscore';

const Filters = (() => {
  let RequiredEditFilters = ['DeviceAdmin', 'ManageAddInData'];
  let RequiredViewFilters = ['DeviceList', 'ViewAddInData',];
  let RequiredPlanViewFilters = ['TripsActivityReport'];
  let Joker = 'Everything';
  return {
    All: RequiredEditFilters.concat(RequiredViewFilters).concat(RequiredPlanViewFilters).concat(Joker),
    RequiredEditFilters,
    RequiredViewFilters,
    RequiredPlanViewFilters: RequiredPlanViewFilters,
    Joker
  };
})();

class RequiredFilters {
  constructor(requiredFiltersArray) {
    this.requiredFilters = Object.assign(
      {},
      ...requiredFiltersArray.map((a) => ({ [a]: undefined }))
    );
  }

  setAllowed(filter, value) {
    if (this.requiredFilters[filter] === undefined) {
      this.requiredFilters[filter] = value;
      return true;
    }
    return false;
  }

  isInitialized() {
    return (
      _.every(this.requiredFilters, (f) => f !== undefined) ||
      this.requiredFilters[Filters.Joker] === true
    );
  }

  hasAllRequiredFilters() {
    return (
      _.every(this.requiredFilters, (f) => f === true) ||
      this.requiredFilters[Filters.Joker] === true
    );
  }
}

export class User {
  constructor(geotabUser, allSecurityGroups) {
    this.canView = false;
    this.canModify = false;
    this.canViewPlans = false;
    this.isMetric = geotabUser.isMetric ?? true; //in case the api contract changes, we will default to true
    let userSecurityGroups = geotabUser.securityGroups.map((g) => g.id);
    if (userSecurityGroups.length > 0) {
      let securityGroupDetail = _.find(
        allSecurityGroups,
        (c) => c.id === userSecurityGroups[0]
      );
      this.buildPermissionTree(allSecurityGroups, securityGroupDetail);
      this.canModify = this.hasClearanceInTree(
        securityGroupDetail,
        Filters.RequiredEditFilters
      );
      this.canView = this.hasClearanceInTree(
        securityGroupDetail,
        Filters.RequiredViewFilters
      );
      this.canViewPlans = this.hasClearanceInTree(
        securityGroupDetail,
        Filters.RequiredPlanViewFilters
      )
    }
  }

  //purely for debugging purposes and convenience
  stripRedundantData(securityGroup) {
    if (securityGroup) {
      if (securityGroup.securityFilters)
        securityGroup.securityFilters = _.filter(
          securityGroup.securityFilters,
          (f) => Filters.All.includes(f.securityIdentifier)
        );
      if (securityGroup.color) delete securityGroup.color;
      if (securityGroup.reference) delete securityGroup.reference;
      if (securityGroup.comments) delete securityGroup.comments;
    }
  }

  getAndAssignParent(allSecurityGroups, securityGroup) {
    this.stripRedundantData(securityGroup);
    const parent = _.find(allSecurityGroups, (c) => {
      return _.find(c.children, (c) => c.id === securityGroup.id);
    });
    securityGroup.parent = parent;
    return parent;
  }

  buildPermissionTree(allSecurityGroups, securityGroup) {
    let parent = this.getAndAssignParent(allSecurityGroups, securityGroup);
    while (parent) {
      parent = this.getAndAssignParent(allSecurityGroups, parent);
    }
  }

  hasClearanceInTree(securityGroup, requiredSecurityFilter, cb) {
    let parent = securityGroup;
    let requiredFilters = new RequiredFilters(requiredSecurityFilter);

    while (parent && !requiredFilters.isInitialized()) {
      let filtersFor = _.filter(
        parent.securityFilters,
        (f) =>
          requiredSecurityFilter.includes(f.securityIdentifier) ||
          f.securityIdentifier === Filters.Joker
      );

      _.each(filtersFor, (filter) => {
        requiredFilters.setAllowed(filter.securityIdentifier, filter.isAdd);
      });
      parent = parent.parent;
    }
    return requiredFilters.hasAllRequiredFilters();
  }
}

export function ApiWrapper(api) {
  // make use of async/await instead of callbacks
  return {
    callAsync: (method, parameters) => {
      return new Promise((resolve, reject) => {
        api.call(
          method,
          parameters,
          (result) => resolve(result),
          (err) => reject(err)
        );
      })
    },
    getSessionAsync: () => {
      return new Promise((resolve, reject) => {
        api.getSession((session) => {
          resolve(session);
        });
      })
    },
  };
}

export class HazmatModel {
  constructor({ general, h_class, adr_tunnel, water}) {
    // US
    this.h_class = h_class;   // Possible values: 1,2,3,4,5,6,7,8,9,I , values can be combined, e.g. h_class='124'
    // EU
    this.general = general;   // true/false
    this.adr_tunnel = adr_tunnel; // Possible values: B, C, D, E, values cannot be combined
    this.water = water;       // true/false
  }
  static getEmpty() {
    return new HazmatModel({general: false, h_class:'', adr_tunnel:'', water: false});
  }

  static getFromStringInputs({general, h_class, adr_tunnel, water}) {
    if (general === undefined) { general = false; }
    if (h_class === undefined) { h_class = ''; }
    if (adr_tunnel === undefined) { adr_tunnel = ''; }
    if (water === undefined) { water = ''; }
    return new HazmatModel({general: general, h_class: h_class, adr_tunnel: adr_tunnel, water: water});
  }

  containsHClass(classId) {
    return this.h_class.indexOf(classId) > -1
  }

  getViewModel(isMetric, state) {
    return {
      // EU
      general: {
        value: this.general,
        label: `${state.translate('General Hazmat')}`,
        visible: isMetric || this.general,
      },
      water: {
        value: this.water,
        label: `${state.translate('Harmful to water')}`,
        visible: isMetric || this.water,
      },
      adr_tunnel: {
        value: this.adr_tunnel,
        label: `${state.translate('ADR tunnel')}`,
        visible: isMetric || this.adr_tunnel,
        options: ['B', 'C', 'D', 'E']
      },
      // USA
      class1: {
        value: this.containsHClass('1'),
        label: `${state.translate('Explosive')} (Class 1)`,
        visible: !isMetric || this.containsHClass('1'),
      },
      class2: {
        value: this.containsHClass('2'),
        label: `${state.translate('Flammable gas')} (Class 2)`,
        visible: !isMetric || this.containsHClass('2'),
      },
      class3: {
        value: this.containsHClass('3'),
        label: `${state.translate('Flammable liquid')} (Class 3)`,
        visible: !isMetric || this.containsHClass('3'),
      },
      class4: {
        value: this.containsHClass('4'),
        label: `${state.translate('Flammable solid')} (Class 4)`,
        visible: !isMetric || this.containsHClass('4'),
      },
      class5: {
        value: this.containsHClass('5'),
        label: `${state.translate('Oxidizer')} (Class 5)`,
        visible: !isMetric || this.containsHClass('5'),
      },
      class6: {
        value: this.containsHClass('6'),
        label: `${state.translate('Poison')} (Class 6)`,
        visible: !isMetric || this.containsHClass('6'),
      },
      class7: {
        value: this.containsHClass('7'),
        label: `${state.translate('Radioactive material')} (Class 7)`,
        visible: !isMetric || this.containsHClass('7'),
      },
      class8: {
        value: this.containsHClass('8'),
        label: `${state.translate('Corrosive material')} (Class 8)`,
        visible: !isMetric || this.containsHClass('8'),
      },
      class9: {
        value: this.containsHClass('9'),
        label: `${state.translate('Miscellaneous')} (Class 9)`,
        visible: !isMetric || this.containsHClass('9'),
      },
      classI: {
        value: this.containsHClass('I'),
        label: `${state.translate('Poison inhalation')} (Class I)`,
        visible: !isMetric || this.containsHClass('I'),
      },
    }
  }

} // class

export class DimensionsModel {
  constructor({ width, height, total_weight, axle_weight, total_length, max_speed, hazmat}) {
    this.width = width;
    this.height = height;
    this.total_length = total_length;
    this.axle_weight = axle_weight;
    this.total_weight = total_weight;
    this.max_speed = max_speed;
    if (hazmat === undefined) {
      this.hazmat = HazmatModel.getEmpty();
    } else {
      this.hazmat = hazmat;
    }
  }

  static getEmpty() {
    return new DimensionsModel({ undefined, undefined, undefined, undefined, undefined, undefined });
  }

  static getEmptyViewModel(isMetric, state) {
    return new DimensionsModel.getEmpty().getViewModelWithUnits(isMetric, state)
  }

  static getFromStringInputs({ width, height, total_weight, axle_weight, total_length, max_speed, hazmat }, isMetric = true) {
    width = Number.parseFloat(width);
    height = Number.parseFloat(height);
    total_weight = Number.parseFloat(total_weight);
    axle_weight = Number.parseFloat(axle_weight);
    total_length = Number.parseFloat(total_length);
    max_speed = Number.parseFloat(max_speed);
    if (isMetric === false) {
      width = Dimensions.convertDimensionToMetric(width);
      height = Dimensions.convertDimensionToMetric(height);
      total_weight = Dimensions.convertWeightToMetric(total_weight);
      axle_weight = Dimensions.convertWeightToMetric(axle_weight);
      total_length = Dimensions.convertDimensionToMetric(total_length);
      max_speed = Dimensions.convertDimensionToMetric(max_speed);
    }

    if (hazmat !== undefined) {
      hazmat = HazmatModel.getFromStringInputs(hazmat);
    } else {
      hazmat = HazmatModel.getEmpty();
    }

    const data = { width, height, total_weight, axle_weight, total_length, hazmat };
    return new DimensionsModel(data);
  }

  getViewModelWithUnits(isMetric, state) {
    let width = undefined;
    let height = undefined;
    let total_length = undefined;
    let total_weight = undefined;
    let axle_weight = undefined;
    let max_speed = undefined;
    if (isMetric) {
      width = this.width;
      height = this.height;
      total_length = this.total_length;
      total_weight = this.total_weight;
      axle_weight = this.axle_weight;
      max_speed = this.max_speed;
    } else {
      width = Dimensions.convertDimensionToImperial(this.width);
      height = Dimensions.convertDimensionToImperial(this.height);
      total_length = Dimensions.convertDimensionToImperial(this.total_length);
      axle_weight = Dimensions.convertWeightToImperial(this.axle_weight);
      total_weight = Dimensions.convertWeightToImperial(this.total_weight);
      max_speed = Dimensions.convertDimensionToMetric(this.max_speed);
    }

    // numbers are stored with 5 decimals. Displayed and used when parsing inputs with 2 decimals.
    let roundTo2Decimals = (number) => {
      if (number)
        return Math.round(number * 100) / 100;
    }

    return {
      width: {
        value: roundTo2Decimals(width),
        label: isMetric ? `${state.translate('Width')} (mm)` : `${state.translate('Width')} (ft)`
      },
      height: {
        value: roundTo2Decimals(height),
        label: isMetric ? `${state.translate('Height')} (mm)` : `${state.translate('Height')} (ft)`
      },
      total_length: {
        value: roundTo2Decimals(total_length),
        label: isMetric ? `${state.translate('Total length')} (mm)` : `${state.translate('Total length')} (ft)`
      },
      axle_weight: {
        value: roundTo2Decimals(axle_weight),
        label: isMetric ? `${state.translate('Axle weight')} (kg)` : `${state.translate('Axle weight')} (lb)`
      },
      total_weight: {
        value: roundTo2Decimals(total_weight),
        label: isMetric ? `${state.translate('Total weight')} (kg)` : `${state.translate('Total weight')} (lb)`
      },
      max_speed: {
        value: roundTo2Decimals(max_speed),
        label: isMetric ? `${state.translate('Max speed')} (km/h)` : `${state.translate('Max speed')} (mph)`
      },
      hazmat : {
        value: this.hazmat.getViewModel(isMetric, state),
      },
    }
  }
}

const constants = {
  poundsInKilos: 2.20462262185,
  feetInMilimeters: 0.00328084,
  mphInKph: 0.621371192
};

export let Dimensions = {
  convertSpeedToMetric: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number / constants.mphInKph * rounding) / rounding;
  },

  convertWeightToMetric: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number / constants.poundsInKilos * rounding) / rounding;
  },

  convertDimensionToMetric: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number  / constants.feetInMilimeters * rounding) / rounding;
  },

  convertSpeedToImperial: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number * constants.mphInKph * rounding) / rounding;
  },

  convertWeightToImperial: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number * constants.poundsInKilos * rounding) / rounding;
  },

  convertDimensionToImperial: (number, rounding = 1e5) => {
    if (number)
      return Math.round(number * constants.feetInMilimeters * rounding) / rounding;
  },

  getInputValues: (parentElement) => {
    let dimensionsModel = DimensionsModel.getEmpty();
    for (const key in dimensionsModel) {
      if (dimensionsModel.hasOwnProperty(key) && key !== 'isMetric' && key !== 'hazmat') {
        dimensionsModel[key] = parentElement.querySelector(
          `input[name=sygic-truck-dimensions-${key}]`
        ).value;
      }
    }

    const hazmats_div = parentElement.querySelector('div[data-name=hazmat-fields]');
    if (hazmats_div) {
      let hazmat_classes = "";
      for (const h_class of "123456789I") {
        const checked = parentElement.querySelector(`input[name=sygic-truck-hazmat-class${h_class}]`).checked;
        if (checked) {
          hazmat_classes += h_class;
        }
      }

      const hazmat_general = parentElement.querySelector('input[name=sygic-truck-hazmat-general]').checked;
      const adr_tunnel = parentElement.querySelector('select[name=sygic-truck-hazmat-adr_tunnel]').value;
      const water = parentElement.querySelector('input[name=sygic-truck-hazmat-water]').checked;

      dimensionsModel.hazmat.h_class = hazmat_classes;
      dimensionsModel.hazmat.general = hazmat_general;
      dimensionsModel.hazmat.adr_tunnel = adr_tunnel;
      dimensionsModel.hazmat.water = water;
    }

    return dimensionsModel;
  },
};

export function DimensionsStorage(geotabApi) {
  const addinDataGuid = 'ajk3ZmUzNmQtYjNlYS0yMGI';
  return {
    getAllDimensionsModelsAsync: async () => {
      let result = await geotabApi.callAsync('Get', {
        typeName: 'AddInData',
        search: {
          addInId: addinDataGuid,
        },
      });
      const data = result.map(r => {
        let isMetric = undefined;
        if (r.details.dimensions.isMetric === false) isMetric = false; //for backward compatibility
        if (r.details.dimensions.isMetric === true) isMetric = true;
        return {
          [r.details.vehicle_id]: DimensionsModel.getFromStringInputs(r.details.dimensions, isMetric)
        };
      });
      return Object.assign({}, ...data.map(d => d));
    },
    getDimensionsModelAsync: async (vehicleId) => {
      let result = await geotabApi.callAsync('Get', {
        typeName: 'AddInData',
        search: {
          addInId: addinDataGuid,
          whereClause: `vehicle_id=\"${vehicleId}\"`,
        },
      });
      if (result && result.length > 0) {
        let item = result[0];
        let isMetric = undefined;
        if (item.details.dimensions.isMetric === false) isMetric = false; //for backward compatibility
        if (item.details.dimensions.isMetric === true) isMetric = true;
        const model = DimensionsModel.getFromStringInputs(item.details.dimensions, isMetric);
        return {
          dimensions: model,
          id: item.id,
        };
      }
    },
    addDimensionsAsync: async (dimensions, vehicleId) => {
      let result = await geotabApi.callAsync('Add', {
        typeName: 'AddInData',
        entity: {
          addInId: addinDataGuid,
          details: {
            vehicle_id: vehicleId,
            dimensions: dimensions,
          }
        }
      });
      return result;
    },
    setDimensionsAsync: async (dimensions, dimensionsId, vehicleId) =>
      await geotabApi.callAsync('Set', {
        typeName: 'AddInData',
        entity: {
          addInId: addinDataGuid,
          id: dimensionsId,
          details: {
            vehicle_id: vehicleId,
            dimensions: dimensions,
          }
        }
      })
  };
}

export function createSygicTruckAttrUrl(dimensions) {
  // https://www.sygic.com/sk/developers/professional-navigation-sdk/android/api-examples/custom-url
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
  if (dimensions.max_speed) {
    valueArray.push(`mxs=${dimensions.max_speed}`);
  }

  valueArray.push(`general=${dimensions.hazmat.general * 1}`);
  valueArray.push(`water=${dimensions.hazmat.water * 1}`);
  valueArray.push(`adr=${dimensions.hazmat.adr_tunnel}`);
  if (dimensions.hazmat.h_class.length > 0) {
    valueArray.push(`hClass=${dimensions.hazmat.h_class}`);
  } else {
    valueArray.push(`hClass=0`);
  }

  if (valueArray.length > 0) {
    return `truckSettings|${valueArray.join('&')}&rou=tru`;
  }
  return '';
}
