import express from 'express';
import { authenticateToken } from '../../middleware/authentication';
import Game from '../../module/game/game';
import short from 'short-uuid';

const translator = short();

const route = express.Router();

route.post('/', authenticateToken, (req, res) => {
    const roomId = Game.createRoom();
    res.status(200).send({ roomId });
});

route.get('/join', authenticateToken, (req, res) => {
    const { roomId } = req.query;
    const room = Game.rooms.get(roomId as string);
    if (!room) return res.status(403).send({ message : 'Couldn\'t found that room id. '});
    if (room.hasUser((req as any).user)) return res.status(403).send({ message : 'Sorry, you can\'t play against yourself with the same account!' })
    const roomAccessToken = translator.new();
    room.accessTokens.set(roomAccessToken, (req as any).user as any);
    Game.accessTokens.set(roomAccessToken, room);
    res.status(200).send({ roomAccessToken });
})

export default route;