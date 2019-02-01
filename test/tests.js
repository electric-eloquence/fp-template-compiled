'use strict';

const fs = require('fs-extra');
const join = require('path').join;

const expect = require('chai').expect;

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

      fp.runSequence(
        'tpl-compile',
        done
      );
    });

    it('should compile templates to the backend', function () {
      const compiled = fs.readFileSync(tplCompileHbs, enc);
      const expected = `<h1>{{title}}</h1>
{{#each foo}}
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
{{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(tplCompileHbsExistsBefore).to.equal(false);
      expect(compiled).to.equal(expected);
    });

    it('should include partial templates in the compiled template', function () {
      const compiled = fs.readFileSync(tplCompileHbs, enc);
      const contained = `
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
`;
      expect(compiled).to.contain(contained);
    });

    it('should compile templates to an alternate backend directory with alternate extension', function () {
      const compiled =
        fs.readFileSync(tplCompileWLocalYml, enc);
      const expected = `<h1>{{title}}</h1>
{{#each foo}}
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
{{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(tplCompileWLocalYmlExistsBefore).to.equal(false);
      expect(compiled).to.equal(expected);
    });

    it(
      'should include partial templates in the template compiled to the alternate backend directory with alternate extension',
      function () {
        const compiled =
          fs.readFileSync(tplCompileWLocalYml, enc);
        const contained = `
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
`;
        expect(compiled).to.contain(contained);
      }
    );
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
      fp.runSequence(
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

    it('should encode backend template into Fepper templates', function () {
      const encoded = fs.readFileSync(tplEncodeMustache, enc);
      const expected = `<h1>{{{<%}}}title{{{%>}}}</h1>
{{{<%}}}#each foo{{{%>}}}
  {{{<%}}}#if bar{{{%>}}}
    <p>{{{<%}}}backend_content{{{%>}}}</p>
  {{{<%}}}/if{{{%>}}}
{{{<%}}}/each{{{%>}}}
<footer>{{{<%}}}{footer}{{{%>}}}</footer>
`;
      expect(tplEncodeJsonExistsBefore).to.equal(false);
      expect(tplEncodeMustacheExistsBefore).to.equal(false);
      expect(encoded).to.equal(expected);
    });

    it('should write the .json file for the encoded template to compile with', function () {
      const compileData = fs.readJsonSync(tplEncodeJson);

      expect(compileData['<%']).to.equal('{{');
      expect(compileData['%>']).to.equal('}}');
    });

    it(
      'should write data to the global _data.json for rendering human-viewable patterns from the encoded templates',
      function () {
        const globalData = fs.readJsonSync(_dataJson);

        expect(_dataJsonBefore).to.equal('{}\n');
        expect(globalData['<%']).to.equal('{{');
        expect(globalData['%>']).to.equal('}}');
      }
    );
  });
});
