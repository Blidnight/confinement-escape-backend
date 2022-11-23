import { RoomRunning } from "../controller/state/running/running";
import { faker } from '@faker-js/faker/locale/fr';
import PF from 'pathfinding';
import short from 'short-uuid';
import { RoomBoard } from "../board/board";

const femaleAvatars = new Map<string, string>();
const translator = short();

femaleAvatars.set('citoyen-2', 'female');
femaleAvatars.set('policier-3', 'female');

export class Entity {
    public id : string;
    public x : number = 0;
    public y : number = 0;

    public health : number;
    public maxHealth : number;
    public name : string;
    public avatar : string;
    public team : string;
    public currentAction: string = 'deplacement';

    public movement : number = 3;
    public defense : boolean = false;

    public actions : Set<string> = new Set();

    public constructor(name : string, health : number, maxHealth: number, team : string) {
        this.id = translator.new();
        this.name = name;
        this.health = health;
        this.maxHealth = maxHealth;
        this.team = team;
        this.reset();
    }

    public setAvatar(avatar : string) {
        const gender = femaleAvatars.has(avatar) ? 'female' : 'male';
        this.avatar = avatar;
        this.name = this.team === 'virus' ? 'Virus' : faker.name.firstName(gender);
    }

    public action(state : RoomRunning, type : string, data : any) {
        console.log(type, this.actions.has('deplacement'), data);
        if (type === 'deplacement' && this.actions.has('deplacement')) {
            const movementData : { x : number, y : number } = data;
            if (movementData?.x !== undefined && movementData?.y !== undefined) {
                const { x, y } = movementData;
                const emptyCells = state.board?.getEmptyCells(0);
                const targetEmpty = emptyCells.has(`${x}-${y}`);
                if (!targetEmpty) return;
                state.board.grid.setWalkableAt(this.x, this.y, true);
                const finder = new PF.AStarFinder();
                const path = finder.findPath(this.x, this.y, x, y, state.board.grid.clone());
                const cost = path.length - 1;
                if (this.movement >= path.length - 1) {
                    let oldX = this.x;
                    let oldY = this.y;

                    this.movement -= cost;
                    this.x = x;
                    this.y = y;
                    state.coolDown = Date.now() + (path.length * 400) + 500;
                    state.machine.room.broadcast(JSON.stringify({
                        id : 'turn-update',
                        action : 'movement',
                        from : { x : oldX, y : oldY },
                        to : { x, y},
                        entity : {...this, actions : Array.from(this.actions) },
                        path
                    }));
                }
                // calculate movement cost
                // check if the current entity has eneough movement points
                // process the movement if yes
            }
        } else if (type === 'attack-1' && this.actions.has('attack-1')) {
            const {x , y} : { x : number, y : number } = data;
            const schema = RoomBoard.schemas.get('attack-1');
            if (x !== undefined && y !== undefined && schema !== undefined) {
                const attackCells = state.board.getSchemaCells(this.x, this.y, schema);
                const canAttackCell = attackCells.has(x + '-' + y);
                if (!canAttackCell) return;
                this.currentAction = 'deplacement';
                this.actions.delete('defense');
                state.board.entity.forEach(e => {
                    if (e.x === x && e.y === y && e.team !== 'obstacle') {
                        console.log('targeted entities found');
                        this.actions.delete('attack-1');
                        e.health = e.health - 2 + (e.defense ? 1 : 0);
                        if (e.defense) e.defense = false;
                        state.machine.room.broadcast(JSON.stringify({
                            id : 'turn-update',
                            action : 'attack-1',
                            entity : {...this, actions : Array.from(this.actions) },
                            target: e
                        }));
                    }
                });
            }
            // check if the player can do an attack1 and do the attack
        } else if (type === 'attack-2' && this.actions.has('attack-2')) {
            const {x , y} : { x : number, y : number } = data;
            const schema = RoomBoard.schemas.get('attack-2');
            if (x !== undefined && y !== undefined && schema !== undefined) {
                const attackCells = state.board.getSchemaCells(this.x, this.y, schema);
                const canAttackCell = attackCells.has(x + '-' + y);
                if (!canAttackCell) return;
                this.actions.delete('defense');
                this.currentAction = 'deplacement';
                state.board.entity.forEach(e => {
                    if (e.x === x && e.y === y && e.team !== 'obstacle') {
                        console.log('targeted entities found');
                        this.actions.delete('attack-2');
                       
                        e.health = e.health - 1 + (this.defense ? 1 : 0);
                        if (e.defense) e.defense = false;
                        state.machine.room.broadcast(JSON.stringify({
                            id : 'turn-update',
                            action : 'attack-2',
                            entity : {...this, actions : Array.from(this.actions) },
                            target: e
                        }));
                    }
                })

            }
            // check if the player can do an attack1
        }  else if (type === 'action-switch') {
            if (data.name === 'defense' && this.actions.has('defense') && !this.defense) {
                this.actions.delete('defense')
                this.actions.delete('attack-1');
                this.actions.delete('attack-2');
                this.defense = true;
                state.machine.room.broadcast(JSON.stringify({
                    id : 'turn-update',
                    action : 'defense',
                    entity : {...this, actions : Array.from(this.actions) },
                }));
                return;
            }
            if (this.actions.has(data.name)) {
                this.currentAction = data.name;
                console.log('dispatch action-switch')
                state.machine.room.broadcast(JSON.stringify({
                    id : 'turn-update',
                    action : 'action-switch',
                    entity : {...this, actions : Array.from(this.actions) },
                }));
                console.log(this)
            }
        }
        state.filterDiedEntities();
    }

 

    public reset() : void {
        if (this.team === 'virus') {
            this.actions = new Set(['attack-1']);
            this.currentAction = 'attack-1';
            this.movement = 0;
            return;
        } 
        let actions = ['deplacement', 'attack-1', 'attack-2'];
        if (!this.defense) actions.push('defense');
        this.movement = 3;
        this.currentAction = 'deplacement';
        this.actions = new Set(actions);
    }
    /**
     * Return true if the entity died
     *  
    **/ 
    public damage(state : RoomRunning, pv : number) : boolean {
        if (this.defense) {
            this.defense = false;
            return false;
        }
        this.health -= pv;
        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        return false;
    }
}

// 
