"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, FileText, Link, Brain, Loader2, CheckCircle, Sparkles, Users, Zap, Plus, X } from "lucide-react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CATEGORIES = [
  { id: 'social', name: 'Social Content', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { id: 'trivia', name: 'Trivia & Knowledge', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'science', name: 'Science Papers', icon: Sparkles, color: 'from-green-500 to-emerald-500' },
  { id: 'code', name: 'Code & Documentation', icon: FileText, color: 'from-orange-500 to-red-500' },
  { id: 'trenches', name: 'Crypto & Finance', icon: Zap, color: 'from-yellow-500 to-amber-500' },
  { id: 'general', name: 'General Content', icon: FileText, color: 'from-gray-500 to-slate-500' }
];

const DATA_TYPES = [
  { id: 'text', name: 'Text Content', icon: FileText },
  { id: 'url', name: 'Website URL', icon: Link },
  { id: 'file', name: 'File Upload', icon: Upload }
];

export default function AddDataEntryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState('text');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, pets } = useUser();

  const petId = searchParams.get('petId');
  const initialCategory = searchParams.get('category') || 'general';
  const activePet = pets.find((p: Pet) => p.id === petId);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && pets.length === 0) {
      router.push('/onboard');
      return;
    }

    if (!petId || !activePet) {
      router.push('/add-data');
      return;
    }
  }, [isAuthenticated, pets, router, petId, activePet]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activePet) {
      toast.error('No active pet found');
      return;
    }

    // Validate based on data type
    if (dataType === 'text' && !content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    if (dataType === 'url' && !url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    if (dataType === 'file' && !file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);

    try {
      let finalContent = content;
      let finalContentType = dataType;
      const metadata: Record<string, unknown> = { tags, category };

      if (title.trim()) {
        metadata.title = title.trim();
      }

      // Handle different data types
      if (dataType === 'url') {
        finalContent = url;
        finalContentType = 'url';
        metadata.url = url;
      } else if (dataType === 'file' && file) {
        // For files, we'll store the file info and upload it
        const formData = new FormData();
        formData.append('file', file);
        
        // Here you would typically upload the file and get a URL
        // For now, we'll just use the file name as content
        finalContent = `File: ${file.name} (${file.size} bytes)`;
        finalContentType = 'file';
        metadata.fileName = file.name;
        metadata.fileSize = file.size;
        metadata.fileType = file.type;
      }

      // Create the data instance
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${activePet.id}/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalContent,
          content_type: finalContentType,
          category: category,
          tags: tags,
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add data');
      }

      await response.json();
      
      toast.success(`Successfully added ${dataType} to ${activePet.name}!`);
      
      // Reset form
      setContent('');
      setTitle('');
      setUrl('');
      setFile(null);
      setTags([]);
      
      // Navigate back
      setTimeout(() => {
        router.push('/add-data');
      }, 1500);

    } catch (error) {
      console.error('Error adding data:', error);
      toast.error('Failed to add data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || pets.length === 0 || !activePet) {
    return null;
  }

  const selectedCategory = CATEGORIES.find(c => c.id === category);

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
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Add Data to {activePet.name}
                </AnimatedShinyText>
              </div>
              
              {selectedCategory && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  <selectedCategory.icon className="h-3 w-3 mr-1" />
                  {selectedCategory.name}
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>Add Knowledge</span>
                </CardTitle>
                <CardDescription>
                  Feed your pet with new knowledge to boost its skills
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Data Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select value={dataType} onValueChange={setDataType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="h-4 w-4" />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center space-x-2">
                              <cat.icon className="h-4 w-4" />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter a title for this content"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Content based on data type */}
                  {dataType === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your text content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        required
                      />
                    </div>
                  )}

                  {dataType === 'url' && (
                    <div className="space-y-2">
                      <Label htmlFor="url">Website URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {dataType === 'file' && (
                    <div className="space-y-2">
                      <Label htmlFor="file">File Upload</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".txt,.pdf,.doc,.docx,.md"
                        required
                      />
                      {file && (
                        <p className="text-sm text-gray-600">
                          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Add to {activePet.name}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 