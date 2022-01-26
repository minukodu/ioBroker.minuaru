![Logo](admin/minuaru.png)
# ioBroker.minuaru

[![NPM version](https://img.shields.io/npm/v/iobroker.minuaru.svg)](https://www.npmjs.com/package/iobroker.minuaru)
[![Downloads](https://img.shields.io/npm/dm/iobroker.minuaru.svg)](https://www.npmjs.com/package/iobroker.minuaru)
![Number of Installations](https://iobroker.live/badges/minuaru-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/minuaru-stable.svg)
[![Dependency Status](https://img.shields.io/david/svallant/iobroker.minuaru.svg)](https://david-dm.org/svallant/iobroker.minuaru)

[![NPM](https://nodei.co/npm/iobroker.minuaru.png?downloads=true)](https://nodei.co/npm/iobroker.minuaru/)

**Tests:** ![Test and Release](https://github.com/svallant/ioBroker.minuaru/workflows/Test%20and%20Release/badge.svg)

## minuaru adapter for ioBroker

alarmsystem for ioBroker and minuvis

## Instructions

- install adapter as usual
- create instance of minuvis (only 1 possible)
- configuring the adapter setting

- select the telegram instance and set the username 
![minuaruTelegramSettings](https://user-images.githubusercontent.com/20790635/151257135-3b8e335f-9510-4531-9452-a982426011ab.png)

- adjust the Telegram message text if necessary
![minuaruTelegramMessageSettings](https://user-images.githubusercontent.com/20790635/151257507-b882a3ec-88b3-4c91-bc24-c774db30908f.png)

- translate the columns title of the alarm table
![minuaruAlarmtableSettingsheader](https://user-images.githubusercontent.com/20790635/151255365-4613045d-c868-4e5e-b428-9077b7ae6f99.png)

- change the colors of the message lines and text color if necessary
![minuaruAlarmtableSettingsColor](https://user-images.githubusercontent.com/20790635/151256690-ee9bead9-9277-4438-998b-c04d8c566124.png)

- activate minuaru on desired objects
![activateMinuaru](https://user-images.githubusercontent.com/20790635/151258456-58e99565-8af5-4200-a1f0-c6c75f4351d2.png)

- activate Minuaru and set an object's setting
![setSettingsObjects](https://user-images.githubusercontent.com/20790635/151258700-4d3ca8ca-5df0-4c3d-9638-968b97d788eb.png)

- activate the alarm page in Minukodu Builder and the minuaru.0 adapter

    ![activateAlarmpage](https://user-images.githubusercontent.com/20790635/151258040-6bb074e3-bd35-45b5-9888-5e826a7d3edc.png)

- use the new alarm page, also click on the number in the Minuvis header
![useNewAlarmPage](https://user-images.githubusercontent.com/20790635/151259455-c8d5a676-027a-4651-813b-211ca2083fd9.png)

- acknowledge the alarms to reduce the number of pending alarms
![acknowledgeAlarms](https://user-images.githubusercontent.com/20790635/151259642-4daec6cf-35fa-4e68-9d92-0000c2d41c25.png)

- use the html or json objects for integration into other visualizations
![otherObjects](https://user-images.githubusercontent.com/20790635/151259992-61758c9c-e102-4f38-ae0e-931721d04a17.png)




## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

### 0.0.1 (2022-01-16)
* (svallant) initial release

## License
MIT License

Copyright (c) 2022 svallant <svallant@gmx.eu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
