'use strict';

const fs = require('fs-extra');
const {join} = require('path');

const {expect} = require('chai');

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = __dirname;
const fp = require('fepper/tasker');
require('../tpl-compile~extend');

const enc = 'utf8';

describe('fp-tpl-compile', function () {
  describe('fp tpl-compile', function () {
    const tplCompileHbs = join(__dirname, 'backend/docroot/templates/tpl-compile.hbs');
    const tplCompileWLocalYml = join(__dirname, 'backend/docroot/templates1/tpl-compile-w-local-yml.handlebars');
    let tplCompileHbsExistsBefore;
    let tplCompileWLocalYmlExistsBefore;

    before(function (done) {
      if (fs.existsSync(tplCompileHbs)) {
        fs.unlinkSync(tplCompileHbs);
      }
      if (fs.existsSync(tplCompileWLocalYml)) {
        fs.unlinkSync(tplCompileWLocalYml);
      }

      tplCompileHbsExistsBefore = fs.existsSync(tplCompileHbs);
      tplCompileWLocalYmlExistsBefore = fs.existsSync(tplCompileWLocalYml);

      fp.runSeq(
        'tpl-compile',
        done
      );
    });

    it('compiles templates to the backend', function () {
      const compiled = fs.readFileSync(tplCompileHbs, enc);
      const expected = `<h1>{{title}}</h1> {{#each foo}} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(tplCompileHbsExistsBefore).to.be.false;
      expect(compiled).to.equal(expected);
    });

    it('includes partial templates in the compiled template', function () {
      const compiled = fs.readFileSync(tplCompileHbs, enc);
      const partial = `{{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}`;
      expect(compiled).to.have.string(partial);
    });

    it('compiles templates to an alternate backend directory with alternate extension', function () {
      const compiled = fs.readFileSync(tplCompileWLocalYml, enc);
      const expected = `<h1>{{title}}</h1> {{#each foo}} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(tplCompileWLocalYmlExistsBefore).to.be.false;
      expect(compiled).to.equal(expected);
    });

    it('includes partial templates in the template compiled to the alternate backend directory with alternate extension\
', function () {
      const compiled = fs.readFileSync(tplCompileWLocalYml, enc);
      const partial = `<h1>{{title}}</h1> {{#each foo}} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(compiled).to.have.string(partial);
    });

    it('retains and beautifies tags that adhere to the Mustache spec', function () {
      const tplCompileMustache = join(__dirname, 'backend/docroot/templates/tpl-compile-mustache.hbs');
      const compiled = fs.readFileSync(tplCompileMustache, enc);
      const expected = `<h1>{{title}}</h1> {{# foo }} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/ foo }} {{^ foo }} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/ foo }} {{#bar}} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/bar}} {{^bar}} {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}} {{/bar}}
<footer>{{{footer}}}</footer>
`;
      expect(compiled).to.equal(expected);
    });
  });

  describe('fp tpl-encode:hbs', function () {
    const _dataJson = join(__dirname, 'source/_data/_data.json');
    const tplEncodeBack = join(__dirname, 'backend/docroot/templates/tpl-encode.hbs');
    const tplEncodeHbs = join(__dirname, 'source/_patterns/03-templates/tpl-encode.hbs');
    const tplEncodeJson = join(__dirname, 'source/_patterns/03-templates/tpl-encode.json');
    const tplEncodeMustache = join(__dirname, 'source/_patterns/03-templates/tpl-encode.mustache');
    let _dataJsonBefore;
    let tplEncodeJsonExistsBefore;
    let tplEncodeMustacheExistsBefore;

    before(function (done) {
      fs.writeFileSync(_dataJson, '{}\n');
      if (fs.existsSync(tplEncodeJson)) {
        fs.unlinkSync(tplEncodeJson);
      }
      if (fs.existsSync(tplEncodeMustache)) {
        fs.unlinkSync(tplEncodeMustache);
      }

      _dataJsonBefore = fs.readFileSync(_dataJson, enc);
      tplEncodeJsonExistsBefore = fs.existsSync(tplEncodeJson);
      tplEncodeMustacheExistsBefore = fs.existsSync(tplEncodeMustache);

      fs.copyFileSync(tplEncodeBack, tplEncodeHbs);
      fp.runSeq(
        'tpl-encode:hbs',
        done
      );
    });

    after(function () {
      fs.writeFileSync(_dataJson, '{}\n');
      if (fs.existsSync(tplEncodeJson)) {
        fs.unlinkSync(tplEncodeJson);
      }
      if (fs.existsSync(tplEncodeMustache)) {
        fs.unlinkSync(tplEncodeMustache);
      }
    });

    it('encodes backend template into Fepper templates', function () {
      const encoded = fs.readFileSync(tplEncodeMustache, enc);
      const expected = `<h1>{{{<%}}}title{{{%>}}}</h1>
{{{<%}}}#each foo{{{%>}}}
  {{{<%}}}#if bar{{{%>}}}
    <p>{{{<%}}}backend_content{{{%>}}}</p>
  {{{<%}}}/if{{{%>}}}
{{{<%}}}/each{{{%>}}}
<footer>{{{<%}}}{footer}{{{%>}}}</footer>
`;
      expect(tplEncodeJsonExistsBefore).to.be.false;
      expect(tplEncodeMustacheExistsBefore).to.be.false;
      expect(encoded).to.equal(expected);
    });

    it('writes the .json file for the encoded template to compile with', function () {
      const compileData = fs.readJsonSync(tplEncodeJson);

      expect(compileData['<%']).to.equal('{{');
      expect(compileData['%>']).to.equal('}}');
    });

    it('writes data to the global _data.json for rendering human-viewable patterns from the encoded templates\
', function () {
      const globalData = fs.readJsonSync(_dataJson);

      expect(_dataJsonBefore).to.equal('{}\n');
      expect(globalData['<%']).to.equal('<!--');
      expect(globalData['%>']).to.equal('-->');
    });
  });

  describe('fp tpl-compile:help', function () {
    it('prints help text', function (done) {
      fp.runSeq(
        'tpl-compile:help',
        done
      );
    });
  });
});
