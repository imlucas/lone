# roadmap

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
