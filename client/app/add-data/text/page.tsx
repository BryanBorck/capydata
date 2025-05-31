"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Brain, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Pet {
  id: string;
  name: string;
  rarity: string;
  social: number;
  trivia: number;
  science: number;
  code: number;
  trenches: number;
  streak: number;
  created_at: string;
}

export default function AddTextPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, pets } = useUser();

  // Get active pet
  const getActivePetId = (): string | null => {
    const petIdFromUrl = searchParams.get('petId');
    if (petIdFromUrl) return petIdFromUrl;
    
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const activePet = pets.find((p: Pet) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Redirect if not authenticated or no pets
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && pets.length === 0) {
      router.push('/onboard');
      return;
    }

    if (!activePet) {
      router.push('/add-data');
      return;
    }
  }, [isAuthenticated, pets, activePet, router]);

  const createDataInstance = async (petId: string, instanceContent: string, instanceType: string, knowledgeData?: any[]) => {
    const payload = {
      content: instanceContent,
      content_type: instanceType,
      metadata: {
        source: 'web_app',
        type: 'text',
        timestamp: new Date().toISOString()
      },
      knowledge_list: knowledgeData || []
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${petId}/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (!activePet) {
      toast.error("No active pet found");
      return;
    }

    setIsSubmitting(true);

    try {
      const petName = activePet.name;
      
      const result = await createDataInstance(
        activePet.id,
        `${petName} learned from text content: "${title}"`,
        'learning_session',
        [{
          content: content,
          title: title,
          metadata: {
            type: 'manual_text',
            character_count: content.length,
            source: 'user_input'
          }
        }]
      );

      console.log('Data instance created:', result);
      
      setSuccess(true);
      toast.success(`Text content added successfully! ${petName} gained intelligence! 🧠✨`);

      // Reset form after success
      setTimeout(() => {
        router.push('/add-data');
      }, 2000);

    } catch (error: any) {
      console.error("Error adding text content:", error);
      toast.error(error.message || "Failed to add text content. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || pets.length === 0 || !activePet) {
    return null;
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 overflow-x-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.3}
        flickerChance={0.1}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/add-data')}
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Add Text Content
                  </AnimatedShinyText>
                </div>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0 bg-blue-100 text-blue-700">
                +2 Intelligence
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-2xl mx-auto">
            {/* Introduction */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                Share Your Knowledge 📝
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Add articles, notes, or any written content to boost {activePet.name}'s intelligence.
              </p>
            </div>

            {/* Form */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <span>Text Content Details</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Provide a title and content for {activePet.name} to learn from
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Give this content a descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">{title.length}/100 characters</p>
                </div>

                {/* Content Field */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xs sm:text-sm font-medium">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your text content here... This could be an article, notes, research findings, or any written knowledge you want to share."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    maxLength={5000}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">{content.length}/5000 characters</p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || success || !title.trim() || !content.trim()}
                    className="w-full py-3 font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Adding to {activePet.name}...</span>
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Success!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span>Feed {activePet.name}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Preview */}
                {(title.trim() || content.trim()) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {title.trim() && (
                        <h4 className="font-semibold text-gray-900">{title}</h4>
                      )}
                      {content.trim() && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {content.length > 200 ? content.substring(0, 200) + '...' : content}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 