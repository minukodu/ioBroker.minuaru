exports.initDatabase = async function (dbName) {
    duckdb = require("duckdb-async");
    const db = await duckdb.Database.create(dbName);
    const connection = db.con();
    return connection;
};

exports.initTable = function (db) {
    let stmt = db.prepare("CREATE TABLE IF NOT EXISTS tblMinuAru (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, tsComes INT, tsGoes INT, tsAck INT, alarmText TEXT, alarmClass TEXT, alarmArea TEXT, stateID TEXT)");
    let info = stmt.run();
    return info;
};

exports.deleteTable = function (db) {
    let stmt = db.prepare("DELETE FROM tblMinuAru");
    let info = stmt.run();
    return info;
};

exports.insertAlarmComes = function (db, data) {
    // set all previous alarms to gone
    let stmt = db.prepare("UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ");
    let info = stmt.run(data.tsComes, 0, data.stateId);
    // now insert new alarm
    stmt = db.prepare("INSERT INTO tblMinuAru VALUES (NULL, @tsComes, 0, 0, @alarmText, @alarmClass, @alarmArea, @stateId)");
    info = stmt.run(data);
    return info;
};

exports.updateAlarmGoes = function (db, data) {
    let stmt = db.prepare("UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ");
    let info = stmt.run(data.tsGoes, 0, data.stateId);
    return info;
}

exports.updateAlarmAck = function (db, data) {
    let stmt = db.prepare("UPDATE tblMinuAru SET tsAck = ? WHERE stateId = ? ");
    let info = stmt.run(data.tsAck, data.stateId);
    return info;
}

exports.getNbActiveAlarmOfId = function (db, data) {
    // get number of active alarms of given id
    let stmt = db.prepare("SELECT COUNT (tsComes) AS nbAlarms FROM tblMinuAru WHERE tsGoes = 0 AND stateId = ?");
    let nbAlarmsOfId = stmt.get(data.stateId).nbAlarms;
    return nbAlarmsOfId;
}

exports.getAlarmListData = function (db) {
    let alarmListdata = {};
    // get all Alarms
    let stmt = db.prepare("SELECT * FROM tblMinuAru ORDER BY tsComes DESC");
    alarmListdata.allAlarms = stmt.all();
    // get all active Alarms
    stmt = db.prepare("SELECT * FROM tblMinuAru WHERE tsGoes = 0 ORDER BY tsComes DESC");
    alarmListdata.allActiveAlarms = stmt.all();
    // get all active, not acknowledged Alarms
    stmt = db.prepare("SELECT * FROM tblMinuAru WHERE tsGoes = 0 AND tsAck = 0 ORDER BY tsComes DESC");
    alarmListdata.allActiveNotAcknowledgedAlarms = stmt.all();
    // nuber of all active, not acknowledged Alarms
    alarmListdata.nbActiveAlarmsNotAcknowledged = alarmListdata.allActiveNotAcknowledgedAlarms.length;
    return alarmListdata;
}
