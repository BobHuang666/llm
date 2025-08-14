// components/file-preview.tsx
'use client';

import { FileText, X } from 'lucide-react';
import Image from 'next/image';
import { FileContent } from '@/lib/types';

export const FilePreview = ({
  content,
  onRemove
}: {
  content: FileContent;
  onRemove?: () => void;
}) => {
  const isImage = content.mimeType.startsWith('image/');
  const isPDF = content.mimeType === 'application/pdf';

  return (
    <div className="relative group border rounded-lg p-2 bg-gray-700 hover:bg-gray-600 transition-colors">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 z-10"
          aria-label="移除文件"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="flex flex-col items-center gap-2">

        {isImage ? (
          <Image
            src={content.url}
            alt={content.name}
            width={128}
            height={128}
            className="h-32 w-32 object-cover rounded-md"
            style={{ objectFit: 'cover', borderRadius: '0.375rem' }}
          />
        ) : isPDF ? (
          <div className="w-32 h-32 bg-gray-800 rounded-md flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-800 rounded-md flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <span className="text-sm text-gray-300 truncate max-w-[120px]">
          {content.name}
        </span>
      </div>
    </div>
  );
};