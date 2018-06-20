var zmq = require('zeromq');
var publisher = zmq.socket('pub');
var subscriber = zmq.socket('sub');
var http = require('http');

// Bind publisher to port
publisher.bind('tcp://*:8689', function (err) {
    if (err)
        console.log(err)
    else
        console.log("Publishing on 8689...")
})

// Function to handle requests
function handle_request(request) {
    var msg = [];
    Array.prototype.slice.call(arguments).forEach(function (arg) {
        msg.push(arg.toString());
    });

    var request = JSON.parse(msg[1])
    var url = request.url
    var token = request.token

    console.log(url)
    
    var page_req = {
        host: 'www.google.com',
        port: 80,
        method: 'POST'
    };

    var req = http.request(page_req, function (res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            publisher.send([token, chunk])
        });
    });

    req.end()
    
}

// Initializing and listening to port
subscriber.on("message", handle_request)
subscriber.connect("tcp://localhost:8688");
subscriber.subscribe("http_req");


// On terminate cleanup
process.on('SIGINT', function () {
    subscriber.close()
    console.log('\nClosed subscriber')
    publisher.close()
    console.log('\nClosed publisher')
})