var fs     = require('fs');
var xml2js = require('xml2js');
var ig     = require('imagemagick');
var colors = require('colors');
var _      = require('underscore');
var Q      = require('q');

/**
 * @var {Object} settings - names of the confix file and of the icon image
 * TODO: add option to get these values as CLI params
 */
var settings = {};
settings.CONFIG_FILE = 'config.xml';
settings.ICON_FILE   = 'res/icon.png';
settings.SPLASH_FILE_PORTRAIT = 'res/splash_p.png';
settings.SPLASH_FILE_LANDSCAPE = 'res/splash_l.png';

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
var generateIcon = function (platform, image) {
    var deferred = Q.defer();
    var imageProp = {
        dstPath: platform.iconsPath + image.name,
        quality: 1,
        format: 'png',
        width: image.width,
        height: image.height,
    };
    
    if(platform.type == 'Icons'){
        imageProp.srcPath = settings.ICON_FILE;
        resizeImage();
    } else {
        if(image.width > image.height){
            imageProp.srcPath = settings.SPLASH_FILE_LANDSCAPE;
            cropImage();
        } else {
            imageProp.srcPath = settings.SPLASH_FILE_PORTRAIT;
            cropImage();
        }
    }

    function resizeImage(){
        ig.resize(imageProp, function(err, stdout, stderr){
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
                display.success(image.name + ' created');
            }
        });
    }

    function cropImage(){
        ig.crop(imageProp, function(err, stdout, stderr){
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
                display.success(image.name + ' created');
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
    display.header('Generating ' + platform.type + ' for ' + platform.name);
    var all = [];
    
    if (platform.icons) {
        platform.icons.forEach(function (icon) {
            all.push(generateIcon(platform, icon));
        });
    } else {
        platform.splashes.forEach(function (splash) {
            all.push(generateIcon(platform, splash));
        });
    }

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
    getPlatformsFromConfig().then(function (platforms) {
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
 * Checks if a valid images files exist
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var validImagesExist = function () {
    var deferred = Q.defer();
    var all = []
    
    all.push(checkImage(settings.ICON_FILE));
    all.push(checkImage(settings.SPLASH_FILE_PORTRAIT));
    all.push(checkImage(settings.SPLASH_FILE_LANDSCAPE));

    Q.all(all).then(function () {
        deferred.resolve();
    });

    return deferred.promise;
};

/**
 * Checks if a valid image file exists
 *
 * @return {Promise} resolves if exists, rejects otherwise
 */
var checkImage = function (file) {
    var deferred = Q.defer();
    fs.exists(file, function (exists) {
        if (exists) {
            display.success(file + ' exists');
            deferred.resolve();
        } else {
            display.error(file + ' does not exist in the root folder');
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

/**
 * Check which platforms are added to the project (via confix.xml) and return their icon names and size
 *
 * @param  {String} projectName
 * @return {Promise} resolves with an array of platforms
 */
var getPlatformsFromConfig = function (projectName) {
    var deferred = Q.defer();
    var parser = new xml2js.Parser();
    var platforms = [];
    var folderCount = 0;
    var all = [];

    fs.readFile(settings.CONFIG_FILE, 'utf8', function(err, data){
        parser.parseString(data, function (err, result) {
            result.widget.platform.forEach(function(node){
                getIcons(node, platforms, function(platforms_result){
                    getSplash(node, platforms, function(platforms_result){
                        folderCount++;

                        if(folderCount == result.widget.platform.length){
                            deferred.resolve(platforms_result);
                        }
                    });
                });
            });            
        });
    });

    return deferred.promise;
};

/**
 * extract the icon information from the node structure
 *
 * @param  {Object} node
 * @param  {Array} platforms
 * @param  {String} cb
 * @return {Function} function with platforms array
 */
var getIcons = function (node, platforms, cb) {
    var platform = {};

    fs.mkdir('res/' + node.$.name, function(err){

        platform.name = node.$.name;
        platform.iconsPath = '';
        platform.isAdded = fs.existsSync('platforms/' + node.$.name),
        platform.icons = [];
        platform.type = 'Icons';

        if(node.icon){
            node.icon.forEach(function(icon){
                platform.icons.push({ name: icon.$.src, width: icon.$.width, height: icon.$.height });
            });
        }

        platforms.push(platform);

        return cb(platforms);
    });
};

/**
 * extract the splash information from the node structure
 *
 * @param  {Object} node
 * @param  {Array} platforms
 * @param  {String} cb
 * @return {Function} function with platforms array
 */
var getSplash = function (node, platforms, cb) {
    var platform = {};

    fs.mkdir('res/screen', function(err){
        fs.mkdir('res/screen/' + node.$.name, function(err){

            platform.name = node.$.name;
            platform.iconsPath = '';
            platform.isAdded = fs.existsSync('platforms/' + node.$.name),
            platform.splashes = [];
            platform.type = 'Splashes';

            if(node.splash){
                node.splash.forEach(function(splash){
                    platform.splashes.push({ name: splash.$.src, width: splash.$.width, height: splash.$.height });
                });
            }

            platforms.push(platform);

            return cb(platforms);
        });
    });
};

display.header('Checking Project & Icon');

atLeastOnePlatformFound()
    .then(validImagesExist)
    .then(configFileExists)
    .then(getProjectName)
    .then(getPlatformsFromConfig)
    .then(generateIcons)
    .catch(function (err) {
        if (err) {
            console.log(err);
        }
    }).then(function () {
        console.log('');
    });
