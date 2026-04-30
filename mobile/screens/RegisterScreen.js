import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API = 'http://192.168.64.106:3000/api';

export default function RegisterScreen({ navigation }) {
  const [uporabniskoIme, setUporabniskoIme] = useState('');
  const [email, setEmail] = useState('');
  const [geslo, setGeslo] = useState('');
  const [geslo2, setGeslo2] = useState('');
  const [kraj, setKraj] = useState('');
  const [pogoji, setPogoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gesloVidno, setGesloVidno] = useState(false);
  const [geslo2Vidno, setGeslo2Vidno] = useState(false);

  const emailVeljavno = email.includes('@') && email.includes('.');
  const gesloMocno = geslo.length >= 8 && /[A-Z]/.test(geslo) && /[0-9]/.test(geslo) && /[^A-Za-z0-9]/.test(geslo);
  const gesliUjemata = geslo === geslo2 && geslo.length > 0;

  function gesloStatus() {
    if (!geslo) return null;
    const checks = [
      { ok: geslo.length >= 8, text: 'Min. 8 znakov' },
      { ok: /[A-Z]/.test(geslo), text: '1 velika črka' },
      { ok: /[0-9]/.test(geslo), text: '1 številka' },
      { ok: /[^A-Za-z0-9]/.test(geslo), text: '1 poseben znak' },
    ];
    return checks;
  }

  async function registracija() {
    if (!uporabniskoIme) return Alert.alert('Napaka', 'Vnesite uporabniško ime');
    if (!emailVeljavno) return Alert.alert('Napaka', 'Email ni veljaven');
    if (!gesloMocno) return Alert.alert('Napaka', 'Geslo ni dovolj močno');
    if (!gesliUjemata) return Alert.alert('Napaka', 'Gesli se ne ujemata');
    if (!pogoji) return Alert.alert('Napaka', 'Strinjati se morate s pogoji uporabe');
    
    setLoading(true);
    try {
      await axios.post(`${API}/auth/registracija`, { 
        uporabnisko_ime: uporabniskoIme, 
        email, 
        geslo, 
        kraj 
      });
      Alert.alert('Uspeh!', 'Registracija uspešna, prijavi se.');
      navigation.navigate('Login');
    } catch {
      Alert.alert('Napaka', 'Email ali uporabniško ime že obstaja');
    }
    setLoading(false);
  }

  const checks = gesloStatus();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView 
          contentContainerStyle={s.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#4faf5a" />
        </TouchableOpacity>

        <Text style={s.title}>Registracija</Text>

        {/* Uporabniško ime */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Uporabniško ime</Text>
          <View style={[s.inputBox, uporabniskoIme && s.inputBoxActive]}>
            <TextInput
              style={s.input}
              placeholder="jana123"
              placeholderTextColor="#bbb"
              value={uporabniskoIme}
              onChangeText={setUporabniskoIme}
              autoCapitalize="none"
            />
            {uporabniskoIme.length > 0 && <Ionicons name="checkmark-circle" size={18} color="#4faf5a" />}
          </View>
        </View>

        {/* Email */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>E-naslov</Text>
          <View style={[s.inputBox, email && (emailVeljavno ? s.inputBoxActive : s.inputBoxError)]}>
            <TextInput
              style={s.input}
              placeholder="jana@primer.si"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email.length > 0 && (
              <Ionicons 
                name={emailVeljavno ? 'checkmark-circle' : 'close-circle'} 
                size={18} 
                color={emailVeljavno ? '#4faf5a' : '#E24B4A'} 
              />
            )}
          </View>
          {email.length > 0 && !emailVeljavno && (
            <Text style={s.errorText}>Email mora vsebovati @ in domeno</Text>
          )}
        </View>

        {/* Geslo */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Geslo</Text>
          <View style={[s.inputBox, geslo && (gesloMocno ? s.inputBoxActive : s.inputBoxWarn)]}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Min. 8 znakov"
              placeholderTextColor="#bbb"
              value={geslo}
              onChangeText={setGeslo}
              secureTextEntry={!gesloVidno}
            />
            <TouchableOpacity onPress={() => setGesloVidno(!gesloVidno)} style={s.eyeBtn}>
              <Ionicons name={gesloVidno ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
          {checks && (
            <View style={s.checksRow}>
              {checks.map((c, i) => (
                <View key={i} style={s.checkItem}>
                  <Ionicons name={c.ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={c.ok ? '#4faf5a' : '#ccc'} />
                  <Text style={[s.checkText, c.ok && s.checkTextOk]}>{c.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ponovi geslo */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Ponovite geslo</Text>
          <View style={[s.inputBox, geslo2 && (gesliUjemata ? s.inputBoxActive : s.inputBoxError)]}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Ponovite geslo"
              placeholderTextColor="#bbb"
              value={geslo2}
              onChangeText={setGeslo2}
              secureTextEntry={!geslo2Vidno}
            />
            <TouchableOpacity onPress={() => setGeslo2Vidno(!geslo2Vidno)} style={s.eyeBtn}>
              <Ionicons name={geslo2Vidno ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
          {geslo2.length > 0 && !gesliUjemata && (
            <Text style={s.errorText}>Gesli se ne ujemata</Text>
          )}
        </View>

        {/* Kraj */}
        <View style={s.inputWrapper}>
          <Text style={s.inputLabel}>Kraj (neobvezno)</Text>
          <View style={s.inputBox}>
            <TextInput
              style={s.input}
              placeholder="npr. Celje"
              placeholderTextColor="#bbb"
              value={kraj}
              onChangeText={setKraj}
            />
          </View>
        </View>

        {/* Pogoji */}
        <TouchableOpacity style={s.pogojiRow} onPress={() => setPogoji(!pogoji)}>
          <View style={[s.checkbox, pogoji && s.checkboxActive]}>
            {pogoji && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={s.pogojiText}>
            Strinjam se s <Text style={s.pogojiLink}>Pogoji uporabe in Politiko zasebnosti</Text>
          </Text>
        </TouchableOpacity>

        {/* Gumb */}
        <TouchableOpacity 
          style={[s.mainBtn, (!pogoji || !emailVeljavno || !gesloMocno || !gesliUjemata || !uporabniskoIme) && s.mainBtnDisabled]}
          onPress={registracija}
        >
          <Text style={s.mainBtnText}>{loading ? 'Ustvarjam račun...' : 'Ustvari račun'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginText}>
            Že imate račun? <Text style={s.loginLink}>Prijavite se</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 28, paddingTop: 56, paddingBottom: 80 },
  backBtn: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 24 },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#555', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fafafa' },
  inputBoxActive: { borderColor: '#4faf5a' },
  inputBoxError: { borderColor: '#E24B4A' },
  inputBoxWarn: { borderColor: '#F5A623' },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#222' },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, marginLeft: 2 },
  checksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkText: { fontSize: 11, color: '#ccc' },
  checkTextOk: { color: '#4faf5a' },
  pogojiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  checkboxActive: { backgroundColor: '#4faf5a', borderColor: '#4faf5a' },
  pogojiText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 19 },
  pogojiLink: { color: '#4faf5a', fontWeight: '600' },
  mainBtn: { backgroundColor: '#4faf5a', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 20, elevation: 4 },
  mainBtnDisabled: { backgroundColor: '#a8d5ac', elevation: 0 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginBtn: { alignItems: 'center' },
  loginText: { fontSize: 14, color: '#888' },
  loginLink: { color: '#4faf5a', fontWeight: '600' },
});