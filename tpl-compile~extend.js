'use strict';

const path = require('path');

const fs = require('fs-extra');
const glob = require('glob');
const gulp = global.gulp || require('gulp');
const utils = require('fepper-utils');
const yaml = require('js-yaml');

const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

const dataDir = conf.ui.paths.source.data;
const dataFile = `${dataDir}/_data.json`;
const patternDirPub = conf.ui.paths.public.patterns;
const patternDirSrc = conf.ui.paths.source.patterns;
const tplDir = conf.ui.paths.source.templates;

function tplCompile() {
  const globExt = '.json';
  const files = glob.sync(`${tplDir}/**/*${globExt}`) || [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let stat;

    try {
      stat = fs.statSync(file);
    }
    catch (err) /* istanbul ignore next */ {
      utils.error(err);

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
    let data = {};

    if (fs.existsSync(ymlFile)) {
      try {
        const yml = fs.readFileSync(ymlFile, conf.enc);
        data = yaml.load(yml);
      }
      catch {} // eslint-disable-line no-empty
    }

    const tplCompileDir = data.tpl_compile_dir || pref.tpl_compile_dir;
    const tplCompileExt = utils.extNormalize(data.tpl_compile_ext || pref.tpl_compile_ext);


    /* istanbul ignore if */
    if (!tplCompileDir || !tplCompileExt) {
      continue;
    }

    let pubPattern = pathMinusExt.replace(`${patternDirSrc}/`, '');
    pubPattern = pubPattern.replace(/\//g, '-');
    pubPattern = pubPattern.replace(/~/g, '-');
    const pubFile = `${patternDirPub}/${pubPattern}/${pubPattern}.markup-only.html`;
    const pubContent = utils.beautifyTemplate(fs.readFileSync(pubFile, conf.enc));
    const destFile = `${rootDir}/backend/${tplCompileDir.trim()}/${fileMinusExt}${tplCompileExt}`;

    try {
      fs.outputFileSync(destFile, pubContent);
    }
    catch (err) /* istanbul ignore next */ {
      utils.error(err);

      continue;
    }

    // Log to console.
    utils.log('Template \x1b[36m%s\x1b[0m compiled.', destFile.replace(rootDir, '').replace(/^\//, ''));
  }
}

function tplEncode(tplType, argv) {
  let ext;

  /* istanbul ignore else */
  if (!argv || !argv.e) {
    ext = `.${tplType}`;
  }
  else if (argv.e[0] === '.') {
    ext = argv.e;
  }
  else {
    ext = `.${argv.e}`;
  }

  let dataObj = {};
  let dataStr = '';

  try {
    dataObj = fs.readJsonSync(dataFile);
    dataStr = fs.readFileSync(dataFile, conf.enc);
  }
  catch {
    // Fail gracefully. A correctly formed dataFile is not crucial for this.
  }

  const files = glob.sync(`${patternDirSrc}/**/*${ext}`) || [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let content = fs.readFileSync(file, conf.enc);

    // Only Handlebars right now. Perhaps encode for other languages in the future.
    switch (tplType) {
      case 'hbs':
        content = content.replace(/\{\{/g, '{{{<%');
        content = content.replace(/(\})?\}\}/g, '$1%>}}}');
        content = content.replace(/(\{\{\{<%)/g, '$1}}}');
        content = content.replace(/(%>\}\}\})/g, '{{{$1');

        break;
    }

    const regex = new RegExp(`${ext}$`);

    let mustacheFile = file.replace(regex, '.mustache');
    let jsonFile = file.replace(regex, '.json');

    fs.outputFileSync(mustacheFile, content);

    // Only Handlebars right now. Perhaps encode for other languages in the future.
    switch (tplType) {
      case 'hbs':
        fs.outputFileSync(jsonFile, '{\n  "<%": "{{",\n  "%>": "}}"\n}\n');

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
      catch (err) /* istanbul ignore next */ {
        utils.error(err);

        return;
      }

      fs.outputFileSync(dataFile, dataStr);
    }

    if (!dataObj['%>']) {
      dataStr = dataStr.replace(/\s*\}(\s*)$/, ',\n  "%>": "-->"\n}$1');

      try {
        dataObj = JSON.parse(dataStr);
      }
      catch (err) /* istanbul ignore next */ {
        utils.error(err);

        return;
      }

      fs.outputFileSync(dataFile, dataStr);
    }
  }
}

// Declare gulp tasks.

gulp.task('tpl-compile:copy', function (cb) {
  tplCompile();
  cb();
});

gulp.task('tpl-compile', function (cb) {
  gulp.runSequence(
    'once',
    'tpl-compile:copy',
    cb
  );
});

gulp.task('tpl-encode:hbs', function (cb) {
  const argv = require('minimist')(process.argv.slice(2));

  tplEncode('hbs', argv);
  cb();
});

gulp.task('tpl-compile:help', function (cb) {
  let out = `
Fepper Template Compile Extension

Use:
    <task> [<additional args>...]

Tasks:
    fp tpl-compile          Export fully recursed compiled templates to the backend.
    fp tpl-compile:copy     Like 'fp tpl-compile' but without running 'fp once' first.
    fp tpl-encode:hbs       Like 'fp tpl-compile' but in reverse. Mainly intended for Handlebars in the backend.
    fp tpl-compile:help     Print fp-tpl-compile tasks and descriptions.
`;

  utils.info(out);
  cb();
});

// Export tasks in case users want to run them without gulp.

exports.tplCompile = tplCompile;
exports.tplEncode = tplEncode;
