'use strict'

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import URLParse from "url-parse"; // url.parse теперь устарел, поэтому мы используем другой метод
import mime from "mime"

const port = 8080;
const basedir = process.cwd();

// узнаем как зовут файл
function getFileName(filepath, callback) {
    filepath = decodeURI(filepath.replace(/\+/g, '%20'));
    let filename = path.normalize(basedir + path.sep + filepath);
    
    function onStat(error, stats) {
        if (error) {
            return callback(error, filename)
        }

        // если путь, то ищем ещё
        if (stats.isDirectory()) {
            filename = path.normalize(filename + path.sep + 'index.html');
			fs.stat(filename, onStat);
			return;
        }
        // ура файл, посмотрим его имя
        if (stats.isFile()) {
            return callback(null, filename);
        } else {
            return callback(new Error("unknown file/type"), filename);
        }
         
    }

    // мера предосторожности: узнаем находится ли наш файл в нашем пути.
    // нужно для того чтобы избежать неожиданных ошибок или чего похуже.
	if (filename.substring(0, basedir.length) != basedir) {
		let err = new Error("Not Found");
		err.code = 'ENOENT';
		return callback(err, filename);
	}

    fs.stat(filename, onStat)
}
function HttpLogic(request, response) {
    const pathh = new URLParse(request.url).pathname;

    getFileName(pathh, (error, filename) => {

        function writeError(err) {
			if (err.code == 'ENOENT') {
                // файл не найден
				response.writeHead(404, { 'Content-Type': 'text/plain' });
				response.write('404 Not Found\n');
				response.end();
			} else {
                // сервер не смог обработать запрос
				response.writeHead(500, { 'Content-Type': 'text/plain' });
				response.write('500 Internal Server Error\n');
				response.end();
			};
		};

        if (error) {
            writeError(error)
        } else {
            fs.readFile(filename, "binary", (error, file) => {
                if (error) {
                    writeError(error)
                } else {
                    // файл найден
                    const mimetype = mime.getExtension(filename);
                    response.writeHead(200, { 'Content-Type': mimetype });
					response.write(file, "binary");
					response.end();
                } 
            })
        }

    });
}

// это мы используем в mainserver.js
export default function initHTTPServer() {
    return http.createServer(HttpLogic).listen(port);
};