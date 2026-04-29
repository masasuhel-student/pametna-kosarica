import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import NewListScreen from './screens/NewListScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import ListekScreen from './screens/ListekScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [prijavljen, setPrijavljen] = useState(null);

  useEffect(() => {
    async function preveriPrijavo() {
      const token = await AsyncStorage.getItem('token');
      setPrijavljen(!!token);
    }
    preveriPrijavo();
  }, []);

  if (prijavljen === null) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1D9E75" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={prijavljen ? 'Home' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewList" component={NewListScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Listek" component={ListekScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}