// src/components/common/ImageUploader.tsx
import { useState } from 'react';
import axios from '../../api/axios'; // axios instance đã set baseURL + bearer token (nếu có)

type Props = {
  onUploaded?: (url: string, publicId: string) => void;
  folder?: string; // vd: "vicedu/images/users"
};

export default function ImageUploader({ onUploaded, folder = 'vicedu/images' }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);

    // 1) xin chữ ký từ BE
    const { data: sign } = await axios.get('/api/uploads/cloudinary-signature', {
      params: { folder, upload_preset: 'vicedu_default' },
    });

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sign.apiKey);
    form.append('timestamp', sign.timestamp);
    form.append('upload_preset', sign.upload_preset);
    form.append('folder', sign.folder);
    form.append('signature', sign.signature);

    // 2) gọi Cloudinary API
    const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;

    const res = await fetch(cloudinaryEndpoint, {
      method: 'POST',
      body: form,
    });

    const json = await res.json();

    if (json.secure_url && json.public_id) {
      onUploaded?.(json.secure_url, json.public_id);
    } else {
      alert('Upload thất bại!');
    }

    setBusy(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <input
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        disabled={!file || busy}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {busy ? 'Đang tải...' : 'Upload'}
      </button>
      {progress > 0 && <div className="text-sm mt-2">{progress}%</div>}
    </div>
  );
}
