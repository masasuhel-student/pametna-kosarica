import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const API = 'http://192.168.50.153:3000/api';

export default function RegisterScreen({ navigation }) {
  const [ime, setIme] = useState('');
  const [email, setEmail] = useState('');
  const [geslo, setGeslo] = useState('');
  const [kraj, setKraj] = useState('');
  const [loading, setLoading] = useState(false);

  async function registracija() {
    if (!ime || !email || !geslo) return Alert.alert('Napaka', 'Vsa polja so obvezna');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/registracija`, { ime, email, geslo, kraj });
      Alert.alert('Uspeh!', 'Registracija uspešna, prijavi se.');
      navigation.navigate('Login');
    } catch {
      Alert.alert('Napaka', 'Email že obstaja');
    }
    setLoading(false);
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>🛒</Text>
      <Text style={s.title}>Registracija</Text>
      <TextInput style={s.input} placeholder="Ime in priimek" value={ime} onChangeText={setIme} placeholderTextColor="#999" />
      <TextInput style={s.input} placeholder="E-pošta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
      <TextInput style={s.input} placeholder="Geslo" value={geslo} onChangeText={setGeslo} secureTextEntry placeholderTextColor="#999" />
      <TextInput style={s.input} placeholder="Kraj (npr. Celje)" value={kraj} onChangeText={setKraj} placeholderTextColor="#999" />
      <TouchableOpacity style={s.btn} onPress={registracija}>
        <Text style={s.btnText}>{loading ? 'Registriram...' : 'Ustvari račun'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>Že imaš račun? Prijava</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#1D9E75', fontSize: 14 }
});