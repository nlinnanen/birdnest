/* eslint-disable comma-dangle */
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const axios = require('axios')

const port = process.env.PORT || 3001
const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('build'))
app.use(cors())

const { parseString } = require('xml2js')
const { updatePilots } = require('./socket')
const { handleParsedDrones } = require('./drones')

const pilots = new Map()
const timeouts = new Map()

setInterval(async () => {
  console.log('Fetching drones...')
  const drones = await axios
    .get('https://assignments.reaktor.com/birdnest/drones')
    .catch((err) => {
      console.error("Couldn't fetch drones: ", err)
    })

  // parse the fetched XML and handle it
  parseString(drones, (err, result) => handleParsedDrones(err, result, pilots, timeouts, io), 10000)
})

io.on('connection', (socket) => updatePilots(socket, pilots))

server.listen(port)
console.log(`Listening on port ${port}`)
