import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TippingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/tipping');
  }, []);
  return null;
}
