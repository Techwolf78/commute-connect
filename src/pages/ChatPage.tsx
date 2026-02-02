import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, userService } from '@/lib/firestore';
import { Message, Chat } from '@/types';
import { format } from 'date-fns';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');

  // Get chat details
  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getChat(chatId!),
    enabled: !!chatId,
  });

  // Get messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatService.getMessagesForChat(chatId!),
    enabled: !!chatId,
  });

  // Get other participant info
  const otherParticipantId = chat?.participants.find(id => id !== user?.id);
  const { data: otherParticipant } = useQuery({
    queryKey: ['user', otherParticipantId],
    queryFn: () => userService.getUser(otherParticipantId!),
    enabled: !!otherParticipantId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => {
      console.log('🔥 ChatPage: mutationFn called with text:', text);
      console.log('🔥 ChatPage: chatId:', chatId);
      console.log('🔥 ChatPage: user.id:', user?.id);
      return chatService.sendMessage(chatId!, user!.id, text);
    },
    onSuccess: (data) => {
      console.log('🔥 ChatPage: sendMessageMutation onSuccess called with data:', data);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    },
    onError: (error) => {
      console.error('🔥 ChatPage: sendMessageMutation onError called with error:', error);
    },
  });

  // Listen to real-time messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = chatService.listenToMessages(chatId, (updatedMessages) => {
      queryClient.setQueryData(['messages', chatId], updatedMessages);
    });

    return unsubscribe;
  }, [chatId, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (chatId && user?.id) {
      chatService.markMessagesAsRead(chatId, user.id);
    }
  }, [chatId, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 ChatPage: handleSendMessage called');
    console.log('🔥 ChatPage: newMessage:', newMessage);
    console.log('🔥 ChatPage: newMessage.trim():', newMessage.trim());
    console.log('🔥 ChatPage: sendMessageMutation.isPending:', sendMessageMutation.isPending);
    console.log('🔥 ChatPage: chatId:', chatId);
    console.log('🔥 ChatPage: user:', user);

    if (!newMessage.trim() || sendMessageMutation.isPending) {
      console.log('🔥 ChatPage: Early return - message empty or mutation pending');
      return;
    }

    console.log('🔥 ChatPage: Calling sendMessageMutation.mutate with:', newMessage);
    sendMessageMutation.mutate(newMessage);
  };

  const handleCall = () => {
    if (otherParticipant?.phone) {
      window.open(`tel:${otherParticipant.phone}`, '_self');
    }
  };

  if (chatLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading chat...</div>
      </div>
    );
  }

  if (!chat || !messages) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Chat not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{otherParticipant?.name || 'User'}</h1>
            <p className="text-sm text-primary-foreground/80">{otherParticipant?.phone}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={handleCall}
          disabled={!otherParticipant?.phone}
        >
          <Phone className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.s === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  message.s === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.t}</p>
                <p className={`text-xs mt-1 ${
                  message.s === user?.id
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                }`}>
                  {format(message.c, 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              console.log('🔥 ChatPage: onKeyDown triggered with key:', e.key);
              console.log('🔥 ChatPage: shiftKey:', e.shiftKey);
              if (e.key === 'Enter' && !e.shiftKey) {
                console.log('🔥 ChatPage: Enter key pressed without shift, calling handleSendMessage');
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;