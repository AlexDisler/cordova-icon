# cordova-icon

<img src="cordova-icon-resize.png"/>

Automatic icon resizing for Cordova. Create an icon in the root folder of your Cordova project and use cordova-icon to automatically resize and copy it for all the platforms your project supports.

### Installation

     $ npm install cordova-icon -g

### Usage
     
Create an ```icon.png``` file in the root folder of your cordova project and run:

     $ cordova-icon

### Requirements

- ImageMagick [instructions for MAC](https://sethvargo.com/install-imagemagick-on-osx-lion/)
- At least one platform was added to your project ([cordova platforms docs](http://cordova.apache.org/docs/en/3.4.0/guide_platforms_index.md.html#Platform%20Guides))
- Cordova's config.xml file must exist in the root folder ([cordova config.xml docs](http://cordova.apache.org/docs/en/3.4.0/config_ref_index.md.html#The%20config.xml%20File))

### License

MIT
