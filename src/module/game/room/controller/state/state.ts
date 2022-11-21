import WebSocket from "ws";
import { Machine } from "../../../../machine";
import { State } from "../../../../state";

export class RoomState extends State {
  public constructor(machine : Machine) {
    super(machine)
  }

  public onMessage(socket: WebSocket.WebSocket, message: any): void {}
  public getState() : any {}
  public update(): void {
    super.update();
  }
}