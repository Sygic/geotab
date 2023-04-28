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

export class DimensionsModel {
  constructor({ width, height, total_weight, axle_weight, total_length }) {
    this.width = width;
    this.height = height;
    this.total_length = total_length;
    this.axle_weight = axle_weight;
    this.total_weight = total_weight;
  }

  static getEmpty() {
    return new DimensionsModel({ undefined, undefined, undefined, undefined, undefined });
  }

  static getEmptyViewModel(isMetric, state) {
    return new DimensionsModel.getEmpty().getViewModelWithUnits(isMetric, state)
  }

  static getFromStringInputs({ width, height, total_weight, axle_weight, total_length }, isMetric = true) {
    width = Number.parseFloat(width);
    height = Number.parseFloat(height);
    total_weight = Number.parseFloat(total_weight);
    axle_weight = Number.parseFloat(axle_weight);
    total_length = Number.parseFloat(total_length);
    if (isMetric === false) {
      width = Dimensions.convertDimensionToMetric(width);
      height = Dimensions.convertDimensionToMetric(height);
      total_weight = Dimensions.convertWeightToMetric(total_weight);
      axle_weight = Dimensions.convertWeightToMetric(axle_weight);
      total_length = Dimensions.convertDimensionToMetric(total_length);
    }

    const data = { width, height, total_weight, axle_weight, total_length };
    return new DimensionsModel(data);
  }

  getViewModelWithUnits(isMetric, state) {
    let width = undefined;
    let height = undefined;
    let total_length = undefined;
    let total_weight = undefined;
    let axle_weight = undefined;
    if (isMetric) {
      width = this.width;
      height = this.height;
      total_length = this.total_length;
      total_weight = this.total_weight;
      axle_weight = this.axle_weight;
    } else {
      width = Dimensions.convertDimensionToImperial(this.width);
      height = Dimensions.convertDimensionToImperial(this.height);
      total_length = Dimensions.convertDimensionToImperial(this.total_length);
      axle_weight = Dimensions.convertWeightToImperial(this.axle_weight);
      total_weight = Dimensions.convertWeightToImperial(this.total_weight);
    }

    // numbers are stored with 5 decimals. Displayed and used when parsing inputs with 2 decimals.
    let roundTo2Decimals = (number) => Math.round(number * 100) / 100;

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
      }
    }
  }
}

const constants = {
  poundsInKilos: 2.20462262185,
  feetInMilimeters: 0.00328084
};

export let Dimensions = {
  convertWeightToMetric: (weight, rounding = 1e5) => {
    if (weight !== undefined)
      return Math.round(weight / constants.poundsInKilos * rounding) / rounding;
  },

  convertDimensionToMetric: (dimension, rounding = 1e5) => {
    if (dimension !== undefined)
      return Math.round(dimension  / constants.feetInMilimeters * rounding) / rounding;
  },

  convertWeightToImperial: (weight, rounding = 1e5) => {
    if (weight !== undefined)
      return Math.round(weight * constants.poundsInKilos * rounding) / rounding;
  },

  convertDimensionToImperial: (dimension, rounding = 1e5) => {
    if (dimension !== undefined)
      return Math.round(dimension * constants.feetInMilimeters * rounding) / rounding;
  },

  getInputValues: (parentElement) => {
    let dimensionsModel = DimensionsModel.getEmpty();
    for (const key in dimensionsModel) {
      if (dimensionsModel.hasOwnProperty(key) && key !== 'isMetric') {
        dimensionsModel[key] = parentElement.querySelector(
          `input[name=sygic-truck-${key}]`
        ).value;
      }
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
