var fs      = require('fs');
var path    = require('path');
var xml2js  = require('xml2js');
var ig      = require('imagemagick');
var colors  = require('colors');
var _       = require('underscore');
var Q       = require('q');
var program = require('commander');
var pkginfo = require('./package.json');

/**
 * Check which platforms are added to the project and return their icon names and sized
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function (projectName) {
    projectName = projectName || '';

    var deferred = Q.defer();
    var platforms = [];

    var projectRoot = path.dirname(program.config);
    var androidRoot = path.join(projectRoot, 'platforms/android');
    var iOSRoot = path.join(projectRoot, 'platforms/ios');
    var wwwRoot = path.join(projectRoot, 'www');

    platforms.push({
        name : 'ios',
        // TODO: use async fs.exists
        isAdded  : fs.existsSync(iOSRoot),
        iconPath : path.join(iOSRoot, projectName, 'Resources/icons'),
        iconAssets : [
            { name : 'icon-40.png',       size : 40  },
            { name : 'icon-40@2x.png',    size : 80  },
            { name : 'icon-50.png',       size : 50  },
            { name : 'icon-50@2x.png',    size : 100 },
            { name : 'icon-60.png',       size : 60  },
            { name : 'icon-60@2x.png',    size : 120 },
            { name : 'icon-60@3x.png',    size : 180 },
            { name : 'icon-72.png',       size : 72  },
            { name : 'icon-72@2x.png',    size : 144 },
            { name : 'icon-76.png',       size : 76  },
            { name : 'icon-76@2x.png',    size : 152 },
            { name : 'icon-small.png',    size : 29  },
            { name : 'icon-small@2x.png', size : 58  },
            { name : 'icon-small@3x.png', size : 87  },
            { name : 'icon.png',          size : 57  },
            { name : 'icon@2x.png',       size : 114 },
        ],
        splashPath : 'platforms/ios/' + projectName + '/Resources/splash/',
        splashAssets : [
          { name : 'Default-568h@2x~iphone.png',    width : 640,  height : 1136 },
          { name : 'Default-Landscape@2x~ipad.png', width : 2048, height : 1496 },
          { name : 'Default-Landscape~ipad.png',    width : 1024, height : 768  },
          { name : 'Default-Portrait@2x~ipad.png',  width : 1536, height : 2008 },
          { name : 'Default-Portrait~ipad.png',     width : 768,  height : 1004 },
          { name : 'Default@2x~iphone.png',         width : 640,  height : 960  },
          { name : 'Default~iphone.png',            width : 320,  height : 480  },
        ]
    });
    platforms.push({
        name : 'android',
        isAdded : fs.existsSync(androidRoot),
        iconPath : path.join(androidRoot, 'res'),
        iconAssets : [
            { name : 'drawable/icon.png',       size : 96 },
            { name : 'drawable-hdpi/icon.png',  size : 72 },
            { name : 'drawable-ldpi/icon.png',  size : 36 },
            { name : 'drawable-mdpi/icon.png',  size : 48 },
            { name : 'drawable-xhdpi/icon.png', size : 96 },
        ],
        splashPath : path.join(androidRoot, 'res'),
        splashAssets : [
            { name : 'drawable/screen.png',       width : 480, height : 640 },
            { name : 'drawable-hdpi/screen.png',  width : 320, height : 426 },
            { name : 'drawable-ldpi/screen.png',  width : 320, height : 470 },
            { name : 'drawable-mdpi/screen.png',  width : 480, height : 640 },
            { name : 'drawable-xhdpi/screen.png', width : 720, height : 960 },
        ]
    });
    // WWW sizing taken from https://mathiasbynens.be/notes/touch-icons#no-html
    platforms.push({
        name : 'www',
        isAdded : true,
        iconPath : wwwRoot,
        iconAssets : [
            { name : 'apple-touch-icon-57x57-precomposed.png',   width : 57,  height : 57 },
            { name : 'apple-touch-icon-76x76-precomposed.png',   width : 76,  height : 76 },
            { name : 'apple-touch-icon-120x120-precomposed.png', width : 120, height : 120 },
            { name : 'apple-touch-icon-152x152-precomposed.png', width : 152, height : 152 },
            { name : 'apple-touch-icon-152x152-precomposed.png', width : 152, height : 152 },
            { name : 'apple-touch-icon-180x180-precomposed.png', width : 180, height : 180 },
            { name : 'apple-touch-icon-precomposed.png',         width : 180, height : 180 },
            { name : 'touch-icon-192x192.png',                   width : 192, height : 192 }
        ]
    });
    // TODO: add all platforms
    deferred.resolve(platforms);
    return deferred.promise;
};

var resolveWithCWD = function (filePath) {
    return path.resolve(process.cwd(), filePath);
};

var defaults = {
    icon   : resolveWithCWD('icon.png'),
    splash : resolveWithCWD('splash.png'),
    config : resolveWithCWD('config.xml'),
};

// Parse CLI arguments
program
    .version(pkginfo.version)
    .option('-i, --icon [s]',   'Base icon used to generate others', resolveWithCWD, defaults.icon)
    .option('-s, --splash [s]', 'Base splash screen used to generate others', resolveWithCWD, defaults.splash)
    .option('-c, --config [s]', 'Cordova configuration file location', resolveWithCWD,  defaults.config)
    .parse(process.argv);

/**
 * @var {Object} console utils
 */
var display = {};
display.success = function (str) {
    str = '✓  '.green + str;
    console.log('  ' + str);
};
display.error = function (str) {
    str = '✗  '.red + str;
    console.log('  ' + str);
};
display.header = function (str) {
    console.log('');
    console.log(' ' + str.cyan.underline);
    console.log('');
};

