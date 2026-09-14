import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Lock, Trash2, PlusCircle, HeartHandshake } from 'lucide-react-native';
import {
  getMyRequests,
  removeMyRequest,
  type StoredRequestReference,
} from '@/lib/secure-store';
import { api } from '@/lib/api';
import { hapticSuccess, hapticSelection } from '@/lib/haptics';

export default function MesSujetsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<StoredRequestReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    setIsLoading(true);
    const items = await getMyRequests();
    setRequests(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleClaimAnswered = (item: StoredRequestReference) => {
    Alert.prompt
      ? Alert.prompt(
          'Dieu a répondu 🙌',
          'Racontez brièvement comment Dieu a répondu pour encourager la communauté (facultatif) :',
          async (note: string) => {
            try {
              await api.manageMyRequest(item.id, item.manageToken, {
                action: 'claimAnswered',
                note: note?.trim() || null,
              });
              hapticSuccess();
              Alert.alert(
                'Gloire à Dieu !',
                'Votre témoignage a été transmis aux administrateurs pour confirmation.'
              );
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible d’enregistrer le témoignage.');
            }
          }
        )
      : Alert.alert(
          'Dieu a répondu 🙌',
          'Confirmez-vous que Dieu a répondu à cette prière ? Les administrateurs seront informés.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Confirmer',
              onPress: async () => {
                try {
                  await api.manageMyRequest(item.id, item.manageToken, {
                    action: 'claimAnswered',
                  });
                  hapticSuccess();
                  Alert.alert(
                    'Gloire à Dieu !',
                    'Votre témoignage a été transmis aux administrateurs pour confirmation.'
                  );
                } catch (err: any) {
                  Alert.alert('Erreur', err.message || 'Impossible d’enregistrer.');
                }
              },
            },
          ]
        );
  };

  const handleMakePrivate = (item: StoredRequestReference) => {
    Alert.alert(
      'Passer en privé',
      'Ce sujet ne sera plus visible sur le mur public et sera réservé à l’équipe pastorale.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Passer en privé',
          onPress: async () => {
            try {
              await api.manageMyRequest(item.id, item.manageToken, { action: 'private' });
              hapticSuccess();
              Alert.alert('Modifié', 'Votre sujet est désormais privé.');
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (item: StoredRequestReference) => {
    Alert.alert(
      'Supprimer le sujet',
      'Êtes-vous sûr de vouloir retirer ce sujet de prière ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.manageMyRequest(item.id, item.manageToken, { action: 'delete' });
              await removeMyRequest(item.id);
              await loadRequests();
              hapticSuccess();
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: StoredRequestReference; index: number }) => (
    <View className="bg-white border border-[#EAE3D8] rounded-2xl p-4 mb-3.5 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold text-primary">Sujet #{index + 1}</Text>
        <Text className="text-[11px] text-ink-muted">
          Déposé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      <Text className="text-xs text-ink-muted mb-3 font-mono">
        Réf. publique : {item.publicSlug}
      </Text>

      {/* Actions de gestion directe */}
      <View className="flex-row gap-2 pt-2 border-t border-cream">
        <TouchableOpacity
          onPress={() => handleClaimAnswered(item)}
          className="flex-1 bg-gold/15 border border-gold/30 py-2 rounded-xl flex-row items-center justify-center"
        >
          <Sparkles color="#E8A33D" size={14} />
          <Text className="text-[11px] font-bold text-gold ml-1">Dieu a répondu 🙌</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleMakePrivate(item)}
          className="bg-cream border border-border p-2 rounded-xl items-center justify-center"
        >
          <Lock color="#55607A" size={15} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          className="bg-danger/10 border border-danger/20 p-2 rounded-xl items-center justify-center"
        >
          <Trash2 color="#C85250" size={15} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-ink">Mes sujets</Text>
        <Text className="text-sm text-ink-muted">
          Retrouvez et gérez les sujets déposés depuis cet appareil.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#2F4A78" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 }}
          ListEmptyComponent={
            <View className="py-20 items-center px-6">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-3">
                <HeartHandshake color="#2F4A78" size={28} />
              </View>
              <Text className="text-base font-bold text-ink text-center">
                Aucun sujet déposé pour l'instant
              </Text>
              <Text className="text-xs text-ink-muted text-center mt-1.5 leading-relaxed">
                Les prières que vous déposez depuis ce téléphone sont enregistrées automatiquement ici
                sans aucun compte nécessaire.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  hapticSelection();
                  router.push('/(public)/deposer');
                }}
                className="mt-6 bg-primary py-3 px-5 rounded-2xl flex-row items-center"
              >
                <PlusCircle color="#FFFFFF" size={18} />
                <Text className="text-white font-bold text-xs ml-2">
                  Déposer mon premier sujet
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
