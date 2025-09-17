import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, QrCode, Download, Zap, Trophy, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { UnifiedQRGenerator } from "@/components/ui/unified-qr-generator";
import { RegistrationTable } from "@/components/ui/registration-table";
import { PageBuilder } from "@/pages/page-builder";
import { Event } from "@shared/schema";

interface DashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Dashboard({ activeTab, onTabChange }: DashboardProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const recentEvents = events.slice(0, 3);

  const renderDashboardContent = () => (
    <div>
      {/* Hero Section */}
      <section className="gradient-bg rounded-2xl text-white p-8 mb-8">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold mb-4">Create QR Registration Forms</h2>
          <p className="text-xl text-white/90 mb-6">
            Generate QR codes for event registration with automatic data collection and Excel export capabilities.
          </p>
          <Button 
            onClick={() => onTabChange('unified-generator')}
            className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            data-testid="button-create-event"
          >
            <Zap className="mr-2 h-5 w-5" />
            Create New Event
          </Button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Events"
          value={(stats as any)?.totalEvents || 0}
          icon={Calendar}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Total Registrations"
          value={(stats as any)?.totalRegistrations || 0}
          icon={Users}
          iconColor="bg-accent/10 text-accent"
        />
        <StatsCard
          title="Active QR Codes"
          value={(stats as any)?.activeQRs || 0}
          icon={QrCode}
          iconColor="bg-green-500/10 text-green-500"
        />
        <StatsCard
          title="Exports This Month"
          value={(stats as any)?.exports || 0}
          icon={Download}
          iconColor="bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No events created yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first event to get started</p>
              <Button 
                onClick={() => onTabChange('unified-generator')}
                className="mt-4"
                data-testid="button-create-first-event"
              >
                <Target className="mr-2 h-4 w-4" />
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0" data-testid={`event-item-${event.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground" data-testid={`event-name-${event.id}`}>
                        {event.name}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`event-date-${event.id}`}>
                        Created {new Date(event.createdAt!).toLocaleDateString()} 
                        {event.eventDate && ` • Event: ${new Date(event.eventDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (activeTab === 'unified-generator') {
    return <UnifiedQRGenerator />;
  }

  if (activeTab === 'page-builder') {
    return <PageBuilder />;
  }

  if (activeTab === 'registrations') {
    return <RegistrationTable />;
  }

  return renderDashboardContent();
}
