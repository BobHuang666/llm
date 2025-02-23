// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 限制文件大小（示例为4MB）
    const MAX_FILE_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）` },
        { status: 400 }
      );
    }

    // 限制文件类型
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: 'public',
      // 如果需要指定存储区域：
      // region: 'auto' // 或 'iad1', 'sfo1' 等
    });

    return NextResponse.json({
      url: blob.url,
      name: blob.pathname,
      size: blob.size,
    });

  } catch (error) {
    console.error('上传错误:', error);
    return NextResponse.json(
      { error: '文件上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}