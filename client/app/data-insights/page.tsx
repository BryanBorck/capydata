"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, Clock, Users, Brain, Lightbulb, Target } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";

// Mock data insights - in a real app, this would come from an API
interface DataInsight {
  id: string;
  title: string;
  description: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  category: 'engagement' | 'performance' | 'behavior' | 'growth';
  confidence: number;
}

export default function DataInsightsPage() {
  const router = useRouter();
  const { user, isAuthenticated, pets } = useUser();
  const [insights, setInsights] = useState<DataInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get current active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const selectedPet = pets.find(pet => pet.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Redirect if not authenticated
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

  // Generate mock insights based on pet data
  useEffect(() => {
    if (!selectedPet) return;

    const generateInsights = () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockInsights: DataInsight[] = [
          {
            id: '1',
            title: 'Data Input Frequency',
            description: 'You tend to add data most frequently on weekends',
            value: '3.2x more active',
            trend: 'up',
            category: 'engagement',
            confidence: 87
          },
          {
            id: '2',
            title: 'Pet Health Correlation',
            description: 'Your pet\'s health improves 15% when you add diverse data types',
            value: '+15% health boost',
            trend: 'up',
            category: 'performance',
            confidence: 92
          },
          {
            id: '3',
            title: 'Optimal Data Time',
            description: 'Your most effective data sessions happen between 2-4 PM',
            value: '2-4 PM peak',
            trend: 'stable',
            category: 'behavior',
            confidence: 78
          },
          {
            id: '4',
            title: 'Growth Pattern',
            description: 'Your pet shows consistent social skill development',
            value: '+8% weekly growth',
            trend: 'up',
            category: 'growth',
            confidence: 85
          },
          {
            id: '5',
            title: 'Data Quality Score',
            description: 'Recent data submissions show high relevance and structure',
            value: '94% quality score',
            trend: 'up',
            category: 'performance',
            confidence: 96
          },
          {
            id: '6',
            title: 'Engagement Prediction',
            description: 'Based on patterns, you\'re likely to add data tomorrow',
            value: '89% probability',
            trend: 'stable',
            category: 'behavior',
            confidence: 83
          }
        ];
        
        setInsights(mockInsights);
        setIsLoading(false);
      }, 1500);
    };

    generateInsights();
  }, [selectedPet]);

  if (!isAuthenticated || pets.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement': return Users;
      case 'performance': return Target;
      case 'behavior': return Brain;
      case 'growth': return TrendingUp;
      default: return BarChart3;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement': return 'from-blue-500 to-blue-600';
      case 'performance': return 'from-green-500 to-green-600';
      case 'behavior': return 'from-purple-500 to-purple-600';
      case 'growth': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return BarChart3;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

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
                  Data Insights
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Analytics
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Introduction */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                Data Intelligence Dashboard 📊
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Discover patterns, trends, and insights from your data interactions with {selectedPet?.name || 'your pet'}.
              </p>
            </div>

            {/* Pet Context */}
            {selectedPet && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-2xl sm:text-3xl">
                    🐾
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                      Analyzing {selectedPet.name}'s Data
                    </h2>
                    <p className="text-sm text-gray-600">
                      AI-powered insights from your pet's data journey
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                  <span className="text-lg font-medium text-gray-700">Analyzing your data patterns...</span>
                </div>
              </div>
            )}

            {/* Insights Grid */}
            {!isLoading && insights.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-6 w-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-800">Key Insights</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {insights.map((insight) => {
                    const CategoryIcon = getCategoryIcon(insight.category);
                    const TrendIcon = getTrendIcon(insight.trend);
                    
                    return (
                      <Card key={insight.id} className="hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r",
                                getCategoryColor(insight.category)
                              )}>
                                <CategoryIcon className="h-4 w-4 text-white" />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {insight.category}
                              </Badge>
                            </div>
                            <TrendIcon className={cn("h-4 w-4", getTrendColor(insight.trend))} />
                          </div>
                          <CardTitle className="text-base sm:text-lg">{insight.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {insight.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-800">{insight.value}</span>
                            <Badge variant="secondary" className="text-xs">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                          <Progress value={insight.confidence} className="h-2" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {!isLoading && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-bold text-gray-800">Recommendations</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800">Optimize Your Schedule</p>
                      <p className="text-sm text-blue-700">Try adding data between 2-4 PM for maximum pet engagement.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Brain className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">Diversify Data Types</p>
                      <p className="text-sm text-green-700">Mix different categories of data to boost your pet's overall development.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-800">Weekend Focus</p>
                      <p className="text-sm text-purple-700">You're most active on weekends - consider setting reminders for weekday sessions.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 