/**
 * read the config file and get the project name
 *
 * @return {Promise} resolves to a string - the project's name
 */
var getProjectName = function () {
    var deferred = Q.defer();
    var parser = new xml2js.Parser();

    fs.readFile(program.config, function (err, data) {
        if (err) {
            deferred.reject(err);
        }
        parser.parseString(data, function (err, result) {
            if (err) {
                deferred.reject(err);
            }
            var projectName = result.widget.name[0];
            deferred.resolve(projectName);
        });
    });
    return deferred.promise;
};

/**
 * Resizes and creates a art asset in the platform's folder.
 *
 * @param  {Object} platform
 * @param  {Object} icon
 * @return {Promise}
 */
var generateArtAsset = function (artAssetName, srcPath, dstPath, opts) {
    var deferred = Q.defer();

    var projectRoot = path.dirname(program.config);
    var destination = path.resolve(projectRoot, dstPath);

    var imageMagickOptions = {
        srcPath: srcPath,
        dstPath: path.join(destination, artAssetName),
        quality: 1,
        format: 'png'
    };

    ig.resize(_.extend(imageMagickOptions, opts), function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
            display.success(artAssetName + ' created');
        }
    })
    return deferred.promise;
};

/**
 * Resizes and creates a new icon from a source path to the destination path.
 *
 * @param  {Object} platform
 * @param  {String} srcPath
 * @param  {String} dstPath
 * @return {Promise}
 */
var generateIcon = function (icon, srcPath, dstPath) {
    return generateArtAsset(icon.name, srcPath, dstPath, {
        width: icon.size,
        height: icon.size
    });
};

/**
 * Resizes and creates a new splash from a source path to the destination path.
 *
 * @param  {Object} platform
 * @param  {Object} icon
 * @return {Promise}
 */
var generateSplash = function (splash, srcPath, dstPath) {
    return generateArtAsset(splash.name, srcPath, dstPath, {
        width: splash.width,
        height: splash.height
    });
};

/**
 * Generates all art assets for a given platform and type
 *
 * @param {Object} platform
 * @param {String} type
 * @param {Function} processor to use, either generateSplash or generateIcon
 *
 * @return {Promise}
 */
var generateArtAssets = function (platform, type, processor) {
    var deferred = Q.defer();
    display.header('Generating ' + type + ' assets for ' + platform.name);

    var processedAssets = platform[type+'Assets'].map(function (asset) {
        return processor(asset, program[type], platform[type+'Path']);
    });

    Q.all(processedAssets).then(deferred.resolve).catch(function (err) {
        console.log(err);
    });

    return deferred.promise;
};

/**
 * Generates icons based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateIcons = function (platform) {
    return generateArtAssets(platform, 'icon', generateIcon);
};

/**
 * Generates splashes based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateSplashes = function (platform) {
    return generateArtAssets(platform, 'splash', generateSplash);
};

/**
 * Goes over all the platforms and triggers icon generation
 * 
 * @param  {Array} platforms
 * @return {Promise}
 */
var generate = function (platforms) {
    var deferred = Q.defer();
    var sequence = Q();
    var all = [];
    _(platforms).where({ isAdded : true }).forEach(function (platform) {
        sequence = sequence.then(function () {
            return generateIcons(platform);
        });
        all.push(sequence);

        if (platform.splashAssets && platform.splashAssets.length) {
            sequence = sequence.then(function () {
                return generateSplashes(platform);
            });
        }
        all.push(sequence);
    });
    Q.all(all).then(function () {
        deferred.resolve();
    });
    return deferred.promise;
};

/**
 * Checks if at least one platform was added to the project
 *
 * @return {Promise} resolves if at least one platform was found, rejects otherwise
 */
var atLeastOnePlatformFound = function () {
    var deferred = Q.defer();
    getPlatforms().then(function (platforms) {
        var activePlatforms = _(platforms).where({ isAdded : true });
        if (activePlatforms.length > 0) {
            display.success('platforms found: ' + _(activePlatforms).pluck('name').join(', '));
            deferred.resolve();
        } else {
            display.error(
                'No Cordova platforms found. Make sure you have specified ' +
                'the correct config file location (or you\'re in the root ' +
                'directory of your project) and you\'ve added platforms with' +
                '\'cordova platform add\'');
            deferred.reject();
        }
    });
    return deferred.promise;
};

/**
 * Promise wrapper around fs.exists with option success and error messages for
 * console output.
 *
 * @param {String} location of file to check
 * @param {String} successMessage
 * @param {String} errorMessage
 */
var validFile = function (location, successMessage, errorMessage) {
    var deferred = Q.defer();

    successMessage = successMessage || location + ' exists';
    errorMessage = errorMessage || location + ' does not exist';

    fs.exists(location, function (exists) {
        if (exists) {
            display.success(successMessage);
            deferred.resolve();
        } else {
            display.error(errorMessage);
            deferred.reject();
        }
    });

    return deferred.promise;
};

/**
 * Checks if a valid icon file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validIconExists = validFile.bind(null, program.icon);

/**
 * Checks if a valid splash file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validSplashExists = validFile.bind(null, program.splash);

/**
 * Checks if a config.xml file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var configFileExists = validFile.bind(null, program.config,
        'cordova\'s ' + program.config + ' exists',
        'cordova\'s ' + program.config + ' does not exist');

display.header('Checking Project, Icon, and Splash');

atLeastOnePlatformFound()
    .then(validIconExists)
    .then(validSplashExists)
    .then(configFileExists)
    .then(getProjectName)
    .then(getPlatforms)
    .then(generate)
    .catch(function (err) {
        if (err) {
            console.log(err);
        }
    }).then(function () {
        console.log('');
    });
