import { useState, useRef, useEffect } from "react";
import { useSimulateWhatsappMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Phone, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LocalMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

export default function Simulator() {
  const [phone, setPhone] = useState("+1234567890");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const simulateMsg = useSimulateWhatsappMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, simulateMsg.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phone.trim()) return;

    const userText = input.trim();
    setInput("");
    
    const newMsg: LocalMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);

    simulateMsg.mutate({ data: { patientPhone: phone, message: userText } }, {
      onSuccess: (data) => {
        const aiMsg: LocalMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        
        if (data.appointmentBooked) {
          toast({
            title: "Appointment Booked!",
            description: "The AI successfully booked an appointment.",
            variant: "default",
          });
        }
      },
      onError: () => {
        toast({
          title: "Simulation Failed",
          description: "Could not get a response from the AI agent.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-3xl mx-auto flex flex-col">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center">
          <Bot className="w-8 h-8 mr-3 text-primary" />
          Agent Simulator
        </h1>
        <p className="text-muted-foreground mt-2">Test how the AI books appointments by chatting with it directly.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-primary/10">
        <CardHeader className="bg-primary text-primary-foreground py-4 rounded-t-xl">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Clinic Assistant</CardTitle>
              <CardDescription className="text-primary-foreground/80">Active Simulator Session</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-primary-foreground/80">Simulated Phone:</span>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-32 h-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardHeader>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 dark:bg-slate-900"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Bot className="w-16 h-16 mb-4 text-primary" />
              <p className="text-sm font-medium">Start the conversation</p>
              <p className="text-xs">e.g. "I want to book an appointment with a doctor"</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end space-x-2 max-w-[80%]`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 text-foreground rounded-bl-sm border border-border/50'
                  }`}>
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</div>
                    <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.time}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {simulateMsg.isPending && (
            <div className="flex flex-col items-start">
              <div className="flex items-end space-x-2 max-w-[80%]">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex space-x-1.5">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-t">
          <form onSubmit={handleSend} className="flex space-x-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 bg-muted/50 border-transparent focus-visible:bg-background"
              disabled={simulateMsg.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full shrink-0" 
              disabled={simulateMsg.isPending || !input.trim()}
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
