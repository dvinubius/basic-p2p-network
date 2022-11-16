# Draft for a p2p network client

FloodSub-based approach to a p2p network.

> Based on freecodecamp's [web3 curriculum](https://web3.freecodecamp.org/web3)

# Setup

- Develop the client in `/node-1`
- node-1 can be cloned, generating `/node-x` directories
- each cloned node has the same setup except for it's MY_PORT in the `/node-x/.env` file


# Start the Network

`node clone-node.js`

`node clone-node.js`

New Terminal 1

`cd node-1`
`node index.js`

New Terminal 2

`cd node-2`
`node index.js`

New Terminal 3

`cd node-3`
`node index.js`

# Reset the network

- Kill existing processes
- In project root, run `node delete-nodes.js`
