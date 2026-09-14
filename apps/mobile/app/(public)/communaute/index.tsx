import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Flag, Sparkles, Filter } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getOrCreateVisitorId } from '@/lib/secure-store';
import { hapticLight, hapticSuccess, hapticSelection } from '@/lib/haptics';
import { CATEGORIES, type PublicPrayerRequestItem } from '@maboiteapriere/shared';

export default function CommunauteScreen() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'needed'>('recent');
  const [prayedSlugs, setPrayedSlugs] = useState<Record<string, boolean>>({});

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['publicFeed', selectedCategory, sortOrder],
    queryFn: () =>
      api.getPublicFeed({
        category: selectedCategory ?? undefined,
        sort: sortOrder,
        limit: 30,
      }),
  });

  const prayMutation = useMutation({
    mutationFn: async (slug: string) => {
      const visitorId = await getOrCreateVisitorId();
      return api.pray(slug, visitorId);
    },
    onSuccess: (result, slug) => {
      hapticLight();
      setPrayedSlugs(prev => ({ ...prev, [slug]: true }));
      // Mise à jour optimiste du compteur dans le cache
      queryClient.setQueryData(
        ['publicFeed', selectedCategory, sortOrder],
        (old: { items: PublicPrayerRequestItem[]; nextCursor: string | null } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item =>
              item.publicSlug === slug
                ? { ...item, prayerCount: result.prayerCount }
                : item
            ),
          };
        }
      );
    },
    onError: (err: any) => {
      Alert.alert('Information', err.message || 'Impossible d’enregistrer la prière.');
    },
  });

  const handleReport = (slug: string) => {
    Alert.prompt
      ? Alert.prompt(
          'Signaler un contenu',
          'Veuillez indiquer le motif de votre signalement :',
          async (text: string) => {
            if (text && text.trim().length >= 3) {
              await api.report(slug, { reason: text.trim() });
              hapticSuccess();
              Alert.alert('Merci', 'Votre signalement a été transmis aux modérateurs.');
            }
          }
        )
      : Alert.alert('Signaler', 'Souhaitez-vous signaler ce sujet aux modérateurs ?', [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Signaler',
            style: 'destructive',
            onPress: async () => {
              await api.report(slug, { reason: 'Contenu signalé par un utilisateur' });
              hapticSuccess();
              Alert.alert('Merci', 'Votre signalement a été transmis aux modérateurs.');
            },
          },
        ]);
  };

  const renderItem = ({ item }: { item: PublicPrayerRequestItem }) => {
    const hasPrayed = prayedSlugs[item.publicSlug];
    const categoryInfo = CATEGORIES.find(c => c.id === item.category);

    return (
      <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 mb-3.5 shadow-sm">
        {/* En-tête de la carte */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
              <Text className="text-primary font-bold text-xs">
                {item.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="font-bold text-ink text-sm">{item.displayName}</Text>
              {categoryInfo && (
                <Text className="text-[11px] text-ink-muted">{categoryInfo.label}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleReport(item.publicSlug)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Flag color="#8C96AB" size={15} />
          </TouchableOpacity>
        </View>

        {/* Badge Exaucé s'il y a lieu */}
        {item.isAnswered && (
          <View className="bg-gold/10 border border-gold/30 rounded-xl p-2.5 mb-2.5 flex-row items-center">
            <Sparkles color="#E8A33D" size={16} />
            <Text className="text-xs font-semibold text-gold ml-2">
              Sujet exaucé par la grâce de Dieu 🙌
            </Text>
          </View>
        )}

        {/* Corps du sujet */}
        <Text className="text-sm text-ink leading-relaxed mb-3.5">
          {item.content}
        </Text>

        {/* Pied de carte avec bouton d'intercession */}
        <View className="flex-row items-center justify-between pt-2 border-t border-cream">
          <Text className="text-xs text-ink-muted font-medium">
            {item.prayerCount === 0
              ? 'Soyez le premier à prier'
              : `${item.prayerCount} ${item.prayerCount > 1 ? 'personnes ont prié' : 'personne a prié'}`}
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (!hasPrayed) {
                prayMutation.mutate(item.publicSlug);
              }
            }}
            disabled={hasPrayed || prayMutation.isPending}
            activeOpacity={0.8}
            className={`flex-row items-center py-2 px-3.5 rounded-xl border ${
              hasPrayed
                ? 'bg-peace/10 border-peace'
                : 'bg-primary border-primary'
            }`}
          >
            <Heart
              color={hasPrayed ? '#6FA287' : '#FFFFFF'}
              size={15}
              fill={hasPrayed ? '#6FA287' : 'none'}
            />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                hasPrayed ? 'text-peace' : 'text-white'
              }`}
            >
              {hasPrayed ? 'Tu as prié 🙏' : 'Je prie pour toi 🙏'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-ink">Communauté</Text>
        <Text className="text-sm text-ink-muted">
          Unissons nos cœurs dans la prière pour nos frères et sœurs.
        </Text>
      </View>

      {/* Barre de filtres & Tri */}
      <View className="px-5 py-2">
        <View className="flex-row items-center justify-between mb-2">
          {/* Sélecteur de tri */}
          <View className="flex-row bg-white border border-border rounded-xl p-0.5">
            <TouchableOpacity
              onPress={() => {
                hapticSelection();
                setSortOrder('recent');
              }}
              className={`px-3 py-1 rounded-lg ${
                sortOrder === 'recent' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  sortOrder === 'recent' ? 'text-white' : 'text-ink-muted'
                }`}
              >
                Récents
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                hapticSelection();
                setSortOrder('needed');
              }}
              className={`px-3 py-1 rounded-lg ${
                sortOrder === 'needed' ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  sortOrder === 'needed' ? 'text-white' : 'text-ink-muted'
                }`}
              >
                Ont besoin de toi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtres par catégories */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', label: 'Tous' }, ...CATEGORIES]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isSelected =
              (item.id === 'all' && selectedCategory === null) ||
              selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  setSelectedCategory(item.id === 'all' ? null : item.id);
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
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Liste des sujets */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#2F4A78" size="large" />
          <Text className="text-xs text-ink-muted mt-2">Chargement des prières...</Text>
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
              tintColor="#2F4A78"
            />
          }
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-sm font-semibold text-ink">Aucun sujet pour le moment</Text>
              <Text className="text-xs text-ink-muted mt-1 text-center px-6">
                Soyez le premier à confier un sujet ou revenez un peu plus tard.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
