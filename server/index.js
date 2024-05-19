const path = require('path');
const express = require('express');
const websocketServer = require('websocket').server;
const http = require('http');
const PORT = process.env.PORT || 3001;
const app = express();
const {O, X, BOTH} = require('../client/src/constants');

const server = http.createServer();
// Listen for websocket connections
server.listen(PORT);

console.log(`Listening on ${PORT}`);

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

server.on('request', app);

// Map of connected clients
const clients = {};

// Map of interconnected users
const users = {};

// Map of games. Games is an array of users, the first assigned X and the latter O.
const games = {};

const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(2);
  return s4() + '_' + s4() + '_' + s4();
};

const getAvailableGameID = () => {
  for (let key in games) {
    if (games[key].length === 1) {
      return key;
    }
  }
  const newGame = getUniqueID();
  games[newGame] = [];

  return newGame;
};

const interconnectUsersForGame = (game) => {
  // Establish reciprocal mapping
  users[game[0]] = game[1];
  users[game[1]] = game[0];
};

const sendAssignedSymbolsToUsers = (game) => {
  if (game[0] === game[1]) {
    // If same user on both, assign BOTH
    clients[game[0]].sendUTF(JSON.stringify({ assignedSymbol: BOTH }));
    return;
  }

  clients[game[0]].sendUTF(JSON.stringify({ assignedSymbol: X }));
  clients[game[1]].sendUTF(JSON.stringify({ assignedSymbol: O }));
};

const removeGameFromList = (gameID) => {
  delete games[gameID];
};

const processReadyGame = (gameID) => {
  const game = games[gameID];
  interconnectUsersForGame(game);
  sendAssignedSymbolsToUsers(game);
  removeGameFromList(gameID);
};

const setSelfPlayingGame = (gameID) => {
  const game = games[gameID];
  if (game?.length === 1) {
    game.push(game[0]);
    processReadyGame(gameID);
  }
};

const handleReadyForGameMessage = (userID) => {
  const gameID = getAvailableGameID();
  const game = games[gameID];
  game.push(userID);
  if (game.length == 1) {
    // If no other user connects within 15 seconds,
    // Make it a self-playing game.
    setTimeout(setSelfPlayingGame, 15000, gameID);
  } else {
    processReadyGame(gameID);
  }
};

const relayMove = (userID, move) => {
  const otherUserID = users[userID];
  clients[otherUserID].sendUTF(JSON.stringify(move));
};

const wsServer = new websocketServer({ httpServer: server });

wsServer.on('request', (request) => {
  var userID = getUniqueID();

  const connection = request.accept(null, request.origin);

  // Save connection
  clients[userID] = connection;

  // Handle messages from client
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const messageData = JSON.parse(message.utf8Data);

      if (messageData?.readyForGame) {
        handleReadyForGameMessage(userID);
        return;
      }

      if (messageData?.move) {
        relayMove(userID, messageData);
      }
    }
  });

  connection.on('close', () => {
    const otherUserID = users[userID];
    if (otherUserID && clients[otherUserID]) {
      clients[otherUserID].sendUTF(JSON.stringify({ otherPlayerDropped: true }));
      delete clients[userID];
      delete users[otherUserID];
      delete users[userID];
    }
  });

});
