import WebSocket from "ws";
import { RoomBoard } from "../../../board/board";
import { Civil } from "../../../entities/civil";
import { Entity } from "../../../entities/entity";
import { Obstacle } from "../../../entities/obstacle";
import { Police } from "../../../entities/police";
import { Virus } from "../../../entities/virus";
import { RoomMachine } from "../../controller";
import { GameOver } from "../over/over";
import { RoomState } from "../state";
import { RoomWaiting } from "../waiting/waiting";
// citoyen 2 fille
const CIVILIAN_TEXTURES = ['citoyen-2', 'citoyen-1', 'citoyen-3'];
// policier 3 fille
const POLICE_TEXTURES = ['policier-1', 'policier-2', 'policier-3'];

const TURN_TIME = 45;

const waitingTransition = (machine : RoomMachine, state : RoomRunning) => {
    if (state.participants.size < 2) {
        machine.setState(new RoomWaiting(machine));
        return true;
    }
}

export class RoomRunning extends RoomState {
    public board: RoomBoard;
    public entities : Entity[];
    public obstacles : Obstacle[];
    public entityTurn: Entity;
    public timer: number;
    public timeout : any;

    public coolDown: number = 0;
   
    public constructor(public machine : RoomMachine, public participants :  Map<WebSocket.WebSocket, string> = new Map()) {
        super(machine)
        this.transitions.set('waiting', waitingTransition);
    } 

    public getState() {
        const state = {
            id : 'room-state',
            state: 'running',
            entities : this.entities,
            entityTurn : {...this.entityTurn, actions : Array.from(this.entityTurn.actions)},
            obstacles: this.obstacles,
            timer : this.timer,
            board : this.board.getBoardString()
        }
        return state;
    }

    public createEntities() : Entity[] {
        const board = new RoomBoard(30, 20);
        const civilian : Civil[] = [];
        const police : Police[] = [];
        const virus : Virus[] = [];

        const availableTextures = {
            civilian : [...CIVILIAN_TEXTURES],
            police: [...POLICE_TEXTURES],
        }

        for (let i = 0; i < 3; i += 1) {
            let civilianTexture = availableTextures.civilian[
                Math.floor(Math.random() * availableTextures.civilian.length)
            ];
            let policeTexture = availableTextures.police[
                Math.floor(Math.random() * availableTextures.police.length)
            ];

            const civil = new Civil('civil-' + i);
            const policeE = new Police('police-' + i);

            civil.setAvatar(civilianTexture);
            policeE.setAvatar(policeTexture);

            civilian.push(civil);
            police.push(policeE);

            availableTextures.civilian = availableTextures.civilian.filter(t => t !== civilianTexture);
            availableTextures.police = availableTextures.police.filter(t => t !== policeTexture);
        }

        for (let i = 0; i < 3; i += 1) {
            virus.push(new Virus());
        }

        const entities : Entity[] = [];
        const obstacles : Obstacle[] = [];
        let rawEntities : Entity[] = [...civilian, ...police, ...virus];

        // randomly set position on the board. Done
        // randomly set avatar for these entities if they are not virus
        // Randomly pick a name for the entity base on the avatar gender (because some avatar are female)
        // For obstacles : between 3 - 6  buildings
        //     trees : between 4 - 8
        //     fontaines : between 1-2
        // for the MVP -> no obstacles

        let buildings = 5 + Math.floor(
            Math.random() * 4
        );

        let trees = 7 + Math.floor(
            Math.random() * 5
        );

        let fontaines = 2 + Math.floor(
            Math.random() * 2
        );
        [buildings, trees, fontaines].forEach((count, index) => {
            let width = 1;
            
            
            for (let i = 0; i < count; i += 1) {
                if (index === 0) {
                    // Buildings
                    width = 3 + Math.floor(
                        Math.random() * 2
                    );
                }
                let obstacle = new Obstacle(width);
                let positions = Array.from(board.getEmptyCells(width, width).values());
                let position = positions[
                    Math.floor(Math.random() * positions.length)
                ];

                

                if (position) {
                    let [x, y] = position.split('-').map(a => parseInt(a))
                    obstacle.x = x;
                    obstacle.y = y;

                    let textures = ['arbre1'];

                    if (index === 0) {
                        if (width === 3) {
                            textures = ['immeuble1', 'immeuble3']
                        } else if (width === 4) {
                            textures = ['immeuble2']
                        } 
                    } else if (index === 1) {
                        textures = ['arbre1', 'arbre2', 'buisson'];
                    }


                    let texture = textures[Math.floor(Math.random() * textures.length)];
                    
                    obstacle.setAvatar(texture);
                    obstacles.push(obstacle);
                    board.entity.add(obstacle);
                }
            }
            
        })
        while(rawEntities.length > 0) {
            const entitySelected = rawEntities[
                Math.floor(Math.random() * rawEntities.length)
            ];
            const emptyPosition = Array.from(board.getEmptyCells(2).values());
            const selectedPosition = emptyPosition[
                Math.floor(Math.random() * emptyPosition.length)
            ].split('-').map(n => parseInt(n));
            entitySelected.x = selectedPosition[0];
            entitySelected.y = selectedPosition[1];
            entities.push(entitySelected);
            board.entity.add(entitySelected);
            rawEntities = rawEntities.filter(e => e !== entitySelected);
        }
        
        this.board = board;
        this.obstacles = obstacles;

        return entities;
    }

