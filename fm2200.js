/*
RabbitMQ var
*/
require('rabbit.js');
var qSocket = "amqp://10.5.50.20:33333";
var qName = "nodejs.demo";
var encoding = "utf8";


// >>>>>>>>>Original start here<<<<<<<<<<<<<
var sockets = require("../core/sockets");
var buffer_alloc = 40960;
var conf = {},
    binary = require('binary'),
    util = require('util'),
    msgbus = require('msgbus'),
    msgbuscli,
    mysql = require("mysql"),
    db = null,
    coredb = null,
    db_connected = false,
    connectedClients = {},
    servicesOffline = [],
    messageQueue = [], // queued messages because services are offline
    messageQueueFirst = true;

exports.handler = {
	"name"	: "fm2200d",
	"type"  : "FMXXXX"
};
exports.getDatabasePOIs = function (cb) {
	if (!db_connected) return cb([]);

	db.query("SELECT latitude AS lat,longitude AS lng,name FROM gps_user_poi", function (err, results) {
		if (err) return cb([]);

		return cb(results);
	});
};
exports.setup = function (config) {
	conf = config;

	if (!conf.opts.debug_devices) {
		conf.opts.debug_devices = [];
	}

	config.httpConsole.connectedClients = connectedClients;

	// wait for it to connect
	serviceWentOffline("msgbusd");
	serviceWentOffline("alarmd");
	serviceWentOffline("movd");
	// check saved queue
	serviceStartup();

	var connectMsgBus = function () {
		msgbuscli.connect(conf.opts.msgbus.bind, function (err) {
			if (err) {
				conf.stdout.printError("Could not connect to message bus server - %s", err.code);
				process.exit(1);
				return;
			}
			msgbuscli.identify(conf.opts.msgbus.id, function (err) {
				if (err) {
					conf.stdout.printError("Could not identify to message bus server - %s", err.code);
					process.exit(1);
				}
				conf.stdout.printInfo("Connected to message bus as ##%s##", conf.opts.msgbus.id);

				serviceWentOnline("msgbusd");
				msgbuscli.broadcast("get-db-settings");
			});
		});
	};

	msgbuscli = msgbus.createClient({ debug: false });
	connectMsgBus();

	msgbuscli.online('movd', function (status) {
		if (!status.online) {
			conf.stdout.printError("movd is not online. start it first");
			process.exit(1);
		}
		serviceWentOnline("movd");
	});
	msgbuscli.online('alarmd', function (status) {
		if (!status.online) {
			conf.stdout.printError("alarmd is not online. start it first");
			process.exit(1);
		}
		serviceWentOnline("alarmd");
	});
	msgbuscli.on('broadcast', function (from, msg, msg_id) {
		if (msg.action == "db-settings") {
			if (!db_connected) {
				db_connected = true;

				db = mysql.createClient({
					    host: msg.settings.host || "localhost",
					    port: msg.settings.port || 3306,
					    user: msg.settings.user || "root",
					password: msg.settings.password || "",
					database: msg.settings.database || null
				});
				conf.stdout.printInfo("Connected to database ##%s## as ##%s##", db.database, db.user);
				coredb = mysql.createClient({
					    host: msg.settings.corehost || msg.settings.host || "localhost",
					    port: msg.settings.port || 3306,
					    user: msg.settings.user || "root",
					password: msg.settings.password || "",
					database: msg.settings.coredatabase || null
				});
				conf.stdout.printInfo("Connected to database ##%s## as ##%s##", coredb.database, coredb.user);

				// db.connect(function (err) {
				// 	if (err) {
				// 		conf.stdout.printError("Could not connect to database server (##%s##)", err.code);
				// 		db_connected = false;
				// 		return;
				// 	}

				// 	conf.stdout.printInfo("Connected to database ##%s## as ##%s##", db.database, db.user);
				// });
			}
			return;
		}

	});
	msgbuscli.on("message", function (from, msg, msg_id) {
		if (msg.action == "gps-info") {
			conf.stdout.printComment("Service asking for ##%s##: ##%s##", msg.id, connectedClients.hasOwnProperty(msg.id) ? "ONLINE": "OFFLINE");
			msgbuscli.reply(from, msg_id, {
				"action": "gps-info",
				"id"	: msg.id,
				"online": connectedClients.hasOwnProperty(msg.id)
			});
		}
	});
	msgbuscli.on('close', function () {
		serviceWentOffline("msgbusd");

		conf.stdout.printError("Connection to message bus server lost. Retrying in 2secs..");
		setTimeout(connectMsgBus, 2e3);
	});
	msgbuscli.on('offline', function (client_id) {
		if ([ 'alarmd', 'movd' ].indexOf(client_id) != -1) {
			// if one of these services go offline, we go offline after 5 seconds if they are not up again
			var intervalId, timeoutId;

			conf.stdout.printError(client_id + " went offline");

			serviceWentOffline(client_id);

			intervalId = setInterval(function () {
				msgbuscli.online(client_id, function (status) {
					if (status.online) {
						conf.stdout.printAlert(client_id + " went back online");
						clearTimeout(timeoutId);
						clearInterval(intervalId);

						serviceWentOnline(client_id);
					}
				});
			}, 1e3);

			timeoutId = setTimeout(function () {
				conf.stdout.printError(client_id + " did not come back online");

				serviceShutdown();
			}, 15e3);
		}
	});
	
};
exports.handle = function (client) {
	var preBuffer = new Buffer(buffer_alloc, 'binary'),
	    client_mode = 'handshake',
	    buffer_bytes = 0,
	    transfered_bytes = 0,
	    transfered_records = 0,
	    clientId = client.remoteAddress,
	    clientHwId = "",
	    connectionStartDate = intDate(),
	    connectionComunications = 1;

	conf.stdout.printNotice("(##%s##) new connection (%d active)", clientId, conf.server.connections);

	var sendResponse = function (records) {
		try {
			client.write("\x00\x00\x00" + String.fromCharCode(records), "binary");
		} catch (e) {
			conf.stdout.printError("(##%s##) could not write response to client - broken pipe?", clientHwId);
		}
		return;
	};
	var processData = function (buffer) {
		var records = parseInt(buffer[0], 10),
		    p = 1, dt_start = Date.now(),
		    record_list = [];

		for (var i = 0; i < records; i++) {
			var data = binary.parse(buffer.slice(p))
			                 .word64be('timestamp')
			                 .word8be('priority')
			                 .word32bs('lng')
			                 .word32bs('lat')
			                 .word16be('alt')
			                 .word16be('angle')
			                 .word8be('sat')
			                 .word16be('speed')
			                 .word8be('eventId')
			                 .word8be('ioElements').vars;

			data.timestamp = Math.round(data.timestamp / 1e3); // miliseconds -> seconds
			data.local_timestamp = Date.now() / 1e3;
			data.lat /= 1e7;
			data.lng /= 1e7;
			data.movementRecord = (data.eventId == 240);

			p += 26;
			if (data.ioElements > 0) {
				var io = binary.parse(buffer.slice(p, p + 1)).word8be('io').vars.io, iodata;
				p++;

				for (var j = 0; j < io; j++) {
					iodata = binary.parse(buffer.slice(p, p + 2)).word8be('name').word8be('value').vars;

					processIOElement(data, iodata, buffer, p);
					p += 2;
				}

				io = binary.parse(buffer.slice(p, p + 1)).word8be('io').vars.io;
				p++;

				for (j = 0; j < io; j++) {
					iodata = binary.parse(buffer.slice(p, p + 3)).word8be('name').word16be('value').vars;

					processIOElement(data, iodata, buffer, p);
					p += 3;
				}

				io = binary.parse(buffer.slice(p, p + 1)).word8be('io').vars.io;
				p++;

				for (j = 0; j < io; j++) {
					iodata = binary.parse(buffer.slice(p, p + 5)).word8be('name').word32be('value').vars;

					processIOElement(data, iodata, buffer, p);
					p += 5;
				}

				io = binary.parse(buffer.slice(p, p + 1)).word8be('io').vars.io;
				p++;

				for (j = 0; j < io; j++) {
					iodata = binary.parse(buffer.slice(p, p + 9)).word8be('name').word64be('value').vars;

					processIOElement(data, iodata, buffer, p);
					p += 9;
				}
			}

			// if (conf.opts.debug_devices.indexOf(clientHwId) != -1) {
				conf.stdout.printNotice(1, "(##%s##) Record ##%d/%d##: (%s, %s @ %s) %d km/h (distance: %d)", clientHwId, i + 1, records, data.lat, data.lng, new Date(data.timestamp * 1e3), data.speed, data.dist);
			// }
			rabbitSender(">>>>Ola Rabbit<<<<<<");
			data.ignition = data.din1;

			record_list.push(data);
		}

		/*
		if (binary.parse(buffer.slice(p, p + 1)).word8be('rec').vars.rec != records) {
			// last byte is wrong..
		}
		*/

		var response = (Date.now() - dt_start) / 1000;
		conf.stdout.printNotice(1, "(##%s##) Records: ##%d## / Time: ##%s secs##", clientHwId, records, response);
		conf.stats.totalResponseTime += response;
		conf.stats.totalResponses++;

		if (record_list.length > 0) {
			conf.stats.totalRecords += record_list.length;
			conf.stats.lastRecord = Date.now();

			if (!connectedClients.hasOwnProperty(clientHwId)) {
				conf.stdout.printComment(1, "Client was not on connected clients list - ##%s## - added it (##%d## on list)", clientHwId, Object.keys(connectedClients).length);
			}
			connectedClients[clientHwId] = Date.now();

			record_list.sort(function (r1, r2) {
				return r1.timestamp - r2.timestamp;
			});

			conf.httpConsole.broadcast({ "action": "map", "id": clientId, "hwid": clientHwId, "lat": record_list[record_list.length - 1].lat, "lng": record_list[record_list.length - 1].lng, "mov": record_list[record_list.length - 1].movement, "hdop": record_list[record_list.length - 1].hdop });
			conf.httpConsole.broadcastStats();

			for (i = 0; i < record_list.length; i++) {
				sendBroadcast({ "action": "gps-record", "id": clientHwId, "record": record_list[i] });

				if (db_connected) {
					coredb.query("INSERT INTO gps_device_rawhistory (dev_id, date, data) VALUES (?, ?, ?)",
					             [ clientHwId, record_list[i].timestamp, JSON.stringify(record_list[i]) ]);
				}
			}

			transfered_records += record_list.length;
			connectionComunications += 1;

			sendBroadcast({
				"action"	    : "traffic-info",
				"device"	    : clientHwId,
				"start"		    : connectionStartDate,
				"end"		    : 0,
				"bytes"		    : transfered_bytes,
				"records"	    : transfered_records,
				"comunications" : connectionComunications
			});

			rabbitSender("E foram 4 de uma vez");
			return sendResponse(record_list.length);
		} else {
			return sendResponse(0);
		}
	
	};

	var checkData = function (data) {
		if (data) {
			// transfered_bytes += data.length;
			// buffer_bytes += data.length;
			// preBuffer.write(data, 0, 'binary');
			transfered_bytes += data.length;
			preBuffer.write(data, buffer_bytes, 'binary');
			buffer_bytes += data.length;

			//console.log(preBuffer.slice(0, buffer_bytes));
		}

		switch (client_mode) {
			case 'handshake':
				if (transfered_bytes < 2) break;

				var imei_size = binary.parse(preBuffer).word16be('size').vars.size;

				if (isNaN(imei_size)) {
					conf.stdout.printError(1, "(##%s##) invalid hardware size = ##%s##", clientId, imei_size);
					client.end("\x00");
					return;
				}

				if (transfered_bytes < imei_size + 2) break;

				clientHwId = preBuffer.slice(2, 2 + imei_size).toString();

				if (isNaN(parseInt(clientHwId, 10))) {
					conf.stdout.printError(1, "(##%s##) invalid hardware id = ##%s##", clientId, clientHwId);
					client.end("\x00");
					return;
				}

				conf.stdout.printNotice(1, "(##%s##) hardware id = ##%s##", clientId, clientHwId);

				sockets.assign(client, clientHwId);

				db.query("UPDATE gps_devices SET last_ip = ? WHERE dev_id = ?", [ clientId, clientHwId ]);

				connectedClients[clientHwId] = Date.now();

				client_mode = 'data';

				preBuffer = preBuffer.slice(2 + imei_size, buffer_alloc);
				buffer_bytes -= 2 + imei_size;

				try {
					client.write("\x01");
				} catch (e) {
					conf.stdout.printError("Client socket is not writeable");

					if (clientHwId && connectedClients.hasOwnProperty(clientHwId)) delete connectedClients[clientHwId];
					return;
				}

				if (transfered_bytes > 2 + imei_size) {
					checkData();
				}
				break;
			case 'data':
				if (buffer_bytes < 8) break;

				var l = binary.parse(preBuffer).word32be('ignore').word32be('len').vars.len;

				//console.log("buffer_bytes=%d l=%d l-12=%d", buffer_bytes, l, l - 12);

				if (buffer_bytes < l - 12) {
					console.log("data pending. need at least %d more bytes", l - 12 - buffer_bytes);
					break;
				}

				processData(preBuffer.slice(9));

				preBuffer = new Buffer(preBuffer.length);
				buffer_bytes = 0;
				break;
		}
	};

	client.setEncoding('binary');
	client.on('data', checkData);
	client.on('end', function () {
		sockets.unassign(client, clientHwId);
		if (clientHwId) {
			sendBroadcast({
				"action"	    : "traffic-info",
				"device"	    : clientHwId,
				"start"		    : connectionStartDate,
				"end"		    : intDate(),
				"bytes"		    : transfered_bytes,
				"records"	    : transfered_records,
				"comunications" : connectionComunications
			});
		}
		conf.stdout.printAlert("(##%s##) closed connection (%d active)", clientId, conf.server.connections);
		conf.httpConsole.broadcast({ "action": "left", "id": clientId });

		if (clientHwId && connectedClients.hasOwnProperty(clientHwId)) delete connectedClients[clientHwId];
	});
	client.on('timeout', function () {
		conf.stdout.printError("Client just timed out");

		if (clientHwId && connectedClients.hasOwnProperty(clientHwId)) delete connectedClients[clientHwId];
	});
	client.on('error', function () {
		conf.stdout.printError("Client socket error");

		if (clientHwId && connectedClients.hasOwnProperty(clientHwId)) delete connectedClients[clientHwId];
	});
	client.on('close', function () {
		//conf.stdout.printError("Client fully closed");

		if (clientHwId && connectedClients.hasOwnProperty(clientHwId)) delete connectedClients[clientHwId];
	});

	setTimeout(function () {
		// after 60 seconds of connection, if socket doesn't
		// say the clientHwId, it is disconnected
		if (clientHwId === "") {
			conf.stdout.printError("Client did not supply a valid ID in 60 seconds of connection. Terminating connection..");
			client.end();
		}
	}, 60e3);
};

