import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react-native';
import { api } from '@/lib/api';
import { hapticSuccess, hapticSelection } from '@/lib/haptics';

export default function AdminConnexionScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('E-mail invalide', 'Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    try {
      setIsLoading(true);
      await api.adminLogin(email.trim().toLowerCase());
      hapticSuccess();
      setIsSent(true);
    } catch (err: any) {
      // Pour des raisons de sécurité, on confirme toujours l'envoi même si le compte n'existe pas
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <TouchableOpacity
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          className="absolute top-12 left-6 p-2 rounded-full bg-white border border-border"
        >
          <ArrowLeft color="#1C2541" size={20} />
        </TouchableOpacity>

        <View className="bg-white border border-[#EAE3D8] rounded-3xl p-6 shadow-sm">
          <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-4 self-center">
            <ShieldCheck color="#2F4A78" size={30} />
          </View>

          <Text className="text-xl font-bold text-ink text-center">
            Espace d'Administration
          </Text>
          <Text className="text-xs text-ink-muted text-center mt-1 mb-6 leading-relaxed">
            Réservé aux modérateurs et aux administrateurs de Ma boîte à prière.
          </Text>

          {isSent ? (
            <View className="items-center py-4">
              <Mail color="#6FA287" size={36} />
              <Text className="font-bold text-ink text-base mt-3 text-center">
                Lien magique envoyé !
              </Text>
              <Text className="text-xs text-ink-muted text-center mt-2 leading-relaxed">
                Consultez votre messagerie sur cet appareil et appuyez sur le lien reçu pour vous
                connecter automatiquement.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/(public)')}
                className="mt-6 bg-primary py-3 px-6 rounded-2xl"
              >
                <Text className="text-white font-semibold text-xs">Retour à l'accueil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                Adresse e-mail administrateur
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="pasteur@eglise.fr"
                placeholderTextColor="#8C96AB"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-[#FBF8F3] border border-border rounded-2xl p-3.5 text-ink text-sm mb-4"
              />

              <TouchableOpacity
                onPress={handleSendMagicLink}
                disabled={isLoading}
                className={`py-3.5 rounded-2xl items-center shadow-sm ${
                  isLoading ? 'bg-primary/70' : 'bg-primary'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-sm">
                    Recevoir le lien de connexion
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
