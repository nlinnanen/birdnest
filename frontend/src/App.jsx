import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:8080')

const App = () => {
  const [pilots, setPilots] = useState()

  useEffect(() => {
    socket.on('pilots', (data) => {
      console.log(data)
      setPilots(data)
    })

    return () => {
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
            <td>{new Date(lastViolation).toLocaleTimeString('fi-FI', {timeStyle: "short"})}</td>
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
