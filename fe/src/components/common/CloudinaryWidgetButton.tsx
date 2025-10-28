// src/components/common/CloudinaryWidgetButton.tsx
declare global { interface Window { cloudinary: any } }

export default function CloudinaryWidgetButton({ onDone }: { onDone: (url: string, publicId: string) => void }) {
  const openWidget = () => {
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'vicedu_default', // có thể dùng unsigned preset nếu bạn cho phép
        folder: 'vicedu/images',
        multiple: false,
        sources: ['local', 'camera', 'url'],
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          onDone(result.info.secure_url, result.info.public_id);
        }
      }
    );
    widget.open();
  };

  return (
    <button onClick={openWidget} className="px-4 py-2 bg-purple-600 text-white rounded">
      Upload bằng Widget
    </button>
  );
}
