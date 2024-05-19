import React from "react";
import * as Constants from "./constants";
import "./App.css";
import OSVG from "./svgs/o.svg";
import XSVG from "./svgs/x.svg";
import { ReactSVG } from "react-svg";
import { w3cwebsocket as W3CWebSocket } from "websocket";

function App() {
  const WS_HOST = window.location.origin.replace(/^http/, 'ws').replace(':3000', ':3001');
  const client = new W3CWebSocket(WS_HOST);
  const [data, setData] = React.useState({ turnPlayerX: true, filledCellCount: 0, gameOver: false });

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

  function checkGame() {
    if (data.gameOver) {
      return;
    }

    let winningCells = getWinningCells();

    // There is a winner
    if (winningCells[0]) {
      for (let cell of winningCells) {
        let cellID = cell + Constants.SVG;
        document.getElementById(cellID).classList.add(Constants.SPINNING_SVG);
      }
      data.gameOver = true;
    }
    else if (data.filledCellCount === Constants.CELL_TOTAL) {
      let visibleSVGs = document.getElementsByClassName(Constants.DISPLAY_BLOCK);
      for (let visibleSVG of visibleSVGs) {
        visibleSVG.classList.add(Constants.SPINNING_SVG);
      }
      data.gameOver = true;
    }

    if (data.gameOver) {
      // Update turn signal.
      document.getElementById(Constants.SVG + Constants.X).classList.remove(Constants.CURRENT_TURN);
      document.getElementById(Constants.SVG + Constants.O).classList.remove(Constants.CURRENT_TURN);
      document.getElementById(Constants.SVG + Constants.X).classList.remove(Constants.WAITING);
      document.getElementById(Constants.SVG + Constants.O).classList.remove(Constants.WAITING);
    }

    setData(data);

    return true;
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
      // Fill in the cell with the appropriate symbol.
      let currentCellSVGGrandParent = document.getElementById(event.currentTarget.id + currentPlayer);
      let currentCellSVG = currentCellSVGGrandParent.firstChild.firstChild;
      // Make symbol visible
      currentCellSVGGrandParent.classList.remove(Constants.DISPLAY_NONE);
      // Add id for easy targeting after game is over.
      currentCellSVG.id = event.currentTarget.id + Constants.SVG;
      // Save what symbol is in the cell.
      data[event.currentTarget.id] = currentPlayer;
      // Increase count of filled cells.
      ++data.filledCellCount;
      // Save data.
      setData(data);

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
    var cells = document.getElementsByClassName("Cell");
    for (let cell of cells) {
      // Add onclick event handlers.
      cell.addEventListener('click', makeMove);
      cell.addEventListener('click', checkGame);
    }
  });

  return (
    <div className="App">
      <div className="GridWrapper">
        <ReactSVG src={XSVG} id={Constants.SVG + Constants.X} className={Constants.TURN_SIGNAL} />
        <div className="Grid">
          <div className="Row" id="row1">
            <div className="Cell" id={Constants.CELL1}>
              <ReactSVG src={OSVG} id={Constants.CELL1 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL1 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL2}>
              <ReactSVG src={OSVG} id={Constants.CELL2 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL2 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL3}>
              <ReactSVG src={OSVG} id={Constants.CELL3 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL3 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
          </div>
          <div className="Row" id="row2">
            <div className="Cell" id={Constants.CELL4}>
              <ReactSVG src={OSVG} id={Constants.CELL4 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL4 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL5}>
              <ReactSVG src={OSVG} id={Constants.CELL5 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL5 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL6}>
              <ReactSVG src={OSVG} id={Constants.CELL6 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL6 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
          </div>
          <div className="Row" id="row3">
            <div className="Cell" id={Constants.CELL7}>
              <ReactSVG src={OSVG} id={Constants.CELL7 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL7 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL8}>
              <ReactSVG src={OSVG} id={Constants.CELL8 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL8 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
            <div className="Cell" id={Constants.CELL9}>
              <ReactSVG src={OSVG} id={Constants.CELL9 + Constants.O} className={Constants.DISPLAY_NONE} />
              <ReactSVG src={XSVG} id={Constants.CELL9 + Constants.X} className={Constants.DISPLAY_NONE} />
            </div>
          </div>
        </div>
        <ReactSVG src={OSVG} id={Constants.SVG + Constants.O} className={Constants.TURN_SIGNAL} />
      </div>
    </div>
  );

}

export default App;
