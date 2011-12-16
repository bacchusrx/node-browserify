#!/usr/bin/env node

var browserify = require('browserify');
var fs = require('fs');

var argv = require('optimist')
    .option('require', {
        alias: 'r',
        desc: 'This is the module to require'
    })
    .option('outfile', {
        alias: 'o',
        desc: 'This is the output file'
    })
    .argv;

var bundle = browserify();

bundle.require(argv.require);

bundle.addEntry('entry.js', {
    body: "nodeModule.exports = require('" + argv.require + "');"
});

fs.writeFile(argv.outfile, bundle.bundle(), function() {
    console.log("Written bundle to " + argv.outfile);
});
