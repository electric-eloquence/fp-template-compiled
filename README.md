# Exporter of compiled templates - extension for Fepper

### Commands
```shell
fp tpl-compile
fp tpl-encode:hbs -e "extension"
```

`fp tpl-compile` will export templates from the `source/_patterns/03-templates` 
directory, similar to the way that `fp template` does. However, the outputted 
template will include all partials, without them needing to be explicitly 
included with a `.mustache` extension.

The tags wthin will most likely need to be translated from the Pattern Lab 
Mustache syntax into the language and syntax by which they will be appropriated. 
Do not assign the translated values in the template's .yml file. Instead, in the 
Mustache file, wrap the tags in triple curly braces, and assign the translated 
values to their corresponding keys in the template's JSON file.

In the template's .yml file, assign the destination directory to a `tpl_compile_dir` 
key, and the destination file's extension to a `tpl_compile_ext` key.

`fp tpl-encode:hbs` automates the import of templates into Fepper. Since it's 
unlikely that there will ever be one-to-one compatibility between other systems 
and Fepper, the other templates' tags must be encoded for them to be usuable in 
Fepper.

Stashes (the symbols used to demarcate tags) must be escaped by URL-encoding the 
type of stash (opening or closing) and then surrounding that code in triple 
curly braces. They can then be replaced with normal data values in Fepper. In 
`source/_patterns/03-templates`, "%7B" and "%7D" should always evaluate to 
opening and closing stashes respectively. Outside that directory, they should 
evaluate to "\<!--" and "--\>" so they can be ignored by humans viewing the UI.

`fp tpl-encode:hbs` automates this. First, the backend template file must be 
copied to the directory where you wish to import it. (It must be within 
`source/patterns/03-templates`.) Then, run the command with the extension used 
by the backend template file.

`fp tpl-encode:hbs` will also update the data schema to correctly render the 
encoded tags both within the Fepper UI, and for export by `fp tpl-compile`. One 
gotcha to be aware of is that underscore-prefixed hidden files should not have a 
corresponding .json file. Underscore-prefixed .json will get compiled into 
`source/_data/data.json`, possibly overwriting values for "%7B" and "%7D".

`fp tpl-encode:hbs` only works with Handlebars at the moment, but will likely be 
expanded to process more templating languages.

P.S. While "%7B" and "%7D" literally decode to "{" and "}", it is likely that 
they will be used as keys for stashes in languages that do not use curly braces 
to demarcate tags.
