# cordova-icon

<img src="cordova-icon-resize.png"/>

Automatic icon resizing for Cordova. Create an icon in the root folder of your Cordova project and use cordova-icon to automatically resize and copy it for all the platforms your project supports.

### How to use

1. Create an icon.png file in the root folder of your project. 1024x1024 size is recommended.
2. Run ```cordova-icon```

### Requirements

- At least one platform was added to your project ([http://cordova.apache.org/docs/en/3.4.0/guide_platforms_index.md.html#Platform%20Guides](cordova platforms docs))
- Cordova's build.xml file must exist in the root folder (created by cordova)
