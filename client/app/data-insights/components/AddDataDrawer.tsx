"use client";

import { useState, useEffect } from "react";
import { X, Plus, Upload, Link, FileText, RefreshCw, Check, Youtube, Globe, File as FileIcon, Loader2, CheckCircle, ExternalLink, ArrowLeft, Github, Users, BookOpen, Brain, Code, SearchCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

interface AddDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataAdded: () => void;
}

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
    id: 'social',
    title: 'Social Content',
    description: 'Twitter posts, social media content',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    statBoost: '+3 Social, +1 Streak'
  },
  {
    id: 'trivia',
    title: 'Trivia & Knowledge',
    description: 'Fun facts, trivia questions, general knowledge',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    statBoost: '+3 Trivia, +1 Streak'
  },
  {
    id: 'science',
    title: 'Science Papers',
    description: 'arXiv papers, research documents, scientific content',
    icon: Brain,
    color: 'from-green-500 to-emerald-500',
    statBoost: '+3 Science, +1 Streak'
  },
  {
    id: 'code',
    title: 'Code & Documentation',
    description: 'GitHub repos, documentation, programming content',
    icon: Code,
    color: 'from-orange-500 to-red-500',
    statBoost: '+3 Code, +1 Streak'
  },
  {
    id: 'trenches',
    title: 'Crypto & Finance',
    description: 'Crypto info, DeFi, blockchain, financial content',
    icon: SearchCheck,
    color: 'from-yellow-500 to-amber-500',
    statBoost: '+3 Trenches, +1 Streak'
  },
  {
    id: 'general',
    title: 'General Content',
    description: 'Text, articles, or general written content',
    icon: FileText,
    color: 'from-gray-500 to-slate-500',
    statBoost: '+2 Streak'
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AddDataDrawer({ isOpen, onClose, onDataAdded }: AddDataDrawerProps) {
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'url' | 'text' | 'category'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlPreview, setUrlPreview] = useState<{domain: string, valid: boolean} | null>(null);

  const { user, isAuthenticated, pets } = useUser();
  
  // Get active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const activePet = pets.find((p: Pet) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // URL validation
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

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('home');
      setTitle('');
      setUrl('');
      setTextContent('');
      setFile(null);
      setSelectedCategory('');
      setUrlPreview(null);
    }
  }, [isOpen]);

  const createDataInstance = async (petId: string, instanceContent: string, instanceType: string, knowledgeData?: any[]) => {
    const payload = {
      content: instanceContent,
      content_type: instanceType,
      metadata: {
        source: 'web_app',
        type: currentView,
        category: selectedCategory,
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
    if (!activePet) {
      toast.error("No active pet found");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    // Validation based on current view
    if (currentView === 'url' && (!url.trim() || !urlPreview?.valid)) {
      toast.error("Please enter a valid URL");
      return;
    }

    if (currentView === 'upload' && !file) {
      toast.error("Please select a file");
      return;
    }

    if (currentView === 'text' && !textContent.trim()) {
      toast.error("Please enter some text content");
      return;
    }

    setIsSubmitting(true);

    try {
      const petName = activePet.name;
      let knowledgeData: any[] = [];

      if (currentView === 'url') {
        knowledgeData = [{
          url: url,
          title: title,
          metadata: {
            type: 'web_scraping',
            source_url: url,
            auto_scraped: true,
            domain: urlPreview?.domain,
            category: selectedCategory
          }
        }];
      } else if (currentView === 'upload') {
        const fileContent = await readFileAsText(file!);
        knowledgeData = [{
          content: fileContent,
          title: title,
          metadata: {
            type: 'file_upload',
            filename: file!.name,
            file_size: file!.size,
            file_type: file!.type,
            source: 'file_upload',
            category: selectedCategory
          }
        }];
      } else if (currentView === 'text') {
        knowledgeData = [{
          content: textContent,
          title: title,
          metadata: {
            type: 'text_input',
            source: 'manual_entry',
            category: selectedCategory
          }
        }];
      }

      const result = await createDataInstance(
        activePet.id,
        `${petName} learned from ${currentView}: "${title}"`,
        `${currentView}_learning`,
        knowledgeData
      );

      console.log('Data instance created:', result);
      
      toast.success(`Content added successfully! ${petName} gained knowledge! 🧠✨`);
      onDataAdded();
      onClose();

    } catch (error: any) {
      console.error("Error adding content:", error);
      toast.error(error.message || "Failed to add content. Please try again.");
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

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="font-silkscreen text-sm text-gray-600 uppercase mb-4">
          Get started by selecting sources
        </div>
        
        <button className="w-full font-silkscreen text-sm font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2 mb-6">
          <RefreshCw className="h-4 w-4" />
          Discover sources
        </button>
      </div>

      {/* Upload Sources */}
      {/* <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center bg-gray-50">
        <div className="w-16 h-16 bg-blue-500 border-2 border-blue-700 shadow-[2px_2px_0_#1e40af] rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
          Upload sources
        </div>
        <div className="font-silkscreen text-xs text-gray-600 uppercase mb-4">
          Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
        </div>
        <button 
          onClick={() => setCurrentView('upload')}
          className="font-silkscreen text-sm font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] px-6 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all"
        >
          Choose Files
        </button>
      </div> */}

      {/* Google Drive Section */}
      {/* <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-4">
        <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          Google Drive
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Google Docs
          </button>
          <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Google Slides
          </button>
        </div>
      </div> */}

      {/* Link Section */}
      <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-4">
        <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2">
          <Link className="h-5 w-5" />
          Link
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentView('url')}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Website
          </button>
          <button 
            onClick={() => setCurrentView('url')}
            className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            Github
          </button>
        </div>
      </div>

      {/* Text Input */}
      <button 
        onClick={() => setCurrentView('text')}
        className="w-full font-silkscreen text-sm font-bold text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-3 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center justify-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Add Text Content
      </button>
    </div>
  );

  const renderCategorySelector = () => (
    <div className="space-y-4">
      <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-4">
        Choose Content Category (Optional)
      </div>
      <div className="grid grid-cols-1 gap-3">
        {DATA_TYPES.map((dataType) => (
          <button
            key={dataType.id}
            onClick={() => {
              setSelectedCategory(dataType.id);
              if (currentView === 'category') {
                setCurrentView('upload'); // Or whatever view they came from
              }
            }}
            className={cn(
              "p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] text-left transition-all",
              selectedCategory === dataType.id 
                ? "bg-blue-100 border-blue-600 shadow-[2px_2px_0_#1e40af]" 
                : "bg-white hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 border-2 border-gray-600 shadow-[2px_2px_0_#374151] flex items-center justify-center",
                selectedCategory === dataType.id ? "bg-blue-600 border-blue-700" : "bg-gray-100"
              )}>
                <dataType.icon className={cn(
                  "h-4 w-4",
                  selectedCategory === dataType.id ? "text-white" : "text-gray-600"
                )} />
              </div>
              <div>
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                  {dataType.title}
                </div>
                <div className="font-silkscreen text-xs text-gray-600 uppercase">
                  {dataType.statBoost}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setSelectedCategory('');
          if (currentView === 'category') {
            setCurrentView('upload');
          }
        }}
        className="w-full font-silkscreen text-sm font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all"
      >
        Skip Category Selection
      </button>
    </div>
  );

  const renderUploadView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">Title</div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your file"
          className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-blue-600 bg-blue-50" : "border-gray-400 bg-gray-50",
          file ? "border-green-600 bg-green-50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-3">
            <FileIcon className="h-8 w-8 mx-auto text-green-600" />
            <div className="font-silkscreen text-sm font-bold text-green-800 uppercase">
              {file.name}
            </div>
            <div className="font-silkscreen text-xs text-green-600 uppercase">
              {formatFileSize(file.size)}
            </div>
            <button
              onClick={() => setFile(null)}
              className="font-silkscreen text-xs font-bold text-red-700 uppercase bg-red-100 border-2 border-red-600 shadow-[2px_2px_0_#dc2626] px-3 py-1 hover:bg-red-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#dc2626] transition-all"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <div className="font-silkscreen text-sm font-bold text-gray-600 uppercase mb-2">
              Drag and drop your file here
            </div>
            <div className="font-silkscreen text-xs text-gray-500 uppercase mb-4">
              or click to browse (max 5MB)
            </div>
            <input
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
              id="file-upload"
              accept=".txt,.md,.pdf,.mp3,.wav,.flac"
            />
            <label
              htmlFor="file-upload"
              className="inline-block font-silkscreen text-sm font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] px-4 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all cursor-pointer"
            >
              Choose File
            </label>
          </>
        )}
      </div>

      {renderCategorySelector()}

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || !file || isSubmitting}
        className="w-full font-silkscreen text-sm font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-3 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload File
          </>
        )}
      </button>
    </div>
  );

  const renderUrlView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">Title</div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this content"
          className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">URL</div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600"
        />
        {urlPreview && (
          <div className={cn(
            "p-2 border-2 font-silkscreen text-xs",
            urlPreview.valid 
              ? "border-green-600 bg-green-50 text-green-800" 
              : "border-red-600 bg-red-50 text-red-800"
          )}>
            {urlPreview.valid ? `✓ Valid URL: ${urlPreview.domain}` : "✗ Invalid URL format"}
          </div>
        )}
      </div>

      {renderCategorySelector()}

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || !urlPreview?.valid || isSubmitting}
        className="w-full font-silkscreen text-sm font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-3 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding URL...
          </>
        ) : (
          <>
            <Link className="h-4 w-4" />
            Add URL
          </>
        )}
      </button>
    </div>
  );

  const renderTextView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">Title</div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this content"
          className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">Content</div>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Enter your text content here..."
          rows={8}
          className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600 resize-none"
        />
      </div>

      {renderCategorySelector()}

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || !textContent.trim() || isSubmitting}
        className="w-full font-silkscreen text-sm font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-3 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding Text...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Add Text
          </>
        )}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-50 border-l-4 border-gray-800 shadow-[8px_0_0_#374151] z-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b-4 border-gray-800 shadow-[0_4px_0_#374151] p-4">
            <div className="flex items-center justify-between">
              {currentView !== 'home' && (
                <button
                  onClick={() => setCurrentView('home')}
                  className="font-silkscreen text-sm font-bold text-gray-800 uppercase hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <div className="flex items-center gap-3 flex-1 justify-center">
                <Upload className="h-6 w-6 text-gray-800" />
                <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase">
                  Add Sources
                </div>
              </div>
              <button
                onClick={onClose}
                className="font-silkscreen text-gray-600 hover:text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentView === 'home' && renderHomeView()}
            {currentView === 'upload' && renderUploadView()}
            {currentView === 'url' && renderUrlView()}
            {currentView === 'text' && renderTextView()}
            {currentView === 'category' && renderCategorySelector()}
          </div>
        </div>
      </div>
    </>
  );
} 