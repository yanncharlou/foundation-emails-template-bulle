import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import browser from 'browser-sync';
import rimraf from 'rimraf';
import panini from 'panini';
import yargs from 'yargs';
import lazypipe from 'lazypipe';
import inky from 'inky';
import fs from 'fs';
import siphon from 'siphon-media-query';
import path from 'path';
import merge from 'merge-stream';
import beep from 'beepbeep';
import colors from 'colors';
import htmlValidator from 'gulp-w3c-html-validator';
import valid from "./validation";
// import cheerio from 'gulp-cheerio';//Add Bulle



const $ = plugins();

// Look for the --production flag
const PRODUCTION = !!(yargs.argv.production);
const MAIL_NAMES = yargs.argv.news;
const EMAIL = yargs.argv.to;

// Declar var so that both AWS and Litmus task can use it.
var CONFIG;

// Build the "dist" folder by running all of the below tasks
gulp.task('build',
    gulp.series(clean, pages, sass, images, inline, reduce));

// Build emails, run the server, and watch for file changes
gulp.task('default',
    gulp.series('build', server, watch));

// Build emails, then send to litmus
gulp.task('litmus',
    gulp.series('build', creds, aws, litmus));

// Build emails, then send to EMAIL
gulp.task('mail',
    // gulp.series('build', creds, aws, mail));
    gulp.series('build', creds, /*validateHtml,*/ mail));

// Build emails, then zip
gulp.task('zip',
    gulp.series('build', zip));

// Gulp
gulp.task('lint', gulp.series(validateHtml));


// FONCTIONS CUSTOM BULLE

//Custom function to reduce size
function reduce() {
    return gulp.src('dist/**/*.html')
        //.pipe($.replace('Elijah', 'Yann'))
        .pipe($.replace('<tr style="padding: 0; text-align: left; vertical-align: top">', '<tr>'))
        .pipe($.replace('<tr style="padding:0;text-align:left;vertical-align:top">', '<tr>'))
        .pipe($.replace("Helvetica, Arial, sans-serif", 'Arial'))
        .pipe($.replace("Helvetica,Arial,sans-serif", 'Arial'))
        .pipe($.replace("border-collapse: collapse;", ''))
        .pipe($.replace("border-collapse:collapse;", ''))
        .pipe($.replace("-moz-hyphens: auto; -webkit-hyphens: auto; ", ''))
        .pipe($.replace("-moz-hyphens: auto;-webkit-hyphens: auto;", ''))
        .pipe($.replace("hyphens: auto;", ''))
        .pipe($.replace("hyphens:auto;", ''))
        .pipe($.replace("padding: 0; padding-bottom: 0; padding-left: 0; padding-right: 0;", 'padding:0;'))
        .pipe($.replace("padding: 0;padding-bottom: 0;padding-left:0;padding-right:0;", 'padding:0;'))
        .pipe($.replace("text-align: left;", ''))
        .pipe($.replace("text-align:left;", ''))
        .pipe($.replace('<link rel="stylesheet" type="text/css" href="../css/app.css">', ''))
        .pipe($.replace(/style="(.+?)"/gim, function (match) {
            let replaceOne = match.replace(/:\s/gim, ":")
            let replaceTwo = replaceOne.replace(/;\s/gim, ";")
            return replaceTwo
        }))
        .pipe($.replace("Margin", "margin"))
        //.pipe($.replace("from", 'to'))
        //Modification via Cheerio (à la mode jQuery)
        /*
        .pipe(
          cheerio(function($, file) {
            // Each file will be run through cheerio and each corresponding `$` will be passed here.
            // `file` is the gulp file object
            // Make all h1 tags uppercase
            $('h1').each(function() {
              var h1 = $(this);
              h1.text(h1.text().toUpperCase());
            });
          }),
        )
        */
        .pipe(gulp.dest('dist'));
}

// FIN FONCTIONS CUSTOM BULLE


// Validate Html with w3c
function validateHtml() {
    return gulp.src('dist/**/*.html')
        .pipe(htmlValidator({ verifyMessage: valid }))
        .pipe(htmlValidator.reporter());
}


// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
    rimraf('dist', done);
}

// Compile layouts, pages, and partials into flat HTML files
// Then parse using Inky templates
function pages() {
    const plugins = [require('posthtml-alt-always')({ root: `${path}` })]
    const options = {}
    return gulp.src(['src/pages/**/*.html', '!src/pages/archive/**/*.html'])
        .pipe(panini({
            root: 'src/pages',
            layouts: 'src/layouts',
            partials: 'src/partials',
            helpers: 'src/helpers'
        }))

        .pipe(inky())
        .pipe($.posthtml(plugins, options))
        .pipe(gulp.dest('dist'));
}

// Reset Panini's cache of layouts and partials
function resetPages(done) {
    panini.refresh();
    done();
}

// Compile Sass into CSS
function sass() {
    return gulp.src('src/assets/scss/app.scss')
        .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
        .pipe($.sass({
            includePaths: ['node_modules/foundation-emails/scss']
        }).on('error', $.sass.logError))
        .pipe($.if(PRODUCTION, $.uncss({
            html: ['dist/**/*.html']
        })))
        .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
        .pipe(gulp.dest('dist/css'));
}

