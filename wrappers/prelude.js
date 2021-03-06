var require = function (file, cwd) {
  try {
    var resolved = require.resolve(file, cwd || '/');
  }
  catch (e) {
    var resolved = null;
  }
  var mod = require.modules[resolved];
  if (!mod) return __require(file);
  var res = mod._cached ? mod._cached.exports : mod();
  return res;
}

require.path = __require('path');

require.paths = [];
require.modules = {};
require.extensions = $extensions;

require._core = { 
    'pkginfo': true
}

require.resolve = (function () {
  return function (x, cwd) {
    if (!cwd) cwd = '/';
    
    if (require._core[x]) return x;
    var path = require.path;
    var y = cwd || '.';
    
    if (x.match(/^(?:\.\.?\/|\/)/)) {
      var m = loadAsFileSync(path.resolve(y, x))
          || loadAsDirectorySync(path.resolve(y, x));
      if (m) return m;
    }
    
    var n = loadNodeModulesSync(x, y);
    if (n) return n;
    
    throw new Error("Cannot find module '" + x + "'");

    function loadAsFileSync (x) {
      if (require.modules[x]) {
        return x;
      }
        
      for (var i = 0; i < require.extensions.length; i++) {
        var ext = require.extensions[i];
        if (require.modules[x + ext]) return x + ext;
      }
    }
    
    function loadAsDirectorySync (x) {
      x = x.replace(/\/+$/, '');
      var pkgfile = x + '/package.json';
      if (require.modules[pkgfile]) {
        var pkg = require.modules[pkgfile]();
        var b = pkg.embedify;
        if (typeof b === 'object' && b.main) {
          var m = loadAsFileSync(path.resolve(x, b.main));
          if (m) return m;
        }
        else if (typeof b === 'string') {
          var m = loadAsFileSync(path.resolve(x, b));
          if (m) return m;
        }
        else if (pkg.main) {
          var m = loadAsFileSync(path.resolve(x, pkg.main));
          if (m) return m;
        }
      }
        
      return loadAsFileSync(x + '/index');
    }
    
    function loadNodeModulesSync (x, start) {
      var dirs = nodeModulesPathsSync(start);
      for (var i = 0; i < dirs.length; i++) {
        var dir = dirs[i];
        var m = loadAsFileSync(dir + '/' + x);
        if (m) return m;
        var n = loadAsDirectorySync(dir + '/' + x);
        if (n) return n;
      }
      
      var m = loadAsFileSync(x);
      if (m) return m;
    }
    
    function nodeModulesPathsSync (start) {
      var parts;
      if (start === '/') parts = [ '' ];
      else parts = path.normalize(start).split('/');
        
      var dirs = [];
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] === 'node_modules') continue;
        var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
        dirs.push(dir);
      }
        
      return dirs;
    }
  };
})();

require.alias = function (from, to) {
  var path = require.path;
  var res = null;
  try {
    res = require.resolve(from + '/package.json', '/');
  }
  catch (err) {
    res = require.resolve(from, '/');
  }

  // Alias modules/directories
  if (require.extensions.indexOf(path.extname(res)) === -1) {
    var basedir = path.dirname(res);
    var keys = Object.keys(require.modules);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.slice(0, basedir.length + 1) === basedir + '/') {
        var f = key.slice(basedir.length);
        require.modules[to + f] = require.modules[basedir + f];
      }
      else if (key === basedir) {
        require.modules[to] = require.modules[basedir];
      }
    }
  }
  // Alias single files
  else {
    require.modules[to] = require.modules[from];
  }
};

require.define = function (filename, fn) {
  var dirname = require._core[filename]
      ? ''
      : require.path.dirname(filename);
    
  var require_ = function (file) {
    return require(file, dirname)
  };

  require_.resolve = function (name) {
    return require.resolve(name, dirname);
  };
  require_.modules = require.modules;
  require_.define = require.define;
  var module_ = { exports: {}, filename: filename, embedified: true };
    
  require.modules[filename] = function () {
    require.modules[filename]._cached = module_;
    fn.call(
      module_.exports,
      require_,
      module_,
      module_.exports,
      dirname,
      filename
    );
    require.modules[filename]._cached = module_;
    return module_.exports;
  };
};
