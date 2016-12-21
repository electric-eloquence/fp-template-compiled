'use strict';

const appDir = global.appDir;
const conf = global.conf;
const workDir = global.workDir;

const beautify = require('js-beautify').html;
const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const path = require('path');
const RcLoader = require('rcloader');
const runSequence = require('run-sequence');
const yaml = require('js-yaml');

const utils = require(`${appDir}/core/lib/utils`);

const dataDir = utils.pathResolve(conf.ui.paths.source.data);
const dataFile = `${dataDir}/_data.json`;
const patternDirPub = utils.pathResolve(conf.ui.paths.public.patterns);
const patternDirSrc = utils.pathResolve(conf.ui.paths.source.patterns, true);
const tplDir = utils.pathResolve(conf.ui.paths.source.templates);

function tplEncodeHbs(content) {
  content = content.replace(/\{\{/g, '{{{ %7B');
  content = content.replace(/(\})?\}\}/g, '$1%7D }}}');
  content = content.replace(/(\{\{ %7B)/g, '$1 }}}');
  content = content.replace(/(%7D \}\})/g, '{{{ $1');

  return content;
}

function writeJsonHbs(jsonFile) {
  fs.writeFileSync(jsonFile, '{\n  "%7B": "{{",\n  "%7D": "}}"\n}\n');
}

function tplEncode(tplType, argv) {
  if (!argv || !argv.e) {
    utils.error('Error: need an -e argument to identify your source files by extension!');
    return;
  }

  var ext;
  if (argv.e[0] === '.') {
    ext = argv.e.slice(1);
  }
  else {
    ext = argv.e;
  }

  var dataObj = {};
  var dataStr = '';
  try {
    dataObj = fs.readJsonSync(dataFile);
    dataStr = fs.readFileSync(dataFile, conf.enc);
  }
  catch (err) {
    // Fail gracefully. A correctly formed dataFile is not crucial for this.
  }

  var files = glob.sync(`${patternDirSrc}/**/*.${ext}`) || [];
  for (let i = 0; i < files.length; i++) {
    let content = fs.readFileSync(files[i], conf.enc);

    // Only Handlebars right now. Could easily encode for other languages.
    switch (tplType) {
      case 'hbs':
        content = tplEncodeHbs(content);
        break;
    }

    let regex = new RegExp(`${ext}$`);
    let mustacheFile = files[i].replace(regex, 'mustache');
    let jsonFile = files[i].replace(regex, 'json');

    fs.writeFileSync(mustacheFile, content);

    // Only Handlebars right now. Could easily encode for other languages.
    switch (tplType) {
      case 'hbs':
        writeJsonHbs(jsonFile);
        break;
    }

    // Crucial part is done. Log to console.
    utils.log('\x1b[36m%s\x1b[0m encoded to \x1b[36m%s\x1b[0m.', files[i].replace(workDir, '').replace(/^\//, ''), mustacheFile.replace(workDir, '').replace(/^\//, ''));

    // Clean up.
    fs.unlinkSync(files[i]);

    // Add key/values to _data.json if they are not there.
    // These hide the encoded tags in all views except 03-templates.
    if (!dataObj['%7B']) {
      dataStr = dataStr.replace(/\s*\}(\s*)$/, ',\n  "%7B": "<!--"\n}$1');
      dataObj = JSON.parse(dataStr);
      fs.writeFileSync(dataFile, dataStr);
    }

    if (!dataObj['%7D']) {
      dataStr = dataStr.replace(/\s*\}(\s*)$/, ',\n  "%7D": "-->"\n}$1');
      dataObj = JSON.parse(dataStr);
      fs.writeFileSync(dataFile, dataStr);
    }
  }
}

gulp.task('tpl-compile:copy', function (cb) {
  var files = glob.sync(`${tplDir}/**/*.yml`) || [];
  // Load js-beautify with options configured in .jsbeautifyrc
  var rcLoader = new RcLoader('.jsbeautifyrc', {});
  var rcOpts = rcLoader.for(appDir, {lookup: true});

  for (let i = 0; i < files.length; i++) {
    let data = {};
    let stats = null;
    let yml = '';

    try {
      stats = fs.statSync(files[i]);
    }
    catch (err) {
      utils.error(err);
      continue;
    }

    // Only process valid files.
    if (!stats || !stats.isFile()) {
      continue;
    }

    try {
      yml = fs.readFileSync(files[i], conf.enc);
      data = yaml.safeLoad(yml);
    }
    catch (err) {
      utils.error(err);
      continue;
    }

    if (!data.tpl_compile_dir || !data.tpl_compile_ext) {
      continue;
    }

    let pubPattern = files[i].replace(`${patternDirSrc}/`, '');
    pubPattern = pubPattern.slice(0, -4);
    pubPattern = pubPattern.replace(/\//g, '-');
    pubPattern = pubPattern.replace(/~/g, '-');
    let pubFile = `${patternDirPub}/${pubPattern}/${pubPattern}.markup-only.html`;
    let pubContent = fs.readFileSync(pubFile, conf.enc);

    // Load .jsbeautifyrc and beautify html
    pubContent = beautify(pubContent, rcOpts) + '\n';

    // Delete empty lines.
    pubContent = pubContent.replace(/^\s*$\n/gm, '');

    let destFile = `${workDir}/backend/${data.tpl_compile_dir.trim()}/${path.basename(files[i], '.yml')}.${data.tpl_compile_ext.trim()}`;

    fs.writeFileSync(destFile, pubContent);

    // Log to console.
    utils.log('Template \x1b[36m%s\x1b[0m compiled.', destFile.replace(workDir, '').replace(/^\//, ''));
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
  let argv = require('yargs')(process.argv).argv;

  tplEncode('hbs', argv);
  cb();
});
