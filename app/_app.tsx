// pages/_app.tsx
import { useEffect } from 'react';
import { verifyPermissions } from '@/lib/coze-client';

function MyApp({ Component, pageProps }: any) {
  useEffect(() => {
    verifyPermissions().catch((error) => {
      console.error('应用初始化失败:', error.message);
      alert('应用初始化失败，请检查控制台日志');
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;