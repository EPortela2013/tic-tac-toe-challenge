
// Symbolizes an X on the board
const X = 'X';

// Symbolizes an O on the board
const O = 'O';

// Number of rows
const ROW_TOTAL = 3;

// Classname for Rows
const ROW_CLASS = 'Row';

// Classname for Cells
const CELL_CLASS = 'Cell';

// Classname for Grid
const GRID_CLASS = 'Grid';

// Classname for GridWrapper
const GRIDWRAPPER_CLASS= 'GridWrapper';

// Number of cells per row
const CELLS_PER_ROW = 3;

// Number of total cells
const CELL_TOTAL = ROW_TOTAL * CELLS_PER_ROW;

// Cell id base
const CELL_ID_BASE = 'cell';

// Row id base
const ROW_ID_BASE = 'row';

// Row objects
const ROW_OBJECTS = [];
for (let i = 1; i <= ROW_TOTAL; ++i) {
    let cells = [];
    for (let j = 1; j <= CELLS_PER_ROW; ++j) {
        let cellNumber = (i - 1) * CELLS_PER_ROW + j;
        cells.push({ key: cellNumber, id: CELL_ID_BASE + cellNumber });
    }
    ROW_OBJECTS.push({ key: i, id: ROW_ID_BASE + i, cells: cells });
}

// Cell identifiers
const CELL1 = 'cell1';
const CELL2 = 'cell2';
const CELL3 = 'cell3';
const CELL4 = 'cell4';
const CELL5 = 'cell5';
const CELL6 = 'cell6';
const CELL7 = 'cell7';
const CELL8 = 'cell8';
const CELL9 = 'cell9';

// Current Turn class name
const CURRENT_TURN = 'CurrentTurn';

// Turn Signal class name
const TURN_SIGNAL = 'TurnSignal';

// Waiting turn signal class name
const WAITING = 'Waiting';

// Game over class name
const GAME_OVER = 'GameOver';

// SVG (used for creating id to SVG tag)
const SVG = 'SVG';

// SVG spinning class name
const SPINNING_SVG = 'Spinning-SVG';

// For when assigned both symbols after timing waiting for other player
const BOTH = 'Both';

module.exports = {
    O,
    X,
    ROW_TOTAL,
    ROW_CLASS,
    CELL_CLASS,
    GRID_CLASS,
    GRIDWRAPPER_CLASS,
    CELLS_PER_ROW,
    CELL_TOTAL,
    CELL_ID_BASE,
    ROW_ID_BASE,
    ROW_OBJECTS,
    CELL1,
    CELL2,
    CELL3,
    CELL4,
    CELL5,
    CELL6,
    CELL7,
    CELL8,
    CELL9,
    CURRENT_TURN,
    TURN_SIGNAL,
    WAITING,
    GAME_OVER,
    SVG,
    SPINNING_SVG,
    BOTH
};
