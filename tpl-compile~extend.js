'use strict';

const path = require('path');

const beautify = require('js-beautify').html;
const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const RcLoader = require('rcloader');
const runSequence = require('run-sequence');
const utils = require('fepper-utils');
const yaml = require('js-yaml');

const appDir = global.appDir;
const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

const dataDir = conf.ui.paths.source.data;
const dataFile = `${dataDir}/_data.json`;
const patternDirPub = conf.ui.paths.public.patterns;
const patternDirSrc = conf.ui.paths.source.patterns;
const tplDir = conf.ui.paths.source.templates;

function tplEncodeHbs(content_) {
  let content = content_;
  content = content.replace(/\{\{/g, '{{{<%');
  content = content.replace(/(\})?\}\}/g, '$1%>}}}');
  content = content.replace(/(\{\{\{<%)/g, '$1}}}');
  content = content.replace(/(%>\}\}\})/g, '{{{$1');

  return content;
}

function writeJsonHbs(jsonFile) {
  fs.writeFileSync(jsonFile, '{\n  "<%": "{{",\n  "%>": "}}"\n}\n');
}

function tplEncode(tplType, argv) {
  let ext;

  if (!argv || !argv.e) {
    ext = `.${tplType}`;
  }
  /* istanbul ignore next */
  else if (argv.e[0] === '.') {
    ext = argv.e;
  }
  /* istanbul ignore next */
  else {
    ext = `.${argv.e}`;
  }

  let dataObj = {};
  let dataStr = '';

  try {
    dataObj = fs.readJsonSync(dataFile);
    dataStr = fs.readFileSync(dataFile, conf.enc);
  }
  catch (err) {
    // Fail gracefully. A correctly formed dataFile is not crucial for this.
  }

  const files = glob.sync(`${patternDirSrc}/**/*${ext}`) || [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let content = fs.readFileSync(file, conf.enc);

    // Only Handlebars right now. Could easily encode for other languages.
    switch (tplType) {
      case 'hbs':
        content = tplEncodeHbs(content);
        break;
    }

    const regex = new RegExp(`${ext}$`);

    let mustacheFile = file.replace(regex, '.mustache');
    let jsonFile = file.replace(regex, '.json');

    fs.writeFileSync(mustacheFile, content);

    // Only Handlebars right now. Could easily encode for other languages.
    switch (tplType) {
      case 'hbs':
        writeJsonHbs(jsonFile);
        break;
    }

    // Crucial part is done. Log to console.
    utils.log(
      '\x1b[36m%s\x1b[0m encoded to \x1b[36m%s\x1b[0m.', file.replace(rootDir, '').replace(/^\//, ''),
      mustacheFile.replace(rootDir, '').replace(/^\//, '')
    );

    // Clean up.
    fs.unlinkSync(file);

    // Add key/values to _data.json if they are not there.
    // These hide the encoded tags in all views except 03-templates.
    if (!dataObj['<%']) {
      if (Object.keys(dataObj).length) {
        /* istanbul ignore next */
        dataStr = dataStr.replace(/\s*\}(\s*)$/, ',\n  "<%": "<!--"\n}$1');
      }
      else {
        dataStr = '{\n  "<%": "<!--"\n}\n';
      }

      try {
        dataObj = JSON.parse(dataStr);
      }
      catch (err) {
        /* istanbul ignore next */
        utils.error(err);
        /* istanbul ignore next */
        return;
      }

      fs.writeFileSync(dataFile, dataStr);
    }

    if (!dataObj['%>']) {
      dataStr = dataStr.replace(/\s*\}(\s*)$/, ',\n  "%>": "-->"\n}$1');

      try {
        dataObj = JSON.parse(dataStr);
      }
      catch (err) {
        /* istanbul ignore next */
        utils.error(err);
        /* istanbul ignore next */
        return;
      }

      fs.writeFileSync(dataFile, dataStr);
    }
  }
}

// Declare gulp tasks.

