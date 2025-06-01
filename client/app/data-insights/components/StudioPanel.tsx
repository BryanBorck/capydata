"use client";

import { Sparkles, BookOpen, FileText, MessageCircle, Target, Loader2, Copy, X, Info, Lock, Coins } from "lucide-react";
import { toast } from "sonner";
import { Knowledge, KnowledgeSummary, GeneratedContent } from "../types";
import { useUser } from "@/providers/user-provider";
import { useState } from "react";

interface StudioPanelProps {
  petKnowledge: Knowledge[];
  knowledgeSummary: KnowledgeSummary | null;
  isGeneratingContent: boolean;
  generatedContent: GeneratedContent | null;
  onGenerateContent: (contentType: string) => void;
  onSetGeneratedContent: (content: GeneratedContent | null) => void;
}

export default function StudioPanel({
  petKnowledge,
  knowledgeSummary,
  isGeneratingContent,
  generatedContent,
  onGenerateContent,
  onSetGeneratedContent
}: StudioPanelProps) {
  
  const { user, purchaseStudioUnlock } = useUser();
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handlePurchaseStudio = async () => {
    setIsPurchasing(true);
    try {
      const success = await purchaseStudioUnlock();
      if (success) {
        // The success message is already shown by the purchaseStudioUnlock function
      }
    } catch (error) {
      console.error('Error purchasing studio unlock:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Show locked state if user hasn't unlocked studio
  if (!user?.studio_unlocked) {
    return (
      <div className="h-full overflow-auto px-6 py-6 pb-16">
        <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 relative">
          <div className="text-center">
            <div className="mb-6">
              <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2">
                STUDIO LOCKED
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase">
                UNLOCK ADVANCED AI CONTENT GENERATION
              </div>
            </div>
            
            <div className="bg-gray-50 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-6 mb-6">
              <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-4">
                STUDIO FEATURES
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-silkscreen text-xs text-gray-700 uppercase">Study Guides</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-silkscreen text-xs text-gray-700 uppercase">Briefing Docs</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  <span className="font-silkscreen text-xs text-gray-700 uppercase">FAQ Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="font-silkscreen text-xs text-gray-700 uppercase">Timelines</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="font-silkscreen text-lg font-bold text-yellow-700 uppercase mb-2">
                UNLOCK COST: 150 POINTS
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase">
                YOUR POINTS: {user?.points || 0}
              </div>
            </div>
            
            {user && user.points >= 150 ? (
              <button 
                onClick={handlePurchaseStudio}
                disabled={isPurchasing}
                className="font-silkscreen text-sm font-bold text-white uppercase bg-yellow-500 border-2 border-yellow-700 shadow-[4px_4px_0_#92400e] px-8 py-4 hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0_#92400e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                {isPurchasing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {isPurchasing ? 'PURCHASING...' : 'UNLOCK STUDIO'}
              </button>
            ) : (
              <div className="text-center">
                <div className="font-silkscreen text-sm text-red-600 uppercase mb-4">
                  INSUFFICIENT POINTS
                </div>
                <div className="font-silkscreen text-xs text-gray-600 uppercase">
                  EARN MORE POINTS BY PLAYING GAMES AND ADDING KNOWLEDGE
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-6 py-6 pb-16">
      {/* Controls Section */}
      <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 relative mb-6">
        {/* Loading Overlay for Controls */}
        {isGeneratingContent && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-gray-800" />
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase">
                LOADING...
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase text-center">
                IT&apos;S FINE, ALWAYS TAKE SOME TIME
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            CONTENT STUDIO
          </div>
          <div className="font-silkscreen text-xs text-gray-600 uppercase">
            GENERATE AI-POWERED CONTENT
          </div>
        </div>
        
        {/* Content Generation Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => onGenerateContent('study_guide')}
            disabled={isGeneratingContent || petKnowledge.length === 0}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e40af] p-4 hover:bg-blue-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            {isGeneratingContent && generatedContent?.type === 'study_guide' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <BookOpen className="h-6 w-6" />
            )}
            <span>STUDY GUIDE</span>
          </button>
          
          <button 
            onClick={() => onGenerateContent('briefing')}
            disabled={isGeneratingContent || petKnowledge.length === 0}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] p-4 hover:bg-green-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            {isGeneratingContent && generatedContent?.type === 'briefing' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <FileText className="h-6 w-6" />
            )}
            <span>BRIEFING DOC</span>
          </button>
          
          <button 
            onClick={() => onGenerateContent('faq')}
            disabled={isGeneratingContent || petKnowledge.length === 0}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-purple-100 border-2 border-purple-600 shadow-[2px_2px_0_#581c87] p-4 hover:bg-purple-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            {isGeneratingContent && generatedContent?.type === 'faq' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
            <span>FAQ</span>
          </button>
          
          <button 
            onClick={() => onGenerateContent('timeline')}
            disabled={isGeneratingContent || petKnowledge.length === 0}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-orange-100 border-2 border-orange-600 shadow-[2px_2px_0_#c2410c] p-4 hover:bg-orange-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#c2410c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            {isGeneratingContent && generatedContent?.type === 'timeline' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Target className="h-6 w-6" />
            )}
            <span>TIMELINE</span>
          </button>
        </div>

        {/* Knowledge Summary */}
        {knowledgeSummary && petKnowledge.length > 0 && (
          <div className="bg-gray-50 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-4 mb-6">
            <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
              KNOWLEDGE OVERVIEW
            </div>
            <div className="font-silkscreen text-xs text-gray-600 uppercase leading-relaxed">
              {knowledgeSummary.summary.length > 200 
                ? knowledgeSummary.summary.substring(0, 200) + '...' 
                : knowledgeSummary.summary}
            </div>
          </div>
        )}

        {/* No Knowledge Sources Warning */}
        {petKnowledge.length === 0 && (
          <div className="bg-yellow-100 border-2 border-yellow-600 shadow-[2px_2px_0_#92400e] p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-silkscreen text-sm font-bold text-yellow-800 uppercase">NO KNOWLEDGE SOURCES</h3>
                <p className="font-silkscreen text-xs text-yellow-700 mt-1 uppercase">
                  ADD KNOWLEDGE SOURCES TO START GENERATING CONTENT.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Content Display - Only show when not generating and content exists */}
      {generatedContent && !isGeneratingContent && (
        <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-silkscreen text-lg font-bold text-gray-800 uppercase">
                {generatedContent.type.replace('_', ' ')}
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => copyMessage(generatedContent.content)}
                  className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => onSetGeneratedContent(null)}
                  className="font-silkscreen text-xs font-bold text-red-800 uppercase bg-red-100 border-2 border-red-600 shadow-[2px_2px_0_#7f1d1d] px-3 py-1 hover:bg-red-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#7f1d1d] transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            
            <div className="bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151]">
              <div className="p-6">
                <div className="font-silkscreen text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {generatedContent.content}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center gap-2">
                <FileText className="h-3 w-3" />
                SAVE TO NOTE
              </button>
              <button 
                onClick={() => copyMessage(generatedContent.content)}
                className="font-silkscreen text-xs font-bold text-blue-800 uppercase bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e40af] px-4 py-2 hover:bg-blue-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all flex items-center gap-2"
              >
                <Copy className="h-3 w-3" />
                COPY
              </button>
              <button 
                onClick={() => onGenerateContent(generatedContent.type)}
                disabled={isGeneratingContent}
                className="font-silkscreen text-xs font-bold text-green-800 uppercase bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingContent ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                REGENERATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 