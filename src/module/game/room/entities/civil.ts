import { Room } from "../room";
import { Entity } from "./entity";

export class Civil extends Entity {
    public constructor(name : string) {
        super(name, 10, 10, 'civilian');
        this.avatar = 'perso-gars1';
    }
}