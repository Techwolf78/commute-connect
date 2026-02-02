import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, userService, rideService } from '@/lib/firestore';
import { Chat } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  // Fetch ride details for each chat
  const { data: chatRides } = useQuery({
    queryKey: ['chat-rides', chats?.map(c => c.rideId)],
    queryFn: async () => {
      if (!chats?.length) return {};

      const rides: { [rideId: string]: any } = {};

      for (const chat of chats) {
        if (chat.rideId) {
          try {
            const ride = await rideService.getRide(chat.rideId);
            rides[chat.rideId] = ride;
          } catch (error) {
            console.error('Error fetching ride:', error);
          }
        }
      }

      return rides;
    },
    enabled: !!chats?.length,
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
              const ride = chatRides?.[chat.rideId];
              const otherParticipantId = chat.participants.find(id => id !== user?.id);

              // Get unread count for this chat
              const unreadForThisChat = unreadCounts?.[chat.id] || 0;

              return (
                <div
                  key={chat.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 cursor-pointer transition-colors relative",
                    unreadForThisChat > 0 && "bg-red-50 border-l-4 border-red-500"
                  )}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        unreadForThisChat > 0 ? "bg-red-500" : "bg-primary/10"
                      )}>
                        {participant ? (
                          <span className={cn(
                            "text-sm font-medium",
                            unreadForThisChat > 0 ? "text-white" : "text-primary"
                          )}>
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <User className={cn(
                            "h-6 w-6",
                            unreadForThisChat > 0 ? "text-white" : "text-primary"
                          )} />
                        )}
                      </div>
                      {unreadForThisChat > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {unreadForThisChat > 9 ? '9+' : unreadForThisChat}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "font-medium truncate",
                          unreadForThisChat > 0 ? "text-red-700" : "text-foreground"
                        )}>
                          {participant?.name || 'Unknown User'}
                        </h3>
                        {chat.lastMessageTimestamp && (
                          <span className="text-xs text-muted-foreground">
                            {format(chat.lastMessageTimestamp, 'MMM d')}
                          </span>
                        )}
                      </div>

                      {chat.lastMessage && (
                        <p className={cn(
                          "text-sm truncate mt-1",
                          unreadForThisChat > 0 ? "text-red-600 font-medium" : "text-muted-foreground"
                        )}>
                          {chat.lastMessage}
                        </p>
                      )}

                      {/* Ride information - minimal with time for uniqueness */}
                      {ride && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ride: {format(ride.departureTime, 'MMM d, h:mm a')}
                        </p>
                      )}

                      {participant?.phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {participant.phone}
                        </p>
                      )}
                    </div>
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