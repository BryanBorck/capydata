"use client";

import { useRef, useEffect, useState } from "react";
import { Loader2, Send, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Knowledge, ChatMessage, KnowledgeSummary } from "../types";

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  currentMessage: string;
  isGenerating: boolean;
  knowledgeSummary: KnowledgeSummary | null;
  isLoadingSummary: boolean;
  onCurrentMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

export default function ChatPanel({
  chatMessages,
  currentMessage,
  isGenerating,
  knowledgeSummary,
  isLoadingSummary,
  onCurrentMessageChange,
  onSendMessage
}: ChatPanelProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestedQuestions = [
    "What are the main topics covered in these sources?",
    "Can you summarize the key insights from this knowledge base?",
    "What are the most important findings or conclusions?",
    "How do these sources relate to each other?",
    "What practical applications can be derived from this information?"
  ];

  const userMessages = chatMessages.filter(m => m.role === 'user');
  const hasUserMessages = userMessages.length > 0;

  // Auto-scroll behavior
  useEffect(() => {
    if (chatMessagesRef.current) {
      if (hasUserMessages && chatSectionRef.current) {
        // If there are user messages, scroll to the chat section
        chatSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Otherwise scroll to bottom for new messages
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }
  }, [chatMessages, isGenerating, hasUserMessages]);

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="h-full flex flex-col px-3 py-3 pb-16 relative">
      {/* Single Card Container */}
      <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] flex-1 flex flex-col overflow-hidden relative">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3" ref={chatMessagesRef} style={{ paddingBottom: '140px' }}>
          
          
          {/* Instruction Banner */}
          <div className="bg-yellow-50 border-2 border-yellow-400 shadow-[2px_2px_0_#ca8a04] p-3 mb-4">
            <p className="font-silkscreen text-xs text-yellow-800 uppercase text-center">
              💡 TIP: GO TO <span className="font-bold text-violet-600">SOURCES</span> TAB TO FEED DATA AND GET BETTER INSIGHTS
            </p>
          </div>
          
          {/* Knowledge Header - Always show */}
          <div className="bg-gray-50 border-2 border-gray-300 shadow-[4px_4px_0_#d1d5db] p-4 mb-6">
            <div className="flex flex-col items-start space-y-3">
              <div className="w-12 h-12 bg-violet-100 border-2 border-violet-600 shadow-[2px_2px_0_#581c87] flex items-center justify-center flex-shrink-0">
                {isLoadingSummary ? (
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                ) : (
                  <div className="text-4xl">{knowledgeSummary?.icon || '📚'}</div>
                )}
              </div>
              <div className="flex-1 w-full">
                {isLoadingSummary ? (
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 border-2 border-gray-400 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 border-2 border-gray-400 w-32 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 border-2 border-gray-400 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 border-2 border-gray-400 w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ) : knowledgeSummary ? (
                  <>
                    <p className="font-silkscreen text-md font-bold text-gray-800 uppercase mb-2">
                      {knowledgeSummary.title}
                    </p>
                    <p className="font-silkscreen text-xs text-gray-600 leading-relaxed mb-4 uppercase">
                      {isExpanded ? knowledgeSummary.summary : truncateText(knowledgeSummary.summary)}
                    </p>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => copyMessage(knowledgeSummary.summary)}
                        className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {knowledgeSummary.summary.length > 100 && (
                        <button 
                          onClick={toggleExpanded}
                          className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center space-x-1"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          <span>{isExpanded ? 'LESS' : 'MORE'}</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-silkscreen text-md font-bold text-gray-800 uppercase mb-2">
                      NO KNOWLEDGE SOURCES
                    </p>
                    <p className="font-silkscreen text-xs text-gray-600 mb-4 uppercase">0 SOURCES</p>
                    <p className="font-silkscreen text-xs text-gray-600 leading-relaxed uppercase">
                      ADD SOME KNOWLEDGE SOURCES TO START EXPLORING YOUR DATA.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages Section */}
          
          {/* Chat Messages */}
          <div className="space-y-4">
            {chatMessages.filter(m => m.id !== 'welcome').map((message) => (
              <div key={message.id} className="space-y-3">
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] text-white p-3 max-w-[80%]">
                      <p className="font-silkscreen text-sm uppercase">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] text-gray-800 p-3 max-w-[80%]">
                      <p className="font-silkscreen text-sm uppercase whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="font-silkscreen text-sm text-gray-600 uppercase">THINKING...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Input Area at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t-2 border-gray-600 bg-gray-50 p-4">
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="TYPE YOUR MESSAGE..."
                value={currentMessage}
                onChange={(e) => onCurrentMessageChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                className="font-silkscreen text-sm uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-2 flex-1 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                disabled={isGenerating}
              />
              <button 
                onClick={onSendMessage}
                disabled={isGenerating || !currentMessage.trim()}
                className="font-silkscreen text-sm font-bold text-white uppercase bg-violet-600 border-2 border-violet-800 shadow-[2px_2px_0_#581c87] px-4 py-2 hover:bg-violet-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
            
            {/* Suggested Questions */}
            <div>
              <div className="flex space-x-2 overflow-x-auto">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onCurrentMessageChange(question)}
                    className="font-silkscreen text-xs text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all whitespace-nowrap"
                  >
                    {question.length > 30 ? `${question.substring(0, 30)}...` : question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 