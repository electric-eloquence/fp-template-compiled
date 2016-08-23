'use strict';

const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

const beautify = require('js-beautify').html;
const fs = require('fs-extra');
const glob = require('glob');
const gulp = require('gulp');
const path = require('path');
const runSequence = require('run-sequence');
const yaml = require('js-yaml');

const utils = require('../../../app/core/lib/utils');

const patternDirPub = path.normalize(`${rootDir}/${conf.ui.paths.public.patterns}`);
const patternDirSrc = path.normalize(`${rootDir}/${conf.ui.paths.source.patterns}`);
const tplDir = path.normalize(`${rootDir}/${conf.ui.paths.source.templates}`);

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

    fs.unlinkSync(files[i]);

    // Log to console.
    utils.log('\x1b[36m%s\x1b[0m encoded to \x1b[36m%s\x1b[0m.', files[i].replace(rootDir, '').replace(/^\//, ''), mustacheFile.replace(rootDir, '').replace(/^\//, ''));
  }
}

gulp.task('tpl-compile:copy', function (cb) {
  var files = glob.sync(`${tplDir}/**/*.yml`) || [];

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
    pubContent = beautify(pubContent, {indent_size: 4}) + '\n';
    // Delete empty lines.
    pubContent = pubContent.replace(/^\s*$\n/gm, '');

    let destFile = `${rootDir}/backend/${data.tpl_compile_dir.trim()}/${path.basename(files[i], '.yml')}.${data.tpl_compile_ext.trim()}`;

    fs.writeFileSync(destFile, pubContent);

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
  let argv = require('yargs')(process.argv).argv;

  tplEncode('hbs', argv);
  cb();
});
