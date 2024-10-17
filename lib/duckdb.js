exports.initDatabase = async function (dbName) {
    const duckdb = require("duckdb-async");
    const db = await duckdb.Database.create(dbName);
    const connection = await db.connection();
    return connection;
};

exports.initTable = function (db) {
    let info = await db.all("CREATE TABLE IF NOT EXISTS tblMinuAru (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, tsComes INT, tsGoes INT, tsAck INT, alarmText TEXT, alarmClass TEXT, alarmArea TEXT, stateID TEXT)");
    return info;
};

exports.deleteTable = function (db) {
    let info = await db.run("DELETE FROM tblMinuAru");
    return info;
};

exports.insertAlarmComes = function (db, data) {
    // set all previous alarms to gone
    let info = await db.all("UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ", data.tsComes, 0, data.stateId);
    // now insert new alarm
    info = await db.run("INSERT INTO tblMinuAru VALUES (NULL, @tsComes, 0, 0, @alarmText, @alarmClass, @alarmArea, @stateId)", data);
    return info;
};

exports.updateAlarmGoes = function (db, data) {
    let info = await db.run("UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ", data.tsGoes, 0, data.stateId);
    return info;
}

exports.updateAlarmAck = function (db, data) {
    let info = await db.run("UPDATE tblMinuAru SET tsAck = ? WHERE stateId = ? ",data.tsAck, data.stateId);
    return info;
}

exports.getNbActiveAlarmOfId = function (db, data) {
    // get number of active alarms of given id
    let info = await db.all("SELECT COUNT (tsComes) AS nbAlarms FROM tblMinuAru WHERE tsGoes = 0 AND stateId = ?", data.stateId);
    let nbAlarmsOfId = info.nbAlarms;
    return nbAlarmsOfId;
}

exports.getAlarmListData = function (db) {
    let alarmListdata = {};
    // get all Alarms
    let info = await db.all("SELECT * FROM tblMinuAru ORDER BY tsComes DESC");
    alarmListdata.allAlarms = info;
    // get all active Alarms
    info = await db.all("SELECT * FROM tblMinuAru WHERE tsGoes = 0 ORDER BY tsComes DESC");
    alarmListdata.allActiveAlarms = info;
    // get all active, not acknowledged Alarms
    info = await db.all("SELECT * FROM tblMinuAru WHERE tsGoes = 0 AND tsAck = 0 ORDER BY tsComes DESC");
    alarmListdata.allActiveNotAcknowledgedAlarms = info;
    // nuber of all active, not acknowledged Alarms
    alarmListdata.nbActiveAlarmsNotAcknowledged = alarmListdata.allActiveNotAcknowledgedAlarms.length;
    return alarmListdata;
}
