import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, BackHandler, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomNav from '../components/BottomNav';

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
  const [aktivniTab, setAktivniTab] = useState('izdelki');
  const [izbraneTrgovine, setIzbraneTrgovine] = useState(['hofer', 'spar', 'lidl']);
  const [lokacija, setLokacija] = useState(null);
  const [trgovineNaZemljevidu, setTrgovineNaZemljevidu] = useState([]);
  const poslusamRef = useRef(false);
  const rezimRef = useRef('izdelki');
  const imeRef = useRef('');
  const izdelkiRef = useRef([]);
  const maxTrgovineRef = useRef(2);
  const maxKmRef = useRef(5);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { imeRef.current = ime; }, [ime]);
  useEffect(() => { izdelkiRef.current = izdelki; }, [izdelki]);
  useEffect(() => { maxTrgovineRef.current = maxTrgovine; }, [maxTrgovine]);
  useEffect(() => { maxKmRef.current = maxKm; }, [maxKm]);

  useEffect(() => {
    return () => {
      if (poslusamRef.current) {
        try { ExpoSpeechRecognitionModule.stop(); } catch {}
        poslusamRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (poslusam) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [poslusam]);

  useEffect(() => {
    async function pridobiLokacijo() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLokacija(loc);
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setTrgovineNaZemljevidu([
        { ime: 'Hofer', kratica: 'HOF', naslov: 'Hofer trgovina', lat: lat + 0.008, lng: lng + 0.005, barva: '#FAEEDA', besedilo: '#854F0B' },
        { ime: 'Spar', kratica: 'SPR', naslov: 'Spar trgovina', lat: lat - 0.005, lng: lng + 0.010, barva: '#EAF3DE', besedilo: '#3B6D11' },
        { ime: 'Lidl', kratica: 'LID', naslov: 'Lidl trgovina', lat: lat + 0.003, lng: lng - 0.008, barva: '#E6F1FB', besedilo: '#185FA5' },
      ]);
    }
    pridobiLokacijo();
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
        { ime: trenutnoIme || 'Osnutek', izdelki: trenutniIzdelki, max_trgovine: maxTrgovineRef.current, max_km: maxKmRef.current, status: 'osnutek', potece: poteceKo.toISOString() },
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
    if (!poslusamRef.current) return;
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

  const TRGOVINE_CONFIG = [
    { id: 'hofer', ime: 'Hofer', barva: '#FAEEDA', besedilo: '#854F0B' },
    { id: 'spar', ime: 'Spar', barva: '#EAF3DE', besedilo: '#3B6D11' },
    { id: 'lidl', ime: 'Lidl', barva: '#E6F1FB', besedilo: '#185FA5' },
  ];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={goNazaj}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dodaj listek</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, aktivniTab === 'izdelki' && s.tabActive]} onPress={() => setAktivniTab('izdelki')}>
          <Text style={[s.tabText, aktivniTab === 'izdelki' && s.tabTextActive]}>Izdelki</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, aktivniTab === 'trgovine' && s.tabActive]} onPress={() => setAktivniTab('trgovine')}>
          <Text style={[s.tabText, aktivniTab === 'trgovine' && s.tabTextActive]}>Trgovine</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>

          {aktivniTab === 'izdelki' ? (
            <View style={s.content}>
              <View style={s.inputWrapper}>
                <Text style={s.inputLabel}>Ime listka</Text>
                <View style={s.inputRow}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.input}
                      placeholder="npr. Tedenski nakup"
                      placeholderTextColor="#bbb"
                      value={ime}
                      onChangeText={setIme}
                    />
                  </View>
                  <TouchableOpacity
                    style={[s.glasMiniBtn, poslusam && glasovniRezim === 'ime' && s.glasMiniAktiven]}
                    onPress={() => toggleGlas('ime')}
                  >
                    <Ionicons name="mic-outline" size={20} color={poslusam && glasovniRezim === 'ime' ? '#fff' : '#4faf5a'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.inputWrapper}>
                <Text style={s.inputLabel}>Dodaj izdelke</Text>
                <View style={s.inputRow}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.input}
                      placeholder="npr. banane, mleko..."
                      placeholderTextColor="#bbb"
                      value={izdelek}
                      onChangeText={setIzdelek}
                      onSubmitEditing={dodajIzdelek}
                    />
                  </View>
                  <TouchableOpacity style={s.addBtn} onPress={dodajIzdelek}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.micSection}>
                <Animated.View style={[s.micOuter, poslusam && { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    style={[s.micBtn, poslusam && s.micBtnActive]}
                    onPress={() => toggleGlas('izdelki')}
                  >
                    <Ionicons name={poslusam ? 'stop' : 'mic'} size={32} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={s.micLabel}>
                  {poslusam ? 'Poslušam... (tapni za stop)' : 'Pritisni in govori'}
                </Text>
                {!poslusam && <Text style={s.micHint}>npr. mleko, kruh, jajca...</Text>}
              </View>

              {izdelki.length > 0 && (
                <View style={s.itemsList}>
                  {izdelki.map((i, idx) => (
                    <View key={idx} style={s.itemRow}>
                      <View style={s.itemCheck}>
                        <Ionicons name="checkmark" size={14} color="#4faf5a" />
                      </View>
                      <Text style={s.itemText}>{i}</Text>
                      <TouchableOpacity onPress={() => odstraniIzdelek(idx)}>
                        <Ionicons name="close" size={18} color="#ccc" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={s.content}>
              <Text style={s.inputLabel}>Izberi trgovine</Text>
              {TRGOVINE_CONFIG.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.trgovinaRow, izbraneTrgovine.includes(t.id) && s.trgovinaRowActive]}
                  onPress={() => setIzbraneTrgovine(prev =>
                    prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                  )}
                >
                  <View style={[s.trgovinaIcon, { backgroundColor: t.barva }]}>
                    <Text style={[s.trgovinaIconText, { color: t.besedilo }]}>{t.ime[0]}</Text>
                  </View>
                  <Text style={s.trgovinaIme}>{t.ime}</Text>
                  <View style={[s.checkbox, izbraneTrgovine.includes(t.id) && s.checkboxActive]}>
                    {izbraneTrgovine.includes(t.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[s.inputLabel, { marginTop: 20 }]}>Maks. število trgovin</Text>
              <View style={s.prefCard}>
                <Text style={s.prefLabel}>Koliko trgovin si pripravljen obiskati?</Text>
                <View style={s.counter}>
                  <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.max(1, maxTrgovine - 1))}>
                    <Ionicons name="remove" size={20} color="#555" />
                  </TouchableOpacity>
                  <Text style={s.cVal}>{maxTrgovine}</Text>
                  <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.min(5, maxTrgovine + 1))}>
                    <Ionicons name="add" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[s.inputLabel, { marginTop: 16 }]}>Maks. razdalja</Text>
              <View style={s.prefCard}>
                <Text style={s.prefLabel}>Skupna pot med vsemi trgovinami</Text>
                <View style={s.counter}>
                  <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.max(1, maxKm - 1))}>
                    <Ionicons name="remove" size={20} color="#555" />
                  </TouchableOpacity>
                  <Text style={s.cVal}>{maxKm} km</Text>
                  <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.min(50, maxKm + 1))}>
                    <Ionicons name="add" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[s.inputLabel, { marginTop: 20 }]}>Najbližje trgovine</Text>
              {lokacija ? (
                <MapView
                  style={s.map}
                  initialRegion={{
                    latitude: lokacija.coords.latitude,
                    longitude: lokacija.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  showsUserLocation={true}
                >
                  {trgovineNaZemljevidu.map((t, idx) => (
                    <Marker
                      key={idx}
                      coordinate={{ latitude: t.lat, longitude: t.lng }}
                      title={t.ime}
                      description={t.naslov}
                    >
                      <View style={[s.markerBox, { backgroundColor: t.barva }]}>
                        <Text style={[s.markerText, { color: t.besedilo }]}>{t.kratica}</Text>
                      </View>
                    </Marker>
                  ))}
                </MapView>
              ) : (
                <View style={s.mapPlaceholder}>
                  <Ionicons name="location-outline" size={32} color="#ccc" />
                  <Text style={s.mapPlaceholderText}>Pridobivam lokacijo...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.bottomBtn}>
        <TouchableOpacity style={s.mainBtn} onPress={potrdiListek}>
          <Text style={s.mainBtnText}>{loading ? 'Izračunavam...' : 'Optimiziraj nakup'}</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigation={navigation} aktivni="dodaj" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#222' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#4faf5a' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#aaa' },
  tabTextActive: { color: '#4faf5a', fontWeight: '700' },
  content: { padding: 16 },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#eee' },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#222' },
  addBtn: { width: 46, height: 46, backgroundColor: '#4faf5a', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  glasMiniBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  glasMiniAktiven: { backgroundColor: '#4faf5a', borderColor: '#4faf5a' },
  micSection: { alignItems: 'center', paddingVertical: 24 },
  micOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  micBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  micBtnActive: { backgroundColor: '#E24B4A' },
  micLabel: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 4 },
  micHint: { fontSize: 12, color: '#aaa' },
  itemsList: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', gap: 12 },
  itemCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  itemText: { flex: 1, fontSize: 14, color: '#222' },
  prefCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prefLabel: { fontSize: 13, color: '#555', flex: 1 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  cVal: { fontSize: 16, fontWeight: '600', color: '#222', minWidth: 40, textAlign: 'center' },
  trgovinaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1.5, borderColor: 'transparent' },
  trgovinaRowActive: { borderColor: '#4faf5a' },
  trgovinaIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  trgovinaIconText: { fontSize: 16, fontWeight: '700' },
  trgovinaIme: { flex: 1, fontSize: 15, fontWeight: '500', color: '#222' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#4faf5a', borderColor: '#4faf5a' },
  map: { height: 220, borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  mapPlaceholder: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', gap: 6 },
  mapPlaceholderText: { fontSize: 13, color: '#aaa' },
  markerBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  markerText: { fontSize: 11, fontWeight: '700' },
  bottomBtn: { position: 'absolute', bottom: 78, left: 16, right: 16 },
  mainBtn: { backgroundColor: '#4faf5a', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});