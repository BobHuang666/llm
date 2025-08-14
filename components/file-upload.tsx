// components/file-upload.tsx
'use client';

import { useState } from 'react';
import { FilePlus } from 'lucide-react';

export const FileUpload = ({
  onUpload,
  disabled
}: {
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 添加进度模拟（实际应根据API响应实现）
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      await onUpload(file);

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="relative">
      <label className={`flex items-center justify-center w-10 h-10 rounded-md ${disabled ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'
        } transition-colors`}>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        {uploadProgress > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-blue-500 rounded-md"
              style={{ width: `${uploadProgress}%` }}
            />
            <span className="relative text-xs text-white">
              {uploadProgress}%
            </span>
          </div>
        ) : (
          <FilePlus className="w-5 h-5 text-white" />
        )}
      </label>
    </div>
  );
};