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
function fromBower(path) {
    return "./bower_components/" + path;
}


gulp.task("copyResources", function() {
    return gulp
        .src([
            fromBower("bootstrap/dist/**/*.ttf"),
            fromBower("bootstrap/dist/**/*.woff"),
            fromBower("bootstrap/dist/**/*.woff2"),
            fromBower("bootstrap/dist/**/*.eot"),
            fromBower("bootstrap/dist/**/*.svg"),
            fromBower("leaflet/dist/**/*.jpg"),
            fromBower("leaflet/dist/**/*.png"),
            fromBower("leaflet/dist/**/*.svg"),
            fromBower("mapbox.js/**/*.jpg"),
            fromBower("mapbox.js/**/*.png"),
            fromBower("mapbox.js/**/*.svg"),
            fromBower("font-awesome/**/*.otf"),
            fromBower("font-awesome/**/*.eot"),
            fromBower("font-awesome/**/*.svg"),
            fromBower("font-awesome/**/*.ttf"),
            fromBower("font-awesome/**/*.woff"),
            fromBower("font-awesome/**/*.woff2"),
            "app/**/*.html",
            "app/**/*.jpg",
            "app/**/*.png",
        ])
        .pipe(gulp.dest("./dist"));
});


gulp.task("bundleCSS", function() {
    var filesToBundle = [
        fromBower("bootstrap/dist/css/bootstrap.css"),
        fromBower("bootstrap/dist/css/bootstrap-theme.css"),
        fromBower("bootstrap-datepicker/css/datepicker3.css"),
        fromBower("font-awesome/css/font-awesome.css"),
        fromBower("mapbox.js/mapbox.css"),
        "app/**/*.css"
    ];

    return gulp.src(filesToBundle)
        .pipe(concat("gogeo-tweet.css"))
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest("./dist"));
});


gulp.task("bundleCoreJS", function() {
    var filesToBundle = [
        fromBower("jquery/dist/jquery.js"),
        fromBower("bootstrap/dist/js/bootstrap.js"),
        fromBower("bootstrap-datepicker/js/bootstrap-datepicker.js"),
        fromBower("angular/angular.js"),
        fromBower("angular-route/angular-route.js"),
        fromBower("mapbox.js/mapbox.js")
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

