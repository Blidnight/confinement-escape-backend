import { Room } from "../room";
import { Entity } from "./entity";

export class Police extends Entity {
    public constructor(name : string) {
        super(name, 10, 10, 'police');
        this.avatar = 'policier';
    }
}