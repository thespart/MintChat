"use strict";

import websocket from "websocket";

/*
connectedusers[k]
connection
username
*/

const connectedusers = {} // подключенные люди
const customProtocol = "secretprotocol"

// --------- helper functions --------- //
function getConnectionKey(connection) {
	let socket = connection.socket; // The underlying socket

	return socket.remoteAddress + socket.remotePort;
}

function broadcast(response) {
	for (let k in connectedusers) if (connectedusers.hasOwnProperty(k)) {
		let destConnection = connectedusers[k].connection;

		destConnection.send(JSON.stringify(response));
	}
}
// ---------                  --------- //


function messageHandler(message, connection) {
	let k = getConnectionKey(connection);
	let response;
	switch (message.type) {
		case "setusername": {
			let username = message.payload.username;
			connectedusers[k].username = username;
			}
			break;

		case "join":
			response = {
				'type': "join",
				"payload": {
					"username": connectedusers[k].username,
				}
			}
			broadcast(response);
			break;

		case "message":
			const text = message.payload.message
			response = {
				'type': "message",
				"payload": {
					"username": connectedusers[k].username,
					"message": text
				}
			}
			broadcast(response);
			break;
	} 
	
	console.log(response)
}

// --------- event functions --------- //
function onRequest(request) {
	if (request.requestedProtocols[0] == customProtocol) {
		request.accept(customProtocol, request.origin);
	} else {
		request.reject(403, "Forbidden")
	}
}

function onMessage(message, connection) {
	message = JSON.parse(message.utf8Data);

	messageHandler(message, connection);
}

function onClose(reason, description) {
	let k = getConnectionKey(this);

	let username = connectedusers[k].username;

	delete connectedusers[k];
	
	let response = {
		'type': 'left',
		'payload': {
			'username': username
		}
	};

	broadcast(response);
}

function onConnect(connection) {
	const k = getConnectionKey(connection);
	console.log(k)
	connectedusers[k] = {
		'connection': connection,
		'username': null,
	}
	connection.on('message', (message) => {
		onMessage(message, connection);
	});
	connection.on('error', ()=> {console.log(connection, " has died")});
	connection.on('close', onClose);
}
// ---------              --------- //


export default function initWSServer(httpserver) {
	const server = new websocket.server({httpServer: httpserver})
	server.on('request', onRequest)
	server.on('connect', onConnect)
}