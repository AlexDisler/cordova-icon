# cordova-icon

<img src="cordova-icon-resize.png"/>

Automatic icon/splashscreen resizing for Cordova. Create an icon and splash screen in the root folder of your Cordova project and use cordova-icon to automatically resize and copy it for all the platforms your project supports (currenty works with iOS and Android).

### Installation

     $ sudo npm install cordova-icon -g

### Usage
     
#### Quickstart

Create an ```icon.png``` and/or ```splash.png``` file in the root folder of your cordova project and run:

     $ cordova-icon

#### CLI Options

    -i, --icon [s]        Base icon used to generate others
    -s, --splash [s]      Base splash screen used to generate others
    -c, --config [s]      Cordova configuration file location, used as the root of your project
    -b, --background [s]  Background to use for icon

### HTML Art Asset File Generation

  If you specify an HTML file for the icon or splash assets, a web context with the dimensions of each output file will be used to generate them. This makes it possible to lay out your splash screens without streching and warping a static picture.

### Creating a cordova-cli hook

Since the execution of cordova-icon is pretty fast, you can add it as a cordova-cli hook to execute before every build.
To create a new hook, go to your cordova project and run:

    $ mkdir hooks/after_prepare
    $ vi hooks/after_prepare/cordova-icon.sh

Paste the following into the hook script:

    #!/bin/bash
    cordova-icon

Then give the script +x permission:

    $ chmod +x hooks/after_prepare/cordova-icon.sh

That's it. Now every time you ```cordova build```, the icons will be auto generated.

### Requirements

- ImageMagick

Install on a Mac:

     $ brew install imagemagick

- At least one platform was added to your project ([cordova platforms docs](http://cordova.apache.org/docs/en/3.4.0/guide_platforms_index.md.html#Platform%20Guides))
- Cordova's config.xml file must exist in the root folder ([cordova config.xml docs](http://cordova.apache.org/docs/en/3.4.0/config_ref_index.md.html#The%20config.xml%20File))

### License

MIT
