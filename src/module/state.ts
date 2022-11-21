import WebSocket from "ws";
import { Machine } from "./machine";

export class State {
  public transitions: Map<string, (...params : any) => boolean | void> =
    new Map();

  public constructor(public machine: Machine) {}

  public enter() {}
  public update() {
    const transitionsList = Array.from(this.transitions.values());
    for (let i = 0; i < transitionsList.length; i += 1) {
      const transition = transitionsList[i];
      if (transition(this.machine, this)) {
        return;
      }
    }
  }
  public leave() {
    this.machine.previousState = this;
  }
}
