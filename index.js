var fs      = require('fs');
var path    = require('path');
var xml2js  = require('xml2js');
var gm      = require('gm');
var colors  = require('colors');
var _       = require('underscore');
var Q       = require('q');
var program = require('commander');

var packageInfo  = require('./package.json');
var platformInfo = require('./platforms.json');

var rootDirectories = {
    android: 'platforms/android',
    blackberry: 'platforms/bb10',
    ios: 'platforms/ios',
    www: 'www'
};

/**
 * Check which platforms are added to the project and return their information.
 *
 * TODO: add all platforms
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function (projectName) {
    projectName = projectName || '';

    var projectRoot = path.dirname(program.config);

    var platforms = platformInfo.map(function(platform) {
        var platformRoot = rootDirectories[platform.name];
        var platformPath = path.join(projectRoot, platformRoot);

        var iconPath   = processPath(platform.iconPath || '', projectName);
        var splashPath = processPath(platform.splashPath || '', projectName);

        return Q.nfcall(fs.stat, platformPath).then(function(stat) {
            return _.extend(Object.create(platform), {
                isAdded: stat.isDirectory(),

                iconPath: path.join(platformPath, iconPath),
                splashPath: path.join(platformPath, splashPath)
            });
        });
    });

    return Q.all(platforms);
};

var projectNameRE = /\$PROJECT_NAME/g;
var processPath = function (path, projectName) {
  return path.replace(projectNameRE, projectName);
};

var resolveWithCWD = function (filePath) {
    return path.resolve(process.cwd(), filePath);
};

var defaults = {
    icon   : resolveWithCWD('icon.png'),
    splash : resolveWithCWD('splash.png'),
    config : resolveWithCWD('config.xml')
};

// Parse CLI arguments
program
    .version(packageInfo.version)
    .option('-i, --icon [s]',   'Base icon used to generate others', resolveWithCWD, defaults.icon)
    .option('-s, --splash [s]', 'Base splash screen used to generate others', resolveWithCWD, defaults.splash)
    .option('-c, --config [s]', 'Cordova configuration file location', resolveWithCWD,  defaults.config)
    .option('-b, --background [s]', 'Background to use for icon', resolveWithCWD, null)
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
display.warn = function (str) {
    str = '  ⚠  '.yellow + str;
    console.log(str);
};
display.header = function (str) {
    console.log('');
    console.log(' ' + str.cyan.underline);
    console.log('');
};

/**
 * Read the config file and get the project name
 *
 * @return {Promise} resolves to a string - the project's name
 */
var getProjectName = function () {
    var deferred = Q.defer();
    var parser = new xml2js.Parser();

    return Q.nfcall(fs.readFile, program.config)
        .then(function(data) {
            return Q.ninvoke(parser, 'parseString', data);
        })
        .then(function(result) {
            return result.widget.name[0];
        });
};

/**
 * Resizes and creates a art asset in the platform's folder by using
 * GraphicsMagick.
 *
 * @param  {String} artAssetName
 * @param  {String} srcPath
 * @param  {String} dstPath
 * @param  {Object} opts for width, height, and size
 * @return {Promise}
 */
var generateArtAsset = function (artAssetName, srcPath, dstPath, opts) {
    var projectRoot = path.dirname(program.config);
    var destination = path.resolve(projectRoot, dstPath, artAssetName);

    var width  = opts.width ? opts.width : opts.size;
    var height = opts.height ? opts.height : opts.size;

    var image;

    // Some images have backgrounds that need to be composed in
    if (Array.isArray(srcPath)) {
        image = gm()
        image = image
            .options({ imageMagick: true })
            .command('composite')
            .in.apply(image, srcPath);
    }
    else {
        image = gm(srcPath).options({ imageMagick: true });
    }

    image = image.resize(width, height);

    return Q.ninvoke(image, 'write', destination).then(function() {
        display.success(artAssetName + ' created');
    });
};

/**
 * Resizes and creates a new icon from a source path to the destination path.
 *
 * @param  {Object} platform
 * @param  {String} srcPath
 * @param  {String} dstPath
 * @param  {String} bgPath
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
 * @param {String} type indicator of 'icon' or 'splash'
 * @param {String} srcPath absolute path of source art asset
 * @param {Function} processor to use, either generateSplash or generateIcon
 *
 * @return {Promise}
 */