function processIOElement(data, io, buffer, p) {
	//console.log(io);
	switch (io.name) {
		case   1: data.din1 = io.value; break;
		case   2: data.din2 = io.value; break;
		case  21: data.gsm_signal = io.value; break; // from 1 to 5
		case  24: data.speedometer = io.value; break;
		case  66: data.voltage = io.value; break;
		case  69: data.antenna = (io.value == 1); break;
		case  70: data.temperature = io.value / 10; break;
		case  72:
		case  73:
		case  74:
			// reparse it.. temperature sensors are signed, not unsigned
			io = binary.parse(buffer.slice(p, p + 5)).word8be('name').word32bs('value').vars;

			var idx = io.name - 71; // 1, 2, 3, ..

			if ([ 850, 2000, 3000, 5000 ].indexOf(io.value) != -1 || io.value < -550 || io.value > 1150) {
				// error
				data["tempsensor"+idx] = null;
				//console.log("Temperature Sensor (%d): error!", idx);
			} else {
				data["tempsensor"+idx] = io.value / 10;
				//console.log("Temperature Sensor (%d): %s ºC", idx, data["tempsensor"+idx]);
			}
			break;
		case  78:
			var ibutton = new Buffer(8);
			for (var i = 0; i < 8; i++) {
				ibutton[i] = buffer[p + 8 - i];
			}
			data.ibutton = ibutton.toString("hex").toUpperCase();
			// data.ibutton = io.value;
			break;
		case  80: data.working_mode = io.value; break;         // from 0 to 5
		case  81: data.can_speed = io.value; break;            // CAN bus data: "Speed (km/h)"
		case  82: data.accel_pedal = io.value; break;          // CAN bus data: "Accelerator Pedal Position (0-100%)"
		case  83: data.fuel_total = io.value; break;           // CAN bus data: "Total fuel used (l)"
		case  84: data.fuel_level = io.value; break;           // CAN bus data: "Fuel level (0-100%)"
		case  85: data.engine_rpm = io.value; break;           // CAN bus data: "Engine RPM (0-8200 RPM)"
		case  86: data.working_hrs = io.value; break;          // CAN bus data: "Total engine hours (hrs)"
		case  87: data.dist_real = io.value; break;            // CAN bus data: "Vehicle dist (m)"
		case  88:
			data.engine_temp = io.value;                       // CAN bus data: "Engine Temp. (ºC)"
			if (data.engine_temp > 127) {
				data.engine_temp -= 127;
			}
			break;
		case  89: data.analog_input = io.value; break;         // CAN bus data: "Analog Input (0-5V%)"
		case  90: data.throttle_pos = io.value; break;         // CAN bus data: "Throtle Position (0-100%)"
		case  91: data.boost_pressure = io.value; break;       // CAN bus data: "Boost Pressure (0-500kPa)"
		case  92: data.door_driver = io.value == 1; break;     // CAN bus data: "Driver Door (on/off)"
		case  93: data.door_others = io.value == 1; break;     // CAN bus data: "Other Doors (on/off)"
		case  94: data.door_trunk = io.value == 1; break;      // CAN bus data: "Trunk Door (on/off)"
		case  95: data.ignition = io.value == 1; break;        // CAN bus data: "Ignition (on/off)"
		case  96: data.door_lock = io.value == 1; break;       // CAN bus data: "Central Door Lock (on/off)"
		case  97: data.status_rpm = io.value == 1; break;      // CAN bus data: "RPM Status (on/off) (> 500 RPM)"
		case  98: data.status_work = io.value == 1; break;     // CAN bus data: "Work Status (on/off) (> 5 km/h)"
		case  99: data.ac = io.value == 1; break;              // CAN bus data: "Air Conditioning (on/off)"
		case 100: data.can_num = io.value; break;              // CAN bus data: "Program Number (0-255)"
		case 101: data.fuel_rate = io.value; break;            // CAN bus data: "Fuel rate (l/h)"
		case 102: data.status_brake = io.value == 1; break;    // CAN bus data: "Brake Status (on/off)"
		case 103: data.status_park = io.value == 1; break;     // CAN bus data: "Parking Brake Status (on/off)"
		case 104: data.status_clutch = io.value == 1; break;   // CAN bus data: "Clutch Status (on/off)"
		case 105: data.lights_park = io.value == 1; break;     // CAN bus data: "Parking Headlights (on/off)"
		case 106: data.lights_low = io.value == 1; break;      // CAN bus data: "Low Headlights (on/off)"
		case 107: data.lights_high = io.value == 1; break;     // CAN bus data: "High Headlights (on/off)"
		case 108: data.status_cruise = io.value == 1; break;   // CAN bus data: "Cruise Control (on/off)"
		case 109: data.engine_torque = io.value + 125; break;  // CAN bus data: "Engine Torque (-125%<->125%)"
		case 110: data.firmware = io.value; break;             // CAN bus data: "Firmware version"
		case 179: data.dout1 = io.value; break;
		case 180: data.dout2 = io.value; break;
		case 182: data.hdop = io.value; break;
		case 199: data.dist = io.value; break;
		case 205: data.cell_id = io.value; break;
		case 206: data.area_code = io.value; break;
		case 240: data.movement = io.value; break;
		case 251: data.ibutton_on = (io.value == 1); break;
		case 252: data.ibutton_authorized = (io.value == 1); break;
		case 253: data.greendrive_harsh = io.value; break;   // 1 - acceleration , 2 - break , 3 - curve
		case 254: data.greendrive_angle = io.value; break;
		default: data["io_" + io.name] = io.value;
	}
}

