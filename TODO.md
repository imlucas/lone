# roadmap

## poc

- [x] use the basename of process.execPath as the directory to fill in tmp
- [x] run strip on node binary before adding app bundle?
- [x] use `./bin/<name>` convention instead of package.json#main
- [x] clean up test fixture apps and have reliable fixtures
- [x] more tests for `lib/source`
- [x] more tests for `lib/deliver`
- [x] more tests for `lib/bundle`
- [x] more tests for embedding
- [x] tests against a binary add-on

## alpha

- [ ] binary add-on's: need to run `npm install` using `./deps/npm/bin/npm` ->
    add to `src/node.js`: `!process.env.SKIP_THIRD_PARTY`
- [ ] build a few things for mongodb and leveldb
- [ ] fire up vagrant and make sure things are good on ubuntu 64
- [ ] simple streaming zip module that actually works to replace adm-zip

## `lone-ui`

> **idea** add a switch to lone for building standalones against `node-webkit` for
    when you want everything

- [ ] munge `package.json` so node-webkit is happy with it
- [ ] helpers for platform, eg current bits, osx or win
- [ ] download & cache the right prebuilt node-webkit binary
- [ ] new `--ui` flow that cat's on `node-webkit` instead of `node`

## `lone-prebake`

> **idea** don't need to have access to any of the platforms and their tool chains.

- [ ] pre-build binaries and upload to github
- [ ] module-foundry'ish deploy for building platform specific cache of packages
    that need binary add-ons
- [ ] example ui app for `lone`

## `lone-installer`

> **idea** definite advantages to being able to "install permanently"

- [ ] windows .msi
- [ ] osx .app
- [ ] deb or rpm
- [ ] new `--installer` flow

## brainstorm

### binary add-ons

```
rm -rf /var/folders/wm/3kkwvb0d2rl96xgn8wrc6px80000gn/T/bsonic/
rm -rf test/fixtures/bsonic/.dist/
rm -rf test/fixtures/bsonic/.build/
rm -rf test/fixtures/bsonic/node_modules/
SKIP_THIRD_PARTY=1 ../../.lone/node-v0.10.26/out/Release/node ../../.lone/node-v0.10.26/deps/npm/bin/npm-cli.js install
DEBUG=lone:* ./node_modules/.bin/mocha test/bsonic.test.js --timeout 60000
```

Still getting

```
module.js:356
  Module._extensions[extension](this, filename);
                               ^
Error: dlopen(/private/var/folders/wm/3kkwvb0d2rl96xgn8wrc6px80000gn/T/bsonic/node_modules/bson/build/Release/bson.node, 1): no suitable image found.  Did find:
    /private/var/folders/wm/3kkwvb0d2rl96xgn8wrc6px80000gn/T/bsonic/node_modules/bson/build/Release/bson.node: unknown file type, first eight bytes: 0xEF 0xBF 0xBD 0xEF 0xBF 0xBD 0xEF 0xBF
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Module.require (module.js:364:17)
    at require (module.js:380:17)
    at Object.<anonymous> (/private/var/folders/wm/3kkwvb0d2rl96xgn8wrc6px80000gn/T/bsonic/node_modules/bson/ext/index.js:14:9)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Module.require (module.js:364:17)
```


### container/launcher

- multiple node apps/other binaries in a wrapper app
- sometimes referred to as launcher
- convention for nested launchers:
    - app name is `knife`, so single executable filename == `knife`
    - idea for tree convention:
    ```
    .
    └── bin
        ├── knife
        ├── knife-bundle
        ├── knife-compile
        ├── knife-ui
        ├── knife-ui-bundle
        └── knife-ui-installer
    ```
- user can just run `knife`, `knife bundle`, `knife ui`, `knife ui bundle` etc
- *all* implementation in userland
    - fight it out over optimist vs whatever for arg parsing
    - want `knife` by default to launch `knife-watch` which launches some other things?
        cool just `require('forever')` in `knife`
- stupid simple to write a bin that, say, by default, you know, launches a
    database process with a REST API process to talk to said database and
    automatically restarts them should either die for some reason.  wink wink.
- can just include other binaries, say from `go build` or a cpp make pipeline,
    in the container app and they will just be included in the tarball when
    the app is packaged
