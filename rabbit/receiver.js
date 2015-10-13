var qSocket = "amqp://localhost:55555";
var qName = "nodejs.demo";
var encoding = "utf8";

var context = require ("rabbit.js").createContext(qSocket);
console.log (" [x] Created context %s", qSocket);

context.on("ready", function(){
	console.log(" [x] Context is ready" );
	
	var sub = context.socket("SUB");
	sub.connect(qName, function(){
		console.log("[x] Connected");
		sub.on("data", function (data){
			console.log ("[x] Received data: %s", data);
		});	
	});
});
