"use strict";

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
const utils = require("@iobroker/adapter-core");
const fs = require('fs');
const databaseTools = require("./lib/sqlite");

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
				role: "info",
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
				role: "info",
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
				role: "stateId",
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
				role: '',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("minuVisColumnNames", {
			type: "state",
			common: {
				name: "minuVisColumnNames",
				type: "string",
				role: "json",
				read: true,
				write: true,
			},
			native: {},
		});
		this.log.debug("set minuvisColumnNames: " + this.config.minuVisColumnNames);
		await this.setStateAsync("minuVisColumnNames", this.config.minuVisColumnNames || "time comes,time goes,time ack,alarmtext,area,acknowlegde");
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
						});
					}
				}
			}
		});
		// update lists at startup
		this.updateListData();
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
		this.handleStateChange(id, state);
	}

	handleStateChange(id, state) {
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
			if (id === this.namespace + ".stateIdToAcknowledge" && this.registeredStates[state.val]) {
				this.setStateAsync('stateIdToAcknowledge', "");
				let data = {};
				data.tsAck = Date.now();
				data.stateId = state.val || "";
				debugInfo = databaseTools.updateAlarmAck(this.db, data);
				this.log.debug("acknowledge alarm: " + JSON.stringify(debugInfo));
				updateNeeded = true;
			}
			// new alarm ??
			if (this.registeredStates[id] && this.registeredStates[id].enabled === true) {
				// check correct type: only bool, number and string allowed:
				if (this.registeredStates[id].type !== "boolean" && this.registeredStates[id].type !== "number" && this.registeredStates[id].type !== "string") {
					this.log.error("wrong type of state: " + id + " : " + this.registeredStates[id].type)
					return;
				}
				// init
				let alarmComes = false;
				let alarmGoes = false;
				// load settings
				let customSettings = this.registeredStates[id];
				// create data-object for Database
				let data = {};
				// constant data
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
					if (getNbActiveAlarms === 0 && state.val == customSettings.comparatorText) {
						alarmComes = true;
					} else {
						alarmGoes = true;
					}
				} // END boolean  or number or string ?
				// insert in database
				if (this.registeredStates[id].skipEvents === false && alarmComes === true) {
					data.tsComes = Date.now();
					debugInfo = databaseTools.insertAlarmComes(this.db, data);
					this.log.debug("insert alarm comes: " + JSON.stringify(debugInfo));
					this.sendToTelegram("alarm comes: " + data.alarmText)
					updateNeeded = true;
				}
				if (this.registeredStates[id].skipEvents === false && alarmGoes === true) {
					data.tsGoes = Date.now();
					debugInfo = databaseTools.updateAlarmGoes(this.db, data);
					this.log.debug("insert alarm goes: " + JSON.stringify(debugInfo));
					this.sendToTelegram("alarm goes: " + data.alarmText)
					updateNeeded = true;
				}
				if (this.registeredStates[id].skipEvents === false && (alarmComes === true || alarmGoes === true)) {
					this.log.debug("skipEvents: " + JSON.stringify(this.registeredStates[id].skipEvents));
					// set debounce-timer
					if (customSettings.debounce && customSettings.debounce > 0) {
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
										this.handleStateChange(id, state);
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

	// update listData json and html for visualization
	updateListData() {
		// update html amd json data
		let alarmListData = databaseTools.getAlarmListData(this.db);
		this.log.debug("new alarm data: " + JSON.stringify(alarmListData));
		// write Data in states
		this.setStateAsync('jsonAlarmHistory', JSON.stringify(alarmListData.allAlarms) || "no data");
		this.setStateAsync('jsonAlarmsActive', JSON.stringify(alarmListData.allActiveAlarms) || "no data");
		this.setStateAsync('nbAlarmsActive', alarmListData.allActiveAlarms.length || 0);
		this.setStateAsync('nbAlarmsActiveNotAcknowledged', alarmListData.nbActiveAlarmsNotAcknowledged || 0);
	}
	// send to telegram
	sendToTelegram(alarmText) {
		if (this.config.telegram && this.config.telegram.length > 0 && this.config.telegramUser && this.config.telegramUser.length > 0) {
			// send Text to telegram-instance
			this.log.debug("sendToTelegram: " + alarmText);
			this.sendTo("minuaru", alarmText);
		}
	}
	// register state
	registerState(id, customData, type) {
		this.log.debug(this.namespace + "-data: " + JSON.stringify(customData));
		if (customData && customData.enabled === true) {
			this.log.debug("register Id: " + JSON.stringify(id));
			this.registeredStates[id] = customData;
			this.registeredStates[id].valueAtAlarm = null;
			this.registeredStates[id].debounceTimer = null;
			this.registeredStates[id].skipEvents = false;
			this.registeredStates[id].alarmActive = false;
			this.registeredStates[id].type = type;
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