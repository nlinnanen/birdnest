const updatePilots = (socket, pilots) =>
  socket.emit('pilots', Array.from(pilots.values()))

module.exports = {
  updatePilots,
}
