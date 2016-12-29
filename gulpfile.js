'use strict'

const babel = require('gulp-babel')
const cleanCss = require('gulp-clean-css')
const copy = require('gulp-copy')
const del = require('del')
const filter = require('gulp-filter')
const gulp = require('gulp')
const merge = require('merge-stream')
const sass = require('gulp-sass')

const wwwDist = './www-dist/'
const baseVisualizations = './visualizations/'
const pathVisualizations = baseVisualizations + '**'

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
