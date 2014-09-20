var fs     = require('fs');
var xml2js = require('xml2js');
var ig     = require('imagemagick');
var colors = require('colors');
var _      = require('underscore');
var Q      = require('q');

/**
 * Check which platforms are added to the project and return their icon names and sized
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
            { name : 'icon-60.png',       size : 60  },
            { name : 'icon-60@2x.png',    size : 120 },
            { name : 'icon-72.png',       size : 72  },
            { name : 'icon-72@2x.png',    size : 144 },
            { name : 'icon-76.png',       size : 76  },
            { name : 'icon-76@2x.png',    size : 152 },
            { name : 'icon-small.png',    size : 29  },
            { name : 'icon-small@2x.png', size : 58  },
            { name : 'icon.png',          size : 57  },
            { name : 'icon@2x.png',       size : 114 },
        ],
        splashesPath : 'platforms/ios/' + projectName + '/Resources/splash/',
        splashes: [
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
        iconsPath : 'platforms/android/res/',
        isAdded : fs.existsSync('platforms/android'),
        icons : [
            { name : 'drawable/icon.png',       size : 96 },
            { name : 'drawable-hdpi/icon.png',  size : 72 },
            { name : 'drawable-ldpi/icon.png',  size : 36 },
            { name : 'drawable-mdpi/icon.png',  size : 48 },
            { name : 'drawable-xhdpi/icon.png', size : 96 },
        ],
        splashesPath : 'platforms/android/res/',
        splashes : [
            { name : 'drawable/screen.png',       width : 480, height : 640 },
            { name : 'drawable-hdpi/screen.png',  width : 320, height : 426 },
            { name : 'drawable-ldpi/screen.png',  width : 320, height : 470 },
            { name : 'drawable-mdpi/screen.png',  width : 480, height : 640 },
            { name : 'drawable-xhdpi/screen.png', width : 720, height : 960 },
        ]
    });
    // TODO: add all platforms
    deferred.resolve(platforms);
    return deferred.promise;
};


/**
 * @var {Object} settings - names of the confix file and of the icon image
 * TODO: add option to get these values as CLI params
 */
var settings = {};
settings.CONFIG_FILE = 'config.xml';
settings.ICON_FILE   = 'icon.png';
settings.SPLASH_FILE   = 'splash.png';

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
 * Resizes and creates a new icon in the platform's folder.
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
    return deferred.promise;
};

/**
 * Resizes and creates a new splashscreen in the platform's folder.
 *
 * @param  {Object} platform
 * @param  {Object} icon
 * @return {Promise}
 */
var generateSplash = function (platform, splash) {
    var deferred = Q.defer();
    ig.resize({
        srcPath: settings.SPLASH_FILE,
        dstPath: platform.splashesPath + splash.name,
        quality: 1,
        format: 'png',
        width: splash.width,
        height: splash.height,
    } , function(err, stdout, stderr){
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
            display.success(splash.name + ' created');
        }
    });
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
 * Generates splashes based on the platform object
 *
 * @param  {Object} platform
 * @return {Promise}
 */
var generateSplashesForPlatform = function (platform) {
    var deferred = Q.defer();
    display.header('Generating Splash Screens for ' + platform.name);
    var all = [];
    var splashes = platform.splashes;
    splashes.forEach(function (splash) {
        all.push(generateSplash(platform, splash));
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
        sequence = sequence.then(function () {
            return generateSplashesForPlatform(platform);
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
 * Checks if a valid splash file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validSplashExists = function () {
    var deferred = Q.defer();
    fs.exists(settings.SPLASH_FILE, function (exists) {
        if (exists) {
            display.success(settings.SPLASH_FILE + ' exists');
            deferred.resolve();
        } else {
            display.error(settings.SPLASH_FILE + ' does not exist in the root folder');
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
    .then(validSplashExists)
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
