let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('join:patient', (patientId) => {
      socket.join(`patient:${patientId}`);
      console.log(`[WebSocket] Socket ${socket.id} joined patient room: ${patientId}`);
    });

    socket.on('leave:patient', (patientId) => {
      socket.leave(`patient:${patientId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
};

export const broadcastTelemetry = (data) => {
  if (!ioInstance) return;
  ioInstance.emit('telemetry:new', data);
  if (data.patientId) {
    ioInstance.to(`patient:${data.patientId}`).emit('telemetry:patient', data);
  }
};

export const broadcastEmergency = (emergency) => {
  if (!ioInstance) return;
  ioInstance.emit('emergency:new', emergency);
};

export const broadcastEmergencyUpdate = (emergency) => {
  if (!ioInstance) return;
  ioInstance.emit('emergency:updated', emergency);
};

export const broadcastDeviceStatus = (deviceStatus) => {
  if (!ioInstance) return;
  ioInstance.emit('device:status', deviceStatus);
};

export const broadcastPatientUpdate = (patient) => {
  if (!ioInstance) return;
  ioInstance.emit('patient:updated', patient);
};
