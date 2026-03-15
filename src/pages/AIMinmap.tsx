/**
 * AI Mind Map Page
 * ================
 * Students can upload PDFs or enter text to generate AI-powered mind maps
 * with 3D visualization and interactive popups
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { mindmapApi, MindMapData, MindMapNode } from '@/lib/api';
import { MindMapVisualization } from '@/components/shared/MindMapVisualization';
import {
  Upload,
  FileText,
  Sparkles,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  Share2,
  Lightbulb,
  BookOpen,
  Zap,
  Eye
} from 'lucide-react';

const AIMindMapPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  }, []);

  // Generate mind map from PDF
  const handleGenerateFromPdf = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.generateFromPdf(selectedFile);
      if (response.success) {
        setMindMapData(response.data);
        toast({
          title: 'Mind Map Generated!',
          description: `Successfully extracted ${response.data.statistics.total_topics} main topics.`,
        });
      } else {
        setError(response.message || 'Failed to generate mind map.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the mind map.');
      toast({
        title: 'Error',
        description: 'Failed to generate mind map from PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mind map from text
  const handleGenerateFromText = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.generateFromText(
        textInput, 
        'Study Notes'
      );
      if (response.success) {
        setMindMapData(response.data);
        toast({
          title: 'Mind Map Generated!',
          description: `Successfully extracted ${response.data.statistics.total_topics} main topics.`,
        });
      } else {
        setError(response.message || 'Failed to generate mind map.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the mind map.');
      toast({
        title: 'Error',
        description: 'Failed to generate mind map from text.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample mind map
  const handleLoadSample = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mindmapApi.getSample();
      if (response.success) {
        setMindMapData(response.data);
        toast({
          title: 'Sample Loaded!',
          description: 'Explore the interactive mind map features.',
        });
      }
    } catch (err: any) {
      setError('Failed to load sample mind map.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle node click
  const handleNodeClick = (node: MindMapNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Mind Map Generator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Transform your study materials into interactive visual mind maps powered by AI
          </p>
        </div>
        
        <Button variant="outline" onClick={handleLoadSample}>
          <Eye className="h-4 w-4 mr-2" />
          Try Sample
        </Button>
      </div>

      {/* Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-100">AI-Powered Analysis</p>
              <p className="text-sm text-purple-600 dark:text-purple-300">LDA topic modeling extracts key concepts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-pink-200 bg-pink-50/50 dark:bg-pink-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <p className="font-medium text-pink-900 dark:text-pink-100">3D Interactive View</p>
              <p className="text-sm text-pink-600 dark:text-pink-300">Zoom, pan, and explore with 3D effects</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Smart Popups</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">Hover on topics for instant content preview</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Input Source
              </CardTitle>
              <CardDescription>
                Upload a PDF or paste text to generate your mind map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'text')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Text Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  {/* Drag and Drop Zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                      ${dragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                      }
                      ${selectedFile ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
                        <p className="font-medium text-green-700 dark:text-green-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="font-medium">Drop your PDF here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleGenerateFromPdf}
                    disabled={!selectedFile || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing PDF...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Mind Map
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <Textarea
                    placeholder="Paste your study notes, syllabus content, or any text you want to visualize as a mind map..."
                    className="min-h-[200px] resize-none"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{textInput.length} characters</span>
                    <span>Min: 100 chars recommended</span>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleGenerateFromText}
                    disabled={textInput.length < 50 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing Text...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Mind Map
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Selected Node Details */}
          {selectedNode && (
            <Card className="animate-in slide-in-from-left">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedNode.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedNode.description}
                  </p>
                )}
                
                {selectedNode.keywords.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.keywords.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.related_concepts.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Related</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.related_concepts.map((rc, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{rc}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mind Map Visualization */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mind Map Visualization
                </CardTitle>
                
                {mindMapData && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {mindMapData.statistics.total_nodes} nodes
                    </Badge>
                    <Badge variant="outline">
                      {mindMapData.statistics.depth_levels} levels
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/30 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <Brain className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Analyzing content...</p>
                    <p className="text-sm text-muted-foreground">
                      AI is extracting topics and building connections
                    </p>
                  </div>
                </div>
              ) : mindMapData ? (
                <MindMapVisualization
                  data={mindMapData}
                  className="h-[500px]"
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="p-6 rounded-full bg-muted/50">
                    <Brain className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">No Mind Map Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upload a PDF file or enter text to generate an AI-powered 
                      mind map visualization of your study materials.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleLoadSample}>
                    <Eye className="h-4 w-4 mr-2" />
                    Load Sample Mind Map
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Lightbulb className="h-6 w-6 text-purple-600 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                Tips for Better Mind Maps
              </h3>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Upload PDF files with clear text (not scanned images)</li>
                <li>• Longer documents produce more detailed mind maps</li>
                <li>• Hover over any node to see a brief content preview</li>
                <li>• Click nodes to see detailed information in the sidebar</li>
                <li>• Use mouse wheel to zoom in/out of the visualization</li>
                <li>• Drag the canvas to pan around large mind maps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIMindMapPage;
