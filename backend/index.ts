const options = {
  cors: {
    origin: '*',
    allowedHeaders: '',
  },
}
const io = require('socket.io')(options)

io.on('connection', (socket) => {
  socket.on('ping', () => {
    io.emit('pong')
  })
})

io.listen(8080)
