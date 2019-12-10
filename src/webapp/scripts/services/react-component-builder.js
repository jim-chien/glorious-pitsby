import React from 'react';
import ReactDom from 'react-dom';
import * as Babel from '@babel/standalone';

const _public = {};

_public.build = ({ controller = {} }, container) => {
  const element = buildElement(controller);
  const vm = ReactDom.render(element, container);
  return vm;
};

function buildElement(controller) {
  const component = Babel.transform(controller, { presets: ['react'], plugins: ['proposal-class-properties'] }).code;
  return React.createElement(eval(`(${component})`));
}

export default _public;
