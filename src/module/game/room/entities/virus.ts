import { Room } from "../room";
import { Entity } from "./entity";

export class Virus extends Entity {
    public constructor() {
        super('Virus', 3, 3, 'virus');
        this.setAvatar('virus');
    }
}