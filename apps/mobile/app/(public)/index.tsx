import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle, Users, Heart, ShieldCheck, Sparkles, BookOpen } from 'lucide-react-native';
import { hapticSelection } from '@/lib/haptics';

export default function HomeScreen() {
  const router = useRouter();

  const handleAdminAccess = () => {
    hapticSelection();
    router.push('/(admin)/connexion');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête avec appui long discret pour l'accès admin */}
        <View className="pt-4 pb-2 items-center">
          <TouchableOpacity
            onLongPress={handleAdminAccess}
            delayLongPress={2000}
            activeOpacity={0.8}
            className="items-center"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
              <Heart color="#2F4A78" size={26} />
            </View>
            <Text className="text-2xl font-bold text-ink tracking-tight">
              Ma boîte à prière
            </Text>
            <Text className="text-sm text-ink-muted mt-1">
              Portons nos fardeaux les uns les autres
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verset biblique d'ancrage */}
        <View className="mt-5 bg-white border border-[#EAE3D8] rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center mb-2">
            <BookOpen color="#E8A33D" size={18} />
            <Text className="text-xs font-semibold text-[#E8A33D] uppercase tracking-wider ml-2">
              Parole d'espérance
            </Text>
          </View>
          <Text className="text-base italic text-ink leading-relaxed font-serif">
            « Je vous dis encore que, si deux d'entre vous s'accordent sur la terre pour demander
            une chose quelconque, elle leur sera accordée par mon Père qui est dans les cieux. »
          </Text>
          <Text className="text-right text-xs font-semibold text-ink-muted mt-3">
            Matthieu 18:19 (LSG)
          </Text>
        </View>

        {/* Actions principales */}
        <View className="mt-6 gap-3">
          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.push('/(public)/deposer');
            }}
            activeOpacity={0.9}
            className="bg-primary flex-row items-center justify-center py-4 px-6 rounded-2xl shadow-sm"
          >
            <PlusCircle color="#FFFFFF" size={20} />
            <Text className="text-white font-bold text-base ml-2">
              Déposer un sujet de prière
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticSelection();
              router.push('/(public)/communaute');
            }}
            activeOpacity={0.8}
            className="bg-white border border-[#EAE3D8] flex-row items-center justify-center py-3.5 px-6 rounded-2xl"
          >
            <Users color="#2F4A78" size={20} />
            <Text className="text-primary font-semibold text-base ml-2">
              Découvrir les sujets de prière
            </Text>
          </TouchableOpacity>
        </View>

        {/* Les 3 étapes */}
        <View className="mt-8">
          <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
            Comment ça marche ?
          </Text>

          <View className="gap-3">
            <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mt-0.5 mr-3">
                <Text className="text-primary font-bold text-sm">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-ink text-sm">Tu écris</Text>
                <Text className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  Confie tes besoins, tes épreuves ou tes actions de grâce en moins de 45 secondes,
                  sans aucun compte.
                </Text>
              </View>
            </View>

            <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-gold/10 items-center justify-center mt-0.5 mr-3">
                <Text className="text-gold font-bold text-sm">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-ink text-sm">Tu choisis</Text>
                <Text className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  🔒 En privé pour l'équipe pastorale uniquement, ou 🌍 En public pour que
                  la communauté prie pour toi.
                </Text>
              </View>
            </View>

            <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-peace/10 items-center justify-center mt-0.5 mr-3">
                <Text className="text-peace font-bold text-sm">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-ink text-sm">La communauté prie</Text>
                <Text className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  Des frères et sœurs intercèdent fidèlement. Tu es informé avec douceur de chaque
                  prière élevée.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pied de page chaleureux */}
        <View className="mt-10 items-center">
          <View className="flex-row items-center">
            <ShieldCheck color="#6FA287" size={16} />
            <Text className="text-xs text-ink-muted ml-1.5 font-medium">
              Confidentialité et bienveillance garanties
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
