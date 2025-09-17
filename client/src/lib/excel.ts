import * as XLSX from 'xlsx';
import { Registration, Event } from '@shared/schema';

export interface ExportData extends Registration {
  eventName?: string;
  formattedDate?: string;
}

export const exportToExcel = async (registrations: ExportData[], events: Event[], filename: string = 'registrations.xlsx') => {
  try {
    // Create enhanced data with event names and formatted dates
    const exportData = registrations.map(registration => {
      const event = events.find(e => e.id === registration.eventId);
      const registeredDate = new Date(registration.registeredAt!);
      
      return {
        Position: registration.position || 'N/A',
        Name: registration.name,
        'Phone Number': registration.phone,
        Email: registration.email || 'N/A',
        Event: event?.name || 'Unknown Event',
        'Registration Date': registeredDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        'Registration Time': registeredDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        'Full Timestamp': registeredDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Position
      { wch: 25 }, // Name
      { wch: 18 }, // Phone Number
      { wch: 30 }, // Email
      { wch: 30 }, // Event
      { wch: 15 }, // Registration Date
      { wch: 15 }, // Registration Time
      { wch: 20 }, // Full Timestamp
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};
