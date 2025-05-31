"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, Link, Brain, Loader2, CheckCircle, X } from "lucide-react";
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

interface DataType {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  statBoost: string;
}

const DATA_TYPES: DataType[] = [
  {
    id: 'text',
    title: 'Text Content',
    description: 'Articles, notes, or written content',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    statBoost: '+2 Intelligence'
  },
  {
    id: 'url',
    title: 'Website URL',
    description: 'Share interesting links and resources',
    icon: Link,
    color: 'from-green-500 to-emerald-500',
    statBoost: '+1 Social, +1 Intelligence'
  },
  {
    id: 'file',
    title: 'File Upload',
    description: 'Upload documents, images, or files',
    icon: Upload,
    color: 'from-purple-500 to-pink-500',
    statBoost: '+3 Intelligence'
  }
];

export default function AddDataPage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, pets } = useUser();

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
  }, [isAuthenticated, pets, router]);

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("Please select a data type");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (selectedType === 'text' && !content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (selectedType === 'url' && !url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (selectedType === 'file' && !file) {
      toast.error("Please select a file");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      toast.success("Data added successfully! Your pet gained intelligence!");

      // Reset form
      setTimeout(() => {
        setSuccess(false);
        setSelectedType('');
        setTitle('');
        setContent('');
        setUrl('');
        setFile(null);
      }, 2000);

    } catch (error) {
      console.error("Error adding data:", error);
      toast.error("Failed to add data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  if (!isAuthenticated || pets.length === 0) {
    return null; // Will redirect in useEffect
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
                  onClick={() => router.push('/home')}
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Add Data
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Feed Your Pet
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Introduction */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                Feed Your Pet with Data 🍯
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Help your pet grow by sharing interesting content, links, or files. 
                Different types of data will boost your pet's intelligence and social stats!
              </p>
            </div>

            {/* Data Type Selection */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Choose Data Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {DATA_TYPES.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedType === type.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3 sm:mb-4 flex items-center justify-center bg-gradient-to-r ${type.color}`}>
                        <type.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{type.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{type.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {type.statBoost}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Data Input Form */}
            {selectedType && (
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                    <span className="truncate">Add {DATA_TYPES.find(t => t.id === selectedType)?.title}</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Fill in the details below to feed your pet
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs sm:text-sm">Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Give this data a descriptive title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500">{title.length}/100 characters</p>
                  </div>

                  {/* Content based on type */}
                  {selectedType === 'text' && (
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-xs sm:text-sm">Content *</Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your text content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        maxLength={5000}
                        className="text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500">{content.length}/5000 characters</p>
                    </div>
                  )}

                  {selectedType === 'url' && (
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-xs sm:text-sm">URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500">
                        Share an interesting link or resource
                      </p>
                    </div>
                  )}

                  {selectedType === 'file' && (
                    <div className="space-y-2">
                      <Label htmlFor="file" className="text-xs sm:text-sm">File *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                        <input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.png,.gif"
                        />
                        <label htmlFor="file" className="cursor-pointer">
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm text-gray-600">
                            {file ? file.name : 'Click to upload a file'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, TXT, or image files
                          </p>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || success}
                      className="flex-1 py-2 sm:py-3 font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                          <span>Feeding Pet...</span>
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span>Success!</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span>Feed Pet</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedType('');
                        setTitle('');
                        setContent('');
                        setUrl('');
                        setFile(null);
                      }}
                      disabled={isSubmitting}
                      className="sm:w-auto text-sm sm:text-base"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 