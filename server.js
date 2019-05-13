const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to Mongo
mongo.connect('mongodb://localhost/chat', function (err, db) {
    if (err) {
        throw err;
    }


    console.log('MongoDB connected...');


    // Connect to Socket.io
    client.on('connection', function (socket) {
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function (s) {
            socket.emit('status', s);
        }

        // Get chats from mongo Collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
            if (err) {
                throw err;
            }

            //Emit the message
            socket.emit('output', res);
        });

        //Handle input events
        socket.on('input', function (data) {
            let name = data.name;
            let message = data.message;


            //Check for name and message
            if (name == '' || message == '') {
                // Send error status
                sendStatus('Please enter a name and message')
            } else {
                // insert message
                chat.insert({ name: name, message: message }, function () {
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle Clear
        socket.on('clear', function (data) {
            // Remove all chats from collection
            chat.remove({}, function () {
                // Emit cleared
                socket.emit('cleared')
            })
        })
    })
})