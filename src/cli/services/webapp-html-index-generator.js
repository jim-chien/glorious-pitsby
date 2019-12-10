const path = require('path');
const pkg = require('../../../package.json');
const processService = require('./process');
const { fileService } = require('./file');
const assetsFilepathFilter = require('./assets-filepath-filter');
const webappHtmlIndexCustomisation = require('./webapp-html-index-customisation');

const _public = {};

_public.init = ({ scripts, styles, custom, projects = [] } = {}) => {
  return new Promise((resolve, reject) => {
    const linkTags = buildAssetTags(styles, buildLinkTag);
    const scriptTags = buildAssetTags(scripts, buildScriptTag);
    const indexHtml = webappHtmlIndexCustomisation.init(buildIndexHtml(
      linkTags,
      handleExternalScriptsTag(scriptTags, projects),
      buildComponentEngineScriptTag('angular.js', pkg.devDependencies.angular.replace('^', ''))
    ), custom);
    fileService.write(path.join(__dirname, '../../webapp/index.html'), indexHtml, resolve, reject);
  });
};

function buildAssetTags(paths = [], tagBuilderAction){
  const tags = [];
  paths.forEach(path => {
    tags.push(tagBuilderAction(path));
  });
  return tags;
}

function buildLinkTag(path){
  return `<link href="${buildExternalAssetPath(path)}?t=${Date.now()}" rel="stylesheet">`;
}

function buildScriptTag(path){
  return `<script src="${buildExternalAssetPath(path)}?t=${Date.now()}"></script>`;
}

function handleExternalScriptsTag(scriptTags, projects) {
  const externalScriptsTag = [...scriptTags];
  projects.forEach(project => {
    if (project.engine == 'vue') {
      externalScriptsTag.unshift(buildVueScriptTag(project.version));
    }
    if (project.engine == 'react') {
      externalScriptsTag.unshift(buildReactScriptTag(project.version),
        buildReactDomScriptTag(project.version));
    }
  });
  return externalScriptsTag;
}

function buildVueScriptTag(vueVersion = '2.5.13') {
  return buildComponentEngineScriptTag('vue', vueVersion);
}

function buildReactScriptTag(reactVersion = '16.11.0') {
  const reactScriptTag = buildComponentEngineScriptTag('react', reactVersion, 'umd');
  const suffix = processService.getNodeEnv() == 'production' ?
    '.production.min.js' : '.development.js';
  return reactScriptTag.replace('.js', suffix);
}

function buildReactDomScriptTag(reactVersion = '16.11.0') {
  const reactDomScriptTag =
    buildComponentEngineScriptTag('react-dom', reactVersion, 'umd');
  const suffix = processService.getNodeEnv() == 'production' ?
    '.production.min.js' : '.development.js';
  return reactDomScriptTag.replace('.js', suffix);
}

function buildComponentEngineScriptTag(engine, version, prefix){
  const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/${engine}`;
  const file = buildComponentEngineFileName(engine);
  return prefix ?
    `<script src="${cdnUrl}/${version}/${prefix}/${file}"></script>`
    : `<script src="${cdnUrl}/${version}/${file}"></script>`;
}

function buildComponentEngineFileName(engine){
  const suffix = processService.getNodeEnv() == 'production' ? '.min.js' : '.js';
  return `${engine.replace('.js', '')}${suffix}`;
}

function buildExternalAssetPath(path){
  return assetsFilepathFilter.isRelativePath(path) ?
    `external/${parseRelativePath(path)}` :
    path;
}

function parseRelativePath(path){
  return path.indexOf('./') === 0 ? path.replace('./','') : path;
}

function buildIndexHtml(linkTags, scriptTags, angularScriptTag) {
  const template = getIndexHtmlTemplate();
  let html = injectExternalTagsOnIndex(template, 'external-links', linkTags);
  html = injectExternalTagsOnIndex(html, 'angular', angularScriptTag);
  scriptTags.unshift('<script src="https://unpkg.com/@babel/standalone@7.7.6/babel.min.js"></script>');
  html = injectExternalTagsOnIndex(html, 'external-scripts', scriptTags);
  return clearBlankLines(html);
}

function injectExternalTagsOnIndex(indexHtml, tagType, tags){
  const html = Array.isArray(tags) ? tags.join('\n') : tags;
  return indexHtml.replace(`<!-- inject:${tagType} -->`, html);
}

function getIndexHtmlTemplate(){
  return fileService.readSync(
    path.join(__dirname, '../../webapp/index-template.html')
  );
}

function clearBlankLines(markup){
  return markup.replace(/^[\s]+$/gm, '');
}

module.exports = _public;
