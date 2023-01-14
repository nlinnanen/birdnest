import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const ENV = process.env.NODE_ENV

const socket = io(ENV === 'development' ? 'http://localhost:8080' : undefined)

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
  console.log(pilots)
  return (
    <table style={{width: "100%"}}>
      <thead>
          <th>name </th>
          <th>id</th>
          <th>phone</th>
          <th>email</th>
          <th>Minimum distance (m)</th>
      </thead>
      <tbody>
        {pilots?.map(({ pilot, minimumDistance, lastViolation }) => (
          <tr key={pilot.pilotId}>
            <td>
              {pilot.firstName} {pilot.lastName}
            </td>
            <td> {pilot.pilotId}</td>
            <td> {pilot.phoneNumber}</td>
            <td> {pilot.email}</td>
            <td>{(minimumDistance / 1000).toFixed(0)} </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default App
