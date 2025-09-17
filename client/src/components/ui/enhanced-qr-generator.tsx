import { useState, useEffect } from "react";
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
  Sparkles
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema, insertQrSettingsSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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

export function EnhancedQRGenerator() {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [generatedEvent, setGeneratedEvent] = useState<any>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("classic");
  
  // QR Customization state
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

  // Update QR code when customization changes
  useEffect(() => {
    if (generatedEvent) {
      generateQRPreview();
    }
  }, [qrCustomization, backgroundImage, textOverlays, generatedEvent]);

  const generateQRPreview = async () => {
    if (!generatedEvent) return;
    
    try {
      const registrationUrl = `${window.location.origin}/register/${generatedEvent.id}`;
      const customization: Partial<QRCustomization> = {
        ...qrCustomization,
        backgroundImage: backgroundImage || undefined,
        textOverlays: textOverlays
      };
      
      const enhancedQR = await generateEnhancedQRCode(registrationUrl, customization);
      setQrCodeDataURL(enhancedQR);
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
      
      // Save QR settings to database
      try {
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
            quality: qrCustomization.quality
          }
        };
        
        await apiRequest("POST", "/api/qr-settings", qrSettings);
      } catch (error) {
        console.error('Error saving QR settings:', error);
      }

      await generateQRPreview();
      
      toast({
        title: "Enhanced QR Code Generated",
        description: "Your customized registration QR code has been created successfully.",
      });
      
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
      const filename = `${generatedEvent.name.replace(/\s+/g, '-')}-enhanced-qr.${qrCustomization.format || 'png'}`;
      downloadEnhancedQRCode(qrCodeDataURL, filename);
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

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            Enhanced QR Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Event Form */}
            <div className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>Event Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of your event" 
                            rows={3} 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createEventMutation.isPending}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {createEventMutation.isPending ? "Generating..." : "Generate Enhanced QR Code"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* QR Customization */}
            <div className="space-y-6">
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
                    <Label>QR Code Size: {qrCustomization.size}px</Label>
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

                  <div>
                    <Label>Margin: {qrCustomization.margin}px</Label>
                    <Slider
                      value={[qrCustomization.margin || 2]}
                      onValueChange={(value) => 
                        setQrCustomization(prev => ({ ...prev, margin: value[0] }))
                      }
                      max={10}
                      min={0}
                      step={1}
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
                      <Label>Background Color</Label>
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
                    <Card key={overlay.id} className="p-4">
                      <div className="space-y-3">
                        <Input
                          value={overlay.text}
                          onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                          placeholder="Enter text"
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">X Position</Label>
                            <Input
                              type="number"
                              value={overlay.x}
                              onChange={(e) => updateTextOverlay(overlay.id, { x: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Y Position</Label>
                            <Input
                              type="number"
                              value={overlay.y}
                              onChange={(e) => updateTextOverlay(overlay.id, { y: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              value={overlay.fontSize}
                              onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) || 16 })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Color</Label>
                            <Input
                              type="color"
                              value={overlay.color}
                              onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                            />
                          </div>
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
            </div>

            {/* QR Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-6 flex flex-col items-center justify-center min-h-64">
                    {qrCodeDataURL ? (
                      <img 
                        src={qrCodeDataURL} 
                        alt="Enhanced QR Code" 
                        className="max-w-full max-h-64 object-contain rounded-lg border"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <QrCode className="h-12 w-12 mx-auto mb-2" />
                        <p>Enhanced QR Preview</p>
                        <p className="text-sm">Generate to see your custom QR code</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Button 
                      onClick={handleDownloadQR} 
                      disabled={!qrCodeDataURL}
                      className="w-full"
                      variant="secondary"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Enhanced QR Code
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
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}