import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FigureFormScreen } from '../screens/FigureFormScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { FiguresScreen } from '../screens/FiguresScreen';
import { Icon, IconName } from '../components/Icon';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { on: IconName; off: IconName }> = {
  Dashboard: { on: 'home', off: 'home-outline' },
  Figuras: { on: 'leaf', off: 'leaf-outline' },
  Categorias: { on: 'pricetags', off: 'pricetags-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icon = TAB_ICONS[name] ?? TAB_ICONS.Dashboard;
  return <Icon name={focused ? icon.on : icon.off} size={24} color={color} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.semibold,
          marginBottom: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Figuras" component={FiguresScreen} />
      <Tab.Screen name="Categorias" component={CategoriesScreen} />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerBackTitle: 'Regresar',
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FigureForm"
        component={FigureFormScreen}
        options={({ route }) => ({
          title: (route.params as any)?.figure ? 'Editar Figura' : 'Nueva Figura',
        })}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppNavigatorContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Funkomacetas</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AdminStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <AppNavigatorContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    fontSize: 24,
    fontFamily: fonts.display,
    color: '#fff',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
