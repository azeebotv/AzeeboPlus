import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="plans" />
      <Stack.Screen name="current" />
      <Stack.Screen name="history" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}
