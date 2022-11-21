import jwt from 'jsonwebtoken';

export function authenticateToken(req : any, res : any, next : any) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.status(401).send({ message : 'Missing the bearer access token!'})

    jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: any) => {
        if (err) return res.status(403).send({ message : 'Invalid JWT token'});
        req.user = user;
        next();
    })
}