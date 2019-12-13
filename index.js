var fs     = require('fs-extra');
var path   = require('path');
var xml2js = require('xml2js');
var ig     = require('imagemagick');
var colors = require('colors');
var _      = require('underscore');
var Q      = require('q');
var argv   = require('minimist')(process.argv.slice(2));

/**
 * @var {Object} settings - names of the config file and of the icon image
 */
var settings = {};
settings.CONFIG_FILE = argv.config || 'config.xml';
settings.ICON_FILE = argv.icon || 'icon.png';
settings.OLD_XCODE_PATH = argv['xcode-old'] || false;

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
    name : 'ios',
    // TODO: use async fs.exists
    isAdded : fs.existsSync('platforms/ios'),
    iconsPath : 'platforms/ios/' + projectName + xcodeFolder,
    contentJSONPath: 'platforms/ios/' + projectName + xcodeFolder + 'Contents.json',
    icons : [
      { name: '20pt2x.png',             size : 40   },
      { name: '20pt3x.png',          size : 60   },
      { name: '29pt1x.png',          size : 29   },
      { name: '29pt2x.png',             size : 58   },
      { name: '29pt3x.png',          size : 87   },
      { name: '40pt2x.png',             size : 80   },
      { name: '40pt3x.png',          size : 120  },
      { name: '57pt1x.png',          size : 57  },
      { name: '57pt2x.png',          size : 114  },
      { name: '60pt2x.png',             size : 120   },
      { name: '60pt3x.png',          size : 180  },
      { name: '20pt1xipad.png',             size : 20   },
      { name: '20pt2xipad.png',          size : 40  },
      { name: '29pt1xipad.png',        size : 29  },
      { name: '29pt2xipad.png',           size : 58 },
      { name: '40pt1xipad.png',          size : 40   },
      { name: '40pt2xipad.png',       size : 80   },
      { name: '50pt1xipad.png',       size : 50   },
      { name: '50pt2xipad.png',                size : 100   },
      { name: '72pt1xipad.png',             size : 72  },
      { name: '72pt2xipad.png',     size : 144   },
      { name: '76pt1xipad.png', size : 76   },
      { name: '76pt2xipad.png',     size : 152   },
      { name: '83.5pt2xipad.png',     size : 167   },
      { name: 'appstore.png',     size : 1024   },
      { name: '38mm2xwatch.png',     size : 48   },
      { name: '38mmshortwatch2x.png',     size : 55  },
      { name: '29pt5858watch.png',     size : 58  },
      { name: '29pt3xwatch.png',     size : 87  },
      { name: '40pt44pt2xwatch.png',     size : 80  },
      { name: '44mm2x40ptwatc.png',     size : 88  },
      { name: '44mm2xwatch.png',     size : 100  },
      { name: '86ptwatch172172.png',     size : 172  },
      { name: '40mm2xshortwatch.png',     size : 196  },
      { name: '44mmshortwatch2x.png',     size : 216  },
      { name: 'watchappstore.png',     size : 1024  },
    ],
  });
  platforms.push({
    name : 'android',
    isAdded : fs.existsSync('platforms/android'),
    iconsPath : 'platforms/android/app/src/main/res/',
    icons : [
      { name : 'drawable/icon.png',       size : 96 },
      { name : 'drawable-hdpi/icon.png',  size : 72 },
      { name : 'drawable-ldpi/icon.png',  size : 36 },
      { name : 'drawable-mdpi/icon.png',  size : 48 },
      { name : 'drawable-xhdpi/icon.png', size : 96 },
      { name : 'drawable-xxhdpi/icon.png', size : 144 },
      { name : 'drawable-xxxhdpi/icon.png', size : 192 },
      { name : 'mipmap-hdpi/icon.png',  size : 72 },
      { name : 'mipmap-ldpi/icon.png',  size : 36 },
      { name : 'mipmap-mdpi/icon.png',  size : 48 },
      { name : 'mipmap-xhdpi/icon.png', size : 96 },
      { name : 'mipmap-xxhdpi/icon.png', size : 144 },
      { name : 'mipmap-xxxhdpi/icon.png', size : 192 }
    ]
  });
  platforms.push({
    name : 'osx',
    // TODO: use async fs.exists
    isAdded : fs.existsSync('platforms/osx'),
    iconsPath : 'platforms/osx/' + projectName + xcodeFolder,
    icons : [
      { name : 'icon-16x16.png',    size : 16  },
      { name : 'icon-32x32.png',    size : 32  },
      { name : 'icon-64x64.png',    size : 64  },
      { name : 'icon-128x128.png',  size : 128 },
      { name : 'icon-256x256.png',  size : 256 },
      { name : 'icon-512x512.png',  size : 512 }
    ]
  });
  platforms.push({
    name : 'windows',
    isAdded : fs.existsSync('platforms/windows'),
    iconsPath : 'platforms/windows/images/',
    icons : [
      { name : 'StoreLogo.scale-100.png', size : 50  },
      { name : 'StoreLogo.scale-125.png', size : 63  },
      { name : 'StoreLogo.scale-140.png', size : 70  },
      { name : 'StoreLogo.scale-150.png', size : 75  },
      { name : 'StoreLogo.scale-180.png', size : 90  },
      { name : 'StoreLogo.scale-200.png', size : 100 },
      { name : 'StoreLogo.scale-240.png', size : 120 },
      { name : 'StoreLogo.scale-400.png', size : 200 },

      { name : 'Square44x44Logo.scale-100.png', size : 44  },
      { name : 'Square44x44Logo.scale-125.png', size : 55  },
      { name : 'Square44x44Logo.scale-140.png', size : 62  },
      { name : 'Square44x44Logo.scale-150.png', size : 66  },
      { name : 'Square44x44Logo.scale-200.png', size : 88  },
      { name : 'Square44x44Logo.scale-240.png', size : 106  },
      { name : 'Square44x44Logo.scale-400.png', size : 176 },

      { name : 'Square71x71Logo.scale-100.png', size : 71  },
      { name : 'Square71x71Logo.scale-125.png', size : 89  },
      { name : 'Square71x71Logo.scale-140.png', size : 99 },
      { name : 'Square71x71Logo.scale-150.png', size : 107 },
      { name : 'Square71x71Logo.scale-200.png', size : 142 },
      { name : 'Square71x71Logo.scale-240.png', size : 170 },
      { name : 'Square71x71Logo.scale-400.png', size : 284 },

      { name : 'Square150x150Logo.scale-100.png', size : 150 },
      { name : 'Square150x150Logo.scale-125.png', size : 188 },
      { name : 'Square150x150Logo.scale-140.png', size : 210 },
      { name : 'Square150x150Logo.scale-150.png', size : 225 },
      { name : 'Square150x150Logo.scale-200.png', size : 300 },
      { name : 'Square150x150Logo.scale-240.png', size : 360 },
      { name : 'Square150x150Logo.scale-400.png', size : 600 },

      { name : 'Square310x310Logo.scale-100.png', size : 310  },
      { name : 'Square310x310Logo.scale-125.png', size : 388  },
      { name : 'Square310x310Logo.scale-140.png', size : 434  },
      { name : 'Square310x310Logo.scale-150.png', size : 465  },
      { name : 'Square310x310Logo.scale-180.png', size : 558  },
      { name : 'Square310x310Logo.scale-200.png', size : 620  },
      { name : 'Square310x310Logo.scale-400.png', size : 1240 },

      { name : 'Wide310x150Logo.scale-80.png', size : 248, height : 120  },
      { name : 'Wide310x150Logo.scale-100.png', size : 310, height : 150  },
      { name : 'Wide310x150Logo.scale-125.png', size : 388, height : 188  },
      { name : 'Wide310x150Logo.scale-140.png', size : 434, height : 210  },
      { name : 'Wide310x150Logo.scale-150.png', size : 465, height : 225  },
      { name : 'Wide310x150Logo.scale-180.png', size : 558, height : 270  },
      { name : 'Wide310x150Logo.scale-200.png', size : 620, height : 300  },
      { name : 'Wide310x150Logo.scale-240.png', size : 744, height : 360  },
      { name : 'Wide310x150Logo.scale-400.png', size : 1240, height : 600 }
    ]
  });
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
  var dstPath = platform.iconsPath + icon.name;
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
      srcPath: srcPath,
      dstPath: dstPath,
      quality: 1,
      format: 'png',
      width: icon.size,
      height: icon.height
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
  let data = JSON.stringify({
    "images": [
      {
        "size": "20x20",
        "idiom": "iphone",
        "filename": "20pt2x.png",
        "scale": "2x"
      },
      {
        "size": "20x20",
        "idiom": "iphone",
        "filename": "20pt3x.png",
        "scale": "3x"
      },
      {
        "size": "29x29",
        "idiom": "iphone",
        "filename": "29pt1x.png",
        "scale": "1x"
      },
      {
        "size": "29x29",
        "idiom": "iphone",
        "filename": "29pt2x.png",
        "scale": "2x"
      },
      {
        "size": "29x29",
        "idiom": "iphone",
        "filename": "29pt3x.png",
        "scale": "3x"
      },
      {
        "size": "40x40",
        "idiom": "iphone",
        "filename": "40pt2x.png",
        "scale": "2x"
      },
      {
        "size": "40x40",
        "idiom": "iphone",
        "filename": "40pt3x.png",
        "scale": "3x"
      },
      {
        "size": "57x57",
        "idiom": "iphone",
        "filename": "57pt1x.png",
        "scale": "1x"
      },
      {
        "size": "57x57",
        "idiom": "iphone",
        "filename": "57pt2x.png",
        "scale": "2x"
      },
      {
        "size": "60x60",
        "idiom": "iphone",
        "filename": "60pt2x.png",
        "scale": "2x"
      },
      {
        "size": "60x60",
        "idiom": "iphone",
        "filename": "60pt3x.png",
        "scale": "3x"
      },
      {
        "size": "20x20",
        "idiom": "ipad",
        "filename": "20pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "20x20",
        "idiom": "ipad",
        "filename": "20pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "29x29",
        "idiom": "ipad",
        "filename": "29pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "29x29",
        "idiom": "ipad",
        "filename": "29pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "40x40",
        "idiom": "ipad",
        "filename": "40pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "40x40",
        "idiom": "ipad",
        "filename": "40pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "50x50",
        "idiom": "ipad",
        "filename": "50pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "50x50",
        "idiom": "ipad",
        "filename": "50pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "72x72",
        "idiom": "ipad",
        "filename": "72pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "72x72",
        "idiom": "ipad",
        "filename": "72pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "76x76",
        "idiom": "ipad",
        "filename": "76pt1xipad.png",
        "scale": "1x"
      },
      {
        "size": "76x76",
        "idiom": "ipad",
        "filename": "76pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "83.5x83.5",
        "idiom": "ipad",
        "filename": "83.5pt2xipad.png",
        "scale": "2x"
      },
      {
        "size": "1024x1024",
        "idiom": "ios-marketing",
        "filename": "appstore.png",
        "scale": "1x"
      },
      {
        "size": "24x24",
        "idiom": "watch",
        "filename": "38mm2xwatch.png",
        "scale": "2x",
        "role": "notificationCenter",
        "subtype": "38mm"
      },
      {
        "size": "27.5x27.5",
        "idiom": "watch",
        "filename": "38mmshortwatch2x.png",
        "scale": "2x",
        "role": "notificationCenter",
        "subtype": "42mm"
      },
      {
        "size": "29x29",
        "idiom": "watch",
        "filename": "29pt5858watch.png",
        "role": "companionSettings",
        "scale": "2x"
      },
      {
        "size": "29x29",
        "idiom": "watch",
        "filename": "29pt3xwatch.png",
        "role": "companionSettings",
        "scale": "3x"
      },
      {
        "size": "40x40",
        "idiom": "watch",
        "filename": "40pt44pt2xwatch.png",
        "scale": "2x",
        "role": "appLauncher",
        "subtype": "38mm"
      },
      {
        "size": "44x44",
        "idiom": "watch",
        "filename": "44mm2x40ptwatc.png",
        "scale": "2x",
        "role": "appLauncher",
        "subtype": "40mm"
      },
      {
        "size": "50x50",
        "idiom": "watch",
        "filename": "44mm2xwatch.png",
        "scale": "2x",
        "role": "appLauncher",
        "subtype": "44mm"
      },
      {
        "size": "86x86",
        "idiom": "watch",
        "filename": "86ptwatch172172.png",
        "scale": "2x",
        "role": "quickLook",
        "subtype": "38mm"
      },
      {
        "size": "98x98",
        "idiom": "watch",
        "filename": "40mm2xshortwatch.png",
        "scale": "2x",
        "role": "quickLook",
        "subtype": "42mm"
      },
      {
        "size": "108x108",
        "idiom": "watch",
        "filename": "44mmshortwatch2x.png",
        "scale": "2x",
        "role": "quickLook",
        "subtype": "44mm"
      },
      {
        "size": "1024x1024",
        "idiom": "watch-marketing",
        "filename": "watchappstore.png",
        "scale": "1x"
      }
    ],
    "info": {
      "version": 1,
      "author": "xcode"
    }
  }
  )
  display.header('Generating Icons for ' + platform.name);
  if(platform.name == 'ios') {
    fs.writeFileSync(platform.contentJSONPath, data)
  }
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
