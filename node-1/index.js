import { getTransactions, writeTransactions } from './blockchain-helpers.js';
import { getKnownPeerAddresses } from './network-helpers.js';

import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const knownPeers = getKnownPeerAddresses();
const MY_PORT = process.env.PORT;
const MY_ADDRESS = `ws://localhost:${MY_PORT}`;
const transactions = getTransactions();
const openedSockets = [];
const connectedAddresses = [];
const attemptingToConnectAddresses = [];

const myServer = new WebSocketServer({ port: MY_PORT })

myServer.on('listening', () => {
  knownPeers.forEach(peer => {
    if (peer !== MY_ADDRESS) connect(peer);
  })
})

myServer.on('connection', (ws) => {
  console.log(`Got connection from peer`);

  ws.on('message', dataString => {
    handleMessage(ws, dataString);
  })
})

function handleMessage(ws, dataString) {
  const message = JSON.parse(dataString);
  const peer = message.data[message.data.length - 1];
  console.log(`HANDSHAKE from peer ${peer} : ${dataString}`);

  const nodesKnownToPeer = new Set(message.data);
  const nodesKnownToMe = new Set([...connectedAddresses, MY_ADDRESS]);

  nodesKnownToPeer.forEach(otherPeer => {
    if (!nodesKnownToMe.has(otherPeer)
      && !attemptingToConnectAddresses.includes(otherPeer)
      && !connectedAddresses.includes(otherPeer)
    ) {
      console.log(`Connecting back to ${otherPeer}`);
      connect(otherPeer);
    }
  });
}

setInterval(() => {
  console.log('connected: ', connectedAddresses);
  console.log('attempting: ', attemptingToConnectAddresses);
}, 5000);

function handshake(socket) {
  socket.send(
    JSON.stringify(
      {
        type: 'HANDSHAKE',
        data: [...connectedAddresses, MY_ADDRESS]
      }
    )
  );
}

function connect(peer) {
  console.log(`Connecting to peer ${peer}`);
  attemptingToConnectAddresses.push(peer);
  const ws = new WebSocket(peer);
  openedSockets.push(ws);
  const removeSocket = () => {
    const socketIdx = openedSockets.indexOf(ws);
    if (socketIdx !== -1) {
      openedSockets.splice(socketIdx, 1);
    }
  }

  ws.on('open', () => {
    const peerIdx = attemptingToConnectAddresses.indexOf(peer);
    const isInAttempt = peerIdx !== -1;
    if (!isInAttempt) {
      console.error(`Unexpected connection "open" event with peer ${peer}`);
      return;
    }
    attemptingToConnectAddresses.splice(peerIdx, 1);
    connectedAddresses.push(peer);
    console.log(`Connected to peer ${peer}. Sending HANDSHAKE...`);
    handshake(ws);
  });

  ws.on('close', () => {
    const peerIdxConn = connectedAddresses.indexOf(peer);
    const peerIdxAtt = attemptingToConnectAddresses.indexOf(peer);

    const isInAttempt = peerIdxAtt !== -1;
    const isConnected = peerIdxConn !== -1;

    if (isInAttempt) {
      console.log(`Could not connect to peer ${peer}`);
      attemptingToConnectAddresses.splice(peerIdxAtt, 1);
      removeSocket();
      return;
    } else if (isConnected) {
      connectedAddresses.splice(peerIdxConn, 1);
      console.log(`Connection closed by ${peer}`);
      removeSocket();
      return;
    } else {
      console.error(`Unrecognized peer ${peer} closed connection`);
      removeSocket();
      return;
    }
  });

  ws.on('message', dataString => {
    handleMessage(ws, dataString);
  })

  ws.on('error', () => {
    console.log(`Network: Error connecting to ${peer}`);
    removeSocket();
  });
}