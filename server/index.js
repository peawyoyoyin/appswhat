const Aedes = require('aedes')
const stats = require('aedes-stats')

const packetHandler = require('./packet-handler')
const config = require('./config')

const aedes = Aedes({
  mq: require('mqemitter-redis')(config.redis),
  persistence: require('aedes-persistence-redis')(config.redis),
  authorizePublish: authorizePublish,
})

aedes.on('client', function(client) {
  console.log(`[${new Date().toLocaleTimeString()}] client connect, ID: ${client.id}`)
})

aedes.on('clientDisconnect', function(client) {
  console.log(`[${new Date().toLocaleTimeString()}] client disconnect, ID: ${client.id}`)
})

const server = require('websocket-stream').createServer({port: config.websocketPort}, aedes.handle)

server.on('listening', function() {
  console.log(`listening on port ${config.websocketPort}`)
})

function authorizePublish(client, packet, callback) {
  try {
    packetHandler.handle(client, packet, function(newPacket) {
      Object.keys(newPacket).forEach(function(key) {
        packet[key] = newPacket[key]
      })
      callback(null)
    })
  } catch(error) {
    callback(error)
  }
}

stats(aedes)
