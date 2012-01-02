#!/usr/bin/env node

var embedify = require('embedify');
var fs = require('fs');

var argv = require('optimist')
  .option('require', {
    alias: 'r',
    desc: 'Name of module or file to require'
  })
  .option('outfile', {
    alias: 'o',
    desc: 'Filename of resultant bundle'
  })
  .argv;

var bundle = embedify();

bundle.embed(argv.require);

fs.writeFile(argv.outfile, bundle.bundle(), function() {
    console.log("Written bundle to " + argv.outfile);
});
