var app
  , path = require("path")
  , http = require("http")
  , connect = require("connect")
  , express = require("express")
  , routes = require("./config/routes")
  , settings = require("nconf");

app = express();
settings
    .argv()
    .env()
    .file({ file: "./config/" + app.settings.env + ".json" });

app.configure(function () {
    app.set("port", settings.get("port") || settings.get("server:port"));
    app.use(connect.compress());
    app.use(express.static(path.join(__dirname, "public"), { maxAge: settings.get("maxAge") }));
    app.use(express.favicon(__dirname + "/public/favicon.ico"), { maxAge: 25920000000 });
    app.use(express.logger("dev"));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser(settings.get("server:cookieSecret")));
    app.use(app.router);
    routes(app);
    app.use(express.errorHandler());
});

http.createServer(app).listen(app.get("port"), function () {
    var environment = process.env.NODE_ENV || "unknown";
    console.log(["Express server listening on port ", app.get("port"), " (", environment, ")"].join(''));
});
