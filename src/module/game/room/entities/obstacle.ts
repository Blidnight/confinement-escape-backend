import { Entity } from "./entity";

export class Obstacle extends Entity {
    public constructor(public width : number = 1) {
        super('Obstacle', -1, -1,  'obstacle')
    }
}