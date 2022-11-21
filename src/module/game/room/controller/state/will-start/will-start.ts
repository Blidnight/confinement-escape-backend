import WebSocket from "ws";
import { RoomMachine } from "../../controller";
import { RoomRunning } from "../running/running";
import { RoomState } from "../state";
import { RoomWaiting } from "../waiting/waiting";

const runningTransition = (machine : RoomMachine, state : WillStart) => {
    if (state.participants.size === 2 && state.timer === 0) {
        machine.setState(new RoomRunning(machine, state.participantsRole));
        return true;
    }
}

const waitingTransition = (machine : RoomMachine, state : WillStart) => {
    if (state.participants.size < 2) {
        machine.setState(new RoomWaiting(machine));
        return true;
    }
}

export class WillStart extends RoomState {
    public timer : number;
    public timeout: any;

    public participantsRole : Map<WebSocket.WebSocket, string> = new Map();

    public constructor(public machine : RoomMachine, public participants : Set<WebSocket.WebSocket>) {
        super(machine);
        this.transitions.set('waiting', waitingTransition);
        this.transitions.set('running', runningTransition);
    }

    public dispatchTimer() {
        this.machine.room.broadcast(JSON.stringify({ id : 'timer', timer : this.timer }));
        this.runTimer(); 
    }

    public runTimer() {
        this.timeout = setTimeout(() => {
            this.update();
            if (this.timer - 1 >= 0) {
                this.timer -= 1;
                this.dispatchTimer();
            }
        }, 1000);
    }

    public createRole() {
        const participants = Array.from(this.participants);
        const civilian = participants[
            Math.floor(Math.random() * participants.length)
        ];
        const police = participants.find(p => p != civilian) as WebSocket.WebSocket;
        
        this.participantsRole.set(civilian, 'civilian');
        this.participantsRole.set(police, 'police');
    }

    public getState() {
        const state = {
            id: 'room-state',
            state: 'will-start',
            timer: this.timer,
            role : 'spectator'
        }
        return state;
    }

    public addSpectator(socket : WebSocket.WebSocket) {
        if (socket.readyState === socket.OPEN) {
            console.log('send spectator message');
            socket.send(JSON.stringify(this.getState()))
        }
    }

    public enter(): void {
        this.timer = 5;
        this.createRole();
        this.machine.room.sockets.forEach((socket) => {
            if (socket.readyState === socket.OPEN) {
                const role = this.participantsRole.get(socket);
                const packet = {
                    id: 'room-state',
                    state : 'will-start',
                    timer : this.timer,
                    role : role ?? 'spectator',
                };
                socket.send(JSON.stringify(packet))
            }
        })
        this.runTimer();
    }

    public onMessage(socket: WebSocket.WebSocket, message: any): void {
        if (message?.id === 'join') this.addSpectator(socket);
        if (message?.id === 'left') {
            this.participantsRole.delete(socket);
            this.participants.delete(socket);
        }
        this.update();
    }

    public leave(): void {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = undefined;
    }


}