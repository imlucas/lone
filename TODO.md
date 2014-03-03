## roadmap brainstorm

### poc


- switch from current zip to tar so adm-zip can be ditched
- use the basename of process.execPath as the directory to fill in tmp
- run strip on node binary before adding app bundle?
- use `./bin/<name>` convention instead of package.json#main
- how to get the early bits for autoupdate in so `_third_party_main.js` never
    has to change? ideas:
    - `uncat`
        split node executable from the app tarball
        - applying an update would just be as simple as jamming a new app
            bundle on the end of the binary and restarting the app
    - `boundary`
        - multiple tarballs in a single binary
        - facility for storing meta/user preferences directly in the binary
        - download new app bundle -> add new boundary with version in it ->
            add new add bundle -> update user preference boundary
        - super benefits to POC
            - don't need a shit ton of readUInt32LE's to search for zlib start header

### container

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
- _from this point on, all new features should be their own modules_

### `lone-ui`

- tada!  it's just using node-webkit under the hood
- `lone` is just a passthrough

### `lone-prebake`

- no gcc required
- pre-built node binaries
    - upload to github
    - can make `./bin/lone` just wget + cat
- module-foundry'ish deploy
    - has the full toolchain for different platforms
    - make an api call, get back mongodb module built for OSX 64 as a tarball
- example ui app for `lone` so you don't need *any of the platform toolchain*

### `lone-installer`

- generate windows .msi, osx .app, .rpm etc
- definite advantages to being able to "install permanently"
- new `lone-installer` bin

### autoupdate

- like `esky` from pyqt land
- just need a few enhancements to `sterno` for this
- handles the business logic of phoning home, pulling down new app bundles etc
- app bin just needs to launch an autoupdate watcher process that polls every
    few hours