    public dispatchTimer() {
        this.machine.room.broadcast(JSON.stringify({ id : 'timer', timer : this.timer }));
        this.runTimer(); 
    }

    public handleTurnChange() {
        this.timer = TURN_TIME; 
        this.coolDown = 0;
        const currentTurnIndex = this.entities.indexOf(this.entityTurn);
        
        if (currentTurnIndex + 1 < this.entities.length) {
            this.entityTurn = this.entities[currentTurnIndex + 1];
            this.entityTurn.reset();
            if (this.entityTurn.team === 'virus') {
                this.timer = 5;
            }
            this.machine.room.broadcast(
                JSON.stringify({
                    id : 'turn-change',
                    entityTurn : {...this.entityTurn, actions : Array.from(this.entityTurn.actions)}
                })
            );
        } else {
            const virusCount = this.entities.filter(e => e.team === 'virus').length;
            const virus = virusCount < 12 ? new Virus() : undefined
            if (virus) {
                const emptyPosition = Array.from(this.board.getEmptyCells(2).values());
                const selectedPosition = emptyPosition[
                    Math.floor(Math.random() * emptyPosition.length)
                ].split('-').map(n => parseInt(n));
                virus.x = selectedPosition[0];
                virus.y = selectedPosition[1];
                this.entities.push(virus);
                this.board.entity.add(virus);
                this.machine.room.broadcast(
                    JSON.stringify({
                        id : 'turn-entities',
                        entities:this.entities
                    })
                );
            }
            this.entityTurn = this.entities[0];
            this.entityTurn.reset();
            if (this.entityTurn.team === 'virus') {
                this.timer = 5;
            }
            this.machine.room.broadcast(
                JSON.stringify({
                    id : 'turn-change',
                    entityTurn : {...this.entityTurn, actions : Array.from(this.entityTurn.actions)},
                })
            );
            
        }

        this.dispatchTimer();
    }

    public filterDiedEntities() {
        const filteredEntities = this.entities.filter(e => {
            if (e.health <= 0) {
                if (this.board.entity.has(e)) this.board.entity.delete(e);
            }
            return e.health > 0;
        });
        if (filteredEntities.length !== this.entities.length) {
            this.entities = filteredEntities;
            this.machine.room.broadcast(
                JSON.stringify({
                    id : 'turn-entities',
                    entities:this.entities
                })
            );
        
        }
        this.checkWinningCondition();
        
    }

    public checkWinningCondition() {
        const aliveCivilian =this.entities.filter(e => e.team === 'civilian');
        if (aliveCivilian.length === 0) {
            this.machine.setState(new GameOver(this.machine, 'police'));
            return;
        }
        const alivePolice = this.entities.filter(e => e.team === 'police');
        if (alivePolice.length === 0) {
            // winner is civilian team, transition to gameover
            this.machine.setState(new GameOver(this.machine, 'civilian'));
            return;
        }
    }

    public runTimer() {
        if (this.timeout) clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            if (this.coolDown > Date.now()) {
                this.dispatchTimer();
                return;
            }

            this.update();
            if (this.timer - 1 >= 0) {
               
                if (this.entityTurn?.team === 'virus') {
                    console.log(this.entityTurn.actions);
                    if (this.entityTurn.actions.has('attack-1')) {
                        const schema = RoomBoard.schemas.get('attack-1');
                        console.log(schema);
                        if (schema) {
                            const attackCells = this.board.getSchemaCells(this.entityTurn.x, this.entityTurn.y, schema);
                         
                            attackCells.forEach(cell => {
                                const [x, y] = cell.split('-').map(a => parseInt(a));
                                if (!isNaN(x) && !isNaN(y)) {
                                    if (this.entityTurn.actions.has('attack-1')) this.entityTurn.action(this, 'attack-1', {x , y});
                                }
                            });

                            

                        }   
                        
                    }
                    if (this.timer <= 3) {
                        this.filterDiedEntities();
                        this.handleTurnChange();
                    }
                }
                this.timer -= 1;
                this.dispatchTimer();
            } else {
                this.handleTurnChange();
            }
        }, 1000);
    }

    public enter(): void {
        // Initialize the game state
        // -> initialize entities
        this.entities = this.createEntities();
        this.entityTurn = this.entities[0];
        this.timer = this.entityTurn.team === 'virus' ? 5 : TURN_TIME;
        // -> initialize the gameMap

        this.machine.room.broadcast(JSON.stringify(this.getState()));
        this.runTimer();
    }

    public leave(): void {
        if (this.timeout) clearTimeout(this.timeout);
    }

    public onMessage(socket: WebSocket.WebSocket, message: any): void {
        if (message?.id === 'cell-action') {
            const socketTeam = this.participants.get(socket);
            
            if (socketTeam === this.entityTurn?.team) {
                if (message?.action === 'stop-turn') {
                    this.filterDiedEntities();
                    this.handleTurnChange();
                    return;
                }
                if (this.coolDown > Date.now() && message?.action !== 'action-switch') return;
                this.entityTurn?.action(this, message.action, message);
            }
        }
        if (message?.id === 'left') {
            this.participants.delete(socket);
        }

        this.update();
    }
}