/**
 * Convert an unix timestamp (in seconds) to an integer date (YYYYMMDDHHMMSS)
 **/
function intDate(unix) {
	var dt = new Date();
	if (typeof unix != "undefined") dt.setTime(unix * 1e3);

	return "" + dt.getUTCFullYear() + intPad2(dt.getUTCMonth() + 1, 2) + intPad2(dt.getUTCDate(), 2) + intPad2(dt.getUTCHours(), 2) + intPad2(dt.getUTCMinutes(), 2) + intPad2(dt.getUTCSeconds(), 2);
}

/**
 * Pad an integer number to 2 characters ("00", "01", ... "99")
 * ( this is used for example by intDate() )
 **/
function intPad2(v) {
	return (v < 10 ? "0" : "") + v;
}

/**
 * Send broadcast to message bus. This function is used as a wrapper because it
 * can delay if the message bus is disconnected.
 **/
function sendBroadcast(msg) {
	if (servicesOffline.length > 0) {
		return messageQueue.push(msg);
	}
	msgbuscli.broadcast(msg);
}
/**
 * A service went offline. Add it to the list of offline services if not there yet.
 **/
function serviceWentOffline(service) {
	if (servicesOffline.indexOf(service) == -1) {
		servicesOffline.push(service);
	}
}
/**
 * A service went online. Remove from the list if found.
 **/
