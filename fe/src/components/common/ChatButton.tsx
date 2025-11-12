import React, { useState } from "react";
import ChatWidget from "./ChatWidget";
import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

const ChatButton: React.FC = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Show for guests and normal users; hide for admin/teacher
  if (user && user.role !== "customer") {
    return null;
  }

  return (
    <>
      <Button
        onClick={toggleChat}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "animate-bounce"
        )}
        title="Mở trợ lý AI"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatButton;
