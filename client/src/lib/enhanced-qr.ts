import QRCode from 'qrcode';

export interface QRCustomization {
  // Basic QR settings
  size: number;
  margin: number;
  
  // Colors
  foregroundColor: string;
  backgroundColor: string;
  
  // Background image
  backgroundImage?: string;
  
  // QR positioning on background
  qrPosition: {
    x: number;
    y: number;
  };
  
  // Text overlays
  textOverlays: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
  }>;
  
  // Output settings
  format: 'png' | 'jpeg';
  quality: number;
}

export const generateEnhancedQRCode = async (
  url: string,
  customization: Partial<QRCustomization> = {}
): Promise<string> => {
  const settings: QRCustomization = {
    size: 256,
    margin: 2,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    qrPosition: { x: 0, y: 0 },
    textOverlays: [],
    format: 'png',
    quality: 0.8,
    ...customization
  };

  try {
    // Generate the base QR code
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: settings.size,
      margin: settings.margin,
      color: {
        dark: settings.foregroundColor,
        light: settings.backgroundColor
      }
    });

    // If no background image or overlays, return the basic QR code
    if (!settings.backgroundImage && settings.textOverlays.length === 0) {
      return qrCodeDataURL;
    }

    // Create canvas for enhanced QR code composition
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Load QR code image
    const qrImage = new Image();
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
      qrImage.src = qrCodeDataURL;
    });

    let finalWidth = settings.size;
    let finalHeight = settings.size;
    
    // Load background image if provided
    let backgroundImage: HTMLImageElement | null = null;
    if (settings.backgroundImage) {
      backgroundImage = new Image();
      await new Promise((resolve, reject) => {
        backgroundImage!.onload = resolve;
        backgroundImage!.onerror = reject;
        backgroundImage!.src = settings.backgroundImage!;
      });
      
      // Use background image dimensions for canvas
      finalWidth = backgroundImage.width;
      finalHeight = backgroundImage.height;
    }

    // Set canvas dimensions
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Draw background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, finalWidth, finalHeight);
    } else {
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    // Calculate QR code position
    const qrX = settings.qrPosition.x;
    const qrY = settings.qrPosition.y;
    
    // Draw QR code
    ctx.drawImage(qrImage, qrX, qrY, settings.size, settings.size);

    // Draw text overlays
    settings.textOverlays.forEach(overlay => {
      ctx.fillStyle = overlay.color;
      ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(overlay.text, overlay.x, overlay.y);
    });

    // Return the enhanced QR code as data URL
    return canvas.toDataURL(`image/${settings.format}`, settings.quality);
    
  } catch (error) {
    console.error('Error generating enhanced QR code:', error);
    throw new Error('Failed to generate enhanced QR code');
  }
};

export const downloadEnhancedQRCode = (
  dataURL: string, 
  filename: string = 'enhanced-qr-code.png'
) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Preset QR styles for quick selection
export const qrPresets = {
  classic: {
    size: 256,
    margin: 2,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    qrPosition: { x: 0, y: 0 }
  },
  modern: {
    size: 300,
    margin: 1,
    foregroundColor: '#1f2937',
    backgroundColor: '#f9fafb',
    qrPosition: { x: 50, y: 50 }
  },
  colorful: {
    size: 280,
    margin: 2,
    foregroundColor: '#3b82f6',
    backgroundColor: '#dbeafe',
    qrPosition: { x: 25, y: 25 }
  },
  business: {
    size: 320,
    margin: 3,
    foregroundColor: '#111827',
    backgroundColor: '#ffffff',
    qrPosition: { x: 40, y: 40 }
  }
};

// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Validate image file
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};