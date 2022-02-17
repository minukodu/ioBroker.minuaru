"use strict";

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
const utils = require("@iobroker/adapter-core");
const fs = require("fs");
const schedule = require('node-schedule');
const databaseTools = require("./lib/sqlite");
const jsonToHtml = require("./lib/jsonToHtml");

class Minuaru extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "minuaru",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
		this.registeredStates = {};
		this.registeredStatesCheckTimeStamp = {};
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize 
		this.log.debug("config: " + JSON.stringify(this.config));
		// this.log.debug("namespace: " + JSON.stringify(this.namespace));

		let debugInfo;

		// create db if not exits
		const dbDir = this.getDatabaseDir(this.namespace);
		const dbFile = dbDir + "/" + this.namespace + ".db";
		this.log.debug("DatabasePath: " + dbFile);
		this.db = databaseTools.initDatabase(dbFile);
		// Create table
		debugInfo = databaseTools.initTable(this.db);
		this.log.debug("create table: " + JSON.stringify(debugInfo));

		// create states of adapter
		await this.setObjectNotExistsAsync("nbAlarmsActive", {
			type: "state",
			common: {
				name: "nbAlarmsActive",
				type: "number",
				role: "value",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("nbAlarmsActiveNotAcknowledged", {
			type: "state",
			common: {
				name: "nbAlarmsActiveNotAcknowledged",
				type: "number",
				role: "value",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("htmlAlarmHistory", {
			type: "state",
			common: {
				name: "htmlAlarmHistory",
				type: "string",
				role: "html",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("htmlAlarmsActive", {
			type: "state",
			common: {
				name: "htmlAlarmsActive",
				type: "string",
				role: "html",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("htmlMinuVisBanner", {
			type: "state",
			common: {
				name: "htmlMinuVisBanner",
				type: "string",
				role: "html",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("jsonAlarmHistory", {
			type: "state",
			common: {
				name: "jsonAlarmHistory",
				type: "string",
				role: "json",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("jsonAlarmsActive", {
			type: "state",
			common: {
				name: "jsonAlarmsActive",
				type: "string",
				role: "json",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("stateIdToAcknowledge", {
			type: "state",
			common: {
				name: "stateIdToAcknowledge",
				type: "string",
				role: "text",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('deleteAlarmTable', {
			type: 'state',
			common: {
				name: 'deleteAlarmTable',
				type: 'boolean',
				role: 'button',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("minuVisConfig", {
			type: "state",
			common: {
				name: "minuVisConfig",
				type: "string",
				role: "json",
				read: true,
				write: true,
			},
			native: {},
		});
		// set telegram config
		this.telegramConfig = {};
		if (this.config.telegram) {
			this.telegramConfig.alarm_textComes = this.config.telegram.alarm_textComes || "🔴 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.alarm_textGoes = this.config.telegram.alarm_textGoes || "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
			this.telegramConfig.warning_textComes = this.config.telegram.warning_textComes || "🟡 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.warning_textGoes = this.config.telegram.warning_textGoes || "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
			this.telegramConfig.information_textComes = this.config.telegram.information_textComes || "🔵 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.information_textGoes = this.config.telegram.information_textGoes || "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
		} else {
			this.telegramConfig.alarm_textComes = "🔴 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.alarm_textGoes = "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
			this.telegramConfig.warning_textComes = "🟡 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.warning_textGoes = "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
			this.telegramConfig.information_textComes = "🔵 %ALARMCLASS%%NL%*%ALARMTEXT%*%NL%Room: %ALARMAREA%";
			this.telegramConfig.information_textGoes = "🟢 %ALARMCLASS%%NL%~%ALARMTEXT%~%NL%Room: %ALARMAREA%";
		}
		// set minuVis config
		this.minuVisConfig = {
			"columnNames": this.config.columnNames || "time comes,time goes,time ack,alarmtext,area,acknowlegde",
			"alarm_colorActive": this.config.alarm_colorActive || "#ee2e2c",
			"alarm_colorGone": this.config.alarm_colorGone || "#f48382",
			"alarm_foregroundColor": this.config.alarm_foregroundColor || "#000000",
			"warning_colorActive": this.config.warning_colorActive || "#d5ca00",
			"warning_colorGone": this.config.warning_colorGone || "#d1cd86",
			"warning_foregroundColor": this.config.warning_foregroundColor || "#000000",
			"information_colorActive": this.config.information_colorActive || "#4e88ca",
			"information_colorGone": this.config.information_colorGone || "#82a4cb",
			"information_foregroundColor": this.config.information_foregroundColor || "#000000",
		};
		await this.setStateAsync("minuVisConfig", JSON.stringify(this.minuVisConfig));
		// subscribe all states and objects
		this.subscribeForeignStates("*");
		this.subscribeForeignObjects("*");

		// read all object and register states
		this.getObjectView('system', 'custom', {}, (err, doc) => {
			this.log.debug("getObjectView: " + JSON.stringify(doc));
			if (doc && doc.rows) {
				for (let data of doc.rows) {
					if (data.value && data.value[this.namespace]) {
						// read type of state
						this.getForeignObject(data.id, (err, object) => {
							this.log.debug("type: " + JSON.stringify(object.common.type));
							this.registerState(data.id, data.value[this.namespace], object.common.type)
							this.log.debug("this.registeredStates: " + JSON.stringify(this.registeredStates));
							this.getForeignState(data.id, (err, state) => {
								this.handleStateChange(data.id, state, true);
								this.log.debug("initialize status of: " + data.id);
							});
						});
					}
				}
			}
		});
		// update lists at startup
		this.updateListData();
		// start schedule for checking timestamps every minute
		this.checkTimeStampSchedule = schedule.scheduleJob('* * * * *', function () {
			this.checkTimeStamps();
		}.bind(this));
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// unregister all states
			for (let id in this.registeredStates) {
				this.unregisterState(id);
			}
			// cancel schedule for checking timestamps 
			this.checkTimeStampSchedule.cancel();
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// object has our custom data, then register state
			if (obj.common && obj.common.custom && obj.common.custom[this.namespace]) {
				this.registerState(id, obj.common.custom[this.namespace], obj.common.type);
				this.log.debug(`state ${id} registered: ${JSON.stringify(obj.common.custom)}`);
			}
		} else {
			// The object was deleted => unregister state
			this.log.debug(`object ${id} deleted`);
			this.unregisterState(id);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		this.handleStateChange(id, state, false);
	}

	handleStateChange(id, state, startUp) {
		let updateNeeded = false;
		if (state) {
			let debugInfo;
			// request to delete table in database ?
			if (id === this.namespace + ".deleteAlarmTable" && state.val === true) {
				this.setStateAsync('deleteAlarmTable', false);
				debugInfo = databaseTools.deleteTable(this.db);
				this.log.debug("delete table: " + JSON.stringify(debugInfo));
				updateNeeded = true;
			}
			// request to acknowledge alarm ?
			if (id === this.namespace + ".stateIdToAcknowledge" && (this.registeredStates[state.val] || this.registeredStatesCheckTimeStamp[state.val])) {
				this.setStateAsync('stateIdToAcknowledge', "");
				let data = {};
				data.tsAck = Date.now();
				data.stateId = state.val || "";
				debugInfo = databaseTools.updateAlarmAck(this.db, data);
				this.log.debug("acknowledge alarm: " + JSON.stringify(debugInfo));
				updateNeeded = true;
			}
			// check timestamp of id ?
			if (this.registeredStatesCheckTimeStamp[id] && this.registeredStatesCheckTimeStamp[id].enabled === true) {
				this.log.debug("new timestamp of state: " + id + " : " + state.ts);
				// store last timestamp
				this.registeredStatesCheckTimeStamp[id].lastTimeStamp = state.ts;
				return;
			}
			// new alarm ??
			if (this.registeredStates[id] && this.registeredStates[id].enabled === true) {
				// check correct type: only bool, number and string allowed:
				if (this.registeredStates[id].type !== "boolean" && this.registeredStates[id].type !== "number" && this.registeredStates[id].type !== "string") {
					this.log.error("wrong type of state: " + id + " : " + this.registeredStates[id].type);
					return;
				}
				// init
				let alarmComes = false;
				let alarmGoes = false;
				// load settings
				let customSettings = this.registeredStates[id];
				// create data-object for Database
				let data = {};
				data.stateId = id;
				data.alarmText = customSettings.alarmText || id + "alarm";
				data.alarmClass = customSettings.alarmClass || "alarm";
				data.alarmArea = customSettings.alarmArea || "undefined";
				// check type of state (boolean or not)
				if (this.registeredStates[id].type === "boolean") {
					this.log.debug("state: " + id + " is boolean; value: " + state.val);
					if (state.val === false) {
						if (customSettings.lowEnabled === true) {
							alarmComes = true;
						} else {
							alarmGoes = true;
						}
					} else // state.val = true
						if (customSettings.lowEnabled === false) {
							alarmComes = true;
						} else {
							alarmGoes = true;
						}
				} else if (this.registeredStates[id].type === "number") { // type number ?
					let value = parseFloat(state.val);
					if (isNaN(value)) {
						value = 0;
						this.log.debug("state: " + id + " is not numerical, assume to be 0 (zero)");
					}
					// is alarm active ?
					let getNbActiveAlarms = databaseTools.getNbActiveAlarmOfId(this.db, data);
					// prepare value to compare
					let valueToCompare = parseFloat(customSettings.comparatorValue);
					if (customSettings.comparator === "lt") {
						if (getNbActiveAlarms === 0 && value < valueToCompare) {
							alarmComes = true;
						} else if (value >= valueToCompare) {
							alarmGoes = true;
						}
					} else { // assume "gt" 
						if (getNbActiveAlarms === 0 && value > valueToCompare) {
							alarmComes = true;
						} else if (value <= valueToCompare) {
							alarmGoes = true;
						}
					}
				} else { // assume string
					// is alarm active ?
					let getNbActiveAlarms = databaseTools.getNbActiveAlarmOfId(this.db, data);
					// compare
					this.log.debug("string  val: " + state.val);
					this.log.debug("compare val: " + customSettings.comparatorText);

					if (getNbActiveAlarms === 0 && state.val === customSettings.comparatorText) {
						alarmComes = true;
					} else if (state.val !== customSettings.comparatorText) {
						alarmGoes = true;
					}
				} // END boolean  or number or string ?
				// insert in database
				if (this.registeredStates[id].skipEvents === false && alarmComes === true) {
					data.tsComes = Date.now();
					debugInfo = databaseTools.insertAlarmComes(this.db, data);
					this.log.debug("insert alarm comes: " + JSON.stringify(debugInfo));
					if (customSettings.sendToTelegram === true) {
						this.sendToTelegram(true, data);
					}
					updateNeeded = true;
				}
				if (this.registeredStates[id].skipEvents === false && alarmGoes === true) {
					data.tsGoes = Date.now();
					debugInfo = databaseTools.updateAlarmGoes(this.db, data);
					this.log.debug("insert alarm goes: " + JSON.stringify(debugInfo));
					if (customSettings.sendToTelegram === true) {
						this.sendToTelegram(false, data);
					}
					updateNeeded = true;
				}
				if (this.registeredStates[id].skipEvents === false && (alarmComes === true || alarmGoes === true)) {
					this.log.debug("skipEvents: " + JSON.stringify(this.registeredStates[id].skipEvents));
					// set debounce-timer
					if (startUp === false && customSettings.debounce && customSettings.debounce > 0) {
						this.log.debug("set debounce timer: " + JSON.stringify(id));
						this.registeredStates[id].valueAtAlarm = state.val;
						this.log.debug("value at alarm: " + JSON.stringify(this.registeredStates[id].valueAtAlarm));
						this.registeredStates[id].skipEvents = true;
						this.registeredStates[id].debounceTimer = setTimeout(
							() => {
								this.registeredStates[id].skipEvents = false;
								this.getForeignState(id, (err, state) => {
									this.log.debug("state at reset debounce timer: " + JSON.stringify(state));
									this.log.debug("value at alarm: " + JSON.stringify(this.registeredStates[id].valueAtAlarm));
									if (state && this.registeredStates[id].valueAtAlarm !== state.val) {
										this.log.debug("handle alarm at reset debounce: " + JSON.stringify(id));
										this.handleStateChange(id, state, false);
									}
								});
								this.log.debug("reset debounce timer: " + JSON.stringify(id));
							},
							customSettings.debounce
						);

					}
				}
			}
		} // enabled ?
		if (updateNeeded === true) {
			// update html amd json data
			this.updateListData();
		}
	}

	//checkTimeStamp started by schedule
	checkTimeStamps() {
		this.log.debug("checking timestamps in progress...");
		// this.log.debug(JSON.stringify(this.registeredStatesCheckTimeStamp));
		let updateNeeded = false;
		let debugInfo;
		for (let id in this.registeredStatesCheckTimeStamp) {
			// create data-object for Database
			let data = {};
			data.stateId = id;
			data.alarmText = this.registeredStatesCheckTimeStamp[id].alarmText || id + "alarm";
			data.alarmClass = this.registeredStatesCheckTimeStamp[id].alarmClass || "alarm";
			data.alarmArea = this.registeredStatesCheckTimeStamp[id].alarmArea || "undefined";
			let lastTimeStamp = this.registeredStatesCheckTimeStamp[id].lastTimeStamp;
			let timeStampDiff = Date.now() - lastTimeStamp;
			let timeStampMaxDiff = this.registeredStatesCheckTimeStamp[id].maxAgeTimeStampMinutes * 60 * 1000;
			if (lastTimeStamp > 0 && timeStampDiff > timeStampMaxDiff) {
				this.log.debug("timeStamp of state: " + id + " too old: " + Math.round(timeStampDiff / 60 / 1000) + " min");
				if (this.registeredStatesCheckTimeStamp[id].timeStampTooOld === false) {
					// alarm comes
					data.tsComes = Date.now();
					debugInfo = databaseTools.insertAlarmComes(this.db, data);
					this.log.debug("insert alarm comes: " + JSON.stringify(debugInfo));
					if (this.registeredStatesCheckTimeStamp[id].sendToTelegram === true) {
						this.sendToTelegram(true, data);
					}
					updateNeeded = true;
				}
				this.registeredStatesCheckTimeStamp[id].timeStampTooOld = true;
			} else {
				if (this.registeredStatesCheckTimeStamp[id].timeStampTooOld === true) {
					// alarm goes
					data.tsGoes = Date.now();
					debugInfo = databaseTools.updateAlarmGoes(this.db, data);
					this.log.debug("insert alarm goes: " + JSON.stringify(debugInfo));
					if (this.registeredStatesCheckTimeStamp[id].sendToTelegram === true) {
						this.sendToTelegram(false, data);
					}
					updateNeeded = true;
				}
				this.registeredStatesCheckTimeStamp[id].timeStampTooOld = false;
			}
		}
		if (updateNeeded === true) {
			// update html amd json data
			this.updateListData();
		}
	}

	// update listData json and html for visualization
	updateListData() {
		// update html amd json data
		let alarmListData = databaseTools.getAlarmListData(this.db);
		// this.log.debug("new alarm data: " + JSON.stringify(alarmListData));
		// write json-Data in states
		this.setStateAsync('jsonAlarmHistory', JSON.stringify(alarmListData.allAlarms) || "no data");
		this.setStateAsync('jsonAlarmsActive', JSON.stringify(alarmListData.allActiveAlarms) || "no data");
		this.setStateAsync('nbAlarmsActive', alarmListData.allActiveAlarms.length || 0);
		this.setStateAsync('nbAlarmsActiveNotAcknowledged', alarmListData.nbActiveAlarmsNotAcknowledged || 0);
		// generate HTML-tables
		let htmlAlarmHistory = jsonToHtml.jsonToHtmlAlarms(alarmListData.allAlarms, "history", true, this.minuVisConfig);
		let htmlAlarmsActive = jsonToHtml.jsonToHtmlAlarms(alarmListData.allActiveAlarms, "active", true, this.minuVisConfig);
		let htmlAlarmBanner = jsonToHtml.jsonToHtmlAlarms([alarmListData.allActiveNotAcknowledgedAlarms[0] || null], "banner", false, this.minuVisConfig);
		let css = jsonToHtml.getCSS(this.minuVisConfig);
		this.setStateAsync('htmlAlarmHistory', css + htmlAlarmHistory || "no data");
		this.setStateAsync('htmlAlarmsActive', css + htmlAlarmsActive || "no data");
		this.setStateAsync('htmlMinuVisBanner', css + htmlAlarmBanner || "");
	}
	// send to telegram
	sendToTelegram(alarmComes, data) {
		if (this.config.telegram && this.config.telegram.instance && this.config.telegram.instance.length > 0 && this.config.telegram.user && this.config.telegram.user.length > 0) {
			// check class and comes or goes
			let telegramText = "";
			if (data.alarmClass === "alarm") {
				if (alarmComes === true) {
					telegramText = this.telegramConfig.alarm_textComes;
				} else {
					telegramText = this.telegramConfig.alarm_textGoes;
				}
			} else if (data.alarmClass === "warning") {
				if (alarmComes === true) {
					telegramText = this.telegramConfig.warning_textComes;
				} else {
					telegramText = this.telegramConfig.warning_textGoes;
				}
			} else {
				if (alarmComes === true) {
					telegramText = this.telegramConfig.information_textComes;
				} else {
					telegramText = this.telegramConfig.information_textGoes;
				}
			}
			// replace placeholder
			telegramText = telegramText.replace(/%NL%/g, "\n");
			telegramText = telegramText.replace(/%ALARMTEXT%/g, data.alarmText);
			telegramText = telegramText.replace(/%ALARMCLASS%/g, data.alarmClass);
			telegramText = telegramText.replace(/%ALARMAREA%/g, data.alarmArea);

			this.log.debug("sendToTelegram: " + telegramText);
			this.sendTo(this.config.telegram.instance, 'ask', {
				user: this.config.telegram.user,
				text: telegramText,
				parse_mode: 'MarkdownV2',
				reply_markup: {
					inline_keyboard: [
						[{ text: '✅', callback_data: data.stateId }],
					]
				}
			}, msg => {
				this.debug.log("ack from telegram: " + msg.data);
				this.setStateAsync("stateIdToAcknowledge", msg.data);
			});
		}
	}
	// register state
	registerState(id, customData, type) {
		this.log.debug(this.namespace + "-data: " + JSON.stringify(customData));
		if (customData && customData.enabled === true) {
			this.log.debug("register Id: " + JSON.stringify(id));
			if (customData.checkTimeStamp && customData.checkTimeStamp === true) {
				// register state for checking the timestamp
				this.registeredStatesCheckTimeStamp[id] = customData;
				this.registeredStatesCheckTimeStamp[id].lastTimeStamp = 0;
				this.registeredStatesCheckTimeStamp[id].timeStampTooOld = false;
			} else {
				// register state for checking the value
				this.registeredStates[id] = customData;
				this.registeredStates[id].valueAtAlarm = null;
				this.registeredStates[id].debounceTimer = null;
				this.registeredStates[id].skipEvents = false;
				this.registeredStates[id].alarmActive = false;
				this.registeredStates[id].type = type;
			}
		} else {
			this.log.debug("do not register Id: " + JSON.stringify(id));
		}
	}
	// unregister state
	unregisterState(id) {
		// clearTimeout and delete id from list 
		if (this.registeredStates[id]) {
			this.log.debug("unregister Id: " + JSON.stringify(id));
			this.registeredStates[id].debounceTimer && clearTimeout(this.registeredStates[id].debounceTimer);
			delete this.registeredStates[id];
		}
	}
	// Find sqlite data directory
	getDatabaseDir(namespace) {
		const tools = require(utils.controllerDir + '/lib/tools');
		let config = tools.getConfigFileName().replace(/\\/g, '/');
		const parts = config.split('/');
		parts.pop();
		config = parts.join('/') + '/files/' + namespace;
		// create sqlite directory
		if (!fs.existsSync(config)) {
			fs.mkdirSync(config);
		}
		return config;
	}

}
if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Minuaru(options);
} else {
	// otherwise start the instance directly
	new Minuaru();
}