gulp.task('tpl-compile:copy', function (cb) {
  const globExt = '.json';
  const files = glob.sync(`${tplDir}/**/*${globExt}`) || [];
  const rcFile = '.jsbeautifyrc';
  const rcLoader = new RcLoader(rcFile);
  let rcOpts;

  // First, try to load .jsbeautifyrc with user-configurable options.
  /* istanbul ignore if */
  if (fs.existsSync(`${rootDir}/${rcFile}`)) {
    rcOpts = rcLoader.for(`${rootDir}/${rcFile}`, {lookup: false});
  }
  // Else, load the .jsbeautifyrc that ships with fepper-npm.
  else {
    rcOpts = rcLoader.for(`${appDir}/${rcFile}`, {lookup: false});
  }

  rcOpts.indent_handlebars = true;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let data = {};
    let stat;
    let tplCompileDir;
    let tplCompileExt;
    let yml = '';

    try {
      stat = fs.statSync(file);
    }
    catch (err) {
      /* istanbul ignore next */
      utils.error(err);
      /* istanbul ignore next */
      continue;
    }

    // Only process valid files.
    /* istanbul ignore if */
    if (!stat || !stat.isFile()) {
      continue;
    }

    const fileMinusExt = path.basename(file, globExt);
    const pathMinusExt = `${path.dirname(file)}/${fileMinusExt}`;
    const ymlFile = `${pathMinusExt}.yml`;

    if (fs.existsSync(ymlFile)) {
      try {
        yml = fs.readFileSync(ymlFile, conf.enc);
        data = yaml.safeLoad(yml);
      }
      catch (err) {
        // Fail gracefully.
      }
    }

    tplCompileDir = data.tpl_compile_dir || pref.tpl_compile_dir;
    tplCompileExt = data.tpl_compile_ext || pref.tpl_compile_ext;
    tplCompileExt = utils.extNormalize(tplCompileExt);


    /* istanbul ignore if */
    if (!tplCompileDir || !tplCompileExt) {
      continue;
    }

    let pubPattern = pathMinusExt.replace(`${patternDirSrc}/`, '');
    pubPattern = pubPattern.replace(/\//g, '-');
    pubPattern = pubPattern.replace(/~/g, '-');
    let pubFile = `${patternDirPub}/${pubPattern}/${pubPattern}.markup-only.html`;
    let pubContent = fs.readFileSync(pubFile, conf.enc);

    // Delete empty lines.
    pubContent = pubContent.replace(/^\s*$\n/gm, '');

    // Prep for beautifcation.
    // In order for js-beautify's to indent Handlebars correctly, any space between control characters #, ^, and /, and
    // the variable name must be removed. However, we want to add the spaces back later.
    // \u00A0 is &nbsp; a space character not enterable by keyboard, and therefore a good delimiter.
    pubContent = pubContent.replace(/(\{\{#)(\s+)(\S+)/g, '$1$3$2\u00A0');
    pubContent = pubContent.replace(/(\{\{^)(\s+)(\S+)/g, '$1$3$2\u00A0');
    pubContent = pubContent.replace(/(\{\{\/)(\s+)(\S+)/g, '$1$3$2\u00A0');

    // Load .jsbeautifyrc and beautify html.
    pubContent = beautify(pubContent, rcOpts);

    // Add back removed spaces to retain the look intended by the author.
    pubContent = pubContent.replace(/(\{\{#)(\S+)(\s+)\u00A0/g, '$1$3$2');
    pubContent = pubContent.replace(/(\{\{\^)(\S+)(\s+)\u00A0/g, '$1$3$2');
    pubContent = pubContent.replace(/(\{\{\/)(\S+)(\s+)\u00A0/g, '$1$3$2');

    // Build path to destFile.
    let destFile = `${rootDir}/backend/${tplCompileDir.trim()}/${fileMinusExt}${tplCompileExt}`;

    try {
      fs.writeFileSync(destFile, pubContent);
    }
    catch (err) {
      /* istanbul ignore next */
      utils.error(err);
      /* istanbul ignore next */
      continue;
    }

    // Log to console.
    utils.log('Template \x1b[36m%s\x1b[0m compiled.', destFile.replace(rootDir, '').replace(/^\//, ''));
  }
  cb();
});

gulp.task('tpl-compile', function (cb) {
  runSequence(
    'once',
    'tpl-compile:copy',
    cb
  );
});

gulp.task('tpl-encode:hbs', function (cb) {
  const argv = require('yargs').argv;

  tplEncode('hbs', argv);
  cb();
});
