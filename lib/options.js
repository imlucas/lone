var fs = require('fs-extra'),
  pkg = {};

try {
  pkg = JSON.parse(fs.readFileSync(process.cwd() + '/package.json'));
}
catch(e){}

pkg.lone = pkg.lone || {};

var defaults = {
  out: process.cwd() + '/dist/{{app name}}',
  cache: '~/.lone/',
  node: 'stable',
  src: process.cwd(),
  ignore: []
};

if(pkg.engines && pkg.engines.node && pkg.engines.node !== '*'){
  pkg.lone.node = pkg.engines.node;
}

for(var key in defaults){
  if(!pkg.lone[key]) pkg.lone[key] = defaults[key];
}

module.exports = {
  setup: {
    boolean: true,
    desc: 'show some helpful setup notes'
  },
  ignore: {
    default: pkg.lone.ignore,
    desc: 'extra paths to exclude from the bundle'
  },
  src: {
    default: pkg.lone.src,
    desc: 'root of your app'
  },
  out: {
    default: pkg.lone.out,
    desc: 'where to deliver your app exectuable'
  },
  node: {
    default: pkg.lone.node,
    desc: 'node version to build against'
  },
  cache: {
    default: pkg.lone.cache,
    desc: 'temp-ish directory where lone can do it\'s thing'
  }
};
