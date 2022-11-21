const dotenv = require('dotenv');
// get config vars
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import UserRoute from './routes/user/user';
import { Room } from './module/game/room/room';
import Game from './module/game/game';
import RoomRoute from './routes/game/room';

async function init() {
    const app = express();
    const port = process.env.PORT || 4000;
    const httpServer = http.createServer(app);

    app.use(cors({
        origin: [process.env.PUBLIC_URL as string],
    }))

    app.use(express.json());
    app.use('/user', UserRoute);
    app.use('/room', RoomRoute);

    const wss = new WebSocket.Server({
        server: httpServer,
    });

    setInterval(() => {
        const clients = new Set(wss.clients);
        clients.forEach((client : WebSocket.WebSocket & { alive? : boolean, heart?: number }) => {
            if (!client.alive) {
                if (client.heart && client.heart > 0) {
                    client.heart -= 1;
                } else {
                    return client.terminate();
                }
            }
            client.alive = false;
            client.send(JSON.stringify({ id : 'ping' }));
        })
    }, 10000);

    // const room = new Room();

    wss.on('connection', (websocket : WebSocket.WebSocket & { alive? : boolean, heart?: number }, request) => {
        websocket.alive = true;
        websocket.heart = 3;
        // room.join(websocket);
        websocket.on('message', (rawData) => {
            try {
                const data = JSON.parse(rawData.toString('utf-8'));

                if (data.id === 'pong') {
                    websocket.alive = true;
                    websocket.heart = 3;
                } else if (data.id === 'room-join') {
                    const room = Game.accessTokens.get(data.token);
                    if (room) {
                        room.join(websocket, data.token);
                    }
                }
            } catch (e) {
                console.log('error');
            }
            
        })
    });

    httpServer.listen(port, () => {
        console.log('Server listenning on port 4000');
        console.log('Frontend APP :', process.env.PUBLIC_URL);
    })
}

init();