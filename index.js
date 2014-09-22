var fs      = require('fs');
var path    = require('path');
var xml2js  = require('xml2js');
var ig      = require('imagemagick');
var colors  = require('colors');
var _       = require('underscore');
var Q       = require('q');
var program = require('commander');

var packageInfo  = require('./package.json');
var platformInfo = require('./platforms.json');

var rootDirectories = {
    android: 'platforms/android',
    ios: 'platforms/ios',
    www: 'www'
};

/**
 * Check which platforms are added to the project and return their icon names and sized
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function (projectName) {
    projectName = projectName || '';

    var platforms = [];
    var projectRoot = path.dirname(program.config);

    // TODO: add all platforms
    var platforms = Q.all(platformInfo.map(function(platform) {
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
    }));

    return platforms;
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
    config : resolveWithCWD('config.xml'),
};

// Parse CLI arguments
program
    .version(packageInfo.version)
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
        if (program.icon && platform.iconAssets && platform.iconAssets.length) {
            sequence = sequence.then(function () {
                return generateIcons(platform);
            });

            all.push(sequence);
        }

        if (program.splash && platform.splashAssets && platform.splashAssets.length) {
            sequence = sequence.then(function () {
                return generateSplashes(platform);
            });

            all.push(sequence);
        }
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
            deferred.reject(
                'No Cordova platforms found. Make sure you have specified ' +
                'the correct config file location (or you\'re in the root ' +
                'directory of your project) and you\'ve added platforms ' +
                'with \'cordova platform add\'');
        }
    });
    return deferred.promise;
};


var atLeastOneAssetType = function () {
    try {
      return program.icon || program.splash ? Q.resolve() : Q.reject(
              "At least one asset type should be specified");
    } catch (e) {
        console.log(e.message);
    }
};

/**
 * Promise wrapper around fs.exists with option success and error messages for
 * console output.
 *
 * @param {String} location of file to check
 * @param {String} successMessage
 * @param {String} errorMessage
 */
var validParamFile = function (type, successMessage, errorMessage, warnMessage) {
    var deferred = Q.defer();
    var location = program[type];

    successMessage = successMessage || type + ' asset exists at: ' + location;
    errorMessage = errorMessage || type + ' asset doesn\'t exist at: ' + location;
    warnMessage = warnMessage || type + ' asset was not specified';

    fs.exists(location, function (exists) {
        if (exists) {
            display.success(successMessage);
            deferred.resolve();
        } else if (location === defaults[type] && type !== 'config') {
            program[type] = null;
            display.warn(warnMessage);
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
var validIconExists = validParamFile.bind(null, 'icon');

/**
 * Checks if a valid splash file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validSplashExists = validParamFile.bind(null, 'splash');

/**
 * Checks if a config.xml file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var configFileExists = validParamFile.bind(null, 'config',
        'cordova\'s ' + program.config + ' exists',
        'cordova\'s ' + program.config + ' does not exist');

display.header('Checking Project, Icon, and Splash');

atLeastOnePlatformFound()
    .then(validIconExists)
    .then(validSplashExists)
    .then(atLeastOneAssetType)
    .then(configFileExists)
    .then(getProjectName)
    .then(getPlatforms)
    .then(generate)
    .catch(function (err) {
        if (err) {
            display.error(err);
        }
    }).then(function () {
        console.log('');
    });
