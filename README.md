# cordova-icon

<img src="cordova-icon-resize.png"/>

Automatic icon resizing for Cordova. Create an icon in the root folder of your Cordova project and use cordova-icon to automatically resize and copy it for all the platforms your project supports.

### Installation

     $ sudo npm install cordova-icon -g

### Usage
     
Create an ```icon.png``` file in the root folder of your cordova project and run:

     $ cordova-icon

### Creating a cordova-cli hook

Since the execution of cordova-icon is pretty fast, you can add it as a cordova-cli to execute before every build.
To create a new hook, go to your cordova project and run:

    $ mkdir hooks/after_prepare
    $ vi hooks/after_prepare/cordova-icon.sh

Paste the following into the hook script:

    #!/bin/bash
    cordova-icon

Then give the script +x permission:

    chmod +x hooks/after_prepare/cordova-icon.sh

That's it. Now every time you ```cordova build```, the icons will be auto generated.

### Requirements

- ImageMagick ([instructions for Mac](https://sethvargo.com/install-imagemagick-on-osx-lion/))
- At least one platform was added to your project ([cordova platforms docs](http://cordova.apache.org/docs/en/3.4.0/guide_platforms_index.md.html#Platform%20Guides))
- Cordova's config.xml file must exist in the root folder ([cordova config.xml docs](http://cordova.apache.org/docs/en/3.4.0/config_ref_index.md.html#The%20config.xml%20File))

### License

MIT
