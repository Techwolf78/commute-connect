import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, userService } from '@/lib/firestore';
import { Chat } from '@/types';
import { format } from 'date-fns';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch all chats for the user
  const { data: chats, isLoading } = useQuery({
    queryKey: ['user-chats', user?.id],
    queryFn: () => chatService.getChatsForUser(user!.id),
    enabled: !!user?.id,
  });

  // Get unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => chatService.getUnreadMessageCount(user!.id),
    enabled: !!user?.id,
  });

  // Get unread counts per chat
  const { data: unreadCounts } = useQuery({
    queryKey: ['unread-counts-per-chat', user?.id],
    queryFn: () => chatService.getUnreadCountsPerChat(user!.id),
    enabled: !!user?.id,
  });

  // Fetch participant details for each chat
  const { data: chatParticipants } = useQuery({
    queryKey: ['chat-participants', chats?.map(c => c.id)],
    queryFn: async () => {
      if (!chats?.length || !user?.id) return {};

      const participants: { [chatId: string]: any } = {};

      for (const chat of chats) {
        const otherParticipantId = chat.participants.find(id => id !== user.id);
        if (otherParticipantId) {
          try {
            const participant = await userService.getUser(otherParticipantId);
            participants[chat.id] = participant;
          } catch (error) {
            console.error('Error fetching participant:', error);
          }
        }
      }

      return participants;
    },
    enabled: !!chats?.length && !!user?.id,
  });

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Chat with your drivers and passengers
          </p>
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-lg mx-auto">
        {chats && chats.length > 0 ? (
          <div className="divide-y divide-border">
            {chats.map((chat) => {
              const participant = chatParticipants?.[chat.id];
              const otherParticipantId = chat.participants.find(id => id !== user?.id);

              // Get unread count for this chat
              const unreadForThisChat = unreadCounts?.[chat.id] || 0;

              return (
                <div
                  key={chat.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {participant ? (
                        <span className="text-sm font-medium text-primary">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate">
                          {participant?.name || 'Unknown User'}
                        </h3>
                        {chat.lastMessageTimestamp && (
                          <span className="text-xs text-muted-foreground">
                            {format(chat.lastMessageTimestamp, 'MMM d')}
                          </span>
                        )}
                      </div>

                      {chat.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {chat.lastMessage}
                        </p>
                      )}

                      {participant?.phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {participant.phone}
                        </p>
                      )}
                    </div>

                    {unreadForThisChat > 0 && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-foreground">
                          {unreadForThisChat}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start chatting with drivers and passengers for your rides
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;