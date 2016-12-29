'use strict'

let babel = require('gulp-babel')
let cleanCss = require('gulp-clean-css')
let copy = require('gulp-copy')
let del = require('del')
let filter = require('gulp-filter')
let gulp = require('gulp')
let merge = require('merge-stream')
let sass = require('gulp-sass')

let wwwDist = './www-dist/'
let baseVisualizations = './visualizations/'
let pathVisualizations = baseVisualizations + '**'

const makeCss = g =>
    g.pipe(sass({
        outputStyle: 'compressed',
    }))
    .pipe(cleanCss())
const makeJs = g =>
    g.pipe(babel({
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
    gulp.src(['www/*/**'])
        .pipe(copy(wwwDist)),
    gulp.src(pathVisualizations, {base: baseVisualizations})
        .pipe(filter(['**', '!**/*.scss', '!**/*.js']))
        .pipe(copy(wwwDist, {prefix: 1})),
    makeCss(gulp.src('www/*.scss', {base: './'}).pipe(filter(['**', '!**/definitions.scss'])))
        .pipe(gulp.dest(wwwDist)),
    makeJs(gulp.src('www/*.js', {base: './'}))
        .pipe(gulp.dest(wwwDist)),
    makeCss(gulp.src(pathVisualizations, {base: baseVisualizations}).pipe(filter('**/*.scss')))
        .pipe(gulp.dest(wwwDist)),
    makeJs(gulp.src(pathVisualizations, {base: baseVisualizations}).pipe(filter('**/*.js')))
        .pipe(gulp.dest(wwwDist))
    ))
gulp.task('clean', () => del([wwwDist]))
