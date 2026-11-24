import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TippingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/tipping');
  }, []);
  return <View accessible={true} accessibilityLabel="Tipping Redirect Screen" />;
}
