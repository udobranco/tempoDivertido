var qSocket = "amqp://10.5.50.20:33333";
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

		setImmediate(function(){
			context.close();
			console.log ("[x] Context closed");
		});
        });
});

