import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const API = 'http://192.168.50.153:3000/api';
const ODSTRANI_BESEDE = /\b(dodaj|kupim|kupi|potrebujem|hočem|hocem|želim|zelim|prosim|še|se|in|ter|pa|nin)\b/gi;

export default function NewListScreen({ navigation }) { 
  const [ime, setIme] = useState('');
  const [izdelek, setIzdelek] = useState('');
  const [izdelki, setIzdelki] = useState([]);
  const [maxTrgovine, setMaxTrgovine] = useState(2);
  const [maxKm, setMaxKm] = useState(5);
  const [loading, setLoading] = useState(false);
  const [poslusam, setPoslusam] = useState(false);
  const [glasovniRezim, setGlasovniRezim] = useState('izdelki');
  const poslusamRef = useRef(false);
  const rezimRef = useRef('izdelki');
  const imeRef = useRef('');
  const izdelkiRef = useRef([]);
  const maxTrgovineRef = useRef(2);
  const maxKmRef = useRef(5);

  useEffect(() => { imeRef.current = ime; }, [ime]);
  useEffect(() => { izdelkiRef.current = izdelki; }, [izdelki]);
  useEffect(() => { maxTrgovineRef.current = maxTrgovine; }, [maxTrgovine]);
  useEffect(() => { maxKmRef.current = maxKm; }, [maxKm]);

  // Ugasni mikrofon ko zapustiš zaslon
  useEffect(() => {
    return () => {
      if (poslusamRef.current) {
        try { ExpoSpeechRecognitionModule.stop(); } catch {}
        poslusamRef.current = false;
      }
    };
  }, []);

  async function shraniOsnutek() {
  const trenutnoIme = imeRef.current;
  const trenutniIzdelki = izdelkiRef.current;
  if (!trenutnoIme && !trenutniIzdelki.length) return;
  try {
    const token = await AsyncStorage.getItem('token');
    const poteceKo = new Date();
    poteceKo.setDate(poteceKo.getDate() + 1);
    await axios.post(`${API}/listki`,
      { 
        ime: trenutnoIme || 'Osnutek', 
        izdelki: trenutniIzdelki,
        max_trgovine: maxTrgovineRef.current, 
        max_km: maxKmRef.current,
        status: 'osnutek',
        potece: poteceKo.toISOString()
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {}
}

  async function goNazaj() {
    if (poslusamRef.current) {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
      poslusamRef.current = false;
      setPoslusam(false);
    }
    await shraniOsnutek();
    navigation.goBack();
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (poslusamRef.current) {
        try { ExpoSpeechRecognitionModule.stop(); } catch {}
        poslusamRef.current = false;
        setPoslusam(false);
      }
      shraniOsnutek().then(() => navigation.goBack());
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
  if (!poslusamRef.current) return; // KLJUČNO
  const besedilo = event.results[0]?.transcript || '';
  if (!besedilo) return;

  if (rezimRef.current === 'ime') {
    setIme(besedilo.trim());
    poslusamRef.current = false;
    setPoslusam(false);
    return;
  }

  const ocisceno = besedilo.replace(ODSTRANI_BESEDE, '').trim();
  const novi = ocisceno
    .split(/,|\s+in\s+|\s+ter\s+|\s+pa\s+|\s+nin\s+/i)
    .map(i => i.trim())
    .filter(i => i.length > 1);
  if (novi.length) setIzdelki(prev => [...prev, ...novi]);
});

useSpeechRecognitionEvent('end', () => {
  if (!poslusamRef.current) return; // KLJUČNO
  if (rezimRef.current === 'izdelki') {
    setTimeout(() => {
      if (!poslusamRef.current) return; // Preveri še enkrat
      try {
        ExpoSpeechRecognitionModule.start({ lang: 'sl-SI', interimResults: false });
      } catch {
        poslusamRef.current = false;
        setPoslusam(false);
      }
    }, 300);
  } else {
    poslusamRef.current = false;
    setPoslusam(false);
  }
});

  async function toggleGlas(rezim = 'izdelki') {
    if (poslusamRef.current) {
      ExpoSpeechRecognitionModule.stop();
      poslusamRef.current = false;
      setPoslusam(false);
      return;
    }
    rezimRef.current = rezim;
    setGlasovniRezim(rezim);
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return Alert.alert('Napaka', 'Ni dovoljenja za mikrofon');
    ExpoSpeechRecognitionModule.start({ lang: 'sl-SI', interimResults: false });
    poslusamRef.current = true;
    setPoslusam(true);
  }

  function dodajIzdelek() {
    if (!izdelek.trim()) return;
    const novi = izdelek.split(',').map(i => i.trim()).filter(Boolean);
    setIzdelki([...izdelki, ...novi]);
    setIzdelek('');
  }

  function odstraniIzdelek(i) {
    setIzdelki(izdelki.filter((_, idx) => idx !== i));
  }

  async function potrdiListek() {
    if (!ime) return Alert.alert('Napaka', 'Vnesite ime listka');
    if (!izdelki.length) return Alert.alert('Napaka', 'Dodajte vsaj en izdelek');
    if (poslusamRef.current) {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
      poslusamRef.current = false;
      setPoslusam(false);
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${API}/listki`,
        { ime, izdelki, max_trgovine: maxTrgovine, max_km: maxKm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const listek_id = res.data.id;
      const izracun = await axios.post(`${API}/letaki/izracunaj/${listek_id}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('Results', { rezultat: izracun.data });
    } catch {
      Alert.alert('Napaka', 'Prišlo je do napake');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity style={s.backBtn} onPress={goNazaj}>
          <Text style={s.backText}>← Nazaj</Text>
        </TouchableOpacity>

        <Text style={s.title}>Nov listek</Text>

        <Text style={s.label}>Ime listka</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            placeholder="npr. Tedenski nakup"
            value={ime}
            onChangeText={setIme}
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={[s.glasMiniBtn, poslusam && glasovniRezim === 'ime' && s.glasMiniAktiven]} 
            onPress={() => toggleGlas('ime')}
          >
            <Text style={s.glasMiniText}>🎤</Text>
          </TouchableOpacity>
        </View>
        {poslusam && glasovniRezim === 'ime' && (
          <Text style={s.poslusamText}>Poslušam ime listka...</Text>
        )}

        <Text style={s.label}>Dodaj izdelke</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            placeholder="npr. banane, mleko..."
            value={izdelek}
            onChangeText={setIzdelek}
            onSubmitEditing={dodajIzdelek}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={s.addBtn} onPress={dodajIzdelek}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[s.glasBtn, poslusam && glasovniRezim === 'izdelki' && s.glasBtnAktiven]} 
          onPress={() => toggleGlas('izdelki')}
        >
          <Text style={s.glasBtnText}>
            {poslusam && glasovniRezim === 'izdelki' ? '🔴 Poslušam... (tapni za stop)' : '🎤 Govori izdelke'}
          </Text>
        </TouchableOpacity>
        {poslusam && glasovniRezim === 'izdelki' && (
          <Text style={s.poslusamText}>Govori izdelke — samodejno nadaljujem poslušanje</Text>
        )}

        {izdelki.length > 0 && (
          <View style={s.itemsList}>
            {izdelki.map((i, idx) => (
              <View key={idx} style={s.itemRow}>
                <Text style={s.itemText}>🛒 {i}</Text>
                <TouchableOpacity onPress={() => odstraniIzdelek(idx)}>
                  <Text style={s.removeBtn}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={s.preferencesRow}>
          <View style={s.preferenceBox}>
            <Text style={s.label}>Maks. trgovin</Text>
            <View style={s.counter}>
              <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.max(1, maxTrgovine - 1))}>
                <Text style={s.cBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.cVal}>{maxTrgovine}</Text>
              <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.min(5, maxTrgovine + 1))}>
                <Text style={s.cBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.preferenceBox}>
            <Text style={s.label}>Maks. razdalja</Text>
            <View style={s.counter}>
              <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.max(1, maxKm - 1))}>
                <Text style={s.cBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.cVal}>{maxKm} km</Text>
              <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.min(50, maxKm + 1))}>
                <Text style={s.cBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={potrdiListek}>
          <Text style={s.btnText}>{loading ? 'Izračunavam...' : 'Potrdi in izračunaj'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1D9E75', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, color: '#333' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#1D9E75', borderRadius: 10, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  glasBtn: { borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  glasBtnAktiven: { backgroundColor: '#E1F5EE', borderColor: '#E24B4A' },
  glasBtnText: { color: '#1D9E75', fontSize: 14, fontWeight: '500' },
  glasMiniBtn: { width: 46, height: 46, borderRadius: 10, borderWidth: 0.5, borderColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  glasMiniAktiven: { backgroundColor: '#E1F5EE', borderColor: '#E24B4A' },
  glasMiniText: { fontSize: 18 },
  poslusamText: { fontSize: 11, color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  itemsList: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, marginBottom: 6 },
  itemText: { flex: 1, fontSize: 14, color: '#333' },
  removeBtn: { fontSize: 20, color: '#ccc', paddingHorizontal: 4 },
  preferencesRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  preferenceBox: { flex: 1 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  cBtnText: { fontSize: 20, color: '#333' },
  cVal: { fontSize: 16, fontWeight: '500', minWidth: 36, textAlign: 'center' },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});