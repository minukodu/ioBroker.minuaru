// db is a DuckDBConnection of @duckdb/node-api

async function run(db, sql, values = []) {
    const result = await db.run(sql, values);
    return { rowsChanged: result.rowsChanged };
}

async function all(db, sql, values = []) {
    const reader = await db.runAndReadAll(sql, values);
    return reader.getRowObjectsJS();
}

exports.initTable = async function (db) {
    let info = await run(
        db,
        'CREATE TABLE IF NOT EXISTS tblMinuAru (id DOUBLE NOT NULL, tsComes DOUBLE, tsGoes DOUBLE, tsAck DOUBLE, alarmText TEXT, alarmClass TEXT, alarmArea TEXT, stateID TEXT, PRIMARY KEY (id))',
    );
    info = await run(db, 'CREATE SEQUENCE IF NOT EXISTS seq_id START 1');
    return info;
};

exports.deleteTable = async function (db) {
    let info = await run(db, 'DELETE FROM tblMinuAru');
    return info;
};

exports.insertAlarmComes = async function (db, data) {
    // set all previous alarms to gone
    let info = await run(db, 'UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ', [
        data.tsComes,
        0,
        data.stateId,
    ]);
    // now insert new alarm
    info = await run(db, "INSERT INTO tblMinuAru VALUES (nextval('seq_id'), ?, 0, 0, ?, ?, ?, ?)", [
        data.tsComes,
        data.alarmText ?? null,
        data.alarmClass ?? null,
        data.alarmArea ?? null,
        data.stateId,
    ]);
    return info;
};

exports.updateAlarmGoes = async function (db, data) {
    let info = await run(db, 'UPDATE tblMinuAru SET tsGoes = ? WHERE tsGoes = ? AND stateId = ? ', [
        data.tsGoes,
        0,
        data.stateId,
    ]);
    return info;
};

exports.updateAlarmAck = async function (db, data) {
    let info = await run(db, 'UPDATE tblMinuAru SET tsAck = ? WHERE stateId = ? ', [data.tsAck, data.stateId]);
    return info;
};

exports.getNbActiveAlarmOfId = async function (db, data) {
    // get number of active alarms of given id
    let info = await all(db, 'SELECT * FROM tblMinuAru WHERE tsGoes = 0 AND stateId = ?', [data.stateId]);
    //let nbAlarmsOfId = info.nbAlarms;
    let nbAlarmsOfId = info.length;
    return nbAlarmsOfId;
};

exports.getAlarmListData = async function (db) {
    let alarmListdata = {};
    // get all Alarms
    let info = await all(db, 'SELECT * FROM tblMinuAru ORDER BY tsComes DESC');
    alarmListdata.allAlarms = info;
    // get all active Alarms
    info = await all(db, 'SELECT * FROM tblMinuAru WHERE tsGoes = 0 ORDER BY tsComes DESC');
    alarmListdata.allActiveAlarms = info;
    // get all active, not acknowledged Alarms
    info = await all(db, 'SELECT * FROM tblMinuAru WHERE tsGoes = 0 AND tsAck = 0 ORDER BY tsComes DESC');
    alarmListdata.allActiveNotAcknowledgedAlarms = info;
    // nuber of all active, not acknowledged Alarms
    alarmListdata.nbActiveAlarmsNotAcknowledged = alarmListdata.allActiveNotAcknowledgedAlarms.length;
    return alarmListdata;
};
