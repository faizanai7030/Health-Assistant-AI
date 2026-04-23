import { useListConversations, getListConversationsQueryKey, useGetConversation, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { MessageSquare, Phone, User, Clock } from "lucide-react";

export default function Conversations() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: conversations, isLoading: isLoadingList } = useListConversations({
    query: { queryKey: getListConversationsQueryKey() }
  });

  const { data: detail, isLoading: isLoadingDetail } = useGetConversation(selectedId!, {
    query: { 
      enabled: !!selectedId, 
      queryKey: getGetConversationQueryKey(selectedId!) 
    }
  });

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">WhatsApp Conversations</h1>
        <p className="text-muted-foreground mt-1">Review AI agent interactions with patients.</p>
      </div>

      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* List */}
        <Card className="w-1/3 flex flex-col overflow-hidden">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">Recent Chats</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto">
            {isLoadingList ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : conversations?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations?.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => setSelectedId(conv.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === conv.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{conv.patientName || conv.patientPhone}</div>
                      {conv.lastMessageAt && (
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(conv.lastMessageAt), "MMM d, HH:mm")}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mb-2">
                      {conv.lastMessage || "No messages"}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" /> {conv.messageCount} msgs
                      </div>
                      <Badge variant={conv.status === 'active' ? "default" : "secondary"} className="text-[10px] h-4">
                        {conv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Thread */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedId ? (
            isLoadingDetail ? (
              <div className="p-6 space-y-4 flex-1">
                <Skeleton className="h-10 w-1/3 mb-8" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
              </div>
            ) : detail ? (
              <>
                <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2 text-primary" />
                      {detail.patientName || "Unknown Patient"}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" /> {detail.patientPhone}
                    </CardDescription>
                  </div>
                  <Badge variant={detail.status === 'active' ? "default" : "secondary"}>
                    {detail.status}
                  </Badge>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                  {detail.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-card border shadow-sm text-card-foreground rounded-bl-sm'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(parseISO(msg.createdAt), "HH:mm")}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Failed to load conversation details
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a conversation to view the thread</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
