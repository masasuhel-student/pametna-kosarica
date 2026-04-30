import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const API = 'http://192.168.64.106:3000/api';

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

  const aktivniListki = listki.filter(l => l.status !== 'osnutek');
  const skupajPrihranjeno = listki.reduce((sum, l) => sum + (l.skupni_prihranek || 0), 0);
  const listkiTaTedenCount = listki.filter(l => {
    const d = new Date(l.ustvarjen);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;
  const prihranekTaTeden = listki
    .filter(l => {
      const d = new Date(l.ustvarjen);
      const now = new Date();
      return (now - d) / (1000 * 60 * 60 * 24) <= 7;
    })
    .reduce((sum, l) => sum + (l.skupni_prihranek || 0), 0);

  const nedavniListki = listki.slice(0, 4);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.logoIcon}>🛒</Text>
          <Text style={s.logoText}>Pametna<Text style={s.logoGreen}>Košarica</Text></Text>
        </View>
        <TouchableOpacity style={s.avatarBtn} onPress={odjava}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{ime.charAt(0).toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroLeft}>
            <Text style={s.heroTitle}>Dobrodošla nazaj!</Text>
            <Text style={s.heroSub}>Tvoj pametni nakup{'\n'}se začne tukaj.</Text>
          </View>
          <Text style={s.heroEmoji}>🛍️</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="document-text-outline" size={28} color="#4faf5a" />
            <View>
              <Text style={s.statVal}>{aktivniListki.length}</Text>
              <Text style={s.statLabel}>Tvoji listki</Text>
              {listkiTaTedenCount > 0 && (
                <Text style={s.statSub}>+{listkiTaTedenCount} ta teden</Text>
              )}
            </View>
          </View>
          <View style={s.statCard}>
            <FontAwesome5 name="piggy-bank" size={26} color="#4faf5a" />
            <View>
              <Text style={[s.statVal, { color: '#4faf5a' }]}>{skupajPrihranjeno.toFixed(2)} €</Text>
              <Text style={s.statLabel}>Prihranki</Text>
              {prihranekTaTeden > 0 && (
                <Text style={[s.statSub, { color: '#4faf5a' }]}>+{prihranekTaTeden.toFixed(2)} € ta teden</Text>
              )}
            </View>
          </View>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Nedavni listki</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={s.sectionLink}>Poglej vse</Text>
          </TouchableOpacity>
        </View>

        {listki.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="cart-outline" size={48} color="#ccc" />
            <Text style={s.emptyText}>Še nimaš listkov</Text>
          </View>
        ) : (
          nedavniListki.map(l => (
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
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem}>
          <Ionicons name="home" size={22} color="#4faf5a" />
          <Text style={[s.navLabel, { color: '#4faf5a' }]}>Domov</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('History')}>
          <Ionicons name="document-text-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Listki</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navCenter} onPress={() => navigation.navigate('NewList')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('History')}>
          <Ionicons name="create-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Uredi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={odjava}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={s.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 18, fontWeight: '700', color: '#222' },
  logoGreen: { color: '#4faf5a' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hero: { margin: 16, backgroundColor: '#4faf5a', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLeft: {},
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  heroSub: { color: '#E1F5EE', fontSize: 13, lineHeight: 20 },
  heroEmoji: { fontSize: 52 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statVal: { fontSize: 18, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 1 },
  statSub: { fontSize: 10, color: '#888', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  sectionLink: { fontSize: 13, color: '#4faf5a', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  cardMeta: { fontSize: 11, color: '#aaa', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardPrihranek: { fontSize: 11, color: '#4faf5a', fontWeight: '600' },
  cardOsnutek: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: '#888', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 34, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingBottom: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#eee', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888' },
  navCenter: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8 },
});