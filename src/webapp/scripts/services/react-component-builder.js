import React from 'react';
import ReactDom from 'react-dom';

const _public = {};

_public.build = ({ controller = {} }, container) => {
  const element = buildElement(controller);
  const vm = ReactDom.render(element, container);
  return vm;
};

function buildElement(controller) {
  return React.createElement(controller);
}

export default _public;
