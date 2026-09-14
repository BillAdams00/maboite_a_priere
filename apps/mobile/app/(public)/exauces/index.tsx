import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PublicPrayerRequestItem } from '@maboiteapriere/shared';

export default function ExaucesScreen() {
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['answeredPrayers'],
    queryFn: async () => {
      // Pour la v1, on filtre les sujets exaucés depuis le flux public
      const feed = await api.getPublicFeed({ limit: 50 });
      return {
        items: feed.items.filter(item => item.isAnswered),
      };
    },
  });

  const renderItem = ({ item }: { item: PublicPrayerRequestItem }) => (
    <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 mb-3.5 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-gold/15 items-center justify-center mr-2">
            <Sparkles color="#E8A33D" size={16} />
          </View>
          <Text className="font-bold text-ink text-sm">{item.displayName}</Text>
        </View>

        <Text className="text-[11px] text-ink-muted">
          {item.answeredAt ? new Date(item.answeredAt).toLocaleDateString('fr-FR') : ''}
        </Text>
      </View>

      <Text className="text-xs text-ink-muted italic mb-2">
        « {item.content} »
      </Text>

      {item.answeredNote && (
        <View className="bg-gold/10 border border-gold/20 rounded-xl p-3 mt-1">
          <Text className="text-xs font-bold text-gold mb-0.5">Témoignage :</Text>
          <Text className="text-xs text-ink leading-relaxed font-serif">
            {item.answeredNote}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-cream">
        <Text className="text-[11px] text-ink-muted">
          Porté par {item.prayerCount} {item.prayerCount > 1 ? 'prières' : 'prière'}
        </Text>
        <Text className="text-[11px] font-semibold text-peace">Dieu a répondu 🙌</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-ink">Sujets exaucés</Text>
        <Text className="text-sm text-ink-muted">
          Célébrons ensemble la fidélité de Dieu et ses réponses à nos prières.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#E8A33D" size="large" />
          <Text className="text-xs text-ink-muted mt-2">Chargement des témoignages...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#E8A33D"
            />
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Sparkles color="#8C96AB" size={32} />
              <Text className="text-sm font-semibold text-ink mt-3">
                Aucun témoignage archivé pour l'instant
              </Text>
              <Text className="text-xs text-ink-muted mt-1 text-center px-8">
                Dès qu'un sujet déposé est confirmé comme exaucé, il apparaîtra ici pour édifier
                la communauté.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
