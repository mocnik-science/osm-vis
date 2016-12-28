'use strict'

let babel = require('gulp-babel')
let cleanCss = require('gulp-clean-css')
let copy = require('gulp-copy')
let del = require('del')
let filter = require('gulp-filter')
let gulp = require('gulp')
let merge = require('merge-stream')
let sass = require('gulp-sass')

let wwws = ['./osm-tags-history-wiki']
let wwwDist = './www-dist/'

let pathsVisualizations = [
    'osm-changes-map/**',
    'osm-tags-history-wiki/**',
]

const makeCss = g =>
    g.pipe(sass({
        outputStyle: 'compressed',
    }))
    .pipe(cleanCss())
const makeJ = g =>
    .pipe(babel({
        presets: ['es2015'],
        compact: true,
        comments: false,
    }))

gulp.task('default', ['clean'], () => merge(
    gulp.src([
            'data/**',
            'src/**',
        ])
        .pipe(copy(wwwDist)),
    gulp.src(['www/index.html'])
        .pipe(copy(wwwDist, {prefix: 1})),
    gulp.src(pathsVisualizations, {base: './'})
        .pipe(filter(['**', '!**/*.css', '!**/*.js']))
        .pipe(copy(wwwDist)),
    makeCss(gulp.src('www/*.css', {base: './'}))
        .pipe(gulp.dest(wwwDist)),
    makeJs(gulp.src('www/*.js', {base: './'}))
        .pipe(gulp.dest(wwwDist)),
    makeCss(gulp.src(pathsVisualizations, {base: './'}).pipe(filter('**/*.css')))
        .pipe(gulp.dest(wwwDist)),
    makeJs(gulp.src(pathsVisualizations, {base: './'}).pipe(filter('**/*.js')))
        .pipe(gulp.dest(wwwDist))
    ))
gulp.task('clean', () => del([wwwDist]))
