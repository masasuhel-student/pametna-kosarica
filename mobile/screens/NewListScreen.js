import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://192.168.50.153:3000/api';

export default function NewListScreen({ navigation }) { 
  const [ime, setIme] = useState('');
  const [izdelek, setIzdelek] = useState('');
  const [izdelki, setIzdelki] = useState([]);
  const [maxTrgovine, setMaxTrgovine] = useState(2);
  const [maxKm, setMaxKm] = useState(5);
  const [loading, setLoading] = useState(false);
  const [poslusam, setPoslusam] = useState(false);

  async function toggleGlas() {
    Alert.alert(
      '🎤 Glasovno vnašanje',
      'Glasovno vnašanje bo na voljo v naslednji verziji aplikacije. Uporabite tipkovnico.',
      [{ text: 'OK' }]
    );
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
    } catch (e) {
      Alert.alert('Napaka', 'Prišlo je do napake');
    }
    setLoading(false);
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Nov listek</Text>

      <Text style={s.label}>Ime listka</Text>
      <TextInput style={s.input} placeholder="npr. Tedenski nakup" value={ime} onChangeText={setIme} />

      <Text style={s.label}>Dodaj izdelke</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          placeholder="npr. banane, mleko..."
          value={izdelek}
          onChangeText={setIzdelek}
          onSubmitEditing={dodajIzdelek}
        />
        <TouchableOpacity style={s.addBtn} onPress={dodajIzdelek}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[s.glasBtn, poslusam && s.glasBtnAktiven]} onPress={toggleGlas}>
        <Text style={s.glasBtnText}>🎤 Govori izdelke</Text>
      </TouchableOpacity>

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

      <Text style={s.label}>Maks. število trgovin: {maxTrgovine}</Text>
      <View style={s.counter}>
        <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.max(1, maxTrgovine - 1))}>
          <Text style={s.cBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.cVal}>{maxTrgovine}</Text>
        <TouchableOpacity style={s.cBtn} onPress={() => setMaxTrgovine(Math.min(5, maxTrgovine + 1))}>
          <Text style={s.cBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Maks. razdalja: {maxKm} km</Text>
      <View style={s.counter}>
        <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.max(1, maxKm - 1))}>
          <Text style={s.cBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.cVal}>{maxKm} km</Text>
        <TouchableOpacity style={s.cBtn} onPress={() => setMaxKm(Math.min(50, maxKm + 1))}>
          <Text style={s.cBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btn} onPress={potrdiListek}>
        <Text style={s.btnText}>{loading ? 'Izračunavam...' : 'Potrdi in izračunaj'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Nazaj</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#1D9E75', borderRadius: 10, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  itemsList: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, marginBottom: 6 },
  itemText: { flex: 1, fontSize: 14 },
  removeBtn: { fontSize: 20, color: '#ccc', paddingHorizontal: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  cBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 0.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  cBtnText: { fontSize: 20, color: '#333' },
  cVal: { fontSize: 16, fontWeight: '500', minWidth: 40, textAlign: 'center' },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: { alignItems: 'center', padding: 16 },
  backText: { color: '#888', fontSize: 14 },
  glasBtn: { borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  glasBtnAktiven: { backgroundColor: '#E1F5EE', borderColor: '#E24B4A' },
  glasBtnText: { color: '#1D9E75', fontSize: 14, fontWeight: '500' }
});