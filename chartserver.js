const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const basePath = '/Users/dev/Github/resize/image-gorilla-tool/';

const server = http.createServer((req, res) => {
    if (req.url === '/memory-dump-1720619031606.json') {
        const filePath = path.join(basePath, 'memory-dump-1720619031606.json');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading file');
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    }
    else if (req.url === '/chart') {
        const filePath = path.join(basePath, 'memory-chart.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading file');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
    else {
        res.writeHead(404);
        res.end('File not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