// Copy and compress images
function images() {
    return gulp.src(['src/assets/img/**/*', '!src/assets/img/archive/**/*'])
        .pipe($.imagemin())
        .pipe(gulp.dest('./dist/assets/img'));
}

// Inline CSS and minify HTML
function inline() {
    return gulp.src('dist/**/*.html')
        .pipe($.if(PRODUCTION, inliner('dist/css/app.css')))
        .pipe(gulp.dest('dist'));
}

// Start a server with LiveReload to preview the site in
function server(done) {
    browser.init({
        server: 'dist'
    });
    done();
}

// Watch for file changes
function watch() {
    gulp.watch('src/pages/**/*.html').on('all', gulp.series(pages, inline, browser.reload));
    gulp.watch(['src/layouts/**/*', 'src/partials/**/*']).on('all', gulp.series(resetPages, pages, inline, browser.reload));
    gulp.watch(['../scss/**/*.scss', 'src/assets/scss/**/*.scss']).on('all', gulp.series(resetPages, sass, pages, inline, browser.reload));
    gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, browser.reload));
}

// Inlines CSS into HTML, adds media query CSS into the <style> tag of the email, and compresses the HTML
function inliner(css) {
    var css = fs.readFileSync(css).toString();
    var mqCss = siphon(css);

    var pipe = lazypipe()
        .pipe($.inlineCss, {
            applyStyleTags: false,
            removeStyleTags: true,
            preserveMediaQueries: true,
            removeLinkTags: false
        })
        .pipe($.replace, '<!-- <style> -->', `<style>${mqCss}</style>`)
        .pipe($.replace, '<link rel="stylesheet" type="text/css" href="css/app.css">', '')
        .pipe($.htmlmin, {
            collapseWhitespace: true,
            minifyCSS: false
        });

    return pipe();
}

// Ensure creds for Litmus are at least there.
function creds(done) {
    var configPath = './config.json';
    try { CONFIG = JSON.parse(fs.readFileSync(configPath)); } catch (e) {
        beep();
        console.log('[AWS]'.bold.red + ' Sorry, there was an issue locating your config.json. Please see README.md');
        process.exit();
    }
    done();
}

// Post images to AWS S3 so they are accessible to Litmus and manual test
function aws() {
    var publisher = !!CONFIG.aws ? $.awspublish.create(CONFIG.aws) : $.awspublish.create();
    var headers = {
        'Cache-Control': 'max-age=315360000, no-transform, public'
    };

    return gulp.src('./dist/assets/img/*')
        // publisher will add Content-Length, Content-Type and headers specified above
        // If not specified it will set x-amz-acl to public-read by default
        .pipe(publisher.publish(headers))

        // create a cache file to speed up consecutive uploads
        //.pipe(publisher.cache())

        // print upload updates to console
        .pipe($.awspublish.reporter());
}

// Send email to Litmus for testing. If no AWS creds then do not replace img urls.
function litmus() {
    var awsURL = !!CONFIG && !!CONFIG.aws && !!CONFIG.aws.url ? CONFIG.aws.url : false;

    return gulp.src('dist/**/*.html')
        .pipe($.if(!!awsURL, $.replace(/=('|")(\/?assets\/img)/g, "=$1" + awsURL)))
        .pipe($.litmus(CONFIG.litmus))
        .pipe(gulp.dest('dist'));
}

// Send email to specified email for testing. If no AWS creds then do not replace img urls.
function mail() {
    var awsURL = !!CONFIG && !!CONFIG.aws && !!CONFIG.aws.url ? CONFIG.aws.url : false;

    CONFIG.mail_names = "dist/**/*.html";

    if (EMAIL) {
        CONFIG.mail.to = [EMAIL];
    }
    if (!!MAIL_NAMES) {
        CONFIG.mail_names = MAIL_NAMES.split(",").map(m => `dist/**/${m}-*.html`)
    }

    return gulp.src(`${CONFIG.mail_names}`, { base: "dist/" })
        .pipe($.if(!!awsURL, $.replace(/=('|")(\/?assets\/img)/g, "=$1" + awsURL)))
        .pipe($.mail(CONFIG.mail))
        .pipe(gulp.dest('dist'));
}

// Copy and compress into Zip
function zip() {
    var dist = 'dist';
    var ext = '.html';

    function getHtmlFiles(dir) {
        return fs.readdirSync(dir)
            .filter(function (file) {
                var fileExt = path.join(dir, file);
                var isHtml = path.extname(fileExt) == ext;
                return fs.statSync(fileExt).isFile() && isHtml;
            });
    }

    var htmlFiles = getHtmlFiles(dist);

    var moveTasks = htmlFiles.map(function (file) {
        var sourcePath = path.join(dist, file);
        var fileName = path.basename(sourcePath, ext);

        var moveHTML = gulp.src(sourcePath)
            .pipe($.rename(function (path) {
                path.dirname = fileName;
                return path;
            }));

        var moveImages = gulp.src(sourcePath)
            .pipe($.htmlSrc({ selector: 'img' }))
            .pipe($.rename(function (path) {
                path.dirname = fileName + path.dirname.replace('dist', '');
                return path;
            }));

        return merge(moveHTML, moveImages)
            .pipe($.zip(fileName + '.zip'))
            .pipe(gulp.dest('dist'));
    });

    return merge(moveTasks);
}