'use strict'

let babel = require('gulp-babel')
let cleanCss = require('gulp-clean-css')
let copy = require('gulp-copy')
let del = require('del')
let filter = require('gulp-filter')
let gulp = require('gulp')
let merge = require('merge-stream')

let wwws = ['./osm-tags-history-wiki']
let wwwDist = './www-dist/'

let pathsVisualizations = [
    'osm-tags-history-wiki/**',
]

gulp.task('default', ['clean'], () => merge(
    gulp.src([
            'data/**',
            'src/**',
        ])
        .pipe(copy(wwwDist)),
    gulp.src([
            'www/*.html',
        ])
        .pipe(copy(wwwDist, {prefix: 1})),
    gulp.src(pathsVisualizations, {base: './'})
        .pipe(filter(['**', '!**/*.css', '!**/*.js']))
        .pipe(copy(wwwDist)),
    gulp.src(pathsVisualizations, {base: './'})
        .pipe(filter('**/*.css'))
        .pipe(cleanCss())
        .pipe(gulp.dest(wwwDist)),
    gulp.src(pathsVisualizations, {base: './'})
        .pipe(filter('**/*.js'))
        .pipe(babel({
            presets: ['es2015'],
            compact: true,
            comments: false,
        }))
        .pipe(gulp.dest(wwwDist))
    ))
gulp.task('clean', () => del([wwwDist]))
