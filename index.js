var broccoli   = require('broccoli'),
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

    this.lrServer = new LrServer();
    this.lrServer.listen(port, this.onError.bind(this));

    watcher.then(this.syncChanges.bind(this, destDir));
    watcher.on('change', this.onChange.bind(this, destDir));

    return middleware(watcher);
}

BroccoliMiddleware.prototype.syncChanges = function (destDir, results) {
    return new Sync(results.directory, destDir).sync();
};

BroccoliMiddleware.prototype.onError = function (error) {
    if (error) {
        console.error(error.stack || error);
    }
};

BroccoliMiddleware.prototype.computeHashes = function (destDir, tree, err, nodes) {
    if (err) {
        return console.log(err);
    }

    if (!this.tree) {
        this.tree = tree;

        return;
    }

    var diffs = this.tree.computeDiff(nodes).map(function ( file ) {
        return path.join(destDir, file);
    });

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
    var tree = new HashTree(result.directory, {
        path: destDir
    });

    this.syncChanges.apply(this, arguments);
    tree.computeHashes(this.computeHashes.bind(this, destDir, tree));
};

module.exports = BroccoliMiddleware;
