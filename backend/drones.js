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
      updatePilots(io, pilots)
    }, 1000 * 60 * 10)
  )
}

const updatePilotData = (serial, timeouts, pilots, dist) => {
  clearTimeout(timeouts.get(serial))
  // update minimum distance and last violation time
  const prev = pilots.get(serial)
  const minimumDistance = Math.min(prev.minimumDistance, dist)

  // if minimum distance didn't change return false so that pilots are not updated
  if (minimumDistance === prev.minimumDistance) return false

  pilots.set(serial, {
    ...prev,
    minimumDistance,
  })

  // changes were made so return true so that pilots are updated
  return true
}

const fetchAndUpdatePilotData = async (serial, pilots, dist) => {
  const pilot = await axios
    .get(`https://assignments.reaktor.com/birdnest/pilots/${serial}`)
    .catch((pilotErr) => {
      console.error("Couldn't fetch pilot: ", pilotErr)
    })

  pilots.set(serial, {
    pilot: pilot.data,
    minimumDistance: dist,
  })

  // changes were made so return true so that pilots are updated
  return true
}

// get drones from parsed XML
const dronesFromParsedXML = (result) => result.report.capture[0].drone

const handleParsedDrones = async (err, result, pilots, timeouts, io) => {
  if (err) {
    console.error('Error parsing XML: ', err)
    return
  }

  if (!result) {
    console.error('No result from XML parsing')
    return
  }

  let shouldUpdate = false
  // iterate over each drone in the parsed XML
  dronesFromParsedXML(result).forEach((drone) => {
    const serial = drone.serialNumber[0]
    const dist = distance(drone.positionX[0], drone.positionY[0])
    // Check if drone is in NDZ
    // if so fetch pilot data if not already fetched
    // and update minimum distance and timeouts so that pilot data will be deleted after 10 minutes
    if (dist < RADIUS) {
      console.log(`Drone ${serial} is in NDZ`)
      if (pilots.has(serial)) {
        shouldUpdate = updatePilotData(serial, timeouts, pilots, dist) || shouldUpdate 
      } else {
        shouldUpdate = fetchAndUpdatePilotData(serial, pilots, dist) || shouldUpdate
      }

      // set timeout to delete pilot data after 10 minutes
      removeAfterTen(serial, pilots, timeouts, io)
    }
  })
  // emit pilots to all sockets if any changes were made
  if (shouldUpdate) updatePilots(io, pilots)
}

module.exports = {
  handleParsedDrones,
}
