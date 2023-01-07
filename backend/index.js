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

const ORIGIN = { x: 250000, y: 250000 }
const RADIUS = 100000

const distance = (x, y) => Math.sqrt((x - ORIGIN.x) ** 2 + (y - ORIGIN.y) ** 2)

const pilots = new Map()
const timeouts = new Map()

const updatePilots = (socket) =>
  socket.emit('pilots', Array.from(pilots.values()))

setInterval(() => {
  console.log('Fetching drones...')
  axios
    .get('https://assignments.reaktor.com/birdnest/drones')
    .then((dronesRes) => {
      parseString(dronesRes.data, (err, result) => {
        result.report.capture[0].drone.forEach((drone) => {
          const serial = drone.serialNumber[0]
          const dist = distance(drone.positionX[0], drone.positionY[0])

          // Check if drone is in NDZ
          // if so fetch pilot data if not already fetched
          // and update minimum distance and last violation time to map
          // and update timout so that the pilot info is deleted after 10 minutes
          if (dist < RADIUS) {
            if (pilots.has(serial)) {
              // pilot data is already fetched
              clearTimeout(timeouts.get(serial))
              // update minimum distance and last violation time
              const prev = pilots.get(serial)
              pilots.set(serial, {
                ...prev,
                minimumDistance: Math.min(prev.minimumDistance, dist),
                lastViolation: new Date(),
              })
            } else {
              // fetch pilot data
              axios
                .get(
                  `https://assignments.reaktor.com/birdnest/pilots/${serial}`
                )
                .then((pilotRes) => {
                  pilots.set(serial, {
                    pilot: pilotRes.data,
                    minimumDistance: dist,
                    lastViolation: new Date(),
                  })
                  // emit pilots to all sockets
                  updatePilots(io)
                })
                .catch((pilotErr) => {
                  console.error("Couldn't fetch pilot: ", pilotErr)
                })
            }

            // set timeout to delete pilot data after 10 minutes
            timeouts.set(
              serial,
              setTimeout(() => {
                pilots.delete(serial)
                timeouts.delete(serial)
                updatePilots(io)
              }, 1000 * 60 * 10)
            )
          }
        })
      })
    })
    .catch((err) => {
      console.error("Couldn't fetch drones: ", err)
    })
}, 10000)

io.on('connection', (socket) => {
  console.log('socket', socket.id, ' connected')
  updatePilots(socket)
})

server.listen(port)
console.log(`Listening on port ${port}`)
