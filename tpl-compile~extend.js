'use strict';

const conf = global.conf;
const pref = global.pref;
const rootDir = global.rootDir;

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

gulp.task('tpl-compile', function (cb) {
  runSequence(
    'patternlab:build',
    'tpl-compile:copy',
    cb
  );
});

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
    let destFile = `${rootDir}/backend/${data.tpl_compile_dir.trim()}/${path.basename(files[i], '.yml')}.${data.tpl_compile_ext.trim()}`;

    fs.copySync(pubFile, destFile);
  }
  cb();
});
