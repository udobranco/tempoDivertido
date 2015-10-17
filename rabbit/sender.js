var qSocket = "amqp://172.17.0.20:55555";
var qName = "nodejs.demo";
var encoding = "utf8";
var message = process.argv.splice(2).join(" ") || "n/a";


var context = require ("rabbit.js").createContext(qSocket);
console.log (" [x] Created context %s", qSocket);

context.on("ready", function(){
        console.log(" [x] Context is ready" );

        var pub = context.socket("PUB");
        pub.connect(qName, function(){
                console.log("[x] Connected");
		
		var data = JSON.stringify({message:message})
		pub.write(data, encoding);
		console.log ("[x] sent mesage: %s", message)

		setTimeout(function(){
			context.close();
			console.log ("[x] Context closed");
		},0);
        });
});

