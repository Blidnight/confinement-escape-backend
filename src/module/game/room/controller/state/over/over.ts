import WebSocket from "ws";
import { RoomMachine } from "../../controller";
import { RoomRunning } from "../running/running";
import { RoomState } from "../state";
import { RoomWaiting } from "../waiting/waiting";

export class GameOver extends RoomState {
    public timer : number;
    public timeout: any;

    public participantsRole : Map<WebSocket.WebSocket, string> = new Map();

    public constructor(public machine : RoomMachine, public winner : string) {
        super(machine);
    }



    public getState() {
        const state = {
            id: 'room-state',
            state: 'game-over',
            winner: this.winner
        }
        return state;
    }


    public enter(): void {
        this.machine.room.sockets.forEach((socket) => {
            if (socket.readyState === socket.OPEN) {
                const role = this.participantsRole.get(socket);
                const packet =  this.getState();
                socket.send(JSON.stringify(packet))
            }
        })
    }

    public onMessage(socket: WebSocket.WebSocket, message: any): void {
        if (message?.id === 'join') {
            socket.send(JSON.stringify(this.getState()))
        }
        this.update();
    }

}