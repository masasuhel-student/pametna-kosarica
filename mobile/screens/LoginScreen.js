import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.50.153:3000/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [geslo, setGeslo] = useState('');
  const [loading, setLoading] = useState(false);

  async function prijava() {
    if (!email || !geslo) return Alert.alert('Napaka', 'Vnesite email in geslo');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/prijava`, { email, geslo });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('ime', res.data.ime);
      navigation.replace('Home');
    } catch {
      Alert.alert('Napaka', 'Napačen email ali geslo');
    }
    setLoading(false);
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>🛒</Text>
      <Text style={s.title}>Pametna košarica</Text>
      <Text style={s.subtitle}>Varčuj pri vsakem nakupu</Text>

      <TextInput style={s.input} placeholder="E-pošta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Geslo" value={geslo} onChangeText={setGeslo} secureTextEntry />

      <TouchableOpacity style={s.btn} onPress={prijava}>
        <Text style={s.btnText}>{loading ? 'Prijavljam...' : 'Prijava'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>Nimaš računa? Registracija</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#1D9E75', fontSize: 14 }
});