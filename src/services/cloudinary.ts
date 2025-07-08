// Cloudinary service for image uploads
export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  private cloudName: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ddblpagys';
  }

  async uploadProfilePicture(file: File): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'profile_pictures'); // You'll need to create this preset in Cloudinary
    formData.append('folder', 'chrysalis/profiles');
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async uploadImageFromURL(imageUrl: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('upload_preset', 'profile_pictures');
    formData.append('folder', 'chrysalis/profiles');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image from URL');
    }
  }

  generateProfilePictureURL(publicId: string, transformations?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const transforms = transformations || 'w_200,h_200,c_fill,f_auto,q_auto';
    return `${baseUrl}/${transforms}/${publicId}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteImage(_publicId: string): Promise<void> {
    // Note: Deletion requires server-side implementation with API secret
    // This would need to be handled by a backend endpoint
    console.warn('Image deletion requires server-side implementation');
    return Promise.resolve();
  }
}

export const cloudinaryService = new CloudinaryService();
