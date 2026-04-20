'use strict'

import initHTTPServer from "./httpserver.js";
import initWSServer from "./WSserver.js";

function StartServer() {
    const server = initHTTPServer();
    console.log("HTTP server started")
    initWSServer(server);
    console.log("WEBSOCKET server started")
}

StartServer()