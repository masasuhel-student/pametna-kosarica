import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = 'http://192.168.50.153:3000/api';

export default function HistoryScreen({ navigation }) {
  const [listki, setListki] = useState([]);

  useEffect(() => {
    naloziListke();
  }, []);

  async function naloziListke() {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/listki`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListki(res.data);
    } catch {}
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Moji listki</Text>
      {listki.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyText}>Še nimaš shranjenih listkov</Text>
        </View>
      ) : (
        listki.map(l => (
          <View key={l.id} style={s.card}>
            <View>
              <Text style={s.cardTitle}>{l.ime}</Text>
              <Text style={s.cardMeta}>{l.ustvarjen?.split('T')[0] || l.ustvarjen} · maks. {l.max_trgovine} trgovin</Text>
            </View>
            {l.skupna_cena ? <Text style={s.cardPrice}>{l.skupna_cena.toFixed(2)}€</Text> : <Text style={s.cardPending}>—</Text>}
          </View>
        ))
      )}
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('NewList')}>
        <Text style={s.btnText}>+ Nov listek</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '500' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '600', color: '#1D9E75' },
  cardPending: { fontSize: 16, color: '#ccc' },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 14 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});