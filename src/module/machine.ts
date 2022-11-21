import { State } from "./state";

export class Machine {
  public state: State;
  public previousState: State;

  public constructor() {}

  public setState(state: State) {
    if (this.state) this.state.leave();
    this.state = state;
    this.state.enter();
  }
}
