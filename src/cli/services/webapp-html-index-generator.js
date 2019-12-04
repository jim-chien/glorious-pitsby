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
  const externalScriptsTag = [];
  projects.forEach(project => {
    if (project.engine == 'vue') {
      externalScriptsTag.push(prependVueScriptTag(scriptTags, project));
    }
    if (project.engine == 'react') {
      return;
    }
  });

  return externalScriptsTag.length ? externalScriptsTag : scriptTags;
}

// function handleVueScriptsTag(scriptTags, projects){
//   const vueProject = getVueProject(projects);
//   return vueProject ? prependVueScriptTag(scriptTags, vueProject) : scriptTags;
// }

// function getVueProject(projects){
//   for (var i = 0; i < projects.length; i++)
//     if(projects[i].engine == 'vue')
//       return projects[i];
// }

function prependVueScriptTag(scriptTags, vueProject) {
  scriptTags.unshift(buildComponentEngineScriptTag('vue', (vueProject.version || '2.5.13')));
  return scriptTags;
}

function buildComponentEngineScriptTag(engine, version){
  const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/${engine}`;
  const file = buildComponentEngineFileName(engine);
  return `<script src="${cdnUrl}/${version}/${file}"></script>`;
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

// eslint-disable-next-line max-statements
function buildIndexHtml(linkTags, scriptTags, angularScriptTag) {
  const template = getIndexHtmlTemplate();
  let html = injectExternalTagsOnIndex(template, 'external-links', linkTags);
  html = injectExternalTagsOnIndex(html, 'angular', angularScriptTag);
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
