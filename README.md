# Exporter of compiled templates - extension for Fepper

### Commands
```shell
fp tpl-compile
```

`fp tpl-compile` will export templates from the `source/_patterns/03-templates` 
directory, similar to the way that `fp template` does. However, the outputted 
template will include all partials, without them needing to be explicitly 
included with a `.mustache` extension.

The tags wthin will most likely need to be translated from the Pattern Lab 
Mustache syntax into the language and syntax by which they will be appropriated. 
Do not assign the translated values in the template's YAML file. Instead, in the 
Mustache file, wrap the tags in triple curly braces, and assign the translated 
values to their corresponding keys in the template's JSON file.

In the template's YAML file, assign the destination directory to a `tpl_compile_dir` 
key, and the destination file's extension to a `tpl_compile_ext` key.
