module.exports = function (grunt) {

    grunt.initConfig({

        watch: {
            javascripts: {
                files: ['components/*.js', 'components/**/*.js', 'public/javascripts/**.js', '!public/javascripts/**.min.js'],
                tasks: ['browserify']
            }
        },

        browserify: {
            client: {
                src: ['components/*.js', 'components/**/*.js'],
                dest: 'public/lib/app.js',
                options: {
                    require: ['jquery'],
                }
            }
        },

        nodemon: {
            web: {
                script: 'app.js',
                options: {
                    file: 'app.js',
                    ignore: ['README.md', 'LICENSE', 'index.html', 'Procfile', 'bower.json',
                        'public/**', 'package.json', 'config-sample.json'],
                    watch: ['config', 'node_modules', '!public'],
                    delayTime: 1,
                    cwd: __dirname
                }
            }
        },

        concurrent: {
            target: {
                tasks: ['watch', 'nodemon:web'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('server', ['browserify', 'nodemon:web']);
    grunt.registerTask('server:watch', ['browserify', 'concurrent']);
    grunt.registerTask('default', ['server']);

};
