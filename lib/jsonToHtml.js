exports.jsonToHtmlAlarms = function (rows, tableClass, withHeader, minuVisConfig) {
    // convert JSON-Data to HTML-table
    const dayjs = require("dayjs");
    const titles = minuVisConfig.columnNames.split(",");
    let htmlOutput = "";
    if (withHeader === true) {
        // Titelzeile schreiben
        htmlOutput += "<table class='minuarutable " + tableClass + "'>";
        htmlOutput += "<tr class='titlerow'>";
        htmlOutput += "<th class='id title'>" + "id" + "</th>";
        htmlOutput += "<th class='tscomes title'>" + titles[0] + "</th>";
        htmlOutput += "<th class='tsgoes title'>" + titles[1] + "</th>";
        htmlOutput += "<th class='tsack title'>" + titles[2] + "</th>";
        htmlOutput += "<th class='alarmtext title'>" + titles[3] + "</th>";
        htmlOutput += "<th class='alarmclass title'>" + "class" + "</th>";
        htmlOutput += "<th class='alarmarea title'>" + titles[4] + "</th>";
        htmlOutput += "<th class='stateid title'>" + "stateId" + "</th>";
        htmlOutput += "<th class='acknowledge title'>" + titles[5] + "</th>";
        htmlOutput += "</tr>";
    }
    if (rows) {
        for (var dataObj in rows) {
            let htmlOutputRow = "";
            let dataAlarmClass = "class-undefined";
            let dataAlarmGone = "";
            let stateId = "NONE";
            let ackClass = "";
            for (var data in rows[dataObj]) {
                var dataDisplay = rows[dataObj][data];
                switch (data) {
                    case "tsComes":
                    case "tsGoes":
                        dataDisplay = "--";
                        dataAlarmGone = "";
                        if (rows[dataObj][data] > 0) {
                            dataDisplay = "<span class='date'>";
                            dataDisplay += dayjs(rows[dataObj][data]).format('DD.MM.YYYY');
                            dataDisplay += "</span>";
                            dataDisplay += "<span class='time'>";
                            dataDisplay += dayjs(rows[dataObj][data]).format('HH:mm:ss');
                            dataDisplay += "</span>";
                            dataAlarmGone = "gone";
                        }
                        break;
                    case "tsAck":
                        dataDisplay = "--";
                        if (rows[dataObj][data] > 0) {
                            dataDisplay = "<span class='date'>";
                            dataDisplay += dayjs(rows[dataObj][data]).format('DD.MM.YYYY');
                            dataDisplay += "</span>";
                            dataDisplay += "<span class='time'>";
                            dataDisplay += dayjs(rows[dataObj][data]).format('HH:mm:ss');
                            dataDisplay += "</span>";
                            ackClass = "acknowledged";
                        }
                        break;
                    case "id":
                    case "alarmText":
                    case "alarmArea":
                    case "stateID":
                        dataDisplay = rows[dataObj][data];
                        stateId = rows[dataObj][data];
                        break;
                    case "alarmClass":
                        dataDisplay = rows[dataObj][data];
                        dataAlarmClass = "class-" + rows[dataObj][data].toLowerCase();
                        break;
                    default:
                        dataDisplay = rows[dataObj][data];
                }
                htmlOutputRow += "<td class='" + data.toLowerCase() + "'>" + dataDisplay + "</td>";
            }
            htmlOutputRow += "<td class='acknowledge'><button onClick='acknowledgeState(\"" + stateId + "\")' class='ackButton'>" + titles[5] + "</button></td>"
            htmlOutput += "<tr class='alarmrow " + dataAlarmClass + " " + dataAlarmGone + " " + ackClass + "'>";
            htmlOutput += htmlOutputRow;
            htmlOutput += "</tr>"
        }
    }
    // Ende alarmtable
    htmlOutput = "<table class='minuarutable " + tableClass + "'>" + htmlOutput;
    htmlOutput += "</table>"
    return htmlOutput;
}

exports.getCSS = function (minuVisConfig) {
    // CSS for HTML-Output
    return `
		<style>
			.minuarutable {
				font-size: 80%;
				border: 1px solid #666666;
				width: 100%;
			}
			.minuarutable.banner {
				font-weight: bold;
			}
			.minuarutable .class-alarm {
				background: ${minuVisConfig.alarm_colorActive};
				color: ${minuVisConfig.alarm_foregroundColor};
			}
			.minuarutable .class-warning {
				background:  ${minuVisConfig.warning_colorActive};
				color: ${minuVisConfig.warning_foregroundColor};
			}
			.minuarutable .class-information {
				background:  ${minuVisConfig.information_colorActive};
				color: ${minuVisConfig.information_foregroundColor};
			}
			.minuarutable .class-alarm.gone {
				background: ${minuVisConfig.alarm_colorGone};
			}
			.minuarutable .class-warning.gone {
				background: ${minuVisConfig.warning_colorGone};
			}
			.minuarutable .class-information.gone {
				background: ${minuVisConfig.information_colorGone};
			}
			.minuarutable .id,
			.minuarutable .alarmclass,
			.minuarutable .stateid,
			.minuarutable.banner .acknowledge,
			.minuarutable.banner .tsgoes,
			.minuarutable.banner .tsack {
				display: none;
			}
			.minuarutable .date,
			.minuarutable .time {
				display: block;
				font-weight: bold;
			}
			.minuarutable.banner .date,
			.minuarutable.banner .time {
				display: inline-block;
				padding-right: 7px;
			}
			.minuarutable.banner .tscomes {
				width: 200px;
			}
			.minuarutable.active .tsgoes {
				display: none;
			}
			.minuarutable td,
			.minuarutable th {
				padding-right: 10px;
				padding-left: 10px;
				text-align: center;
			}
			.minuarutable .alarmtext {
				 text-align: left;
			}
		</style>
		`;
}