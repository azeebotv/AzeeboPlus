import { redirect } from 'next/navigation';

/**
 * Creator Upload Page alias
 * Canonical creator route lives at `/creator/upload`.
 */
export default function CreatorUploadPage() {
  redirect('/creator/upload');
}
