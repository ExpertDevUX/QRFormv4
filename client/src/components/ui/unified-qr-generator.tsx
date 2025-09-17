import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  QrCode, 
  Download, 
  Share2, 
  Palette, 
  Move, 
  Type, 
  Settings,
  RotateCcw,
  Sparkles,
  Calendar, 
  Clock,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import { z } from "zod";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import { FormBuilder } from "@/components/ui/form-builder";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema, FormField as RegistrationFormField } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  generateQRCode, 
  downloadQRCode 
} from "@/lib/qr";
import { 
  generateEnhancedQRCode, 
  downloadEnhancedQRCode, 
  qrPresets, 
  QRCustomization 
} from "@/lib/enhanced-qr";

const formSchema = insertEventSchema.extend({
  includeEmail: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
}

interface PageElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'input' | 'divider';
  content?: string;
  style?: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

export function UnifiedQRGenerator() {
  const [qrMode, setQrMode] = useState<'basic' | 'enhanced'>('basic');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [generatedEvent, setGeneratedEvent] = useState<any>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("classic");
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [pageElements, setPageElements] = useState<PageElement[]>([]);
  const [dragStartCoords, setDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [formFields, setFormFields] = useState<RegistrationFormField[]>([]);
  const [activeEnhancedTab, setActiveEnhancedTab] = useState<'page-builder' | 'form-builder'>('page-builder');
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // QR Customization state for enhanced mode
  const [qrCustomization, setQrCustomization] = useState<Partial<QRCustomization>>({
    size: 256,
    margin: 2,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    qrPosition: { x: 0, y: 0 },
    format: 'png',
    quality: 0.8
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      eventDate: "",
      eventTime: "",
      isActive: true,
      includeEmail: false,
    },
  });

  // Generate QR code preview
  useEffect(() => {
    if (generatedEvent) {
      generateQRPreview();
    }
  }, [qrCustomization, backgroundImage, textOverlays, generatedEvent, qrMode]);

  const generateQRPreview = async () => {
    if (!generatedEvent) return;
    
    try {
      const registrationUrl = `${window.location.origin}/register/${generatedEvent.id}`;
      
      if (qrMode === 'basic') {
        const qrCode = await generateQRCode(registrationUrl);
        setQrCodeDataURL(qrCode);
      } else {
        const customization: Partial<QRCustomization> = {
          ...qrCustomization,
          backgroundImage: backgroundImage || undefined,
          textOverlays: textOverlays
        };
        const enhancedQR = await generateEnhancedQRCode(registrationUrl, customization);
        setQrCodeDataURL(enhancedQR);
      }
    } catch (error) {
      console.error('Error generating QR preview:', error);
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { includeEmail, ...eventData } = data;
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: async (event) => {
      setGeneratedEvent(event);
      
      // Save QR settings and form schema for enhanced mode
      if (qrMode === 'enhanced') {
        let qrSettingsSaved = false;
        let formSchemaSaved = false;
        
        try {
          // Save QR settings with page elements
          const qrSettings = {
            eventId: event.id,
            backgroundImage: backgroundImage,
            qrSize: qrCustomization.size || 256,
            qrPosition: qrCustomization.qrPosition || { x: 0, y: 0 },
            textOverlays: textOverlays,
            customFields: {
              foregroundColor: qrCustomization.foregroundColor,
              backgroundColor: qrCustomization.backgroundColor,
              margin: qrCustomization.margin,
              format: qrCustomization.format,
              quality: qrCustomization.quality,
              pageElements: pageElements
            }
          };
          
          await apiRequest("POST", "/api/qr-settings", qrSettings);
          qrSettingsSaved = true;
          
          // Save form schema if form fields exist
          if (formFields.length > 0) {
            const formSchema = {
              eventId: event.id,
              schema: formFields,
              layout: {}
            };
            
            await apiRequest("POST", "/api/form-schemas", formSchema);
            formSchemaSaved = true;
          } else {
            formSchemaSaved = true; // No form fields to save
          }
          
        } catch (error) {
          console.error('Error saving enhanced QR settings:', error);
          
          // Show specific error to user
          toast({
            title: "Saving Failed",
            description: error instanceof Error 
              ? `Failed to save settings: ${error.message}` 
              : "Failed to save QR settings and form data. Please try again.",
            variant: "destructive",
          });
          
          // Don't proceed with success actions if saving failed
          return;
        }
        
        // Only show success if everything saved properly
        if (qrSettingsSaved && formSchemaSaved) {
          toast({
            title: "Enhanced QR Generated",
            description: formFields.length > 0 
              ? `QR code and ${formFields.length} form fields saved successfully.`
              : "QR code and page elements saved successfully.",
          });
        }
      }

      await generateQRPreview();
      
      // Only show generic success for basic mode (enhanced mode shows specific success above)
      if (qrMode === 'basic') {
        toast({
          title: "QR Code Generated",
          description: "Your registration QR code has been created successfully.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createEventMutation.mutate(data);
  };

  const handleDownloadQR = () => {
    if (qrCodeDataURL && generatedEvent) {
      const filename = qrMode === 'basic' 
        ? `${generatedEvent.name.replace(/\s+/g, '-')}-qr-code.png`
        : `${generatedEvent.name.replace(/\s+/g, '-')}-enhanced-qr.${qrCustomization.format || 'png'}`;
      
      if (qrMode === 'basic') {
        downloadQRCode(qrCodeDataURL, filename);
      } else {
        downloadEnhancedQRCode(qrCodeDataURL, filename);
      }
    }
  };

  const handleShareLink = () => {
    if (generatedEvent) {
      const registrationUrl = `${window.location.origin}/register/${generatedEvent.id}`;
      navigator.clipboard.writeText(registrationUrl);
      toast({
        title: "Link Copied",
        description: "Registration link has been copied to clipboard.",
      });
    }
  };

  const applyPreset = (presetName: string) => {
    const preset = qrPresets[presetName as keyof typeof qrPresets];
    if (preset) {
      setQrCustomization(preset);
      setSelectedPreset(presetName);
    }
  };

  const addTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: 'Sample Text',
      x: 50,
      y: 50,
      fontSize: 16,
      color: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'normal'
    };
    setTextOverlays([...textOverlays, newOverlay]);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(overlays => 
      overlays.map(overlay => 
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(overlays => overlays.filter(overlay => overlay.id !== id));
  };

  // Page Builder Functions
  const addPageElement = (type: PageElement['type']) => {
    const newElement: PageElement = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : '',
      style: {
        color: '#000000',
        fontSize: '16px',
        fontWeight: 'normal',
        backgroundColor: type === 'button' ? '#007bff' : 'transparent',
        borderRadius: type === 'button' ? '8px' : '0px',
        padding: type === 'button' ? '8px 16px' : '4px'
      },
      position: { x: 50, y: 50 },
      size: { width: 200, height: type === 'text' ? 40 : type === 'button' ? 50 : 100 }
    };
    setPageElements([...pageElements, newElement]);
  };

  const updatePageElement = (id: string, updates: Partial<PageElement>) => {
    setPageElements(elements => 
      elements.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  const removePageElement = (id: string) => {
    setPageElements(elements => elements.filter(element => element.id !== id));
  };

  const onDragStart = useCallback((start: any) => {
    setDragStartCoords({ x: 0, y: 0 }); // Will be updated with actual mouse position
  }, []);

  const onDragEnd = useCallback((result: any) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) {
      setDragStartCoords(null);
      return;
    }

    // Handle dragging from palette to canvas
    if (source.droppableId === 'palette' && destination.droppableId === 'canvas') {
      const elementType = draggableId.replace('palette-', '') as PageElement['type'];
      
      // Calculate reasonable drop position within canvas bounds
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const canvasWidth = canvasRect?.width || 400;
      const canvasHeight = canvasRect?.height || 400;
      
      // Use a grid-based positioning system for predictable placement
      const elementCount = pageElements.length;
      const gridX = (elementCount % 3) * (canvasWidth / 3) + 20;
      const gridY = Math.floor(elementCount / 3) * 100 + 20;
      
      // Ensure the position is within canvas bounds
      const dropX = Math.min(gridX, canvasWidth - 200);
      const dropY = Math.min(gridY, canvasHeight - 60);
      
      const newElement: PageElement = {
        id: Date.now().toString(),
        type: elementType,
        content: elementType === 'text' ? 'New Text Element' : elementType === 'button' ? 'Click Me' : '',
        style: {
          color: '#000000',
          fontSize: '16px',
          fontWeight: 'normal',
          backgroundColor: elementType === 'button' ? '#3b82f6' : 'transparent',
          borderRadius: elementType === 'button' ? '8px' : '0px',
          padding: elementType === 'button' ? '8px 16px' : '4px',
          borderColor: elementType === 'button' ? '#3b82f6' : 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid'
        },
        position: { x: dropX, y: dropY },
        size: { 
          width: elementType === 'text' ? 200 : elementType === 'button' ? 120 : 180, 
          height: elementType === 'text' ? 40 : elementType === 'button' ? 40 : 40 
        }
      };
      
      setPageElements([...pageElements, newElement]);
      setDragStartCoords(null);
      return;
    }

    // Handle moving elements within canvas - update their positions
    if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      const draggedElementId = draggableId;
      const draggedElement = pageElements.find(el => el.id === draggedElementId);
      
      if (draggedElement) {
        // For now, implement a simple repositioning system
        // In a real implementation, you'd track the actual mouse delta
        const newX = Math.max(0, draggedElement.position.x + (destination.index - source.index) * 20);
        const newY = Math.max(0, draggedElement.position.y + (destination.index - source.index) * 10);
        
        setPageElements(elements => 
          elements.map(element => 
            element.id === draggedElementId 
              ? { 
                  ...element, 
                  position: { 
                    x: Math.min(newX, (canvasRef.current?.clientWidth || 400) - element.size.width),
                    y: Math.min(newY, (canvasRef.current?.clientHeight || 400) - element.size.height)
                  } 
                }
              : element
          )
        );
      }
      
      setDragStartCoords(null);
      return;
    }

    setDragStartCoords(null);
  }, [pageElements]);

  const getDeviceClass = () => {
    switch (devicePreview) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-md';
      default: return 'max-w-2xl';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-3 h-8 w-8 text-primary" />
            Unified QR Generator & Page Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={qrMode} onValueChange={(value) => setQrMode(value as 'basic' | 'enhanced')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Basic QR
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enhanced QR + Page Builder
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Event Form */}
              <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter event name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Event description" 
                                rows={3} 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="eventDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="eventTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Time</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="includeEmail"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                            <label className="text-sm text-foreground">Include Email Field</label>
                          </div>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createEventMutation.isPending}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        {createEventMutation.isPending ? "Generating..." : `Generate ${qrMode === 'basic' ? 'QR Code' : 'Enhanced QR'}`}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* QR Customization Panel (Enhanced Mode Only) */}
            {qrMode === 'enhanced' && (
              <div className="xl:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">QR Customization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="style" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="style">
                          <Palette className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="background">
                          <Settings className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="position">
                          <Move className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="text">
                          <Type className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="style" className="space-y-4">
                        <div>
                          <Label>Quick Presets</Label>
                          <Select value={selectedPreset} onValueChange={applyPreset}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a preset" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="colorful">Colorful</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>QR Size: {qrCustomization.size}px</Label>
                          <Slider
                            value={[qrCustomization.size || 256]}
                            onValueChange={(value) => 
                              setQrCustomization(prev => ({ ...prev, size: value[0] }))
                            }
                            max={500}
                            min={100}
                            step={10}
                            className="mt-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>QR Color</Label>
                            <Input
                              type="color"
                              value={qrCustomization.foregroundColor || '#000000'}
                              onChange={(e) => 
                                setQrCustomization(prev => ({ ...prev, foregroundColor: e.target.value }))
                              }
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label>Background</Label>
                            <Input
                              type="color"
                              value={qrCustomization.backgroundColor || '#FFFFFF'}
                              onChange={(e) => 
                                setQrCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))
                              }
                              className="h-10"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="background" className="space-y-4">
                        <FileUpload
                          onFileUpload={setBackgroundImage}
                          currentFile={backgroundImage}
                        />
                        
                        {backgroundImage && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setBackgroundImage(null)}
                            className="w-full"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Remove Background
                          </Button>
                        )}
                      </TabsContent>

                      <TabsContent value="position" className="space-y-4">
                        <div>
                          <Label>QR Position X: {qrCustomization.qrPosition?.x || 0}px</Label>
                          <Slider
                            value={[qrCustomization.qrPosition?.x || 0]}
                            onValueChange={(value) => 
                              setQrCustomization(prev => ({ 
                                ...prev, 
                                qrPosition: { ...prev.qrPosition, x: value[0], y: prev.qrPosition?.y || 0 } 
                              }))
                            }
                            max={500}
                            min={0}
                            step={5}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>QR Position Y: {qrCustomization.qrPosition?.y || 0}px</Label>
                          <Slider
                            value={[qrCustomization.qrPosition?.y || 0]}
                            onValueChange={(value) => 
                              setQrCustomization(prev => ({ 
                                ...prev, 
                                qrPosition: { ...prev.qrPosition, y: value[0], x: prev.qrPosition?.x || 0 } 
                              }))
                            }
                            max={500}
                            min={0}
                            step={5}
                            className="mt-2"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="text" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Text Overlays</Label>
                          <Button size="sm" onClick={addTextOverlay}>
                            Add Text
                          </Button>
                        </div>

                        {textOverlays.map((overlay) => (
                          <Card key={overlay.id} className="p-3">
                            <div className="space-y-2">
                              <Input
                                value={overlay.text}
                                onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                                placeholder="Enter text"
                                className="text-sm"
                              />
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  placeholder="X"
                                  value={overlay.x}
                                  onChange={(e) => updateTextOverlay(overlay.id, { x: parseInt(e.target.value) || 0 })}
                                  className="text-xs"
                                />
                                <Input
                                  type="number"
                                  placeholder="Y"
                                  value={overlay.y}
                                  onChange={(e) => updateTextOverlay(overlay.id, { y: parseInt(e.target.value) || 0 })}
                                  className="text-xs"
                                />
                              </div>

                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => removeTextOverlay(overlay.id)}
                                className="w-full"
                              >
                                Remove
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enhanced Mode Panel - Page Builder & Form Builder */}
            {qrMode === 'enhanced' && (
              <div className="xl:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enhanced Tools</CardTitle>
                    <Tabs value={activeEnhancedTab} onValueChange={(value) => setActiveEnhancedTab(value as 'page-builder' | 'form-builder')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="page-builder" className="text-xs">
                          Page Builder
                        </TabsTrigger>
                        <TabsTrigger value="form-builder" className="text-xs">
                          Form Builder
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="page-builder" className="space-y-4">
                      <div>
                        <Label>Drag Elements to Canvas</Label>
                        <Droppable droppableId="palette" isDropDisabled={true}>
                          {(provided) => (
                            <div 
                              {...provided.droppableProps} 
                              ref={provided.innerRef}
                              className="grid grid-cols-1 gap-2 mt-2"
                            >
                              <Draggable draggableId="palette-text" index={0}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`border-2 border-dashed border-primary rounded-lg p-3 cursor-grab hover:bg-primary/5 transition-colors ${
                                      snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Type className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Text Element</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Add custom text to your page</p>
                                  </div>
                                )}
                              </Draggable>
                              
                              <Draggable draggableId="palette-button" index={1}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`border-2 border-dashed border-primary rounded-lg p-3 cursor-grab hover:bg-primary/5 transition-colors ${
                                      snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Plus className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">Button Element</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Interactive button component</p>
                                  </div>
                                )}
                              </Draggable>
                              
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 opacity-50">
                                <div className="flex items-center gap-2">
                                  <Square className="h-4 w-4" />
                                  <span className="text-sm font-medium">Input Field</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Form input elements (coming soon)</p>
                              </div>
                              
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 opacity-50">
                                <div className="flex items-center gap-2">
                                  <Minus className="h-4 w-4" />
                                  <span className="text-sm font-medium">Divider</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Section separator (coming soon)</p>
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>

                      {/* Element Properties Panel */}
                      {pageElements.length > 0 && (
                        <div>
                          <Label>Page Elements ({pageElements.length})</Label>
                          <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                            {pageElements.map((element) => (
                              <div key={element.id} className="border rounded p-2 bg-background">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium capitalize">{element.type}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removePageElement(element.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                {(element.type === 'text' || element.type === 'button') && (
                                  <Input
                                    value={element.content || ''}
                                    onChange={(e) => updatePageElement(element.id, { content: e.target.value })}
                                    placeholder="Element content"
                                    className="text-xs"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                  <Input
                                    type="number"
                                    placeholder="X"
                                    value={element.position.x}
                                    onChange={(e) => updatePageElement(element.id, { 
                                      position: { ...element.position, x: parseInt(e.target.value) || 0 } 
                                    })}
                                    className="text-xs h-6"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Y"
                                    value={element.position.y}
                                    onChange={(e) => updatePageElement(element.id, { 
                                      position: { ...element.position, y: parseInt(e.target.value) || 0 } 
                                    })}
                                    className="text-xs h-6"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="form-builder" className="space-y-4">
                      <div>
                        <Label>Registration Form Builder</Label>
                        <div className="mt-2 border rounded-lg p-3 bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-3">
                            Create custom form fields for your event registration
                          </p>
                          <FormBuilder
                            eventId={generatedEvent?.id}
                            initialSchema={formFields}
                            onSave={(fields) => {
                              setFormFields(fields);
                              toast({
                                title: "Form Schema Saved",
                                description: `Saved ${fields.length} custom form fields.`,
                              });
                            }}
                            onChange={(fields) => {
                              // Auto-sync form fields as user makes changes
                              setFormFields(fields);
                            }}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* QR Preview & Device Preview */}
            <div className={qrMode === 'basic' ? 'xl:col-span-3' : 'xl:col-span-1'}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {qrMode === 'basic' ? 'QR Code Preview' : 'QR & Page Preview'}
                    </CardTitle>
                    {qrMode === 'enhanced' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={devicePreview === 'desktop' ? 'default' : 'outline'}
                          onClick={() => setDevicePreview('desktop')}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === 'tablet' ? 'default' : 'outline'}
                          onClick={() => setDevicePreview('tablet')}
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === 'mobile' ? 'default' : 'outline'}
                          onClick={() => setDevicePreview('mobile')}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`mx-auto bg-muted rounded-lg p-6 transition-all duration-300 ${getDeviceClass()}`}>
                    {/* QR Code Display */}
                    <div className="bg-white rounded-lg border-2 border-dashed border-border flex items-center justify-center mb-4" 
                         style={{ height: qrMode === 'basic' ? '300px' : '200px' }}>
                      {qrCodeDataURL ? (
                        <img 
                          src={qrCodeDataURL} 
                          alt="QR Code" 
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <QrCode className="h-12 w-12 mx-auto mb-2" />
                          <p>QR Code Preview</p>
                          <p className="text-sm">Generate to see QR code</p>
                        </div>
                      )}
                    </div>

                    {/* Visual Page Canvas (Enhanced Mode Only) */}
                    {qrMode === 'enhanced' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Page Canvas</Label>
                          <div className="text-xs text-muted-foreground">
                            {devicePreview === 'desktop' && 'Desktop View (max-width: 672px)'}
                            {devicePreview === 'tablet' && 'Tablet View (max-width: 448px)'}
                            {devicePreview === 'mobile' && 'Mobile View (max-width: 384px)'}
                          </div>
                        </div>
                        <Droppable droppableId="canvas">
                          {(provided, snapshot) => (
                            <div
                              id="canvas-container"
                              {...provided.droppableProps}
                              ref={(el) => {
                                provided.innerRef(el);
                                canvasRef.current = el;
                              }}
                              className={`relative bg-white rounded-lg border-2 border-dashed min-h-96 overflow-hidden transition-all duration-200 ${
                                snapshot.isDraggingOver 
                                  ? 'border-primary bg-primary/5 border-solid shadow-md' 
                                  : 'border-border'
                              }`}
                              style={{ 
                                height: '400px',
                                background: 'white',
                                maxWidth: devicePreview === 'mobile' ? '384px' : devicePreview === 'tablet' ? '448px' : '100%'
                              }}
                            >
                            {pageElements.length === 0 ? (
                              <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                                <div>
                                  <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p className="font-medium">Drag Elements Here</p>
                                  <p className="text-sm">Create your custom registration page</p>
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Positioned Elements */}
                            {pageElements.map((element) => (
                              <Draggable key={element.id} draggableId={element.id} index={0}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`absolute cursor-move border-2 transition-all ${
                                      snapshot.isDragging 
                                        ? 'border-primary shadow-lg z-10' 
                                        : 'border-transparent hover:border-primary/50'
                                    }`}
                                    style={{
                                      left: `${element.position.x}px`,
                                      top: `${element.position.y}px`,
                                      width: `${element.size.width}px`,
                                      minHeight: `${element.size.height}px`,
                                      zIndex: snapshot.isDragging ? 1000 : 1,
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    {element.type === 'text' && (
                                      <div 
                                        className="p-2 bg-white rounded"
                                        style={element.style}
                                      >
                                        {element.content || 'Sample Text'}
                                      </div>
                                    )}
                                    {element.type === 'button' && (
                                      <button 
                                        className="px-4 py-2 rounded pointer-events-none"
                                        style={element.style}
                                      >
                                        {element.content || 'Button'}
                                      </button>
                                    )}
                                    {element.type === 'input' && (
                                      <input 
                                        type="text" 
                                        placeholder="Input field"
                                        className="w-full p-2 border rounded pointer-events-none"
                                        readOnly
                                      />
                                    )}
                                    {element.type === 'divider' && (
                                      <hr className="border-t w-full" />
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 mt-4">
                      <Button 
                        onClick={handleDownloadQR} 
                        disabled={!qrCodeDataURL}
                        className="w-full"
                        variant="secondary"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download {qrMode === 'basic' ? 'QR Code' : 'Enhanced QR'}
                      </Button>
                      <Button 
                        onClick={handleShareLink} 
                        disabled={!generatedEvent}
                        className="w-full"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Registration Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DragDropContext>

          {/* Mobile Registration Form Preview */}
          {generatedEvent && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Registration Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`mx-auto bg-background border border-border rounded-2xl p-4 shadow-lg ${getDeviceClass()}`}>
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-foreground">{generatedEvent.name}</h4>
                    <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-muted-foreground">
                      {generatedEvent.eventDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(generatedEvent.eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {generatedEvent.eventTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{generatedEvent.eventTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                      <Input placeholder="Enter your name" className="text-sm" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                      <Input placeholder="+84 xxx xxx xxx" className="text-sm" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Position/Role</label>
                      <Select>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {form.watch("includeEmail") && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <Input placeholder="your.email@example.com" className="text-sm" />
                      </div>
                    )}
                    
                    <Button className="w-full text-sm font-medium">
                      Register Now
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}