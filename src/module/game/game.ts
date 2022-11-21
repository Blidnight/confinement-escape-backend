import { Room } from "./room/room";

export default class Game {
    public static rooms : Map<string, Room> = new Map();
    public static accessTokens: Map<string, Room> = new Map();
    /**
     * - It's here that we gonna init the Game Websocket server with the express server
     * - It's here we gonna setup the JWT token, and express route for authentifying user that join the server
     * - It's here we gonna setup the route to handle room creation (only one room allowed by user, and one socket connection
     * - by user)
     * - it's here that we'll handle every join, leave, ping-pong, and message from clients
     * and dispatch them to their respective module (Room)
     */

    public static createRoom() {
        const room = new Room();
        Game.rooms.set(room.id, room);
        return room.id;
    }
}