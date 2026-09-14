import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View className="flex-1 items-center justify-center p-5 bg-[#FBF8F3]">
        <Text className="text-xl font-bold text-ink mb-2">Écran introuvable</Text>
        <Link href="/" className="mt-4 py-3 px-5 bg-primary rounded-xl">
          <Text className="text-white font-semibold text-sm">Retourner à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}
