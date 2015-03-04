module.exports = function (grunt) {

    grunt.initConfig({

        watch: {
            javascripts: {
                files: ['public/javascripts/**.js', '!public/javascripts/**.min.js'],
                tasks: []
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

    grunt.registerTask('server', ['nodemon:web']);
    grunt.registerTask('server:watch', ['concurrent']);
    grunt.registerTask('default', ['server']);

};