function serviceWentOnline(service) {
	if (servicesOffline.length > 0) {
		var newList = [];
		for (var i = 0; i < servicesOffline; i++) {
			if (servicesOffline[i] != service) {
				newList.push(servicesOffline[i]);
			}
		}

		servicesOffline = newList;
	}

	processQueue();
}
/**
 * Process queue if no services are offline and if there are any queued messages.
 **/
function processQueue() {
	if (servicesOffline.length > 0 || messageQueue.length === 0) {
		return;
	}

	conf.stdout.printNotice("Processing ##%d## queued msgs", messageQueue.length);

	while (messageQueue.length > 0) {
		sendBroadcast(messageQueue.shift());
	}

	if (messageQueueFirst) {
		require("fs").unlinkSync(__dirname + "/fm2200.queue.msgs");
		messageQueueFirst = false;
	}
}
/**
 * Check queued messages saved to a file and queue them.
 **/
function serviceStartup() {
	var data;
	try {
		data = require("fs").readFileSync(__dirname + "/fm2200.queue.msgs");
	} catch (e) {
		conf.stdout.printNotice("Could not load queued msgs from filesystem - ##%s##", e.code || e.message);
		return;
	}

	try {
		data = JSON.parse(data);
	} catch (e) {
		conf.stdout.printNotice("Could not check queued msgs from filesystem - ##%s##", e.code || e.message);
		return;
	}

	if (data.length) {
		conf.stdout.printNotice("Loaded ##%d## queued msgs from filesystem", data.length);
		messageQueue = data;
	}
}
/**
 * Check queued messages and save them to a file (if any) before quitting.
 **/
