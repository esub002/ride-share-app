/**
 * Advanced Real-Time Communication Service
 * Provides voice calls, video calls, and enhanced messaging features
 */

const { EventEmitter } = require('events');
const { logEvent } = require('../utils/log');
const { secureQuery } = require('../middleware/database');

class CommunicationService extends EventEmitter {
  constructor(socketService) {
    super();
    this.socketService = socketService;
    this.activeCalls = new Map(); // callId -> call info
    this.voiceRooms = new Map(); // roomId -> room info
    this.messageQueues = new Map(); // userId -> message queue
    this.typingIndicators = new Map(); // roomId -> typing users
    this.callTimeout = 30000; // 30 seconds
    this.initialize();
  }

  async initialize() {
    console.log('💬 Initializing Communication Service...');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
    
    console.log('✅ Communication Service initialized');
  }

  setupEventListeners() {
    // Voice call events
    this.socketService.on('call:initiate', (data) => {
      this.handleCallInitiate(data);
    });

    this.socketService.on('call:accept', (data) => {
      this.handleCallAccept(data);
    });

    this.socketService.on('call:reject', (data) => {
      this.handleCallReject(data);
    });

    this.socketService.on('call:end', (data) => {
      this.handleCallEnd(data);
    });

    // Voice room events
    this.socketService.on('voice:join', (data) => {
      this.handleVoiceJoin(data);
    });

    this.socketService.on('voice:leave', (data) => {
      this.handleVoiceLeave(data);
    });

    // Messaging events
    this.socketService.on('message:send', (data) => {
      this.handleMessageSend(data);
    });

    this.socketService.on('typing:start', (data) => {
      this.handleTypingStart(data);
    });

    this.socketService.on('typing:stop', (data) => {
      this.handleTypingStop(data);
    });
  }

  // Voice Call Management
  async handleCallInitiate(data) {
    const { callerId, receiverId, callType = 'voice', rideId } = data;
    
    try {
      const callId = this.generateCallId();
      const call = {
        id: callId,
        callerId,
        receiverId,
        callType,
        rideId,
        status: 'ringing',
        startTime: new Date().toISOString(),
        participants: [callerId],
        metadata: {
          rideId,
          callType
        }
      };

      this.activeCalls.set(callId, call);

      // Send call notification to receiver
      this.socketService.sendToUser(receiverId, 'call:incoming', {
        callId,
        callerId,
        callType,
        rideId
      });

      // Set call timeout
      setTimeout(() => {
        this.handleCallTimeout(callId);
      }, this.callTimeout);

      // Log call initiation
      await this.logCallEvent(callId, 'initiated', { callerId, receiverId });

      console.log(`📞 Call initiated: ${callId} (${callerId} -> ${receiverId})`);

    } catch (error) {
      console.error('Error handling call initiation:', error);
    }
  }

  async handleCallAccept(data) {
    const { callId, receiverId } = data;
    const call = this.activeCalls.get(callId);

    if (!call) {
      console.error(`Call not found: ${callId}`);
      return;
    }

    try {
      call.status = 'active';
      call.answerTime = new Date().toISOString();
      call.participants.push(receiverId);

      // Create voice room for the call
      const roomId = `call:${callId}`;
      const voiceRoom = {
        id: roomId,
        callId,
        participants: call.participants,
        startTime: new Date().toISOString(),
        type: call.callType
      };

      this.voiceRooms.set(roomId, voiceRoom);

      // Notify all participants
      call.participants.forEach(participantId => {
        this.socketService.sendToUser(participantId, 'call:accepted', {
          callId,
          roomId,
          participants: call.participants
        });
      });

      // Log call acceptance
      await this.logCallEvent(callId, 'accepted', { receiverId });

      console.log(`📞 Call accepted: ${callId}`);

    } catch (error) {
      console.error('Error handling call acceptance:', error);
    }
  }

