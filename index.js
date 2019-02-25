var fs = require('fs-extra');
var path = require('path');
var xml2js = require('xml2js');
var ig = require('imagemagick');
var colors = require('colors');
var _ = require('underscore');
var Q = require('q');
var argv = require('minimist')(process.argv.slice(2));

/**
 * @var {Object} settings - names of the config file and of the icon image
 */
var settings = {};
settings.CONFIG_FILE = argv.config || 'config.xml';
settings.ICON_FILE = argv.icon || 'icon.png';
settings.OLD_XCODE_PATH = argv['xcode-old'] || false;
settings.RESOURCE_PATH = argv['resource-path'] || 'config/res';
settings.USE_PLATFORMS_PATH = !argv['resource-path']
settings.ICON_DIR = argv.iconDir || 'icon';
settings.WINDOWS = false;
settings.OSX = false;

/**
 * Check which platforms are added to the project and return their icon names and sizes
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatforms = function (projectName) {
  var deferred = Q.defer();
  var platforms = [];
  var xcodeFolder = '/Images.xcassets/AppIcon.appiconset/';

  if (settings.OLD_XCODE_PATH) {
    xcodeFolder = '/Resources/icons/';
  }

  platforms.push({
    name: 'ios',
    // TODO: use async fs.exists
    isAdded: fs.existsSync('platforms/ios'),
    iconsPath: (settings.RESOURCE_PATH + '/' + settings.ICON_DIR + '/ios/').replace('//', '/'),
    platformIconsPath: 'platforms/ios/' + projectName + xcodeFolder,
    icons: [
      { name: 'icon-20.png', size: 20 },
      { name: 'icon-20@2x.png', size: 40 },
      { name: 'icon-20@3x.png', size: 60 },
      { name: 'icon-40.png', size: 40 },
      { name: 'icon-40@2x.png', size: 80 },
      { name: 'icon-50.png', size: 50 },
      { name: 'icon-50@2x.png', size: 100 },
      { name: 'icon-60@2x.png', size: 120 },
      { name: 'icon-60@3x.png', size: 180 },
      { name: 'icon-72.png', size: 72 },
      { name: 'icon-72@2x.png', size: 144 },
      { name: 'icon-76.png', size: 76 },
      { name: 'icon-76@2x.png', size: 152 },
      { name: 'icon-83.5@2x.png', size: 167 },
      { name: 'icon-1024.png', size: 1024 },
      { name: 'icon-small.png', size: 29 },
      { name: 'icon-small@2x.png', size: 58 },
      { name: 'icon-small@3x.png', size: 87 },
      { name: 'icon.png', size: 57 },
      { name: 'icon@2x.png', size: 114 },
      { name: 'AppIcon24x24@2x.png', size: 48 },
      { name: 'AppIcon27.5x27.5@2x.png', size: 55 },
      { name: 'AppIcon29x29@2x.png', size: 58 },
      { name: 'AppIcon29x29@3x.png', size: 87 },
      { name: 'AppIcon40x40@2x.png', size: 80 },
      { name: 'AppIcon44x44@2x.png', size: 88 },
      { name: 'AppIcon86x86@2x.png', size: 172 },
      { name: 'AppIcon98x98@2x.png', size: 196 },
    ]
  });
  platforms.push({
    name: 'android',
    isAdded: fs.existsSync('platforms/android'),
    iconsPath: (settings.RESOURCE_PATH + '/' + settings.ICON_DIR + '/android/').replace('//', '/'),
    platformIconsPath: 'platforms/android/res/',
    icons: [
      { name: 'drawable/icon.png', size: 96 },
      { name: 'drawable-hdpi/icon.png', size: 72 },
      { name: 'drawable-ldpi/icon.png', size: 36 },
      { name: 'drawable-mdpi/icon.png', size: 48 },
      { name: 'drawable-xhdpi/icon.png', size: 96 },
      { name: 'drawable-xxhdpi/icon.png', size: 144 },
      { name: 'drawable-xxxhdpi/icon.png', size: 192 },
      { name: 'mipmap-hdpi/icon.png', size: 72 },
      { name: 'mipmap-ldpi/icon.png', size: 36 },
      { name: 'mipmap-mdpi/icon.png', size: 48 },
      { name: 'mipmap-xhdpi/icon.png', size: 96 },
      { name: 'mipmap-xxhdpi/icon.png', size: 144 },
      { name: 'mipmap-xxxhdpi/icon.png', size: 192 }
    ]
  });
  if (settings.OSX) {
    platforms.push({
      name: 'osx',
      // TODO: use async fs.exists
      isAdded: fs.existsSync('platforms/osx'),
      iconsPath: (settings.RESOURCE_PATH + '/' + settings.ICON_DIR + '/windows/').replace('//', '/'),
      platformIconsPath: 'platforms/windows/images/',
      icons: [
        { name: 'icon-16x16.png', size: 16 },
        { name: 'icon-32x32.png', size: 32 },
        { name: 'icon-64x64.png', size: 64 },
        { name: 'icon-128x128.png', size: 128 },
        { name: 'icon-256x256.png', size: 256 },
        { name: 'icon-512x512.png', size: 512 }
      ]
    });
  }
  if (settings.WINDOWS) {
    platforms.push({
      name: 'windows',
      isAdded: fs.existsSync('platforms/windows'),
      iconsPath: (settings.RESOURCE_PATH + '/' + settings.ICON_DIR + '/windows/').replace('//', '/'),
      platformIconsPath: 'platforms/windows/images/',
      icons: [
        { name: 'StoreLogo.scale-100.png', size: 50 },
        { name: 'StoreLogo.scale-125.png', size: 63 },
        { name: 'StoreLogo.scale-140.png', size: 70 },
        { name: 'StoreLogo.scale-150.png', size: 75 },
        { name: 'StoreLogo.scale-180.png', size: 90 },
        { name: 'StoreLogo.scale-200.png', size: 100 },
        { name: 'StoreLogo.scale-240.png', size: 120 },
        { name: 'StoreLogo.scale-400.png', size: 200 },

        { name: 'Square44x44Logo.scale-100.png', size: 44 },
        { name: 'Square44x44Logo.scale-125.png', size: 55 },
        { name: 'Square44x44Logo.scale-140.png', size: 62 },
        { name: 'Square44x44Logo.scale-150.png', size: 66 },
        { name: 'Square44x44Logo.scale-200.png', size: 88 },
        { name: 'Square44x44Logo.scale-240.png', size: 106 },
        { name: 'Square44x44Logo.scale-400.png', size: 176 },

        { name: 'Square71x71Logo.scale-100.png', size: 71 },
        { name: 'Square71x71Logo.scale-125.png', size: 89 },
        { name: 'Square71x71Logo.scale-140.png', size: 99 },
        { name: 'Square71x71Logo.scale-150.png', size: 107 },
        { name: 'Square71x71Logo.scale-200.png', size: 142 },
        { name: 'Square71x71Logo.scale-240.png', size: 170 },
        { name: 'Square71x71Logo.scale-400.png', size: 284 },

        { name: 'Square150x150Logo.scale-100.png', size: 150 },
        { name: 'Square150x150Logo.scale-125.png', size: 188 },
        { name: 'Square150x150Logo.scale-140.png', size: 210 },
        { name: 'Square150x150Logo.scale-150.png', size: 225 },
        { name: 'Square150x150Logo.scale-200.png', size: 300 },
        { name: 'Square150x150Logo.scale-240.png', size: 360 },
        { name: 'Square150x150Logo.scale-400.png', size: 600 },

        { name: 'Square310x310Logo.scale-100.png', size: 310 },
        { name: 'Square310x310Logo.scale-125.png', size: 388 },
        { name: 'Square310x310Logo.scale-140.png', size: 434 },
        { name: 'Square310x310Logo.scale-150.png', size: 465 },
        { name: 'Square310x310Logo.scale-180.png', size: 558 },
        { name: 'Square310x310Logo.scale-200.png', size: 620 },
        { name: 'Square310x310Logo.scale-400.png', size: 1240 },

        { name: 'Wide310x150Logo.scale-80.png', size: 248, height: 120 },
        { name: 'Wide310x150Logo.scale-100.png', size: 310, height: 150 },
        { name: 'Wide310x150Logo.scale-125.png', size: 388, height: 188 },
        { name: 'Wide310x150Logo.scale-140.png', size: 434, height: 210 },
        { name: 'Wide310x150Logo.scale-150.png', size: 465, height: 225 },
        { name: 'Wide310x150Logo.scale-180.png', size: 558, height: 270 },
        { name: 'Wide310x150Logo.scale-200.png', size: 620, height: 300 },
        { name: 'Wide310x150Logo.scale-240.png', size: 744, height: 360 },
        { name: 'Wide310x150Logo.scale-400.png', size: 1240, height: 600 }
      ]
    });
  }
  // TODO: add missing platforms
  deferred.resolve(platforms);
  return deferred.promise;
};

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
  fs.readFile(settings.CONFIG_FILE, function (err, data) {
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
 * Resizes, crops (if needed) and creates a new icon in the platform's folder.
 *
 * @param  {Object} platform
 * @param  {Object} icon
 * @return {Promise}
 */
