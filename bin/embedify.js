#!/usr/bin/env node

var embedify = require('embedify');
var fs = require('fs');
var path = require('path');

var argv = require('optimist')
  .demand(['embed', 'outfile'])
  .usage('Usage: $0 -e [module] -o [bundle] [options]')
  .option('embed', {
    alias: 'e',
    desc: 'Module name or filename of primary module to embed'
  })
  .option('outfile', {
    alias: 'o',
    desc: 'Filename of the resultant bundle'
  })
  .option('require', {
    alias: 'r',
    desc: 'Include additional modules or files in bundle: "module:target:basedir"'
  })
  .option('alias', {
    alias: 'a',
    desc:  'Register an alias with a colon separator: "to:from"'
  })
  .argv;

var bundle = embedify();

([].concat(argv.require || [])).forEach(function (req) {
    if (req.match(/:/)) {
        var s = req.split(':'), opts = {};

        if (s[1]) opts.target  = s[1];
        if (s[2]) opts.basedir = path.resolve(process.cwd(), s[2]);

        bundle.require(s[0], opts);
    }
    else {
        bundle.require(req);
    }
});

([].concat(argv.alias || [])).forEach(function (alias) {
    if (!alias.match(/:/)) {
        console.error('aliases require a colon separator');
        process.exit();
    }
    bundle.alias.apply(bundle, alias.split(':'));
});

bundle.embed(argv.embed);

fs.writeFile(argv.outfile, bundle.bundle(), function() {
    console.log("Wrote bundle to " + argv.outfile);
});
