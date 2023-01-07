import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:8080')

const App = () => {
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [pilots, setPilots] = useState()

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('pilots', (data) => {
      console.log(data)
      setPilots(data)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('pilots')
    }
  }, [])
  return (
    <table>
      <thead>
        <tr>
          <td>name </td>
          <td>id</td>
          <td>Minimum distance (m)</td>
          <td>Last violation</td>
        </tr>
      </thead>
      <tbody>
        {pilots?.map(({ pilot, minimumDistance, lastViolation }) => (
          <tr key={pilot.pilotId}>
            <td>
              {pilot.firstName} {pilot.lastName}
            </td>
            <td> {pilot.pilotId}</td>
            <td>{(minimumDistance / 1000).toFixed(0)} </td>
            <td>{lastViolation.toLocaleString()}</td>
            <br />
            <br />
            <br />
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default App
