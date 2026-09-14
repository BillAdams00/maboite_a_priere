import { Tabs } from 'expo-router';
import { Home, Users, PlusCircle, Sparkles, HeartHandshake } from 'lucide-react-native';

export default function PublicTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2F4A78',
        tabBarInactiveTintColor: '#8C96AB',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EAE3D8',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="communaute/index"
        options={{
          title: 'Communauté',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="deposer"
        options={{
          title: 'Déposer',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={(size ?? 22) + 4} />,
        }}
      />
      <Tabs.Screen
        name="exauces/index"
        options={{
          title: 'Exaucés',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="mes-sujets/index"
        options={{
          title: 'Mes sujets',
          tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
