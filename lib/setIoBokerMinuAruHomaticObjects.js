//////////////////////////////////////////////////////////////////////////////
// script for ioBroker to set up alarms for minuaru adapter
// uses instance "minuaru.0"
//
// ******* IMPORTANT
// ******* enable command "setObject" in javascript instance *******
//
// USE ON YOUR OWN RISK !
// MAKE A BACKUP BEFORE STARTING THIS SCRIPT !
//
// %STATEID% in the alarmtext will be replaced by the real state-id 
// %STATENAME% in the alarmtext will be replaced by the name of the state
//
// if one or more rooms are assigned to the state, first room will be alarmarea
// since rooms are translated, please select language in second line of script
// you can switch of this feature by setting false in 2nd line of script
//
// Version 1.1
//
//////////////////////////////////////////////////////////////////////////////

// enable and setup language for rooms here
const useRoom = true;
const langRoom = "de";

// setup your data here
const data = [
    {
        selector: "channel[state.id=hm-rpc.*.0.LOWBAT_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "warning",
            "alarmArea": "Batterie",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Batteriestand niedrig"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.LOW_BAT_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "warning",
            "alarmArea": "Batterie",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Batteriestand niedrig"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.UNREACH_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Kommunikation",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Kommunikation gestört"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.STICKY_UNREACH_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Kommunikation",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Kommunikation gestört"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.CONFIG_PENDING_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "warning",
            "alarmArea": "Konfiguration",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Konfigurationsdaten stehen zur Übertragung an"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.UPDATE_PENDING_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "warning",
            "alarmArea": "Update",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Update verfügbar"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.DEVICE_IN_BOOTLOADER_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "information",
            "alarmArea": "Neustart",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Gerät startet neu"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.SABOTAGE_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Sabotage",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Gerät wurde sabotiert"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.0.ERROR_NON_FLAT_POSITIONING_ALARM]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Sabotage",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Gerät wurde angehoben"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.1.ERROR]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Error",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Fehler aufgetreten"
        }
    },
    {
        selector: "channel[state.id=hm-rpc.*.4.FAULT_REPORTING]",
        "minuaru.0": {
            "enabled": true,
            "lowEnabled": false,
            "comparator": "gt",
            "comparatorValue": 0,
            "comparatorText": "state not ok",
            "alarmClass": "alarm",
            "alarmArea": "Error",
            "debounce": 300,
            "sendToTelegram": false,
            "alarmText": "%STATENAME%: Fehler aufgetreten"
        }
    }
];

//////////////////////////////////////////////////////////////////////////////
// normally no changes behind this line necessary
//////////////////////////////////////////////////////////////////////////////

// helper
function replaceAll(string, token, newtoken) {
    if (token != newtoken)
        while (string.indexOf(token) > -1) {
            string = string.replace(token, newtoken);
        }
    return string;
}

// read ids of selector and extendObject
function setMinuaruData(data) {
    $(data.selector).each(function (id, i) {
        if (existsObject(id)) {
            // get object of state
            const stateObj = getObject(id, 'rooms');
            // handling of rooms
            if ( useRoom === true ){
                // init value
                let room = data["minuaru.0"].alarmArea;
                if ( stateObj.enumNames.length > 0 ) {
                    console.log(stateObj.enumNames[0][langRoom]);
                    if ( stateObj.enumNames[0][langRoom] && stateObj.enumNames[0][langRoom].length > 1 ){
                        room = stateObj.enumNames[0][langRoom];
                    } else if ( stateObj.enumNames[0][0] && stateObj.enumNames[0][0].length > 1 ){
                        // try with first value
                        room = stateObj.enumNames[0][0];
                    }
                }
                // write room
                data["minuaru.0"].alarmArea = room;
            }
            console.log("updating :" + id);
            let stateName = stateObj.common.name || id;
            data["minuaru.0"].alarmText = replaceAll(data["minuaru.0"].alarmText, "%STATEID%", id)
            data["minuaru.0"].alarmText = replaceAll(data["minuaru.0"].alarmText, "%STATENAME%", stateName)
            let dataToExtend = {};
            dataToExtend["minuaru.0"] = data["minuaru.0"];
            extendObject(id, { "common": { "custom": dataToExtend } });
        };
    });
}

// loop through data
function setObjects() {
    data.forEach(element => setMinuaruData(element));
}

// run script once
setObjects();
