var zmq = require('zeromq');
var subscriber = zmq.socket('sub');
var publisher = zmq.socket('pub');
var crypto = require('crypto');

// Initialize request variable
var token = crypto.randomBytes(10).toString('hex');
var request_obj = {
    "url": "http://google.com",
    "token": token
};
var request = JSON.stringify(request_obj)

function handle_response(response) {
    var msg = [];
    Array.prototype.slice.call(arguments).forEach(function (arg) {
        msg.push(arg.toString());
    });

    console.log(msg)
}

publisher.bind('tcp://*:8688', function (err) {
    if (err)
        console.log(err)
    else 
        console.log("Publishing on 8688...");
})

subscriber.on("message", handle_response);
subscriber.connect("tcp://localhost:8689");
subscriber.subscribe(token);


for (var i = 1; i < 3; i++)
    setTimeout(function () {
        publisher.send(["http_req", request])
    }, 1000 * i)

process.on('SIGINT', function () {
    subscriber.close()
    console.log('\nClosed subscriber')
    publisher.close()
    console.log('\nClosed publisher')
})