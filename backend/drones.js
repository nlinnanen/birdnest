/* eslint-disable comma-dangle */
const axios = require('axios')

const { updatePilots } = require('./socket')
const { ORIGIN, RADIUS } = require('./constants')

const distance = (x, y) => Math.sqrt((x - ORIGIN.x) ** 2 + (y - ORIGIN.y) ** 2)

const removeAfterTen = (serial, pilots, timeouts, io) => {
  timeouts.set(
    serial,
    setTimeout(() => {
      pilots.delete(serial)
      timeouts.delete(serial)
      updatePilots(io)
    }, 1000 * 60 * 10)
  )
}

const updatePilotData = (serial, timeouts, pilots, dist, io) => {
  clearTimeout(timeouts.get(serial))
  // update minimum distance and last violation time
  const prev = pilots.get(serial)
  const minimumDistance = Math.min(prev.minimumDistance, dist)

  if (minimumDistance === prev.minimumDistance) return

  pilots.set(serial, {
    ...prev,
    minimumDistance,
    lastViolation: new Date(),
  })
  updatePilots(io)
}

const fetchAndUpdatePilotData = async (serial, pilots, dist, io) => {
  const pilot = await axios
    .get(`https://assignments.reaktor.com/birdnest/pilots/${serial}`)
    .catch((pilotErr) => {
      console.error("Couldn't fetch pilot: ", pilotErr)
    })

  pilots.set(serial, {
    pilot: pilot.data,
    minimumDistance: dist,
    lastViolation: new Date(),
  })
  // emit pilots to all sockets
  updatePilots(io)
}

const dronesFromParsedXML = (result) => result.report.capture[0].drone

const handleParsedDrones = async (err, result, pilots, timeouts, io) => {
  dronesFromParsedXML(result).forEach((drone) => {
    const serial = drone.serialNumber[0]
    const dist = distance(drone.positionX[0], drone.positionY[0])

    // Check if drone is in NDZ
    // if so fetch pilot data if not already fetched
    // and update minimum distance and last violation time to map
    // and update timeout so that the pilot info is deleted after 10 minutes
    if (dist < RADIUS) {
      if (pilots.has(serial)) {
        updatePilotData(serial, pilots, dist, timeouts, io)
      } else {
        fetchAndUpdatePilotData(serial, pilots, dist, io)
      }

      // set timeout to delete pilot data after 10 minutes
      removeAfterTen(serial, pilots, timeouts, io)
    }
  })
}

module.exports = {
  handleParsedDrones,
}
