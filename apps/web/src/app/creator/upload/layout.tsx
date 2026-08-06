import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Content',
  description: 'Azeebo+ - Upload and share your video, image, or audio content with the community',
};

export default function CreatorUploadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
