/**
 * Created by danfma on 05/03/15.
 */

var gulp = require("gulp"),
    concat = require("gulp-concat"),
    tsc = require("gulp-tsc"),
    rename = require("gulp-rename"),
    ignore = require("gulp-ignore"),
    minifyCSS = require("gulp-minify-css"),
    uglify = require("gulp-uglify"),
    less = require("gulp-less");


var environment = "development";


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
            fromBower("leaflet-draw/dist/**/*.png"),
            "./lib/**/*.png",
            "app/**/*.png",
            "app/**/*.html",
            "app/**/*.jpg"
        ])
        .pipe(gulp.dest("./dist"));
});

gulp.task("copySharedResources", function() {
    return gulp
        .src([
            "./app/shared/**/*.png",
            "./app/shared/**/*.html",
            "./app/shared/**/*.jpg"
        ])
        .pipe(gulp.dest("./dist/dashboard"));
});

gulp.task("bundleCSS", function() {
    gulp.src("./app/**/*.less")
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest("./app"));

    var filesToBundle = [
        fromBower("bootstrap/dist/css/bootstrap.css"),
        fromBower("bootstrap/dist/css/bootstrap-theme.css"),
        fromBower("bootstrap-datepicker/css/datepicker3.css"),
        fromBower("bootstrap-tagsinput/dist/bootstrap-tagsinput.css"),
        fromBower("font-awesome/css/font-awesome.css"),
        fromBower("mapbox.js/mapbox.css"),
        fromBower("leaflet-draw/dist/leaflet.draw.css"),
        "./lib/css/MarkerCluster.css",
        "./lib/css/MarkerCluster.Default.css",
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
        fromBower("bootstrap-tagsinput/dist/bootstrap-tagsinput.js"),
        fromBower("angular/angular.js"),
        fromBower("angular-route/angular-route.js"),
        fromBower("angularytics/dist/angularytics.min.js"),
        fromBower("mapbox.js/mapbox.js"),
        fromBower("leaflet-draw/dist/leaflet.draw.js"),
        fromBower("leaflet-plugins/layer/tile/Google.js"),
        fromBower("rxjs/dist/rx.lite.js"),
        fromBower("rxjs/dist/rx.lite.compat.js"),
        fromBower("linqjs/linq.js"),
        fromBower("numeral/min/numeral.min.js"),
        fromBower("numeral/min/languages.min.js"),
        fromBower("angular-linkify/angular-linkify.min.js"),
        fromBower("momentjs/min/moment-with-locales.min.js"),
        fromBower("ngGeolocation/ngGeolocation.min.js"),
        "app/shared/support/rx-angular.js",
        "./lib/js/leaflet.tilecluster.js",
        "./config/" + environment + ".js"
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
        .pipe(tsc({ out: "gogeo-tweet.js", target: "ES5" }))
        .pipe(rename("gogeo-tweet.js"))
        .pipe(gulp.dest("./dist"));
});

gulp.task("default", [
    "copyResources",
    "copySharedResources",
    "bundleCSS",
    "bundleCoreJS",
    "bundleTS"
]);

gulp.task("deploy", function() {
    environment = "deployment";
    gulp.start("default");
});

gulp.task("watch", ["default"], function() {
    gulp.watch(["./app/**/*.ts"], ["bundleTS"]);
    gulp.watch(["./app/**/*.less"], ["bundleCSS"]);
    gulp.watch(["./app/**/*.html"], ["copyResources"]);
    gulp.watch(["./app/shared/**/*.png"], ["copySharedResources"]);
});