var generateIcon = function (platform, icon) {
  var deferred = Q.defer();
  var srcPath = settings.ICON_FILE;
  var platformPath = srcPath.replace(/\.png$/, '-' + platform.name + '.png');
  if (fs.existsSync(platformPath)) {
    srcPath = platformPath;
  }
  var dstPath = (settings.USE_PLATFORMS_PATH ?
    platform.platformIconsPath : platform.iconsPath) + icon.name;
  var dst = path.dirname(dstPath);
  if (!fs.existsSync(dst)) {
    fs.mkdirsSync(dst);
  }
  ig.resize({
    srcPath: srcPath,
    dstPath: dstPath,
    quality: 1,
    format: 'png',
    width: icon.size,
    height: icon.size
  }, function (err, stdout, stderr) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve();
      display.success(icon.name + ' created [' + dstPath + ']');
    }
  });
  if (icon.height) {
    ig.crop({
      srcPath: srcPath,
      dstPath: dstPath,
      quality: 1,
      format: 'png',
      width: icon.size,
      height: icon.height
    }, function (err, stdout, stderr) {
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
  display.header('Generating Icons for ' + platform.name);
  var all = [];
  var icons = platform.icons;
  icons.forEach(function (icon) {
    all.push(generateIcon(platform, icon));
  });
  return Promise.all(all);
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
  _(platforms).forEach(function (platform) {
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
    var activePlatforms = _(platforms).where({ isAdded: true });
    if (activePlatforms.length > 0) {
      display.success('platforms found: ' + _(activePlatforms).pluck('name').join(', '));
      deferred.resolve();
    } else if (!settings.USE_PLATFORMS_PATH) {
      deferred.resolve();
    } else {
      display.error('No cordova platforms found. ' +
        'Make sure you are in the root folder of your Cordova project ' +
        'and add platforms with \'cordova platform add\'');
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
      display.error(settings.ICON_FILE + ' does not exist');
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
      display.error('cordova\'s ' + settings.CONFIG_FILE + ' does not exist');
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
