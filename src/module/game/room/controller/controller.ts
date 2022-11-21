import WebSocket from "ws";

import { Machine } from "../../../machine";
import { Room } from "../room";
import { RoomState } from "./state/state";
import { RoomWaiting } from "./state/waiting/waiting";

export class RoomMachine extends Machine {
    public state : RoomState;

    public constructor(public room : Room) {
        super();
        this.state = new RoomWaiting(this);
    }

    public onMessage(client : WebSocket.WebSocket, data : any) {
        if (data?.id === 'join') console.log(this.state.getState());
        this.state?.onMessage?.(client, data);
    }
}