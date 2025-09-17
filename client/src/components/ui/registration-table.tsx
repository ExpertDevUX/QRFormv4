import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Registration, Event, insertRegistrationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const editFormSchema = insertRegistrationSchema.omit({ eventId: true }).extend({
  position: z.string().min(1, "Position is required"),
});

type EditFormData = z.infer<typeof editFormSchema>;

export function RegistrationTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      position: "",
      email: "",
    },
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditFormData }) => {
      const response = await apiRequest("PATCH", `/api/registrations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      setEditingRegistration(null);
      editForm.reset();
      toast({
        title: "Registration Updated",
        description: "Registration has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/registrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Registration Deleted",
        description: "Registration has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRegistrations = registrations.filter((registration) => {
    const matchesSearch = registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.phone.includes(searchTerm) ||
                         (registration.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesEvent = selectedEvent === "all" || registration.eventId === selectedEvent;
    
    return matchesSearch && matchesEvent;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(new Set(filteredRegistrations.map(r => r.id)));
    } else {
      setSelectedRegistrations(new Set());
    }
  };

  const handleSelectRegistration = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRegistrations);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRegistrations(newSelected);
  };

  const handleEdit = (registration: Registration) => {
    setEditingRegistration(registration);
    editForm.reset({
      name: registration.name,
      phone: registration.phone,
      position: registration.position || "",
      email: registration.email || "",
    });
  };

  const handleEditSubmit = (data: EditFormData) => {
    if (editingRegistration) {
      updateRegistrationMutation.mutate({ id: editingRegistration.id, data });
    }
  };

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event?.name || "Unknown Event";
  };

  const formatRegistrationDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'player': return 'bg-primary/10 text-primary';
      case 'coach': return 'bg-accent/10 text-accent';
      case 'manager': return 'bg-green-500/10 text-green-600';
      case 'staff': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (registrationsLoading) {
    return <div className="flex justify-center p-8">Loading registrations...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-foreground">Registration Management</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                  data-testid="input-search-registrations"
                />
              </div>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-[200px]" data-testid="select-event-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRegistrations.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedRegistrations.has(registration.id)}
                          onCheckedChange={(checked) => handleSelectRegistration(registration.id, checked as boolean)}
                          data-testid={`checkbox-registration-${registration.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground" data-testid={`text-name-${registration.id}`}>
                            {registration.name}
                          </div>
                          {registration.email && (
                            <div className="text-sm text-muted-foreground" data-testid={`text-email-${registration.id}`}>
                              {registration.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-phone-${registration.id}`}>
                        {registration.phone}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPositionBadgeColor(registration.position || '')}`} data-testid={`text-position-${registration.id}`}>
                          {registration.position || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-event-${registration.id}`}>
                        {getEventName(registration.eventId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-${registration.id}`}>
                        {formatRegistrationDate(registration.registeredAt!)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(registration)}
                            data-testid={`button-edit-${registration.id}`}
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRegistrationMutation.mutate(registration.id)}
                            data-testid={`button-delete-${registration.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="p-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredRegistrations.length} of {registrations.length} registrations
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedRegistrations.size > 0 && `${selectedRegistrations.size} selected`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingRegistration} onOpenChange={() => setEditingRegistration(null)}>
        <DialogContent data-testid="dialog-edit-registration">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-position">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setEditingRegistration(null)}
                  className="flex-1"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={updateRegistrationMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateRegistrationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
