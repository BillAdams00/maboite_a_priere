import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, LogOut, CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react-native';
import { clearAdminTokens } from '@/lib/secure-store';
import { hapticSelection } from '@/lib/haptics';

export default function TableauDeBordScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    hapticSelection();
    await clearAdminTokens();
    router.replace('/(public)');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête admin */}
        <View className="flex-row items-center justify-between pt-4 pb-4">
          <View>
            <Text className="text-2xl font-bold text-ink">Tableau de bord</Text>
            <Text className="text-xs text-ink-muted">Modération & Équipe pastorale</Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="p-2.5 rounded-full bg-white border border-border"
          >
            <LogOut color="#C85250" size={18} />
          </TouchableOpacity>
        </View>

        {/* Chiffres clés du jour */}
        <View className="flex-row gap-3 mt-2">
          <View className="flex-1 bg-white border border-border rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-ink-muted font-semibold">En attente</Text>
              <Clock color="#E8A33D" size={16} />
            </View>
            <Text className="text-2xl font-bold text-ink">0</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">Sujet à relire</Text>
          </View>

          <View className="flex-1 bg-white border border-border rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-ink-muted font-semibold">Signalements</Text>
              <AlertTriangle color="#C85250" size={16} />
            </View>
            <Text className="text-2xl font-bold text-ink">0</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">Alerte active</Text>
          </View>
        </View>

        {/* Section Actions rapides */}
        <View className="mt-6">
          <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
            Gestion du ministère
          </Text>

          <View className="gap-2.5">
            <TouchableOpacity className="bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <ShieldCheck color="#2F4A78" size={20} />
                </View>
                <View>
                  <Text className="font-bold text-ink text-sm">File des sujets de prière</Text>
                  <Text className="text-xs text-ink-muted">Consulter tous les sujets déposés</Text>
                </View>
              </View>
              <Text className="text-ink-muted font-bold text-base">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-gold/10 items-center justify-center mr-3">
                  <CheckCircle2 color="#E8A33D" size={20} />
                </View>
                <View>
                  <Text className="font-bold text-ink text-sm">Exaucements à confirmer</Text>
                  <Text className="text-xs text-ink-muted">Valider les témoignages des frères et sœurs</Text>
                </View>
              </View>
              <Text className="text-ink-muted font-bold text-base">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-peace/10 items-center justify-center mr-3">
                  <BarChart3 color="#6FA287" size={20} />
                </View>
                <View>
                  <Text className="font-bold text-ink text-sm">Statistiques d'intercession</Text>
                  <Text className="text-xs text-ink-muted">Évolution des prières et de la communauté</Text>
                </View>
              </View>
              <Text className="text-ink-muted font-bold text-base">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Retour au mode public */}
        <TouchableOpacity
          onPress={() => router.replace('/(public)')}
          className="mt-8 bg-cream border border-border py-3.5 rounded-2xl items-center"
        >
          <Text className="text-ink font-semibold text-xs">Retourner à l'application publique</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
