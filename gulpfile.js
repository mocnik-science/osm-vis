'use strict'

let copy = require('gulp-copy')
let del = require('del')
let gulp = require('gulp')
let merge = require('merge-stream')

let wwws = ['./osm-tags-history-wiki']
let wwwDist = './www-dist/'

gulp.task('default', ['clean'], () => merge(
    gulp.src([
            'data/**',
            'src/**',
        ])
        .pipe(copy(wwwDist)),
    gulp.src([
            'osm-tags-history-wiki/index.html',
        ])
        .pipe(copy(wwwDist))
    ))
gulp.task('clean', () => del([wwwDist]))
