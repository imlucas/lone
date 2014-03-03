module.exports = {
  setup: {
    boolean: true,
    desc: 'show some helpful setup notes'
  },
  out: {
    default: process.cwd().replace(process.env.HOME, '~') + '/.dist/{{app name}}',
    desc: 'where to deliver your app exectuable'
  },
  node: {
    default: '0.10.26',
    desc: 'node version to build against'
  },
  cache: {
    default: '~/.lone/',
    desc: 'temp-ish directory where lone can do it thing'
  }
};
