/* eslint-disable comma-dangle */
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const axios = require('axios')
const { parseString } = require('xml2js')

const { updatePilots } = require('./socket')
const { handleParsedDrones } = require('./drones')

const port = process.env.PORT || 8080
const app = express()

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(express.static('build'))
app.use(cors())

const pilots = new Map()
const timeouts = new Map()

io.on('connection', (socket) => {
  console.log('a user connected')
  return updatePilots(socket, pilots)
})

setInterval(async () => {
  console.log('Fetching drones...')
  const drones = await axios
    .get('https://assignments.reaktor.com/birdnest/drones')
    .catch((err) => {
      console.error("Couldn't fetch drones: ", err)
    })

  // parse the fetched XML and handle it
  parseString(drones.data, (err, result) =>
    handleParsedDrones(err, result, pilots, timeouts, io)
  )
}, 10000)

server.listen(port)
console.log(`Listening on port ${port}`)
