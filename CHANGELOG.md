# Change Log
All notable changes to this project [will be documented](http://keepachangelog.com/) in this file.
This project *tries to* adhere to [Semantic Versioning](http://semver.org/).

## [0.7.0] - 2016-04-17

- Use wrench to prevent issues with directory creation (e150cc1)
- uses config/res as the default folder to persist generated icons (not backwards compatible)
- Add --help option
- Ability to specify output path
- Backwards-compatibility mode to use platforms path instead of new defaults (-c)

## [0.6.0] - 2016-03-08
- Allow platform-specific icons (0c26dfe)

## [0.5.0] - 2016-03-03
- For iOS, add `icon-small@3x.png` & `icon-83.5@2x.png` (3e42077 - 5ba1e4e)
- For iOS, remove icons considered as "Unassigned" in Xcode (32eebea)
- Ensure that destination directory exists (7372147)
- Support for Windows platform (f60dafb)
- Minor changes

## [0.4.1] - 2016-02-24
- Add various things that will help to maintain the project (editorconfig, guidelines, changelog...)
- Update path for iOS icons ([358e491](https://github.com/AlexDisler/cordova-icon/commit/358e491ce01645d6b15b1c0bae3313f08f18df0e) + [426984b](https://github.com/AlexDisler/cordova-icon/commit/426984b39335055be56d838ca2ed118433588c55)) - Please use [an older version](https://github.com/AlexDisler/cordova-icon/tree/891d17fdf271a6139c1c8e97beacab817169d282) if this leads to problems
