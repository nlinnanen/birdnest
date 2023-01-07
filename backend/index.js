/* eslint-disable comma-dangle */
const options = {
  cors: {
    origin: '*',
    allowedHeaders: '',
  },
}

const io = require('socket.io')(options)
const axios = require('axios')
const { parseString } = require('xml2js')

const ORIGIN = { x: 250000, y: 250000 }
const RADIUS = 100000

const distance = (x, y) => Math.sqrt((x - ORIGIN.x) ** 2 + (y - ORIGIN.y) ** 2)

const pilots = new Map()
const timeouts = new Map()

setInterval(() => {
  console.log('Fetching drones...')
  axios
    .get('https://assignments.reaktor.com/birdnest/drones')
    .then((dronesRes) => {
      parseString(dronesRes.data, (err, result) => {
        result.report.capture[0].drone.forEach((drone) => {
          const serial = drone.serialNumber[0]
          const dist = distance(drone.positionX[0], drone.positionY[0])

          if (dist < RADIUS) {
            console.log('Drone in NDZ: ', serial)
            if (pilots.has(serial)) {
              clearTimeout(timeouts.get(serial))
              const prev = pilots.get(serial)
              pilots.set(serial, {
                ...prev,
                minimumDistance: Math.min(prev.minimumDistance, dist),
                lastViolation: new Date(),
              })
            } else {
              axios
                .get(
                  `https://assignments.reaktor.com/birdnest/pilots/${serial}`
                )
                .then((pilotRes) => {
                  console.log(
                    `Pilot for drone ${serial} fetched: `,
                    pilotRes.data
                  )
                  pilots.set(serial, {
                    pilot: pilotRes.data,
                    minimumDistance: dist,
                    lastViolation: new Date(),
                  })
                  io.emit('pilots', Array.from(pilots.values()))
                })
                .catch((pilotErr) => {
                  console.error("Couldn't fetch pilot: ", pilotErr)
                })
            }

            timeouts.set(
              serial,
              setTimeout(() => {
                console.log('deleting ', serial)
                pilots.delete(serial)
                timeouts.delete(serial)
                io.emit('pilots', Array.from(pilots.values()))
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
  socket.emit('pilots', Array.from(pilots.values()))
})

io.listen(8080)
