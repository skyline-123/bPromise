const rollup = require('rollup');
const { uglify } = require('rollup-plugin-uglify');
module.exports = {
  input: 'bPromise.js',
  plugins: [uglify()],
  output: {
    file: 'index.js',
    format: 'umd',
    name: 'bPromise'
  }
};