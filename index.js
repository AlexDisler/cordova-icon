var fs     = require('fs');
var xml2js = require('xml2js');
var ig     = require('imagemagick');
var colors = require('colors');
var _      = require('underscore');
var Q      = require('q');

/**
 * Check which platforms are added to the project and return their icon names and sizes
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function (projectName) {
    var deferred = Q.defer();
    var platforms = [];
    platforms.push({
        name : 'ios',
        // TODO: use async fs.exists
        isAdded : fs.existsSync('platforms/ios'),
        iconsPath : 'platforms/ios/' + projectName + '/Resources/icons/',
        icons : [
            { name : 'icon-40.png',       size : 40  },
            { name : 'icon-40@2x.png',    size : 80  },
            { name : 'icon-50.png',       size : 50  },
            { name : 'icon-50@2x.png',    size : 100 },
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
            { name : 'icon@2x.png',       size : 114 }
        ]
    });
    platforms.push({
        name : 'android',
        isAdded : fs.existsSync('platforms/android'),
        iconsPath : 'platforms/android/res/',
        icons : [
            { name : 'drawable/icon.png',         size : 96  },
            { name : 'drawable-hdpi/icon.png',    size : 72  },
            { name : 'drawable-ldpi/icon.png',    size : 36  },
            { name : 'drawable-mdpi/icon.png',    size : 48  },
            { name : 'drawable-xhdpi/icon.png',   size : 96  },
            { name : 'drawable-xxhdpi/icon.png',  size : 144 },
            { name : 'drawable-xxxhdpi/icon.png', size : 192 }
        ]
    });
    platforms.push({
        name : 'windows',
        isAdded : fs.existsSync('platforms/windows'),
        iconsPath : 'platforms/windows/images/',
        icons : [
            { name : 'Square30x30Logo.scale-100.png',   size : 30  },
            { name : 'Square44x44Logo.scale-100.png',   size : 44  },
            { name : 'Square44x44Logo.scale-240.png',   size : 106 },
            { name : 'Square70x70Logo.scale-100.png',   size : 70  },
            { name : 'Square71x71Logo.scale-100.png',   size : 71  },
            { name : 'Square71x71Logo.scale-240.png',   size : 170 },
            { name : 'Square150x150Logo.scale-100.png', size : 150 },
            { name : 'Square150x150Logo.scale-240.png', size : 360 },
            { name : 'Square310x310Logo.scale-100.png', size : 310 },
            { name : 'StoreLogo.scale-100.png',         size : 50  },
            { name : 'StoreLogo.scale-240.png',         size : 120 },
            { name : 'Wide310x150Logo.scale-100.png',   size : 310, height: 150 },
            { name : 'Wide310x150Logo.scale-240.png',   size : 744, height: 360 }
        ]
    });
    // TODO: add missing platforms
    deferred.resolve(platforms);
    return deferred.promise;
};


/**
 * @var {Object} settings - names of the config file and of the icon image
 * TODO: add option to get these values as CLI params
 */
var settings = {};
settings.CONFIG_FILE = 'config.xml';
settings.ICON_FILE   = 'icon.png';

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
    data = fs.readFile(settings.CONFIG_FILE, function (err, data) {
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
 * Resizes, crops and creates a new icon in the platform's folder.
 *
 * @param  {Object} platform
 * @param  {Object} icon
 * @return {Promise}
 */
var generateIcon = function (platform, icon) {
    var deferred = Q.defer();
    ig.resize({
        srcPath: settings.ICON_FILE,
        dstPath: platform.iconsPath + icon.name,
        quality: 1,
        format: 'png',
        width: icon.size,
        height: icon.size,
    } , function(err, stdout, stderr){
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
            display.success(icon.name + ' created');
        }
    });
    if (icon.height) {
      ig.crop({
          srcPath: settings.ICON_FILE,
          dstPath: platform.iconsPath + icon.name,
          quality: 1,
          format: 'png',
          width: icon.size,
          height: icon.height,
      } , function(err, stdout, stderr){
          if (err) {
              deferred.reject(err);
          } else {
              deferred.resolve();
              display.success(icon.name + ' cropped');
          }
      });
    }
    return deferred.promise;
};

/**
 * Generates icons based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateIconsForPlatform = function (platform) {
    var deferred = Q.defer();
    display.header('Generating Icons for ' + platform.name);
    var all = [];
    var icons = platform.icons;
    icons.forEach(function (icon) {
        all.push(generateIcon(platform, icon));
    });
    Q.all(all).then(function () {
        deferred.resolve();
    }).catch(function (err) {
        console.log(err);
    });
    return deferred.promise;
};

/**
 * Goes over all the platforms and triggers icon generation
 *
 * @param  {Array} platforms
 * @return {Promise}
 */
var generateIcons = function (platforms) {
    var deferred = Q.defer();
    var sequence = Q();
    var all = [];
    _(platforms).where({ isAdded : true }).forEach(function (platform) {
        sequence = sequence.then(function () {
            return generateIconsForPlatform(platform);
        });
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
            display.error('No cordova platforms found. Make sure you are in the root folder of your Cordova project and add platforms with \'cordova platform add\'');
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
var validIconExists = function () {
    var deferred = Q.defer();
    fs.exists(settings.ICON_FILE, function (exists) {
        if (exists) {
            display.success(settings.ICON_FILE + ' exists');
            deferred.resolve();
        } else {
            display.error(settings.ICON_FILE + ' does not exist in the root folder');
            deferred.reject();
        }
    });
    return deferred.promise;
};

/**
 * Checks if a config.xml file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var configFileExists = function () {
    var deferred = Q.defer();
    fs.exists(settings.CONFIG_FILE, function (exists) {
        if (exists) {
            display.success(settings.CONFIG_FILE + ' exists');
            deferred.resolve();
        } else {
            display.error('cordova\'s ' + settings.CONFIG_FILE + ' does not exist in the root folder');
            deferred.reject();
        }
    });
    return deferred.promise;
};

display.header('Checking Project & Icon');

atLeastOnePlatformFound()
    .then(validIconExists)
    .then(configFileExists)
    .then(getProjectName)
    .then(getPlatforms)
    .then(generateIcons)
    .catch(function (err) {
        if (err) {
            console.log(err);
        }
    }).then(function () {
        console.log('');
    });
