import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API = 'http://192.168.64.106:3000/api';

export default function HistoryScreen({ navigation }) {
  const [listki, setListki] = useState([]);
  const [iskanje, setIskanje] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      naloziListke();
    });
    return unsubscribe;
  }, [navigation]);

  async function naloziListke() {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/listki`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListki(res.data);
    } catch {}
  }

  const filtrirani = listki.filter(l => 
    l.ime.toLowerCase().includes(iskanje.toLowerCase())
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Vsi listki</Text>
      </View>

      {/* Iskanje */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color="#aaa" />
          <TextInput
            style={s.searchInput}
            placeholder="Išči listke..."
            placeholderTextColor="#bbb"
            value={iskanje}
            onChangeText={setIskanje}
          />
          {iskanje.length > 0 && (
            <TouchableOpacity onPress={() => setIskanje('')}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <Ionicons name="filter-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Listki */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {filtrirani.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={s.emptyText}>
              {iskanje ? 'Ni rezultatov' : 'Še nimaš listkov'}
            </Text>
          </View>
        ) : (
          filtrirani.map(l => (
            <TouchableOpacity 
              key={l.id} 
              style={s.card} 
              onPress={() => navigation.navigate('Listek', { listek_id: l.id })}
            >
              <View style={s.cardIcon}>
                <Ionicons name="document-text-outline" size={22} color="#4faf5a" />
              </View>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{l.ime}</Text>
                <Text style={s.cardMeta}>
                  {new Date(l.ustvarjen).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              {l.status === 'osnutek' ? (
                <Text style={s.cardOsnutek}>osnutek</Text>
              ) : l.skupni_prihranek > 0 ? (
                <View style={s.cardRight}>
                  <Text style={s.cardPrihranek}>+{l.skupni_prihranek.toFixed(2)} €</Text>
                  <Text style={s.cardPrice}>{l.skupna_cena.toFixed(2)} €</Text>
                </View>
              ) : l.skupna_cena ? (
                <View style={s.cardRight}>
                  <Text style={s.cardPrice}>{l.skupna_cena.toFixed(2)} €</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewList')}>
          <Ionicons name="add" size={20} color="#4faf5a" />
          <Text style={s.newBtnText}>Nov listek</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Domov</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem}>
          <Ionicons name="document-text" size={22} color="#4faf5a" />
          <Text style={[s.navLabel, { color: '#4faf5a' }]}>Vsi listki</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navCenter} onPress={() => navigation.navigate('NewList')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('History')}>
          <Ionicons name="create-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Uredi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', color: '#222', textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#222' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  cardMeta: { fontSize: 11, color: '#aaa', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardPrihranek: { fontSize: 13, fontWeight: '700', color: '#4faf5a' },
  cardPrice: { fontSize: 11, color: '#aaa', marginTop: 1 },
  cardOsnutek: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  empty: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { color: '#888', fontSize: 14 },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#4faf5a', borderStyle: 'dashed' },
  newBtnText: { color: '#4faf5a', fontSize: 14, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 34, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingBottom: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#eee', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888' },
  navCenter: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8 },
});