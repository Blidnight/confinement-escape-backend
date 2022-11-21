import PF from 'pathfinding';
import { Entity } from "../entities/entity";
import { Obstacle } from "../entities/obstacle";

export class RoomBoard {
    public static schemas : Map<string, string[]> = new Map();

    public entity : Set<Entity> = new Set();
    public grid : PF.Grid;

    public constructor(public width : number, public height: number) {
        this.grid = new PF.Grid(width, height);
    }

    public getSchemaCells(x : number, y : number, schema : string[]) {
        let offsetX : number = 0, offsetY : number = 0;
        for (let i = 0; i < schema.length; i += 1) {
            let row = schema[i];
            let centerIndex = row.indexOf('.');

            if (centerIndex !== -1) {
                offsetX = centerIndex;
                offsetY = i;
            }
        }

        x -= offsetX;
        y -= offsetY;
        const cells = new Set<string>();
        for(let i = 0; i < schema.length; i += 1) {
            Array.from(schema[i]).forEach((value, j) => {
                let cellX = x + j;
                let cellY = y + i;
                if (value === '1') {
                    cells.add(cellX + '-' + cellY);
                }
            })
        }
        return cells;
    }
    /**
     * 
     * Return a set of the entityCells
     */
    public getEntityCells() {
        const entityCells = new Set();
        this.entity.forEach(e => {
            entityCells.add(`${e.x}-${e.y}`)
            if (e instanceof Obstacle) {
                for (let i = 0; i < e.width; i += 1) {
                    entityCells.add(`${e.x + i}-${e.y}`);
                }
            }
        });
        return entityCells;
    }

    public getBoardString() : string[] {
        const rows : string[] = [];
        const entityCells = this.getEmptyCells(0)
        for (let y = 0; y < this.height; y += 1) {
            let row = '';
            for (let x = 0; x < this.width; x += 1) {
                const isFree = entityCells.has(`${x}-${y}`);
                if (isFree) row += '0';
                else row += '1';
            }
            rows.push(row);
        }
        return rows;
    }
    /**
     * 
     * Return empty cells on the board with the defined offset from border
     */
    public getEmptyCells(offset : number, width : number = 1) {
        const emptyCells = new Set<string>();
        const entityCells = this.getEntityCells();

        for(let i = 0; i < this.height; i +=1 ) {
            for (let j = 0; j < this.width; j += 1) {
                this.grid.setWalkableAt(j, i, false);
                if (
                    i - offset >= 0 && i + offset < this.height 
                    && j - offset >= 0 && j - offset < this.width
                ) {
                    const cell = `${j}-${i}`;
                    const isFree = !entityCells.has(cell);
                    if (isFree) {
                        let widthFree = true;
                        for (let l = j; l < j + width; l += 1) {
                            if (!widthFree) continue;
                            if (entityCells.has(`${l}-${i}`)) {
                                widthFree = false;
                            } else {
                                if (
                                    i - offset >= 0 && i + offset < this.height 
                                    && l - offset >= 0 && l - offset < this.width
                                ) {
                                    try {
                                    this.grid.setWalkableAt(l, i, true);

                                    } catch (e) {}
                                }
                            }
                        }
                        if (widthFree) {
                            try {
                                this.grid.setWalkableAt(j, i, true);
                            } catch(e) {

                            }
                            emptyCells.add(cell)
                        }
                    }
                }
            }
        }
        return emptyCells;
    }


}

RoomBoard.schemas.set('attack-1', [
    '010',
    '1.1',
    '010'
]);

RoomBoard.schemas.set('attack-2', [
    '10001',
    '01010',
    '00.00',
    '01010',
    '10001'
]);