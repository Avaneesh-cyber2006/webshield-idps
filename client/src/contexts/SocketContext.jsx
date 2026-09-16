import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000'

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const joinAdminRoom = (token) => {
    if (socket) {
      socket.emit('join-admin', token)
      socket.on('joined-admin', (data) => {
        if (data.success) {
          console.log('Successfully joined admin room')
        }
      })
      socket.on('error', (error) => {
        console.error('Socket error:', error.message)
      })
    }
  }

  const leaveAdminRoom = () => {
    if (socket) {
      socket.emit('leave-admin')
    }
  }

  const value = {
    socket,
    connected,
    joinAdminRoom,
    leaveAdminRoom
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
