import '@styles/external-component.styl';
import componentsResource from '@scripts/resources/components';
import template from './external-component.html';

function controller(routeService) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    setEngine(routeService.getParams('engine'));
  };

  $ctrl.fetch = () => {
    return componentsResource.get(
      routeService.getParams('engine'),
      routeService.getParams('componentId')
    );
  };

  $ctrl.fetchSuccess = component => {
    setComponent(component);
  };

  function setEngine(engine){
    $ctrl.engine = engine;
  }

  function setComponent(component){
    $ctrl.component = component;
  }
}

controller.$inject = ['routeService'];

export default {
  controller,
  template
};
