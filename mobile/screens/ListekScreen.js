import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const API = 'http://192.168.50.153:3000/api';
const ODSTRANI_BESEDE = /\b(dodaj|kupim|kupi|potrebujem|hočem|hocem|želim|zelim|prosim|še|se|in|ter|pa|nin)\b/gi;

export default function ListekScreen({ route, navigation }) {
  const { listek_id } = route.params;
  const [listek, setListek] = useState(null);
  const [izdelki, setIzdelki] = useState([]);
  const [novIzdelek, setNovIzdelek] = useState('');
  const [novIme, setNovIme] = useState('');
  const [loading, setLoading] = useState(false);
  const [urejanje, setUrejanje] = useState(false);
  const [poslusam, setPoslusam] = useState(false);
  const [glasovniRezim, setGlasovniRezim] = useState('izdelki');
  const poslusamRef = useRef(false);
  const rezimRef = useRef('izdelki');

  useEffect(() => {
    naloziListek();
  }, []);

  useEffect(() => {
    return () => {
      if (poslusamRef.current) {
        try { ExpoSpeechRecognitionModule.stop(); } catch {}
        poslusamRef.current = false;
      }
    };
  }, []);

  async function naloziListek() {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/listki/${listek_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListek(res.data);
      setNovIme(res.data.ime);
      setIzdelki(res.data.izdelki || []);
    } catch {
      Alert.alert('Napaka', 'Ne morem naložiti listka');
    }
  }

  useSpeechRecognitionEvent('result', (event) => {
    if (!poslusamRef.current) return;
    const besedilo = event.results[0]?.transcript || '';
    if (!besedilo) return;

    if (rezimRef.current === 'ime') {
      setNovIme(besedilo.trim());
      poslusamRef.current = false;
      setPoslusam(false);
      return;
    }

    const ocisceno = besedilo.replace(ODSTRANI_BESEDE, '').trim();
    const novi = ocisceno
      .split(/,|\s+in\s+|\s+ter\s+|\s+pa\s+/i)
      .map(i => i.trim())
      .filter(i => i.length > 1);
    if (novi.length) setIzdelki(prev => [...prev, ...novi.map(ime => ({ ime }))]);
  });

  useSpeechRecognitionEvent('end', () => {
    if (!poslusamRef.current) return;
    if (rezimRef.current === 'ime') {
      poslusamRef.current = false;
      setPoslusam(false);
      return;
    }
    setTimeout(() => {
      if (!poslusamRef.current) return;
      try {
        ExpoSpeechRecognitionModule.start({ lang: 'sl-SI', interimResults: false });
      } catch {
        poslusamRef.current = false;
        setPoslusam(false);
      }
    }, 300);
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

  async function dodajIzdelek() {
    if (!novIzdelek.trim()) return;
    const novi = novIzdelek.split(',').map(i => i.trim()).filter(Boolean);
    setIzdelki([...izdelki, ...novi.map(ime => ({ ime }))]);
    setNovIzdelek('');
  }

  function odstraniIzdelek(idx) {
    setIzdelki(izdelki.filter((_, i) => i !== idx));
  }

  async function potrdiInIzracunaj() {
    if (!novIme.trim()) return Alert.alert('Napaka', 'Ime listka ne sme biti prazno');
    if (poslusamRef.current) {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
      poslusamRef.current = false;
      setPoslusam(false);
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API}/listki/${listek_id}`,
        { ime: novIme.trim(), izdelki: izdelki.map(i => i.ime) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (izdelki.length > 0) {
        const izracun = await axios.post(`${API}/letaki/izracunaj/${listek_id}`, {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigation.navigate('Results', { rezultat: izracun.data });
      } else {
        await naloziListek();
        setUrejanje(false);
        Alert.alert('Shranjeno!', 'Listek je shranjen. Dodaj izdelke za izračun.');
      }
    } catch {
      Alert.alert('Napaka', 'Prišlo je do napake');
    }
    setLoading(false);
  }

  async function izbrisiListek() {
    Alert.alert('Izbriši', 'Ali res želiš izbrisati ta listek?', [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Izbriši', style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('token');
          await axios.delete(`${API}/listki/${listek_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          navigation.goBack();
        }
      }
    ]);
  }

  if (!listek) return <View style={s.container}><Text>Nalagam...</Text></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Nazaj</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.izbrisiBtn} onPress={izbrisiListek}>
            <Text style={s.izbrisiText}>Izbriši</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            if (urejanje && poslusamRef.current) {
              try { ExpoSpeechRecognitionModule.stop(); } catch {}
              poslusamRef.current = false;
              setPoslusam(false);
            }
            setUrejanje(!urejanje);
          }}>
            <Text style={s.uredi}>{urejanje ? 'Prekliči' : 'Uredi'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {listek.status === 'osnutek' && (
        <View style={s.osnutekBadge}>
          <Text style={s.osnutekText}>📝 Osnutek — uredi in shrani da postane aktiven</Text>
        </View>
      )}

      {urejanje ? (
        <View style={s.row}>
          <TextInput
            style={[s.titleInput, { flex: 1 }]}
            value={novIme}
            onChangeText={setNovIme}
            placeholder="Ime listka"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[s.glasMiniBtn, poslusam && glasovniRezim === 'ime' && s.glasMiniAktiven]}
            onPress={() => toggleGlas('ime')}
          >
            <Text style={s.glasMiniText}>🎤</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={s.title}>{listek.ime}</Text>
      )}
      {poslusam && glasovniRezim === 'ime' && (
        <Text style={s.poslusamText}>Poslušam ime listka...</Text>
      )}

      <Text style={s.meta}>{listek.ustvarjen?.split('T')[0] || listek.ustvarjen} · maks. {listek.max_trgovine} trgovin</Text>

      {listek.skupna_cena > 0 && (
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statVal}>{listek.skupna_cena?.toFixed(2)}€</Text>
            <Text style={s.statLabel}>Skupna cena</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statVal, { color: '#1D9E75' }]}>{listek.skupni_prihranek?.toFixed(2)}€</Text>
            <Text style={s.statLabel}>Prihranjeno</Text>
          </View>
        </View>
      )}

      <Text style={s.sectionTitle}>Izdelki ({izdelki.length})</Text>

      {urejanje && (
        <>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Dodaj izdelek..."
              value={novIzdelek}
              onChangeText={setNovIzdelek}
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
        </>
      )}

      {izdelki.map((i, idx) => (
        <View key={idx} style={s.itemRow}>
          <Text style={s.itemText}>🛒 {i.ime}</Text>
          {urejanje && (
            <TouchableOpacity onPress={() => odstraniIzdelek(idx)}>
              <Text style={s.removeBtn}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {urejanje && (
        <TouchableOpacity style={s.btn} onPress={potrdiInIzracunaj}>
          <Text style={s.btnText}>{loading ? 'Shranjujem...' : izdelki.length > 0 ? 'Shrani in izračunaj' : 'Shrani listek'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  back: { color: '#1D9E75', fontSize: 14 },
  uredi: { color: '#1D9E75', fontSize: 14, fontWeight: '500' },
  izbrisiBtn: { paddingHorizontal: 8 },
  izbrisiText: { color: '#E24B4A', fontSize: 14 },
  osnutekBadge: { backgroundColor: '#FAEEDA', borderRadius: 8, padding: 10, marginBottom: 12 },
  osnutekText: { fontSize: 12, color: '#854F0B' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  titleInput: { fontSize: 20, fontWeight: '600', borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 10, backgroundColor: '#fff', color: '#333' },
  meta: { fontSize: 13, color: '#888', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '600' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fff', color: '#333' },
  addBtn: { backgroundColor: '#1D9E75', borderRadius: 10, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  glasBtn: { borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  glasBtnAktiven: { backgroundColor: '#E1F5EE', borderColor: '#E24B4A' },
  glasBtnText: { color: '#1D9E75', fontSize: 14, fontWeight: '500' },
  glasMiniBtn: { width: 46, height: 46, borderRadius: 10, borderWidth: 0.5, borderColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  glasMiniAktiven: { backgroundColor: '#E1F5EE', borderColor: '#E24B4A' },
  glasMiniText: { fontSize: 18 },
  poslusamText: { fontSize: 11, color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 6 },
  itemText: { flex: 1, fontSize: 14 },
  removeBtn: { fontSize: 20, color: '#ccc', paddingHorizontal: 4 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});