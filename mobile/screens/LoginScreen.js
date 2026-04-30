import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, AntDesign } from '@expo/vector-icons';

const API = 'http://192.168.64.106:3000/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [geslo, setGeslo] = useState('');
  const [loading, setLoading] = useState(false);
  const [gesloVidno, setGesloVidno] = useState(false);

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        
        {/* Logo */}
        <View style={s.logoSection}>
          <View style={s.logoCircle}>
            <Ionicons name="cart" size={36} color="#fff" />
          </View>
          <Text style={s.logoText}>Pametni<Text style={s.logoGreen}>Nakup</Text></Text>
        </View>

        <Text style={s.title}>Prijava v račun</Text>

        {/* Email */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Uporabniško ime</Text>
          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              placeholder="Uporabniško ime ali e-pošta"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Geslo */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Geslo</Text>
          <View style={s.inputBox}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              value={geslo}
              onChangeText={setGeslo}
              secureTextEntry={!gesloVidno}
            />
            <TouchableOpacity onPress={() => setGesloVidno(!gesloVidno)} style={s.eyeBtn}>
              <Ionicons name={gesloVidno ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={s.forgotBtn}>
          <Text style={s.forgotText}>Pozabljeno geslo?</Text>
        </TouchableOpacity>

        {/* Prijava gumb */}
        <TouchableOpacity style={s.mainBtn} onPress={prijava}>
          <Text style={s.mainBtnText}>{loading ? 'Prijavljam...' : 'Prijava'}</Text>
        </TouchableOpacity>

        {/* Separator */}
        <View style={s.separator}>
          <View style={s.separatorLine} />
          <Text style={s.separatorText}>ali nadaljuj z</Text>
          <View style={s.separatorLine} />
        </View>

        {/* Social gumbi */}
        <View style={s.socialRow}>
          <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Kmalu', 'Google prijava bo kmalu na voljo!')}>
            <Image source={require('../assets/google.png')} style={{ width: 20, height: 20 }} />
            <Text style={s.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.socialBtn} onPress={() => Alert.alert('Kmalu', 'Apple prijava bo kmalu na voljo!')}>
            <Ionicons name="logo-apple" size={18} color="#222" />
            <Text style={s.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Registracija */}
        <TouchableOpacity style={s.registerBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={s.registerText}>
            Nimate računa? <Text style={s.registerLink}>Registrirajte se</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#4faf5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  logoText: { fontSize: 24, fontWeight: '700', color: '#222' },
  logoGreen: { color: '#4faf5a' },

  title: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 24, textAlign: 'center' },

  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#555', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fafafa' },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#222' },
  eyeBtn: { padding: 4 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: '#4faf5a', fontWeight: '500' },

  mainBtn: { backgroundColor: '#4faf5a', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 24, shadowColor: '#4faf5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  separator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  separatorText: { fontSize: 12, color: '#aaa', marginHorizontal: 12 },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 13, backgroundColor: '#fff' },
  socialIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  socialText: { fontSize: 14, fontWeight: '500', color: '#222' },

  registerBtn: { alignItems: 'center' },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { color: '#4faf5a', fontWeight: '600' },
});