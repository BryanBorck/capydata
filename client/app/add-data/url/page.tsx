"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Link, Brain, Loader2, CheckCircle, Sparkles, ExternalLink } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function AddUrlPage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [urlPreview, setUrlPreview] = useState<{domain: string, valid: boolean} | null>(null);
  
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

  // URL validation and preview
  useEffect(() => {
    if (url.trim()) {
      try {
        const urlObj = new URL(url);
        setUrlPreview({
          domain: urlObj.hostname,
          valid: true
        });
      } catch {
        setUrlPreview({
          domain: '',
          valid: false
        });
      }
    } else {
      setUrlPreview(null);
    }
  }, [url]);

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
        type: 'url',
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

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!urlPreview?.valid) {
      toast.error("Please enter a valid URL");
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
        `${petName} learned from web content: "${title}"`,
        'web_learning',
        [{
          url: url,
          title: title,
          metadata: {
            type: 'web_scraping',
            source_url: url,
            auto_scraped: true,
            domain: urlPreview.domain
          }
        }]
      );

      console.log('Data instance created:', result);
      
      setSuccess(true);
      toast.success(`URL added successfully! ${petName} gained knowledge! 🧠✨`);

      // Reset form after success
      setTimeout(() => {
        router.push('/add-data');
      }, 2000);

    } catch (error: any) {
      console.error("Error adding URL:", error);
      toast.error(error.message || "Failed to add URL. Please try again.");
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500">
                    <Link className="h-4 w-4 text-white" />
                  </div>
                  <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Add Website URL
                  </AnimatedShinyText>
                </div>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0 bg-green-100 text-green-700">
                +1 Social, +1 Intelligence
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
                Share Interesting Links 🔗
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Add web resources, articles, or any interesting URLs for {activePet.name} to explore and learn from.
              </p>
            </div>

            {/* Form */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <span>Website URL Details</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Provide a title and URL for {activePet.name} to learn from
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Give this link a descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">{title.length}/100 characters</p>
                </div>

                {/* URL Field */}
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-xs sm:text-sm font-medium">Website URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`text-sm sm:text-base ${
                      urlPreview && !urlPreview.valid ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  {urlPreview && (
                    <div className="flex items-center space-x-2 text-xs">
                      {urlPreview.valid ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-600">Valid URL • {urlPreview.domain}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-600">Invalid URL format</span>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Content will be automatically extracted from this URL
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || success || !title.trim() || !url.trim() || !urlPreview?.valid}
                    className="w-full py-3 font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
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
                {title.trim() && urlPreview?.valid && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                        <h4 className="font-semibold text-gray-900">{title}</h4>
                      </div>
                      <p className="text-sm text-blue-600 truncate">{url}</p>
                      <p className="text-xs text-gray-600">
                        Domain: {urlPreview.domain}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Tips for sharing URLs:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Articles, blog posts, and news stories work great</li>
                    <li>• Research papers and documentation are valuable</li>
                    <li>• Make sure the URL is publicly accessible</li>
                    <li>• Content will be automatically extracted and processed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 