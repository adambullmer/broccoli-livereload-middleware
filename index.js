var broccoli   = require('broccoli'),
    debug      = require('debug')('broccoli-livereload-middleware'),
    Watcher    = require('broccoli-sane-watcher'),
    middleware = require('broccoli/lib/middleware'),
    HashTree   = require('broccoli-live-reload/lib/hash-tree'),
    Sync       = require('tree-sync'),
    path       = require('path'),
    LrServer   = require('tiny-lr').Server,
    tree       = broccoli.loadBrocfile(),
    builder    = new broccoli.Builder(tree),
    watcher    = new Watcher(builder, { verbose: true });

function BroccoliMiddleware (config) {
    var destDir = path.resolve(config.destDir || 'dist'),
        port    = config.port || 35729;

    debug('livereload server running on port %d', port);
    debug('syncing changes to destination directory %s', destDir);

    this.lrServer = new LrServer();
    this.lrServer.listen(port, this.onError.bind(this));

    watcher.then(this.syncChanges.bind(this, destDir));
    watcher.on('change', this.onChange.bind(this, destDir));

    return middleware(watcher);
}

BroccoliMiddleware.prototype.syncChanges = function (destDir, results) {
    debug('syncChanges: destDir: %s, results.directory: %s', destDir, results.directory);

    return new Sync(results.directory, destDir).sync();
};

BroccoliMiddleware.prototype.onError = function (error) {
    if (error) {
        console.error(error.stack || error);
    }
};

BroccoliMiddleware.prototype.computeHashes = function (destDir, tree, error, nodes) {
    if (error) {
        return this.onError(error);
    }

    if (!this.tree) {
        this.tree = tree;

        return;
    }

    var diffs = this.tree.computeDiff(nodes).map(function ( file ) {
        return path.join(destDir, file);
    });

    debug('detected diffs: ' + diffs);

    if (!diffs.length) {
        this.tree = tree;

        return;
    }

    this.lrServer.changed({
        body: {
            files: diffs
        }
    });

    this.tree = tree;
};

BroccoliMiddleware.prototype.onChange = function (destDir, result) {
    debug('Change detected');
    var tree = new HashTree(result.directory, {
        path: destDir
    });

    this.syncChanges(destDir, result);
    tree.computeHashes(this.computeHashes.bind(this, destDir, tree));
};

module.exports = BroccoliMiddleware;
