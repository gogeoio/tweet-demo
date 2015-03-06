/**
 * Created by danfma on 05/03/15.
 */

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    tsc = require("gulp-tsc"),
    rename = require("gulp-rename"),
    ignore = require("gulp-ignore"),
    minifyCSS = require("gulp-minify-css"),
    uglify = require("gulp-uglify");


/**
 * Completa o caminho para um caminho no diretório de componentes do bower.
 */
function atBower(path) {
    return "./bower_components/" + path;
}


gulp.task("copyResources", function() {
    return gulp.src(["app/**/*.html"]).pipe(gulp.dest("./dist"));
});


gulp.task("bundleCSS", function() {
    var filesToBundle = [
        atBower("bootstrap/dist/css/bootstrap.css"),
        atBower("bootstrap/dist/css/bootstrap-theme.css"),
        atBower("mapbox.js/mapbox.css"),
        "app/shared/gogeo-workspace.css"
    ];

    return gulp.src(filesToBundle)
        .pipe(concat("gogeo-tweet.css"))
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest("./dist"));
});


gulp.task("bundleCoreJS", function() {
    var filesToBundle = [
        atBower("jquery/dist/jquery.js"),
        atBower("bootstrap/dist/js/bootstrap.js"),
        atBower("angular/angular.js"),
        atBower("angular-route/angular-route.js"),
        atBower("mapbox.js/mapbox.js")
    ];

    return gulp.src(filesToBundle)
        .pipe(concat("gogeo-core.js"))
        .pipe(uglify())
        .pipe(gulp.dest("./dist"));
});

/**
 * Agrupa todos os javascripts em um bundle único.
 */
gulp.task("bundleTS", function() {
    return gulp.src("./app/**/*.ts")
        .pipe(tsc({ out: "gogeo-tweet.js" }))
        .pipe(rename("gogeo-tweet.js"))
        .pipe(gulp.dest("./dist"));
});


gulp.task("default", [
    "copyResources",
    "bundleCSS",
    "bundleCoreJS",
    "bundleTS"
]);


gulp.task("watch", ["default"], function() {
    gulp.watch(["./app/**/*.ts"], ["bundleTS"]);
    gulp.watch(["./app/**/*.css"], ["bundleCSS"]);
    gulp.watch(["./app/**/*.html"], ["copyResources"]);
});

