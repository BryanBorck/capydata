"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Brain, Loader2, CheckCircle, Sparkles, FileText, File, X } from "lucide-react";
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

export default function AddFilePage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
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
        type: 'file',
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

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          resolve('File content could not be read as text');
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!activePet) {
      toast.error("No active pet found");
      return;
    }

    setIsSubmitting(true);

    try {
      const petName = activePet.name;
      const fileContent = await readFileAsText(file);
      
      const result = await createDataInstance(
        activePet.id,
        `${petName} learned from file: "${title}"`,
        'file_learning',
        [{
          content: fileContent,
          title: title,
          metadata: {
            type: 'file_upload',
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
            source: 'file_upload'
          }
        }]
      );

      console.log('Data instance created:', result);
      
      setSuccess(true);
      toast.success(`File uploaded successfully! ${petName} gained intelligence! 🧠✨`);

      // Reset form after success
      setTimeout(() => {
        router.push('/add-data');
      }, 2000);

    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setFile(selectedFile);
    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'md': return '📋';
      case 'json': return '🔧';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📄';
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Upload File
                  </AnimatedShinyText>
                </div>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0 bg-purple-100 text-purple-700">
                +3 Intelligence
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
                Upload Documents 📁
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Share files, documents, or any digital content to expand {activePet.name}&apos;s knowledge base.
              </p>
            </div>

            {/* Form */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <span>File Upload Details</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Provide a title and select a file for {activePet.name} to learn from
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Give this file a descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">{title.length}/100 characters</p>
                </div>

                {/* File Upload Field */}
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">File *</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-purple-400 bg-purple-50' 
                        : file 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.png,.gif,.json,.md"
                    />
                    
                    {file ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-3xl">{getFileIcon(file.name)}</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">
                              Drop files here or click to upload
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, TXT, MD, JSON or image files (max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || success || !title.trim() || !file}
                    className="w-full py-3 font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Uploading to {activePet.name}...</span>
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
                {title.trim() && file && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFileIcon(file.name)}</span>
                        <h4 className="font-semibold text-gray-900">{title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">File: {file.name}</p>
                      <p className="text-xs text-gray-600">
                        Size: {formatFileSize(file.size)} • Type: {file.type || 'Unknown'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">💡 File upload tips:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Text-based files (PDF, DOC, TXT, MD) work best</li>
                    <li>• Images will be processed for text content</li>
                    <li>• Keep files under 5MB for optimal processing</li>
                    <li>• JSON files are great for structured data</li>
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