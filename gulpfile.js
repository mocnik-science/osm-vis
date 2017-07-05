'use strict'

const babel = require('gulp-babel')
const cleanCss = require('gulp-clean-css')
const copy = require('gulp-copy')
const del = require('del')
const filter = require('gulp-filter')
const fs = require('fs')
const gulp = require('gulp')
const inject = require('gulp-inject')
const merge = require('merge-stream')
const sass = require('gulp-sass')
const gzip = require('gulp-gzip')

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
const injectJs = g => (!fs.existsSync('inject.html')) ? g : g.pipe(inject(gulp.src('inject.html'), {starttag: '<!-- inject:inject -->', transform: (filepath, file) => file.contents.toString('utf-8')}))

gulp.task('default', ['gzip'], () => {})

gulp.task('gzip', ['dist', 'gzip2'], () => gulp.src([
        wwwDist + '**/*.html',
        wwwDist + '**/*.js',
        wwwDist + '**/*.css',
    ])
    .pipe(gzip({level: 9}))
    .pipe(gulp.dest(wwwDist))
)

gulp.task('gzip2', ['dist'], () => gulp.src([
        wwwDist + 'data/**',
    ])
    .pipe(gzip({level: 9}))
    .pipe(gulp.dest(wwwDist + 'data/'))
)

gulp.task('dist', ['clean'], () => merge(
    gulp.src([
            '.htaccess',
            'data/**',
            'src/**',
        ])
        .pipe(copy(wwwDist)),
    injectJs(gulp.src(['www/index.html']))
        .pipe(gulp.dest(wwwDist)),
    gulp.src(['www/*/**'])
        .pipe(copy(wwwDist)),
    gulp.src(pathVisualizations, {base: baseVisualizations})
        .pipe(filter(['**', '!**/*.scss', '!**/*.js', '!**/*.html']))
        .pipe(copy(wwwDist, {prefix: 1})),
    injectJs(gulp.src(pathVisualizations, {base: baseVisualizations}).pipe(filter('**/*.html')))
        .pipe(gulp.dest(wwwDist)),
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
