import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CuttingItem {
  id: string;
  length: number;
  width: number;
  quantity: number;
  material: string;
  edging: string;
  edgingMaterial: string;
  notes?: string;
}

interface AIAssistantProps {
  items: CuttingItem[];
  onAddItem: (item: Omit<CuttingItem, 'id'>) => void;
  onRemoveItems: (itemIds: string[]) => void;
  onUpdateItem: (itemId: string, updates: Partial<CuttingItem>) => void;
  onClearList: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  items, 
  onAddItem, 
  onRemoveItems, 
  onUpdateItem, 
  onClearList 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Include current cutting list context
      const contextMessage = `Current cutting list has ${items.length} items: ${items.map(
        item => `${item.length}x${item.width}x${item.quantity} ${item.material} (ID: ${item.id})`
      ).join(", ")}`;
      
      const messagesWithContext = [
        ...messages, 
        userMessage,
        { role: "user", content: contextMessage }
      ];

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: messagesWithContext },
      });

      if (error) throw error;

      console.log("AI Response data:", data);

      // Execute tool calls if any
      if (data?.toolCalls && data.toolCalls.length > 0) {
        console.log("Executing tool calls:", data.toolCalls);
        for (const toolCall of data.toolCalls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing ${functionName} with args:`, args);

          switch (functionName) {
            case "add_cutting_item":
              onAddItem({
                length: args.length,
                width: args.width,
                quantity: args.quantity,
                material: args.material,
                edging: args.edging,
                edgingMaterial: args.edgingMaterial,
                notes: args.notes
              });
              console.log("Item added via AI");
              break;
            case "remove_cutting_items":
              onRemoveItems(args.itemIds);
              console.log("Items removed via AI:", args.itemIds);
              break;
            case "update_cutting_item":
              const { itemId, ...updates } = args;
              onUpdateItem(itemId, updates);
              console.log("Item updated via AI:", itemId, updates);
              break;
            case "clear_cutting_list":
              onClearList();
              console.log("List cleared via AI");
              break;
          }
        }
      } else {
        console.log("No tool calls in response");
      }

      if (data?.answer) {
        const assistantMessage: Message = { role: "assistant", content: data.answer };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      toast({
        title: "AI Assistant unavailable",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestedPrompts = [
    "How do I save my cutting list?",
    "How can I upload an image to extract cut sizes?",
    "What materials and edging options are available?",
    "Help me optimize my cutting list for minimal waste",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="lg" className="gap-2">
          <Sparkles className="h-5 w-5" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Assistant
              </DialogTitle>
              <DialogDescription>
                Ask me anything about the app, materials, cutting optimization, or troubleshooting
              </DialogDescription>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                <div className="grid gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="text-left h-auto py-3 px-4 justify-start whitespace-normal"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "glass-effect"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap m-0">{message.content}</p>
                    </div>
                  </Card>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="glass-effect p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 border-t">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            disabled={isLoading}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
