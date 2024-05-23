import React from "react";
import { createRoot } from 'react-dom/client';
import * as Constants from "./constants";
import "./App.css";
import OSVG from "./svgs/o.svg";
import XSVG from "./svgs/x.svg";
import { ReactSVG } from "react-svg";
import { w3cwebsocket as W3CWebSocket } from "websocket";

// Components
function App() {
  const WS_HOST = window.location.origin.replace(/^http/, 'ws').replace(':3000', ':3001');
  const client = new W3CWebSocket(WS_HOST);
  const data = { turnPlayerX: true, filledCellCount: 0, gameOver: false };
  const visibleCells = [];

  function checkGame() {
    if (data.gameOver) {
      return;
    }

    let winningCells = getWinningCells();

    // There is a winner
    if (winningCells[0]) {
      data.gameOver = true;
      for (let cell of winningCells) {
        document.getElementById(cell).classList.add(Constants.SPINNING_SVG);
      }
    }
    else if (data.filledCellCount === Constants.CELL_TOTAL) {
      data.gameOver = true;
      for (let visibleSVG of visibleCells) {
        visibleSVG.classList.add(Constants.SPINNING_SVG);
      }
    }

    if (data.gameOver) {
      // Update turn signal.
      document.getElementById(Constants.SVG + Constants.X).classList.remove(Constants.CURRENT_TURN);
      document.getElementById(Constants.SVG + Constants.O).classList.remove(Constants.CURRENT_TURN);
      document.getElementById(Constants.SVG + Constants.X).classList.remove(Constants.WAITING);
      document.getElementById(Constants.SVG + Constants.O).classList.remove(Constants.WAITING);
    }

    return true;
  }

  function getWinningCells() {
    // First row
    if (data[Constants.CELL1] && data[Constants.CELL1] === data[Constants.CELL2] && data[Constants.CELL2] === data[Constants.CELL3]) {
      return [Constants.CELL1, Constants.CELL2, Constants.CELL3];
    }

    // Second row
    if (data[Constants.CELL4] && data[Constants.CELL4] === data[Constants.CELL5] && data[Constants.CELL5] === data[Constants.CELL6]) {
      return [Constants.CELL4, Constants.CELL5, Constants.CELL6];
    }

    // Third row
    if (data[Constants.CELL7] && data[Constants.CELL7] === data[Constants.CELL8] && data[Constants.CELL8] === data[Constants.CELL9]) {
      return [Constants.CELL7, Constants.CELL8, Constants.CELL9];
    }

    // First column
    if (data[Constants.CELL1] && data[Constants.CELL1] === data[Constants.CELL4] && data[Constants.CELL4] === data[Constants.CELL7]) {
      return [Constants.CELL1, Constants.CELL4, Constants.CELL7];
    }

    // Second column
    if (data[Constants.CELL2] && data[Constants.CELL2] === data[Constants.CELL5] && data[Constants.CELL5] === data[Constants.CELL8]) {
      return [Constants.CELL2, Constants.CELL5, Constants.CELL8];
    }

    // Third column
    if (data[Constants.CELL3] && data[Constants.CELL3] === data[Constants.CELL6] && data[Constants.CELL6] === data[Constants.CELL9]) {
      return [Constants.CELL3, Constants.CELL6, Constants.CELL9];
    }

    // Diagonal top-left to bottom-right
    if (data[Constants.CELL1] && data[Constants.CELL1] === data[Constants.CELL5] && data[Constants.CELL5] === data[Constants.CELL9]) {
      return [Constants.CELL1, Constants.CELL5, Constants.CELL9];
    }

    // Diagonal top-right to bottom-left
    if (data[Constants.CELL3] && data[Constants.CELL3] === data[Constants.CELL5] && data[Constants.CELL5] === data[Constants.CELL7]) {
      return [Constants.CELL3, Constants.CELL5, Constants.CELL7];
    }

    return [];
  }

  function handleOtherPlayerDropped() {
    if (data.gameOver) {
      return;
    }

    let svgs = document.getElementsByTagName('svg');
    for (let svg of svgs) {
      svg.classList.add(Constants.GAME_OVER);
    }
    data.gameOver = true;
  }

  function handleOtherPlayerMove(move) {
    // Create pseudo event
    const pseudoEvent = { currentTarget: { id: move } };
    makeMove(pseudoEvent, true);
    checkGame();
  }

  function initializeTurnSignals() {
    // Update turn signals
    let classesForTurnSignalX = [];
    let classesForTurnSignalO = [];
    switch (data?.assignedSymbol) {
      case Constants.BOTH:
      case Constants.X: {
        classesForTurnSignalX.push(Constants.CURRENT_TURN);
        break;
      }
      case Constants.O: {
        classesForTurnSignalX.push(Constants.WAITING);
        break;
      }
      default: {
        classesForTurnSignalO.push(Constants.WAITING);
        classesForTurnSignalX.push(Constants.WAITING);
      }
    }

    if (classesForTurnSignalO.length) {
      document.getElementById(Constants.SVG + Constants.O).classList.add(classesForTurnSignalO);
    }

    if (classesForTurnSignalX.length) {
      document.getElementById(Constants.SVG + Constants.X).classList.add(classesForTurnSignalX);
    }
  }

  function makeMove(event, force = false) {
    // Don't do anything if game is already over.
    if (data.gameOver) {
      return;
    }

    // Don't do anything if symbol has not been assigned
    if (data?.assignedSymbol === undefined) {
      return;
    }

    let currentPlayer = data.turnPlayerX ? Constants.X : Constants.O;
    let otherPlayer = data.turnPlayerX ? Constants.O : Constants.X;

    if (![currentPlayer, Constants.BOTH].includes(data.assignedSymbol) && !force) {
      // It's the other player's turn. Don't do anything.
      return;
    }

    if (data[event.currentTarget.id]) {
      // Move is invalid, no need to show error to user.
      console.log("Invalid move");
    }
    else {
      let currentCellElement = document.getElementById(event.currentTarget.id);
      let root = createRoot(currentCellElement);
      // Fill in the cell with the appropriate symbol.
      if (currentPlayer === Constants.X) {
        root.render(<Symbol src={XSVG} id={event.currentTarget.id + Constants.X} />);
      } else {
        root.render(<Symbol src={OSVG} id={event.currentTarget.id + Constants.O} />);
      }
      visibleCells.push(currentCellElement);
      // Save what symbol is in the cell.
      data[event.currentTarget.id] = currentPlayer;
      // Increase count of filled cells.
      ++data.filledCellCount;

      // Switch turn to other player.
      data.turnPlayerX = !data.turnPlayerX;
      // Update turn signal.
      if (data.assignedSymbol === Constants.BOTH) {
        document.getElementById(Constants.SVG + currentPlayer).classList.remove(Constants.CURRENT_TURN);
        document.getElementById(Constants.SVG + otherPlayer).classList.add(Constants.CURRENT_TURN);
      } else {
        if (data.assignedSymbol === currentPlayer) {
          document.getElementById(Constants.SVG + currentPlayer).classList.remove(Constants.CURRENT_TURN);
          document.getElementById(Constants.SVG + otherPlayer).classList.add(Constants.WAITING);
        } else {
          document.getElementById(Constants.SVG + currentPlayer).classList.remove(Constants.WAITING);
          document.getElementById(Constants.SVG + otherPlayer).classList.add(Constants.CURRENT_TURN);
        }
      }

      // Send message to server for it to relay it to the other player
      if (data.assignedSymbol !== Constants.BOTH && !force) {
        client.send(JSON.stringify({ move: event.currentTarget.id }));
      }
    }
    return true;
  }

  React.useEffect(() => {
    client.onopen = () => {
      console.log('Websocket client connected');

      // Inform server that it's ready for game
      client.send(JSON.stringify({ readyForGame: true }));
    };

    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);

      if (dataFromServer?.assignedSymbol) {
        data.assignedSymbol = dataFromServer.assignedSymbol;
        initializeTurnSignals();
        return;
      }

      if (dataFromServer?.move) {
        handleOtherPlayerMove(dataFromServer.move);
        return;
      }

      if (dataFromServer?.otherPlayerDropped) {
        handleOtherPlayerDropped();
      }
    };

    // Find all cells.
    var cells = document.getElementsByClassName(Constants.CELL_CLASS);
    for (let cell of cells) {
      // Add onclick event handlers.
      cell.addEventListener('click', makeMove);
      cell.addEventListener('click', checkGame);
    }
  });

  return (
    <div>
      <GridWrapper />
    </div>
  );

}

function Cells(props) {
  return (
    <>
      {
        props.cells.map((cell) => (<div className={Constants.CELL_CLASS} key={cell.key} id={cell.id}></div>))
      }
    </>
  );
}

function Grid() {
  return (
    <div className={Constants.GRID_CLASS}>
      {
        <Rows />
      }
    </div>);
}

function GridWrapper() {
  return (
    <div className={Constants.GRIDWRAPPER_CLASS}>
      <Symbol src={XSVG} id={Constants.SVG + Constants.X} className={Constants.TURN_SIGNAL} />
      <Grid />
      <Symbol src={OSVG} id={Constants.SVG + Constants.O} className={Constants.TURN_SIGNAL} />
    </div>);
}

function Rows() {
  return (
    <>
      {
        Constants.ROW_OBJECTS.map((row) => (<div className={Constants.ROW_CLASS} key={row.key} id={row.id}><Cells cells={row.cells} /></div>))
      }
    </>
  );
}

function Symbol(props) {
  return (
    <>
      <ReactSVG src={props.src} id={props.id} className={props.className ?? ''} />
    </>
  );
}

export default App;
