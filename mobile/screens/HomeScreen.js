import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://192.168.50.153:3000/api';

export default function HomeScreen({ navigation }) {
  const [ime, setIme] = useState('');
  const [listki, setListki] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      naloziPodatke();
    });
    return unsubscribe;
  }, [navigation]);

  async function naloziPodatke() {
    const shranjeno = await AsyncStorage.getItem('ime');
    setIme(shranjeno || '');
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/listki`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListki(res.data);
    } catch {}
  }

  async function odjava() {
    await AsyncStorage.clear();
    navigation.replace('Login');
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.pozdrav}>Zdravo, {ime}! 👋</Text>
          <Text style={s.subtitle}>Kaj danes kupuješ?</Text>
        </View>
        <TouchableOpacity onPress={odjava}>
          <Text style={s.odjava}>Odjava</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statVal}>{listki.length}</Text>
          <Text style={s.statLabel}>Listki</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statVal}>3</Text>
          <Text style={s.statLabel}>Aktivni letaki</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: '#1D9E75' }]}>
            {listki.filter(l => l.skupna_cena).reduce((sum, l) => sum + l.skupna_cena, 0).toFixed(2)}€
          </Text>
          <Text style={s.statLabel}>Skupaj porabljeno</Text>
        </View>
      </View>

      <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewList')}>
        <Text style={s.newBtnText}>+ Nov nakupovalni listek</Text>
      </TouchableOpacity>

      <Text style={s.sectionTitle}>Zadnji listki</Text>
      {listki.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🛍️</Text>
          <Text style={s.emptyText}>Še nimaš listkov</Text>
        </View>
      ) : (
        listki.slice(0, 5).map(l => (
          <TouchableOpacity key={l.id} style={s.card} onPress={() => navigation.navigate('History')}>
            <View>
              <Text style={s.cardTitle}>{l.ime}</Text>
              <Text style={s.cardMeta}>{l.ustvarjen?.split('T')[0] || l.ustvarjen}</Text>
            </View>
            {l.skupna_cena ? <Text style={s.cardPrice}>{l.skupna_cena.toFixed(2)}€</Text> : null}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  pozdrav: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  odjava: { color: '#E24B4A', fontSize: 14 },
  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '600' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  newBtn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, margin: 16, marginTop: 4, alignItems: 'center' },
  newBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '500' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '600', color: '#1D9E75' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 14 }
});