var generateArtAssets = function (platform, type, processor, srcPath) {
    display.header('Generating ' + type + ' assets for ' + platform.name);
    srcPath = srcPath || program[type];

    return Q.all(platform[type+'Assets'].map(function(asset) {
        var outPath = platform[type+'Path'];

        return processor(asset, srcPath, outPath);
    }));
};

/**
 * Generates icons based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateIcons = function (platform) {
    // Use a background if we have one and the platform has it set
    if (platform.iconBackground && program.background) {
        var srcPath = [ program.icon, program.background ];
    }

    return generateArtAssets(platform, 'icon', generateIcon, srcPath);
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
 * Goes over all the platforms and triggers icon/splash generation
 * 
 * @param  {Array} platforms
 * @return {Promise}
 */
var generate = function (platforms) {
    var tasks = _(platforms).where({ isAdded : true }).reduce(function (previous, platform) {
        return previous.then(function() {
            return Q()
                .then(processPlatformFor.bind(null, 'icon', platform, generateIcons))
                .then(processPlatformFor.bind(null, 'splash', platform, generateSplashes));
        })
    }, Q());

    return tasks;

    function processPlatformFor(type, platform, processor) {
        var assets = platform[type+'Assets'] || [];

        if (program[type] && assets.length) {
            return processor(platform);
        }
    }
};

/**
 * Ensures at least one platform was added to the project
 *
 * @throws {Error}
 * @return {Promise} resolves if at least one platform was found, rejects otherwise
 */
var atLeastOnePlatformFound = function () {
    return getPlatforms().then(function (platforms) {
        var activePlatforms = _(platforms).where({ isAdded : true });

        if (activePlatforms.length === 0) {
            throw new Error(
                'No Cordova platforms found. Make sure you have specified ' +
                'the correct config file location (or you\'re in the root ' +
                'directory of your project) and you\'ve added platforms ' +
                'with \'cordova platform add\'');
        } 

        display.success('platforms found: ' + _(activePlatforms).pluck('name').join(', '));
    });
};

/**
 * Checks if the passed asset type (icon, splash, or config) exists, if it
 * doesn't then we optionally generate a warning.
 *
 * @param {String} type (icon, splash, or config)
 * @param {Boolean} warningType allows non existent files to pass through and only warn
 * @param {String} successMessage
 * @param {String} errorMessage
 * @param {String} warnMessage
 * @return {Promise} resolves to boolean indicating whether the file exists
 */
var validParamFile = function (type, warningType, successMessage, errorMessage, warnMessage) {
    var location = program[type];

    successMessage = successMessage || type + ' asset exists at: ' + location;
    errorMessage = errorMessage || type + ' asset doesn\'t exist at: ' + location;
    warnMessage = warnMessage || type + ' asset was not specified';

    return Q.nfcall(fs.readFile, location)
        .then(function() {
            display.success(successMessage);
            return true;
        })
        .catch(function(error) {
            if (warningType) {
                program[type] = null;
                display.warn(warnMessage);
                return true;
            }

            // No file exists, return false
            if (error.code === 'ENOENT') {
                return false;
            }

            // Throw unknown error
            throw error;
        })
};

/**
 * Checks if a valid icon file exists
 *
 * @return {Promise} resolves to a boolean incidating whether it exists
 */
var validIconExists = validParamFile.bind(null, 'icon', true);

/**
 * Checks if a valid splash file exists
 *
 * @return {Promise} resolves to a boolean incidating whether it exists
 */
var validSplashExists = validParamFile.bind(null, 'splash', true);

/**
 * Ensures we either have a valid splash asset or a valid icon asset
 *
 * @return {Promise}
 * @throws {Error}
 */
var validArtAssets = function() {
    Q.all([validIconExists(), validSplashExists()])
        .spread(function (validIcon, validSplash) {
            if (!validIcon && !validSplash)
                throw new Error('At least one asset type should be specified');
        });
};

/**
 * Checks if a config.xml file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var configFileExists = validParamFile.bind(null, 'config', false,
        'cordova\'s ' + program.config + ' exists',
        'cordova\'s ' + program.config + ' does not exist');


display.header('Checking Project, Icon, and Splash');

atLeastOnePlatformFound()
    .then(configFileExists)
    .then(validArtAssets)
    .then(getProjectName)
    .then(getPlatforms)
    .then(generate)
    .catch(function (err) {
        if (err) {
            display.error(err.message);
        }
    }).then(function () {
        console.log('');
    });

