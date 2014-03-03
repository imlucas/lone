console.log('js-only-app');
console.log('process', process);

var other = require('./some-other-file.js');
console.log('other', other);

other();

