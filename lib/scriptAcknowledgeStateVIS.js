function acknowledgeState (stateID) {
   this.servConn._socket.emit('setState', "minuaru.0.stateIdToAcknowledge", stateID);
}