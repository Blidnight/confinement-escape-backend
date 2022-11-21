import WebSocket from "ws";
import { Machine } from "../../machine";
import { RoomMachine } from "./controller/controller";
import short from 'short-uuid';
const translator = short();

export class Room {
    public sockets : Set<WebSocket> = new Set<WebSocket>();
    public accessTokens: Map<string, any> = new Map<string, any>();
    /**
     * If machien.state waiting data will only be the current state
     * machine.state will-start data will be the timer, and the current role of the client (civilian, police or spectator)
     * machine.state running data will be the timer, currentRole, entities, entityTurn
     *  - The running state will initialize all entities Instance (name, type, life, movement and availableAction )
     *  - The running state will manage all gameAction events (stop, movement, attack, defense)
     *  - The running state will manage transition to the over state ( one player left the game, one player lose all his entities )
     * 
     * 
     * TODO - create an OnMessage, and an OnUpdate event for state
     */
    public machine : RoomMachine;
    public id : string;

    public constructor() {
        this.id = translator.new();
        this.machine = new RoomMachine(this)
    }

    public hasUser(socketData : any) {
        let hasSocket = false;
        this.sockets.forEach((s) => {
            if (hasSocket) return;
            if (s.readyState === s.OPEN && (s as any).socketData?.id === socketData?.id) {
                hasSocket = true;
            }
        });
        return hasSocket;
    }

    public join(client : WebSocket.WebSocket, token: string) : void {
        (client as any).socketData = this.accessTokens.get(token);
        console.log((client as any).socketData);
        this.sockets.add(client);
        this.machine.onMessage(client, { id : 'join' });
        ['close', 'error'].forEach((e) => client.once(e, () => {
            this.sockets.delete(client)
            this.machine.onMessage(client, { id : 'left'})
        })) 
        client.on('message', (data) => {
            try {
                this.machine.onMessage(client, JSON.parse(data.toString('utf-8')));
            } catch (e) {
                console.log('error')
            }     
        })
    }

    public broadcast(data : any) {
        this.sockets.forEach(socket => {
            if (socket?.readyState === socket?.OPEN) {
                socket.send(data);
            }
        })
    }
}