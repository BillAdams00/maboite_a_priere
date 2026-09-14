import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Globe, CheckCircle2, Shield, HeartHandshake } from 'lucide-react-native';
import { api } from '@/lib/api';
import { saveMyRequest } from '@/lib/secure-store';
import { hapticSuccess, hapticSelection } from '@/lib/haptics';
import { CATEGORIES } from '@maboiteapriere/shared';

export default function DeposerScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [category, setCategory] = useState<string | null>(null);
  const [displayAsAnonymous, setDisplayAsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (firstName.trim().length < 2) {
      Alert.alert('Prénom requis', 'Veuillez saisir votre prénom (au moins 2 caractères).');
      return;
    }
    if (lastName.trim().length < 2) {
      Alert.alert('Nom requis', 'Veuillez renseigner votre nom de famille.');
      return;
    }
    if (content.trim().length < 10) {
      Alert.alert('Sujet trop court', 'Votre sujet de prière doit contenir au moins 10 caractères.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createPrayerRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        content: content.trim(),
        visibility,
        category,
        displayAsAnonymous,
      });

      // Sauvegarde dans le trousseau local de l'appareil
      await saveMyRequest({
        id: res.id,
        manageToken: res.manageToken,
        publicSlug: res.publicSlug,
        createdAt: new Date().toISOString(),
      });

      hapticSuccess();
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de l’envoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-[#FBF8F3] justify-center px-6">
        <View className="bg-white border border-[#EAE3D8] rounded-3xl p-6 items-center shadow-sm">
          <View className="w-16 h-16 rounded-full bg-peace/10 items-center justify-center mb-4">
            <CheckCircle2 color="#6FA287" size={36} />
          </View>
          <Text className="text-xl font-bold text-ink text-center">
            Ton sujet a bien été déposé 🙏
          </Text>
          <Text className="text-sm text-ink-muted text-center mt-2 leading-relaxed">
            {visibility === 'PUBLIC'
              ? 'La communauté chrétienne va pouvoir intercéder fidèlement pour toi.'
              : 'Ton sujet a été transmis de manière sécurisée et confidentielle à l’équipe pastorale.'}
          </Text>

          <View className="w-full mt-6 gap-3">
            <TouchableOpacity
              onPress={() => {
                hapticSelection();
                setIsSubmitted(false);
                setFirstName('');
                setLastName('');
                setContent('');
                router.push('/(public)/mes-sujets');
              }}
              className="bg-primary py-3.5 px-4 rounded-2xl items-center"
            >
              <Text className="text-white font-semibold text-sm">Voir dans « Mes sujets »</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                hapticSelection();
                setIsSubmitted(false);
                router.push('/(public)/communaute');
              }}
              className="bg-cream border border-border py-3 px-4 rounded-2xl items-center"
            >
              <Text className="text-ink font-semibold text-sm">Prier pour les autres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-4 pb-2">
            <Text className="text-2xl font-bold text-ink">Déposer un sujet</Text>
            <Text className="text-sm text-ink-muted mt-0.5">
              Partage ton fardeau, une prière sera élevée pour toi.
            </Text>
          </View>

          {/* Choix de confidentialité */}
          <View className="mt-5">
            <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
              Confidentialité de votre sujet
            </Text>

            <View className="flex-row gap-3">
              {/* Option Public */}
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setVisibility('PUBLIC');
                }}
                activeOpacity={0.8}
                className={`flex-1 p-4 rounded-2xl border ${
                  visibility === 'PUBLIC'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white'
                }`}
              >
                <View className="flex-row items-center mb-1">
                  <Globe color={visibility === 'PUBLIC' ? '#2F4A78' : '#8C96AB'} size={18} />
                  <Text
                    className={`font-bold text-sm ml-1.5 ${
                      visibility === 'PUBLIC' ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    Public
                  </Text>
                </View>
                <Text className="text-xs text-ink-muted leading-tight">
                  Visible par la communauté afin qu'elle prie pour vous.
                </Text>
              </TouchableOpacity>

              {/* Option Privé */}
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setVisibility('PRIVATE');
                }}
                activeOpacity={0.8}
                className={`flex-1 p-4 rounded-2xl border ${
                  visibility === 'PRIVATE'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white'
                }`}
              >
                <View className="flex-row items-center mb-1">
                  <Lock color={visibility === 'PRIVATE' ? '#2F4A78' : '#8C96AB'} size={18} />
                  <Text
                    className={`font-bold text-sm ml-1.5 ${
                      visibility === 'PRIVATE' ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    Privé
                  </Text>
                </View>
                <Text className="text-xs text-ink-muted leading-tight">
                  Accessible uniquement aux administrateurs.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nom & Prénom */}
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                Prénom *
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ex. Samuel"
                placeholderTextColor="#8C96AB"
                className="bg-white border border-border rounded-xl px-3.5 py-2.5 text-ink text-sm"
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                Nom *
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ex. Dubois"
                placeholderTextColor="#8C96AB"
                className="bg-white border border-border rounded-xl px-3.5 py-2.5 text-ink text-sm"
              />
            </View>
          </View>
          <Text className="text-[11px] text-ink-muted mt-1 flex-row items-center">
            🔒 Votre nom de famille ne sera jamais affiché publiquement.
          </Text>

          {/* Anonymat facultatif */}
          {visibility === 'PUBLIC' && (
            <TouchableOpacity
              onPress={() => setDisplayAsAnonymous(!displayAsAnonymous)}
              className="mt-3 flex-row items-center bg-white border border-border rounded-xl p-3"
            >
              <View
                className={`w-5 h-5 rounded border items-center justify-center mr-2.5 ${
                  displayAsAnonymous ? 'bg-primary border-primary' : 'border-border bg-cream'
                }`}
              >
                {displayAsAnonymous && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-xs text-ink flex-1">
                Publier sans afficher mon prénom (« Un frère · une sœur »)
              </Text>
            </TouchableOpacity>
          )}

          {/* Catégories */}
          <View className="mt-5">
            <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
              Catégorie (facultatif)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      hapticSelection();
                      setCategory(isSelected ? null : cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-full border mr-2 ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-white border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-ink-muted'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Sujet de prière */}
          <View className="mt-5">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                Votre sujet de prière *
              </Text>
              <Text className="text-xs text-ink-muted">
                {content.length}/1000
              </Text>
            </View>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Décrivez votre besoin, votre épreuve ou votre sujet de louange avec simplicité..."
              placeholderTextColor="#8C96AB"
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
              className="bg-white border border-border rounded-2xl p-4 text-ink text-sm min-h-[140px]"
            />
          </View>

          {/* Bouton de soumission */}
          <View className="mt-6">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.9}
              className={`py-4 px-6 rounded-2xl items-center shadow-sm ${
                isSubmitting ? 'bg-primary/70' : 'bg-primary'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Déposer mon sujet 🙏
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
