# Template Compile extension for Fepper

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

## Export fully recursed templates in your backend's template language.

This extension exports templates from the `source/_patterns/03-templates` 
directory to the backend, similar to the way that `fp template` does. However, 
the output will compile all included partials. Furthermore, this extension 
obviates the need to declare a translation for each tag.

This should prove to be a simpler alternative to Fepper core's `fp template` 
task, but it is probably not appropriate for many CMSs (like Drupal and 
WordPress) for which `fp template` was originally designed.

Instead, this extension is more suitable for Express-like applications, where 
any number of routes can be assigned a unique template for rendering HTML. 
Unlike Drupal and WordPress, instead of the backend trying to determine which 
partial goes where, the inclusion of partials, as appropriate per route, would 
be prototyped in Fepper. Running `fp tpl-compile` would then compile a single 
template per route.

### Commands

#### `fp tpl-compile`

This does the compilation as described in the first paragraph. You will still 
normally need to translate from Fepper's Mustache syntax 
(<a href="https://github.com/electric-eloquence/feplet" target="_blank">Feplet</a>) 
to the backend's template language. `fp tpl-compile` leverages normal Feplet 
rendering, but targets the tag delimiters instead of the entire tag. You are 
free to use any alternate delimiter, but we recommend ERB notation, as 
exemplified in the 
<a href="https://mustache.github.io/mustache.5.html#Set-Delimiter" target="_blank">Mustache docs</a>. 
Wrap them in triple curly braces and use them as opening and closing delimiters. 
Use these wrapped delimiters to surround tags destined for the backend. In the 
example of ERB alternate delimiters and regular `{{` and `}}` delimiters for the 
backend, the `.json` file specific to the Fepper template must declare `<%` and 
`%>` keys and have their values be `{{` and `}}` respectively. In 
`source/_data/_data.json` file, their values should be `<!--` and `-->` so they 
can be ignored by humans viewing the UI.

Each template that is to be compiled requires a `.json` file with alternate and 
backend delimiter declarations. While this may appear to be unnecessarily 
repetitive, it leverages normal Fepper rendering, instead of hacking around it. 
It also avoids the chaos that global configurations for opening and closing 
delimiters for alternate and backend tags would instill. (Yes, that's four 
configurations. Yes, their keys would be long and/or unguessable.)

The `tpl_compile_dir` and `tpl_compile_ext` preferences need to be configured in 
`pref.yml` or the template's `.yml` file. In this way, `fp tpl-compile` will 
know where to write, and what extension to use.

#### `fp tpl-encode:hbs -e .ext`

`fp tpl-encode:hbs` works in the reverse direction. It encodes backend templates 
for use as Fepper templates, which can in turn, be compiled back to the backend. 
Assuming the backend template is fully fleshed out, copy it to 
`source/patterns/03-templates`. Do not change its name. Then, run the command 
with the extension used by the backend. The copied backend template in 
`source/patterns/03-templates` will be replaced by a `.mustache` file, 
accompanied by a `.json` file.

The `.json` file will declare ERB notation for alternate delimiters. The encoder 
will also add the `"<%": "<!--"` and `"%>": "-->"` key-value pairs to 
`source/_data/_data.json` if they aren't there already.

One gotcha to be aware of is that underscore-prefixed hidden files must not have 
a corresponding `.json` file. Underscore-prefixed `.json` files will get 
compiled into `source/_data/data.json`, possibly overwriting values for `<%` and 
`%>`.

`fp tpl-encode:hbs` encodes any backend language with tags delimited by `{{` and 
`}}`.

The output HTML will be formatted by 
<a href="https://github.com/beautify-web/js-beautify" target="_blank">js-beautify</a>. 
To override the default configurations, modify the `.jsbeautifyrc` file at the 
root of Fepper.

### Example

##### source/\_patterns/03-templates/example.mustache:

```handlebars
<h1>{{{<%}}}title{{{%>}}}</h1>
{{> 00-elements/paragraph }}
<footer>{{{<%}}}{footer}{{{%>}}}</footer>
```

##### source/\_patterns/03-templates/example.json:

```
{
  "<%": "{{",
  "%>": "}}"
}
```

##### source/\_patterns/03-templates/example.yml (or append to pref.yml):

```yaml
tpl_compile_dir: docroot/templates
tpl_compile_ext: .hbs
```

##### source/\_patterns/00-elements/paragraph.mustache:

```handlebars
<p>{{{<%}}}backend_content{{{%>}}}{{ placeholder_content }}</p>
```

##### source/\_patterns/00-elements/paragraph.json:

```
{
  "placeholder_content": "Lorem ipsum",
}
```

##### Insert into source/\_data/\_data.json:

```
"<%": "<!--",
"%>": "-->"
```

##### Compiles to backend/docroot/templates/example.hbs:

```handlebars
<h1>{{title}}</h1>
<p>{{backend_content}}</p>
<footer>{{{footer}}}</footer>
```

[snyk-image]: https://snyk.io/test/github/electric-eloquence/fp-tpl-compile/master/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/fp-tpl-compile/master

[travis-image]: https://img.shields.io/travis/electric-eloquence/fp-tpl-compile.svg?label=mac%20%26%20linux
[travis-url]: https://travis-ci.org/electric-eloquence/fp-tpl-compile

[appveyor-image]: https://img.shields.io/appveyor/ci/e2tha-e/fp-tpl-compile.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/e2tha-e/fp-tpl-compile

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/fp-tpl-compile/master.svg
[coveralls-url]: https://coveralls.io/r/electric-eloquence/fp-tpl-compile

[license-image]: https://img.shields.io/github/license/electric-eloquence/fp-tpl-compile.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/fp-tpl-compile/master/LICENSE