  async handleCallReject(data) {
    const { callId, receiverId, reason } = data;
    const call = this.activeCalls.get(callId);

    if (!call) {
      console.error(`Call not found: ${callId}`);
      return;
    }

    try {
      call.status = 'rejected';
      call.endTime = new Date().toISOString();
      call.rejectionReason = reason;

      // Notify caller
      this.socketService.sendToUser(call.callerId, 'call:rejected', {
        callId,
        reason
      });

      // Remove call from active calls
      this.activeCalls.delete(callId);

      // Log call rejection
      await this.logCallEvent(callId, 'rejected', { receiverId, reason });

      console.log(`📞 Call rejected: ${callId} (${reason})`);

    } catch (error) {
      console.error('Error handling call rejection:', error);
    }
  }

  async handleCallEnd(data) {
    const { callId, userId } = data;
    const call = this.activeCalls.get(callId);

    if (!call) {
      console.error(`Call not found: ${callId}`);
      return;
    }

    try {
      call.status = 'ended';
      call.endTime = new Date().toISOString();
      call.endedBy = userId;

      // Calculate call duration
      const duration = new Date(call.endTime) - new Date(call.startTime);
      call.duration = Math.round(duration / 1000); // seconds

      // Remove voice room
      const roomId = `call:${callId}`;
      this.voiceRooms.delete(roomId);

      // Notify all participants
      call.participants.forEach(participantId => {
        this.socketService.sendToUser(participantId, 'call:ended', {
          callId,
          duration: call.duration,
          endedBy: userId
        });
      });

      // Store call record
      await this.storeCallRecord(call);

      // Remove call from active calls
      this.activeCalls.delete(callId);

      // Log call end
      await this.logCallEvent(callId, 'ended', { userId, duration: call.duration });

      console.log(`📞 Call ended: ${callId} (duration: ${call.duration}s)`);

    } catch (error) {
      console.error('Error handling call end:', error);
    }
  }

  handleCallTimeout(callId) {
    const call = this.activeCalls.get(callId);
    if (call && call.status === 'ringing') {
      this.handleCallReject({
        callId,
        receiverId: call.receiverId,
        reason: 'timeout'
      });
    }
  }

  // Voice Room Management
  handleVoiceJoin(data) {
    const { roomId, userId } = data;
    const room = this.voiceRooms.get(roomId);

    if (!room) {
      console.error(`Voice room not found: ${roomId}`);
      return;
    }

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
    }

    // Notify other participants
    room.participants.forEach(participantId => {
      if (participantId !== userId) {
        this.socketService.sendToUser(participantId, 'voice:user_joined', {
          roomId,
          userId
        });
      }
    });

