'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function AIAgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your ITF portfolio assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulated assistant response
  const simulateResponse = (userMessage: string) => {
    setIsLoading(true);
    
    // Examples of responses based on user input
    const getResponse = () => {
      const lowercaseMsg = userMessage.toLowerCase();
      
      if (lowercaseMsg.includes('rebalance')) {
        return "I can help you rebalance your ITF portfolio. Based on the current market conditions, I'd recommend increasing your allocation to Tech Basket ITF by 5% and reducing your position in DeFi Portfolio by the same amount.";
      }
      
      if (lowercaseMsg.includes('performance') || lowercaseMsg.includes('doing')) {
        return "Your portfolio is up 2.4% today and 8.7% over the past month. Your best performing ITF is DeFi Portfolio with a 5.7% gain.";
      }
      
      if (lowercaseMsg.includes('create') || lowercaseMsg.includes('new itf')) {
        return "To create a new ITF, you can go to the 'Create New ITF' section from your dashboard. Would you like me to explain the process in detail?";
      }
      
      return "I understand you're asking about " + userMessage.substring(0, 20) + "... Could you provide more details so I can assist you better?";
    };
    
    // Simulate typing delay
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: getResponse(),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
      
      // Announce new message to screen readers
      const announcement = document.getElementById('chat-announcement');
      if (announcement) {
        announcement.textContent = `New message: ${newMessage.content}`;
      }
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    simulateResponse(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="relative h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>AI Portfolio Assistant</CardTitle>
        <CardDescription>
          Ask questions about your ITF portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {/* Visually hidden live region for screen readers */}
        <div 
          id="chat-announcement" 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        ></div>
        
        {/* Chat messages */}
        <div 
          className="h-full overflow-y-auto pb-4 pr-2" 
          role="log"
          aria-label="Conversation with AI assistant"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
                aria-label={message.role === 'assistant' ? 'Assistant message' : 'Your message'}
              >
                <p>{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                <div className="flex space-x-2" aria-label="Assistant is typing">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your portfolio..."
            className="flex-grow"
            aria-label="Message to assistant"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!inputValue.trim() || isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 