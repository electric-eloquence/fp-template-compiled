'use strict';

const fs = require('fs');
const join = require('path').join;

const expect = require('chai').expect;

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = __dirname;
const fp = require('fepper/tasker');
require('../tpl-compile~extend');

const enc = 'utf8';

describe('fp-tpl-compile', function () {
  describe('fp tpl-compile', function () {
    before(function (done) {
      fp.runSequence(
        'tpl-compile',
        done
      );
    });

    it('should compile templates to the backend', function () {
      const compiled = fs.readFileSync(join(__dirname, 'backend/docroot/tpl-compile.hbs'), enc);
      const expected = `<h1>{{title}}</h1>
{{#each foo}}
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
{{/each}}
<footer>{{{footer}}}</footer>
`;
      expect(compiled).to.equal(expected);
    });

    it('should include partial templates in the compiled template', function () {
      const compiled = fs.readFileSync(join(__dirname, 'backend/docroot/tpl-compile.hbs'), enc);
      const contained = `
  {{#if bar}}
    <p>{{backend_content}}</p>
  {{/if}}
`;
      expect(compiled).to.contain(contained);
    });
  });

  describe('fp tpl-encode:hbs', function () {
    before(function (done) {
      fs.writeFileSync(join(__dirname, 'source/_data/_data.json'), '{}\n');
      fs.copyFileSync(
        join(__dirname, 'backend/docroot/tpl-encode.hbs'),
        join(__dirname, 'source/_patterns/03-templates/tpl-encode.hbs')
      );
      if (fs.existsSync(join(__dirname, 'source/_patterns/03-templates/tpl-encode.mustache'))) {
        fs.unlinkSync(join(__dirname, 'source/_patterns/03-templates/tpl-encode.mustache'));
      }
      fp.runSequence(
        'tpl-encode:hbs',
        done
      );
    });

    it('should include partial templates in the compiled template', function () {
      const encoded = fs.readFileSync(join(__dirname, 'source/_patterns/03-templates/tpl-encode.mustache'), enc);
      const expected = `<h1>{{{<%}}}title{{{%>}}}</h1>
{{{<%}}}#each foo{{{%>}}}
  {{{<%}}}#if bar{{{%>}}}
    <p>{{{<%}}}backend_content{{{%>}}}</p>
  {{{<%}}}/if{{{%>}}}
{{{<%}}}/each{{{%>}}}
<footer>{{{<%}}}{footer}{{{%>}}}</footer>
`;
      expect(encoded).to.equal(expected);
    });
  });
});