    console.log(`🎤 User joined voice room: ${userId} -> ${roomId}`);
  }

  handleVoiceLeave(data) {
    const { roomId, userId } = data;
    const room = this.voiceRooms.get(roomId);

    if (!room) {
      console.error(`Voice room not found: ${roomId}`);
      return;
    }

    room.participants = room.participants.filter(id => id !== userId);

    // Notify other participants
    room.participants.forEach(participantId => {
      this.socketService.sendToUser(participantId, 'voice:user_left', {
        roomId,
        userId
      });
    });

    // If room is empty, end the call
    if (room.participants.length === 0) {
      this.handleCallEnd({
        callId: room.callId,
        userId: 'system'
      });
    }

    console.log(`🎤 User left voice room: ${userId} -> ${roomId}`);
  }

  // Messaging Management
  async handleMessageSend(data) {
    const { senderId, receiverId, message, messageType = 'text', rideId, metadata = {} } = data;

    try {
      const messageId = this.generateMessageId();
      const messageData = {
        id: messageId,
        senderId,
        receiverId,
        message,
        messageType,
        rideId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        metadata
      };

      // Store message in database
      await this.storeMessage(messageData);

      // Send to receiver if online
      this.socketService.sendToUser(receiverId, 'message:received', messageData);

      // Send delivery confirmation to sender
      this.socketService.sendToUser(senderId, 'message:delivered', {
        messageId,
        timestamp: new Date().toISOString()
      });

      // Emit message event
      this.emit('message:sent', messageData);

      console.log(`💬 Message sent: ${senderId} -> ${receiverId}`);

    } catch (error) {
      console.error('Error handling message send:', error);
    }
  }

  handleTypingStart(data) {
    const { senderId, receiverId, rideId } = data;
    const roomId = this.getRoomId(senderId, receiverId, rideId);

    if (!this.typingIndicators.has(roomId)) {
      this.typingIndicators.set(roomId, new Set());
    }

    this.typingIndicators.get(roomId).add(senderId);

    // Send typing indicator to receiver
    this.socketService.sendToUser(receiverId, 'typing:started', {
      senderId,
      rideId
    });

    // Clear typing indicator after 5 seconds
    setTimeout(() => {
      this.handleTypingStop(data);
    }, 5000);
  }

  handleTypingStop(data) {
    const { senderId, receiverId, rideId } = data;
    const roomId = this.getRoomId(senderId, receiverId, rideId);

    if (this.typingIndicators.has(roomId)) {
      this.typingIndicators.get(roomId).delete(senderId);
    }

    // Send typing stopped indicator to receiver
    this.socketService.sendToUser(receiverId, 'typing:stopped', {
      senderId,
      rideId
    });
  }

  // Utility methods
  generateCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRoomId(user1, user2, rideId) {
    return rideId ? `ride:${rideId}` : `chat:${[user1, user2].sort().join(':')}`;
  }

  // Database operations
  async storeMessage(messageData) {
    try {
      await secureQuery(
        `INSERT INTO messages 
         (id, sender_id, receiver_id, message, message_type, ride_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          messageData.id,
          messageData.senderId,
          messageData.receiverId,
          messageData.message,
          messageData.messageType,
          messageData.rideId,
          JSON.stringify(messageData.metadata),
          messageData.timestamp
        ]
      );
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  async storeCallRecord(call) {
    try {
      await secureQuery(
        `INSERT INTO call_records 
         (call_id, caller_id, receiver_id, call_type, ride_id, status, start_time, end_time, duration, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          call.id,
          call.callerId,
          call.receiverId,
          call.callType,
          call.rideId,
          call.status,
          call.startTime,
          call.endTime,
          call.duration,
          JSON.stringify(call.metadata)
        ]
      );
    } catch (error) {
      console.error('Error storing call record:', error);
    }
  }

  async logCallEvent(callId, event, metadata) {
    try {
      await logEvent('call_event', {
        callId,
        event,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging call event:', error);
    }
  }

  // Message queue management
  async queueMessage(userId, message) {
    if (!this.messageQueues.has(userId)) {
      this.messageQueues.set(userId, []);
    }

    this.messageQueues.get(userId).push(message);
  }

  async processMessageQueue(userId) {
    const queue = this.messageQueues.get(userId);
    if (!queue || queue.length === 0) {
      return;
    }

    const messages = [...queue];
    this.messageQueues.set(userId, []);

    for (const message of messages) {
      try {
        await this.handleMessageSend(message);
      } catch (error) {
        console.error('Error processing queued message:', error);
        // Re-queue failed messages
        this.queueMessage(userId, message);
      }
    }
  }

  // Periodic cleanup
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpiredCalls();
      this.cleanupTypingIndicators();
    }, 60000); // Every minute
  }

  cleanupExpiredCalls() {
    const now = Date.now();
    for (const [callId, call] of this.activeCalls) {
      const callAge = now - new Date(call.startTime).getTime();
      if (callAge > this.callTimeout && call.status === 'ringing') {
        this.handleCallTimeout(callId);
      }
    }
  }

  cleanupTypingIndicators() {
    // Clean up typing indicators that are older than 10 seconds
    const now = Date.now();
    for (const [roomId, typingUsers] of this.typingIndicators) {
      // This is a simplified cleanup - in a real implementation,
      // you'd track when each user started typing
      if (typingUsers.size === 0) {
        this.typingIndicators.delete(roomId);
      }
    }
  }

  // Public methods
  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  getVoiceRooms() {
    return Array.from(this.voiceRooms.values());
  }

  getCall(callId) {
    return this.activeCalls.get(callId);
  }

  getVoiceRoom(roomId) {
    return this.voiceRooms.get(roomId);
  }

  // Cleanup
  cleanup() {
    // End all active calls
    for (const [callId, call] of this.activeCalls) {
      this.handleCallEnd({
        callId,
        userId: 'system'
      });
    }

    // Clear all data structures
    this.activeCalls.clear();
    this.voiceRooms.clear();
    this.messageQueues.clear();
    this.typingIndicators.clear();
  }
}

module.exports = CommunicationService; 