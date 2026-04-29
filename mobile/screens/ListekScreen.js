import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://192.168.50.153:3000/api';

export default function ListekScreen({ route, navigation }) {
  const { listek_id } = route.params;
  const [listek, setListek] = useState(null);
  const [izdelki, setIzdelki] = useState([]);
  const [novIzdelek, setNovIzdelek] = useState('');
  const [loading, setLoading] = useState(false);
  const [urejanje, setUrejanje] = useState(false);

  useEffect(() => {
    naloziListek();
  }, []);

  async function naloziListek() {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/listki/${listek_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListek(res.data);
      setIzdelki(res.data.izdelki || []);
    } catch {
      Alert.alert('Napaka', 'Ne morem naložiti listka');
    }
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
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API}/listki/${listek_id}`,
        { izdelki: izdelki.map(i => i.ime) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const izracun = await axios.post(`${API}/letaki/izracunaj/${listek_id}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('Results', { rezultat: izracun.data });
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
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Nazaj</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setUrejanje(!urejanje)}>
          <Text style={s.uredi}>{urejanje ? 'Prekliči' : 'Uredi'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.title}>{listek.ime}</Text>
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
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Dodaj izdelek..."
            value={novIzdelek}
            onChangeText={setNovIzdelek}
            onSubmitEditing={dodajIzdelek}
          />
          <TouchableOpacity style={s.addBtn} onPress={dodajIzdelek}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={s.btnText}>{loading ? 'Izračunavam...' : 'Shrani in izračunaj znova'}</Text>
        </TouchableOpacity>
      )}

      {!urejanje && listek.skupna_cena > 0 && (
        <TouchableOpacity style={s.btn} onPress={potrdiInIzracunaj}>
          <Text style={s.btnText}>Izračunaj znova</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.deleteBtn} onPress={izbrisiListek}>
        <Text style={s.deleteBtnText}>Izbriši listek</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  back: { color: '#1D9E75', fontSize: 14 },
  uredi: { color: '#1D9E75', fontSize: 14, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '600' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#1D9E75', borderRadius: 10, width: 46, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 6 },
  itemText: { flex: 1, fontSize: 14 },
  removeBtn: { fontSize: 20, color: '#ccc', paddingHorizontal: 4 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { borderWidth: 0.5, borderColor: '#E24B4A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  deleteBtnText: { color: '#E24B4A', fontSize: 14 }
});