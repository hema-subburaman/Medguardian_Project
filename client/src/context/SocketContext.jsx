import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected to MedGuardian real-time server:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setConnected(false);
    });

    newSocket.on('telemetry:new', (data) => {
      setLatestTelemetry(data);
    });

    newSocket.on('emergency:new', (emergency) => {
      console.log('🚨 [EMERGENCY ALERT RECEIVED]:', emergency);
      setEmergencies((prev) => [emergency, ...prev]);
      setUnresolvedCount((c) => c + 1);

      // Play subtle acoustic chime if permitted by browser
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    });

    newSocket.on('emergency:updated', (updated) => {
      setEmergencies((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );
      if (updated.status === 'resolved') {
        setUnresolvedCount((c) => Math.max(0, c - 1));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        latestTelemetry,
        emergencies,
        unresolvedCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
