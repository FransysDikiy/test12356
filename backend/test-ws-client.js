const WebSocket = require('ws');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZTFhNmYzZTJlNDBiNGZhZGFhNDc0ZSIsImlhdCI6MTc0NDI5MzU0NywiZXhwIjoxNzQ0Mjk3MTQ3fQ.jH5aSYrSWioegQOeW4qSkSBEmVxG6SxdWwwnNSoxU2k';

const ws = new WebSocket(`ws://localhost:5000/notifications?token=${token}`);

ws.on('open', () => {
    console.log('Connected to WebSocket');
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    console.log('Received message:', data);
});
