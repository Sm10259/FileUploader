var express = require('express'),
	app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Blocks HTML characters
    fs = require('fs'),
	path = require('path'),
	formidable = require('formidable');

app.use(express.static(__dirname));

var userList = []; // Username = 0 | socket.id = 1
var fileList = []; // LUID = 0 | socket.id = 1 | File name = 2

io.sockets.on('connection', function (socket, username) {

    // When the username is received it’s stored as a session variable and informs the other people
    socket.on('newUser', function(username) {
        username = ent.encode(username); // Strip HTML characters
        socket.username = username; // Store username
		
        socket.broadcast.emit('newUser', username); // Tell client new user
		console.log(username + ' has joined'); // Tell console new user
		//fs.appendFile('log.txt', username + ' has joined\r\n', function (err) {}); // Log user join
		
		userList.push([username, socket.id]); // Update user list array
		
		io.sockets.emit('getUserList', userList); // Get active users
		io.sockets.emit('getFileList', fileList); // Get all files
		
		console.log(username + " joined");
    });

    // When a file is received, the file's name is retrieved and sent to the other people
    socket.on('newFile', function (name) {
        name = ent.encode(name); // Strip HTML characters
		
		// Generate LUID (Local Unique Identifier)
		var unique = false, luid;
		
		// If array is not empty execute
		if (fileList.length != 0) {
		
			// While the unique number is not unique run the loop
			while(!unique){
				luid = Math.ceil(Math.random() * 100);
				
				// Run through all LUIDs to see if there is a duplicate
				for (var w = 0; w < fileList.length; w++) {
					// If the LUID generated is not found in the array set unique to true
					if(fileList[w][0] != luid) { unique = true; }
					// If the LUID generated is found in the array set unique to false
					else { unique = false; }
				}
			}
		}
		else { // If array is empty set LUID = 1
			luid = 1;
		}
		
        io.sockets.emit('newFile', {luid: luid, username: socket.username, name: name}); // Tell client new file
		console.log(socket.username + ': ' + name); // Tell console new file
		
		fileList.push([luid, socket.id, name]); // Update file list array
    }); 
	
	// When the username is received it’s stored as a session variable and informs the other people
    socket.on('requestDelete', function(luid) {
        luid = ent.encode(luid); // Strip HTML characters
		//name = ent.encode(name); // Strip HTML characters
		
		var location;
		
		//console.log(name + ' has been deleted'); // Tell console new user
		
		for (var u = 0; u < fileList.length; u++) { // Get username
			if (fileList[u][0] == luid) {
				location = u;
			}
		}
		userList.splice(location, 1); // Remove user from userList[]
		io.sockets.emit('getFileList', fileList); // Get all files
    });
	
	// Handle disconnects
	socket.on('disconnect', function () {
		var location, username;
		for (var u = 0; u < userList.length; u++) { // Get username
			if (userList[u][1] == socket.id) {
				username = userList[u][0];
				location = u;
			}
		}
		
		if (username != null) {
			socket.broadcast.emit('left', username); // Tell client user left	
			console.log(username + ' has left'); // Tell console user left
			//fs.appendFile('log.txt', username + ' has left\r\n', function (err) {}); // Log user leave
			userList.splice(location, 1); // Remove user from userList[]
			io.sockets.emit('getUserList', userList);
			console.log(username + " left");
		}
	});
	
	// Handle file uploads
	app.post('/upload', function(req, res){
	
	// create an incoming form object
	var form = new formidable.IncomingForm();
	
	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;
	
	// store all uploads in the /uploads directory
	form.uploadDir = path.join(__dirname, '/uploads');
	
	// every time a file has been uploaded successfully, rename it to it's original name
	form.on('file', function(field, file) {
		fs.rename(file.path, path.join(form.uploadDir, file.name));
	});
	
	// log any errors that occur
	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});
	
	// once all the files have been uploaded, send a response to the client
	form.on('end', function() {
		res.end('success');
	});
	
	// parse the incoming request containing the form data
	form.parse(req);
	});

});
console.log('Cloud Docs Live is running on port 8081');
server.listen(8081);