function serviceShutdown() {
	if (messageQueue.length > 0) {
		conf.stdout.printNotice("Saving ##%d## queued msgs to filesystem", messageQueue.length);
		console.log(JSON.stringify(messageQueue));

		require("fs").writeFileSync(__dirname + "/fm2200.queue.msgs", JSON.stringify(messageQueue));
	}
	process.exit(1);
}

/**
 * Function to send a msg via rabbitmq 
**/

function rabbitSender(message){

var context = require ("rabbit.js").createContext(qSocket);
conf.stdout.printInfo (1," [x] Created context %s", qSocket);
	context.on("ready", function(){
       		conf.stdout.printInfo(1," [x] Context is ready" );

	       	var pub = context.socket("PUB");
       		pub.connect(qName, function(){
       		       conf.stdout.printInfo(1,"[x] Connected");

			var data = JSON.stringify({message:message})
			pub.write(data, encoding);
			conf.stdout.printInfo (1,"[x] sent mesage: %s", message)

				setImmediate(function(){
					context.close();
					conf.stdout.printInfo (1,"[x] Context closed");
				});
       		});
	});
	
	conf.stdout.printInfo (1," A minha mensagem: %s", message);
	context.on("error", function (err) { conf.stdout.printInfo(1,err); });
};

//rabbitSender("init");
