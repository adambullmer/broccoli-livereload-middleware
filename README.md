# broccoli-livereload-middleware
Middleware to build broccoli apps with a livereload server

## Config Options
| Option    | Default Value | Description |
|-----------|---------------|-------------|
| `destDir` | `dist`        | Broccoli build destination directory. This is where the output of the broccoli build routine will go |
| `port`    | `35729`       | Port for the livereload server to listen on |

## Usage
Example express application

```js
var express            = require('express'),
    BroccoliMiddleware = require('broccoli-livereload-middleware'),
    app                = express(),
    serverDir          = process.cwd() + '/dist';

app.set('port', 4200);

app.use(new BroccoliMiddleware({
    destDir: serverDir
}));
app.use(express.static(serverDir));

// Only enable if html5 routing is turned on
// Enable HTML5 routing by creating a catchall route
app.all('/*', function (req, res) {
    res.sendFile(serverDir + '/index.html');
});

module.exports = app.listen(app.get('port'), function () {
    var port   = chalk.green(app.get('port')),
        cancel = chalk.red('Ctrl + C');

    console.log("Express server listening on port " + port + ' (Press ' + cancel + ' to stop)');
});
```

## Debugging
This plugin utilizes the [debug](https://www.npmjs.com/package/debug) npm module. Activate by prefixing your node command with the `DEBUG` enviroinment variable: `DEBUG=broccoli-livereload-middleware`
