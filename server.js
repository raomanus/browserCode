var zmq = require('zeromq');
var publisher = zmq.socket('pub');
var subscriber = zmq.socket('sub');
var synchronizeSubscription = zmq.socket('req');
var synchronizePublisher = zmq.socket("rep");
var page_req = require('request')

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

    page_request(url, function (error, response, body) {
        if (error) {
            console.log('error:', error);
            publisher.send([token, error]);
        } else if (response && response.statusCode == 200) {
            console.log('response status', response.statusCode);
            publisher.send([token, body]);
        } else if (response) {
            console.log('Reponse status not OK:', response.statusCode);
            publisher.send([token, response.statusMessage]);
        }
    });

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