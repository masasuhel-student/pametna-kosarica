import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ navigation, aktivni }) {
  return (
    <View style={s.bottomNav}>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Home')}>
        <Ionicons name={aktivni === 'home' ? 'home' : 'home-outline'} size={22} color={aktivni === 'home' ? '#4faf5a' : '#888'} />
        <Text style={[s.navLabel, aktivni === 'home' && s.navLabelActive]}>Domov</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('History')}>
        <Ionicons name={aktivni === 'listki' ? 'document-text' : 'document-text-outline'} size={22} color={aktivni === 'listki' ? '#4faf5a' : '#888'} />
        <Text style={[s.navLabel, aktivni === 'listki' && s.navLabelActive]}>Vsi listki</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navCenter} onPress={() => navigation.navigate('NewList')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('NewList')}>
        <Ionicons name={aktivni === 'dodaj' ? 'create' : 'create-outline'} size={22} color={aktivni === 'dodaj' ? '#4faf5a' : '#888'} />
        <Text style={[s.navLabel, aktivni === 'dodaj' && s.navLabelActive]}>Dodaj listek</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem}>
        <Ionicons name={aktivni === 'profil' ? 'person' : 'person-outline'} size={22} color={aktivni === 'profil' ? '#4faf5a' : '#888'} />
        <Text style={[s.navLabel, aktivni === 'profil' && s.navLabelActive]}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', paddingBottom: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#eee', alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888' },
  navLabelActive: { color: '#4faf5a' },
  navCenter: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4faf5a', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8 },
});