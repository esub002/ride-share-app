import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';

// Import our enhanced services
import enhancedRealTimeManager from '../utils/enhancedRealTimeManager';
import apiService from '../utils/api';

const { width, height } = Dimensions.get('window');

const AdvancedMessaging = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [messageStatus, setMessageStatus] = useState(new Map());
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Animation refs
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const messageAnimation = useRef(new Animated.Value(0)).current;

  // Refs for cleanup
  const typingTimeout = useRef(null);
  const scrollViewRef = useRef(null);
  const messageInputRef = useRef(null);

  // Initialize messaging system
  useEffect(() => {
    initializeMessaging();
    setupEventListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  // Filter conversations when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.participant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  // Initialize messaging system
  const initializeMessaging = async () => {
    try {
      // Connect to real-time manager
      await enhancedRealTimeManager.connect();
      
      // Load conversations
      await loadConversations();
      
      console.log('💬 Advanced messaging initialized');
    } catch (error) {
      console.error('💬 Failed to initialize messaging:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    // New message received
    enhancedRealTimeManager.on('message:received', (messageData) => {
      handleMessageReceived(messageData);
    });

    // Message sent
    enhancedRealTimeManager.on('message:sent', (messageData) => {
      handleMessageSent(messageData);
    });

    // Message delivered
    enhancedRealTimeManager.on('message:delivered', (messageData) => {
      handleMessageDelivered(messageData);
    });

    // Message read
    enhancedRealTimeManager.on('message:read', (messageData) => {
      handleMessageRead(messageData);
    });

    // Typing started
    enhancedRealTimeManager.on('typing:started', (data) => {
      handleTypingStarted(data);
    });

    // Typing stopped
    enhancedRealTimeManager.on('typing:stopped', (data) => {
      handleTypingStopped(data);
    });

    // New conversation
    enhancedRealTimeManager.on('conversation:new', (conversationData) => {
      handleNewConversation(conversationData);
    });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const conversationsData = await apiService.getConversations();
      setConversations(conversationsData);
      setFilteredConversations(conversationsData);
    } catch (error) {
      console.error('💬 Error loading conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const messagesData = await apiService.getMessages(conversationId);
      setMessages(messagesData);
      
      // Mark messages as read
      await markMessagesAsRead(conversationId);
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('💬 Error loading messages:', error);
    }
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
    
    // Clear unread count
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(conversation.id, 0);
      return newMap;
    });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!currentConversation) return;

    try {
      const messageData = {
        conversationId: currentConversation.id,
        content: newMessage.trim(),
        attachments: attachments,
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      // Add message to local state immediately
      const tempMessage = {
        ...messageData,
        id: `temp_${Date.now()}`,
        status: 'sending',
        isOwn: true,
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setAttachments([]);

      // Send to server
      const sentMessage = await enhancedRealTimeManager.sendMessage(
        currentConversation.id,
        messageData.content,
        attachments
      );

      // Update message with server response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? { ...sentMessage, isOwn: true } : msg
        )
      );

      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Scroll to bottom
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

    } catch (error) {
      console.error('💬 Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Handle message received
  const handleMessageReceived = (messageData) => {
    if (currentConversation && messageData.conversationId === currentConversation.id) {
      setMessages(prev => [...prev, { ...messageData, isOwn: false }]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }

    // Update unread count
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(messageData.conversationId) || 0;
      newMap.set(messageData.conversationId, currentCount + 1);
      return newMap;
    });

    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Handle message sent
  const handleMessageSent = (messageData) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'sent' } : msg
      )
    );
  };

  // Handle message delivered
  const handleMessageDelivered = (messageData) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'delivered' } : msg
      )
    );
  };

  // Handle message read
  const handleMessageRead = (messageData) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'read' } : msg
      )
    );
  };

  // Handle typing started
  const handleTypingStarted = (data) => {
    if (currentConversation && data.conversationId === currentConversation.id) {
      setTypingUsers(prev => new Set([...prev, data.userId]));
      startTypingAnimation();
    }
  };

  // Handle typing stopped
  const handleTypingStopped = (data) => {
    if (currentConversation && data.conversationId === currentConversation.id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      stopTypingAnimation();
    }
  };

  // Handle new conversation
  const handleNewConversation = (conversationData) => {
    setConversations(prev => [conversationData, ...prev]);
  };

  // Start typing indicator
  const startTyping = () => {
    if (!currentConversation) return;

    setIsTyping(true);
    enhancedRealTimeManager.startTyping(currentConversation.id);

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set timeout to stop typing
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  // Stop typing indicator
  const stopTyping = () => {
    if (!currentConversation) return;

    setIsTyping(false);
    enhancedRealTimeManager.stopTyping(currentConversation.id);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  };

  // Start typing animation
  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop typing animation
  const stopTypingAnimation = () => {
    typingAnimation.setValue(0);
  };

  // Mark messages as read
  const markMessagesAsRead = async (conversationId) => {
    try {
      await apiService.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('💬 Error marking messages as read:', error);
    }
  };

  // Pick image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const attachment = {
          type: 'image',
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
        };
        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('💬 Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const attachment = {
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          size: result.assets[0].size,
        };
        setAttachments(prev => [...prev, attachment]);
      }
    } catch (error) {
      console.error('💬 Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Share location
  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Please enable location access to share your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const attachment = {
        type: 'location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: 'Current Location',
      };

      setAttachments(prev => [...prev, attachment]);
    } catch (error) {
      console.error('💬 Error sharing location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle attachments panel
  const toggleAttachments = () => {
    setShowAttachments(!showAttachments);
    Animated.timing(slideAnimation, {
      toValue: showAttachments ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Get message status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time" size={12} color="#999" />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="#999" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color="#999" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color="#007AFF" />;
      default:
        return null;
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Cleanup
  const cleanup = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    enhancedRealTimeManager.off('message:received');
    enhancedRealTimeManager.off('message:sent');
    enhancedRealTimeManager.off('message:delivered');
    enhancedRealTimeManager.off('message:read');
    enhancedRealTimeManager.off('typing:started');
    enhancedRealTimeManager.off('typing:stopped');
    enhancedRealTimeManager.off('conversation:new');
  };

  // Render conversation list
  const renderConversationList = () => (
    <View style={styles.conversationList}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredConversations.map(conversation => (
          <TouchableOpacity
            key={conversation.id}
            style={[
              styles.conversationItem,
              currentConversation?.id === conversation.id && styles.selectedConversation
            ]}
            onPress={() => selectConversation(conversation)}
          >
            <View style={styles.conversationAvatar}>
              <Ionicons name="person" size={24} color="#007AFF" />
            </View>
            
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.participant}</Text>
                <Text style={styles.conversationTime}>
                  {formatMessageTime(conversation.lastMessageTime)}
                </Text>
              </View>
              
              <Text style={styles.conversationLastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            </View>

            {unreadCounts.get(conversation.id) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCounts.get(conversation.id)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render message
  const renderMessage = (message) => (
    <Animated.View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isOwn ? styles.ownMessage : styles.otherMessage,
        { transform: [{ scale: messageAnimation }] }
      ]}
    >
      <View style={[
        styles.messageBubble,
        message.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        {message.content && (
          <Text style={[
            styles.messageText,
            message.isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        )}

        {message.attachments && message.attachments.map((attachment, index) => (
          <View key={index} style={styles.attachmentContainer}>
            {attachment.type === 'image' && (
              <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
            )}
            {attachment.type === 'document' && (
              <View style={styles.documentAttachment}>
                <Ionicons name="document" size={24} color="#007AFF" />
                <Text style={styles.documentName}>{attachment.name}</Text>
              </View>
            )}
            {attachment.type === 'location' && (
              <View style={styles.locationAttachment}>
                <Ionicons name="location" size={24} color="#007AFF" />
                <Text style={styles.locationText}>Location shared</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(message.timestamp)}
          </Text>
          {message.isOwn && getMessageStatusIcon(message.status)}
        </View>
      </View>
    </Animated.View>
  );

  // Render typing indicator
  const renderTypingIndicator = () => (
    <Animated.View
      style={[
        styles.typingIndicator,
        { opacity: typingAnimation }
      ]}
    >
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>Typing...</Text>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
        </View>
      </View>
    </Animated.View>
  );

  // Render attachments panel
  const renderAttachmentsPanel = () => (
    <Animated.View
      style={[
        styles.attachmentsPanel,
        {
          maxHeight: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 120],
          }),
          opacity: slideAnimation,
        },
      ]}
    >
      <View style={styles.attachmentButtons}>
        <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#007AFF" />
          <Text style={styles.attachmentButtonText}>Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
          <Ionicons name="document" size={24} color="#007AFF" />
          <Text style={styles.attachmentButtonText}>Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentButton} onPress={shareLocation}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.attachmentButtonText}>Location</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Render attachments preview
  const renderAttachmentsPreview = () => (
    <View style={styles.attachmentsPreview}>
      {attachments.map((attachment, index) => (
        <View key={index} style={styles.attachmentPreview}>
          {attachment.type === 'image' && (
            <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
          )}
          {attachment.type === 'document' && (
            <View style={styles.previewDocument}>
              <Ionicons name="document" size={20} color="#007AFF" />
              <Text style={styles.previewText}>{attachment.name}</Text>
            </View>
          )}
          {attachment.type === 'location' && (
            <View style={styles.previewLocation}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.previewText}>Location</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.removeAttachment}
            onPress={() => removeAttachment(index)}
          >
            <Ionicons name="close-circle" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Advanced Messaging</Text>
      </View>

      <View style={styles.content}>
        {!currentConversation ? (
          renderConversationList()
        ) : (
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setCurrentConversation(null)}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.chatTitle}>{currentConversation.participant}</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(renderMessage)}
              {typingUsers.size > 0 && renderTypingIndicator()}
            </ScrollView>

            {renderAttachmentsPreview()}
            {renderAttachmentsPanel()}

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.attachmentToggle}
                onPress={toggleAttachments}
              >
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>

              <TextInput
                ref={messageInputRef}
                style={styles.messageInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  if (text.length > 0) {
                    startTyping();
                  } else {
                    stopTyping();
                  }
                }}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() && attachments.length === 0) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={(!newMessage.trim() && attachments.length === 0) ? "#999" : "#FFFFFF"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  conversationList: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedConversation: {
    backgroundColor: '#F0F8FF',
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  conversationTime: {
    fontSize: 12,
    color: '#666',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
  },
  otherMessageBubble: {
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  documentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  locationAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  typingIndicator: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginRight: 2,
  },
  attachmentsPanel: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
  },
  attachmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentButton: {
    alignItems: 'center',
    padding: 8,
  },
  attachmentButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    padding: 8,
    flexWrap: 'wrap',
  },
  attachmentPreview: {
    position: 'relative',
    margin: 4,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewDocument: {
    width: 60,
    height: 60,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLocation: {
    width: 60,
    height: 60,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  attachmentToggle: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});

export default AdvancedMessaging; 