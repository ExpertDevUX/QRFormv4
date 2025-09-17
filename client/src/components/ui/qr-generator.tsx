import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode, Download, Share2, Calendar, Clock } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateQRCode, downloadQRCode } from "@/lib/qr";

const formSchema = insertEventSchema.extend({
  includeEmail: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function QRGenerator() {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [generatedEvent, setGeneratedEvent] = useState<any>(null);
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

  const createEventMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { includeEmail, ...eventData } = data;
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: async (event) => {
      setGeneratedEvent(event);
      const registrationUrl = `${window.location.origin}/register/${event.id}`;
      
      try {
        const qrCode = await generateQRCode(registrationUrl);
        setQrCodeDataURL(qrCode);
        
        toast({
          title: "QR Code Generated",
          description: "Your registration QR code has been created successfully.",
        });
      } catch (error) {
        toast({
          title: "QR Generation Failed",
          description: "Failed to generate QR code. Please try again.",
          variant: "destructive",
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
      downloadQRCode(qrCodeDataURL, `${generatedEvent.name.replace(/\s+/g, '-')}-qr-code.png`);
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create QR Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Configuration */}
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
                            data-testid="input-event-name"
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
                            data-testid="input-event-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              data-testid="input-event-date"
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
                              data-testid="input-event-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Registration Fields</FormLabel>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked disabled />
                        <label className="text-sm text-foreground">Name (Required)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked disabled />
                        <label className="text-sm text-foreground">Phone Number (Required)</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked disabled />
                        <label className="text-sm text-foreground">Position/Role (Required)</label>
                      </div>
                      <FormField
                        control={form.control}
                        name="includeEmail"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-include-email"
                            />
                            <label className="text-sm text-foreground">Email (Optional)</label>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createEventMutation.isPending}
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {createEventMutation.isPending ? "Generating..." : "Generate QR Code"}
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* QR Code Preview */}
            <div className="bg-muted rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="w-64 h-64 bg-white rounded-lg border-2 border-dashed border-border flex items-center justify-center mb-4">
                {qrCodeDataURL ? (
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code" 
                    className="w-full h-full object-contain rounded-lg"
                    data-testid="img-qr-code"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-2" />
                    <p>QR Code Preview</p>
                    <p className="text-sm">Generate to see QR code</p>
                  </div>
                )}
              </div>
              
              <div className="w-full space-y-2">
                <Button 
                  onClick={handleDownloadQR} 
                  disabled={!qrCodeDataURL}
                  className="w-full"
                  variant="secondary"
                  data-testid="button-download-qr"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                <Button 
                  onClick={handleShareLink} 
                  disabled={!generatedEvent}
                  className="w-full"
                  data-testid="button-share-link"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Registration Link
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile Registration Form Preview */}
      {generatedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Mobile Registration Form Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto bg-background border border-border rounded-2xl p-4 shadow-lg">
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
    </div>
  );
}
