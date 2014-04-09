# lone.js

Turn node.js apps into standalone executables, with cross-platform and
binary add-on support.

```
npm install -g lone && lone ./path-to-app;
your app is ready: ./path-to-app/dist/app_OSX_64
```

## explain

neat trick, but how? a slight twist on how node-webkit does it.

1. get the node source
2. add `lone/_third_party_main.js` to library files in `node.gyp`
3. compile node
4. run `npm install` on `./path-to-app`
5. put everything from `./path-to-app` in a tarball
6. `mkdir -p ./path-to-app/dist && cat out/Release/node app.tar.gz > ./path-to-app/dist/app_OSX_64`
7. when `app_OSX_64`is executed, node calls `_third_party_main.js`
8. read `app_OSX_64` looking for a boundary where node stops and the app tarball begins
9. slice out the app tarball into a buffer that's inflated into a tmp directory and run
10. marinate, rotate, and cover

## license

MIT
