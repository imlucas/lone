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
