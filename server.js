var zmq = require('zeromq');
var publisher = zmq.socket('pub');
var subscriber = zmq.socket('sub');
var synchronizeSubscription = zmq.socket('req');
var synchronizePublisher = zmq.socket("rep");

var SUBSCRIBERS_EXPECTED = 1;

var http = require('http');

// Subscription Synchronization
synchronizeSubscription.connect('tcp://localhost:5100')
synchronizeSubscription.send('')

// Publisher synchronization
var subscriberCount = 0;
synchronizePublisher.on('message', function (request) {
    subscriberCount++;
    synchronizePublisher.send('')
    if (subscriberCount >= SUBSCRIBERS_EXPECTED){
        console.log("Publisher Synched")
    }
})


synchronizePublisher.bind('tcp://*:6100', function(err){
    if(err)
        console.log(err)
    else
        console.log('Listening on 6100…')
})


// Bind publisher to port
publisher.bind('tcp://*:6101', function (err) {
    if (err)
        console.log(err)
    else
        console.log("Publishing on 6101...")
})


// Function to handle requests
function handle_request(request) {
    var msg = [];
    Array.prototype.slice.call(arguments).forEach(function (arg) {
        msg.push(arg.toString());
    });

    var request = JSON.parse(msg[1])
    var url = request.url
    var token = "gui_backend"

    console.log("Token: " + token)
    console.log("url: " + url)

    var page_req = {
        host: url,
        port: 80,
        method: 'GET'
    };

    var req = http.request(page_req, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('error', function (error) { 
            // console.log(chunk)
            console.log("Error: " + error)
            
        });
        res.on('data', function (chunk) { 
            // console.log(chunk)
            console.log("inside callback")
            publisher.send([token, JSON.stringify(chunk)])                
        });
    });
    
    req.end()

}

// Initializing and listening to port
subscriber.on("message", handle_request)
subscriber.connect("tcp://localhost:5101");
subscriber.subscribe("network_backend");



// On terminate cleanup
process.on('SIGINT', function () {
    synchronizeSubscription.close()
    console.log('closed sync Subscription ')
    synchronizePublisher.close()
    console.log('closed sync Publisher')
    subscriber.close()
    console.log('Closed subscriber')
    publisher.close()
    console.log('Closed publisher')
})