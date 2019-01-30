# Template Compile extension for Fepper

## Export fully recursed templates in your backend's templating language.

### Commands

```shell
fp tpl-compile
fp tpl-encode:hbs -e .ext
```

`fp tpl-compile` will export templates from the `source/_patterns/03-templates` 
directory, similar to the way that `fp template` does. However, the outputted 
templates will include all partials, without them needing to be explicitly 
included with a `.mustache` extension.

The tags within will most likely need to be translated from Fepper's Mustache 
syntax 
(<a href="https://github.com/electric-eloquence/feplet" target="_blank">Feplet</a>) 
into the language and syntax by which they will be appropriated. Do not assign 
the translated values in the template's .yml file. Instead, in the `.mustache` 
file, wrap the tags in triple curly braces, and assign the translated values to 
their corresponding keys in the template's `.json` file.

In the template's `.yml` file, assign the destination directory to a `tpl_compile_dir` 
key, and the destination file's extension to a `tpl_compile_ext` key.

Stashes (the symbols used to demarcate tags) must be escaped by replacing them 
with a different delimiter (ERB notation, as exemplified in the 
<a href="https://mustache.github.io/mustache.5.html#Set-Delimiter" target="_blank">Mustache docs</a>) 
and then surrounding them in triple curly braces. The `.json` file specific to 
the template should declare `<%` and `%>` keys and have them evaluate to `{{` 
and `}}` respectively. In the global `_data.json` file, they should evaluate to 
`<!--` and `-->` so they can be ignored by humans viewing the UI.

`fp tpl-encode:hbs` automates this. It translates backend templates to templates 
Fepper can consume. Assuming the backend template is fully fleshed out, copy 
it to `source/patterns/03-templates`. Do not change its name. Then, run the 
command with the extension used by the backend (probably ".hbs").

`fp tpl-encode:hbs` will also update the data schema to correctly render the 
encoded tags both within the Fepper UI, and for export by `fp tpl-compile`. One 
gotcha to be aware of is that underscore-prefixed hidden files should not have a 
corresponding .json file. Underscore-prefixed .json will get compiled into 
`source/_data/data.json`, possibly overwriting values for `<%` and `%>`.

`fp tpl-encode:hbs` only works with Handlebars at the moment, but will likely be 
expanded to process more templating languages.

The output HTML will be formatted by 
<a href="https://github.com/beautify-web/js-beautify" target="_blank">js-beautify</a>. 
To override the default configurations, modify the .jsbeautifyrc file at the 
root of Fepper.

### Example

##### source/\_patterns/03-templates/example.mustache:

```handlebars
<h1>{{{<%}}} title {{{%>}}}</h1>
{{> 00-elements/paragraph }}
<footer>{{{<%}}}{ footer }{{{%>}}}</footer>
```

##### source/\_patterns/03-templates/example.json:

```
{
  "<%": "{{",
  "%>": "}}"
}
```

##### source/\_patterns/03-templates/example.yml:

```yaml
tpl_compile_dir: docroot/templates
tpl_compile_ext: .hbs
```

##### source/\_patterns/00-elements/paragraph.mustache:

```handlebars
<p>{{{<%}}} content {{{%>}}}{{ placeholder_content }}</p>
```

##### source/\_patterns/00-elements/paragraph.json:

```
{
  "placeholder_content": "Lorem ipsum",
}
```

##### source/\_data/\_data.json:

```
{
  "<%": "<!--",
  "%>": "-->"
}
```

##### Compiles to backend/docroot/templates/example.hbs:

```handlebars
<h1>{{ title }}</h1>
<p>{{ content }}</p>
<footer>{{{ footer }}}</footer>
```
