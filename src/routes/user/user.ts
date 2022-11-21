import express from 'express';
import jwt from 'jsonwebtoken';
import short from 'short-uuid';
import { authenticateToken } from '../../middleware/authentication';

const translator = short();
const route = express.Router();

function generateAccessToken(uid: string, username : string) {
    return jwt.sign({id : uid, username}, process.env.TOKEN_SECRET as string, { expiresIn: '3600s' });
}

route.post('/', (req, res) => {
    const { username } = req.body;
    const validUsername = /^[a-zA-Z0-9\-_]{3,40}$/.test(username);

    if (!validUsername) {
        return res.status(403).send({ message : 'Invalid username validation!' });
    }
    const token = generateAccessToken(translator.new(), username);

    res.status(200).send({ accessToken : token });
});

route.get('/me', authenticateToken, (req, res) => {
    res.status(200).send((req as any).user);
});

export default route;