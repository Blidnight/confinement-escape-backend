import WebSocket from "ws";
import { Machine } from "../../../../../machine";
import { RoomMachine } from "../../controller";
import { RoomState } from "../state";
import { WillStart } from "../will-start/will-start";

const willStartTransition = (machine : RoomMachine, state : RoomWaiting) => {
    if (state.participants.size === 2) {
       machine.setState(new WillStart(machine, state.participants));
       return true;
    }
}

export class RoomWaiting extends RoomState {
    public participants : Set<WebSocket.WebSocket> = new Set();
    public transitions: Map<string, (machine: RoomMachine, state : RoomWaiting) => boolean | void> = new Map();

    public constructor(public machine : RoomMachine) {
        super(machine);
        this.transitions.set('will-start', willStartTransition);
    }

    public enter(): void {
        this.participants = new Set(Array.from(this.machine.room.sockets).slice(0, 2));
        this.machine.room.broadcast(JSON.stringify(this.getState()));
    }

    public getState() {
        const state = {
            id : 'room-state',
            state : 'waiting'
        };
        return state;
    }

    public addParticipant(socket : WebSocket.WebSocket) {
        if (this.participants.size < 2) {
            this.participants.add(socket);
            this.machine.room.broadcast(JSON.stringify(this.getState()));
        }
    }

    public onMessage(socket: WebSocket.WebSocket, message: any): void {
        if (message?.id === 'join') this.addParticipant(socket);
        if (message?.id === 'left') this.participants.delete(socket);
        this.update();
    }
}