// components/file-preview.tsx
'use client';

import { FileText, Image as ImageIcon, X } from 'lucide-react';

export const FilePreview = ({
  content,
  onRemove
}: {
  content: FileContent;
  onRemove?: () => void;
}) => {
  const isImage = content.mimeType.startsWith('image/');

  return (
    <div className="relative group border rounded-lg p-2 bg-gray-700">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {isImage ? (
        <a href={content.url} target="_blank" rel="noopener">
          <img
            src={content.url}
            alt={content.name}
            className="h-24 w-24 object-cover rounded-md"
          />
        </a>
      ) : (
        <a
          href={content.url}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
          download
        >
          <FileText className="w-6 h-6" />
          <span className="text-sm max-w-[120px] truncate">{content.name}</span>
        </a>
      )}
    </div>
  );
};