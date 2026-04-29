import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function ResultsScreen({ route, navigation }) {
  const { rezultat } = route.params;
  const trgovine = rezultat?.trgovine || {};

  const barve = { hofer: '#FAEEDA', spar: '#EAF3DE', lidl: '#E6F1FB' };
  const besedilo = { hofer: '#854F0B', spar: '#3B6D11', lidl: '#185FA5' };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Rezultati 🎉</Text>
      <Text style={s.listek}>{rezultat?.listek}</Text>

      {Object.entries(trgovine).map(([trgovina, izdelki]) => (
        <View key={trgovina} style={s.card}>
          <View style={[s.storeHeader, { backgroundColor: barve[trgovina.toLowerCase()] || '#f0f0f0' }]}>
            <Text style={[s.storeName, { color: besedilo[trgovina.toLowerCase()] || '#333' }]}>{trgovina}</Text>
            <Text style={[s.storeTotal, { color: besedilo[trgovina.toLowerCase()] || '#333' }]}>
              {izdelki.reduce((s, i) => s + i.cena, 0).toFixed(2)}€
            </Text>
          </View>
          {izdelki.map((i, idx) => (
            <View key={idx} style={s.itemRow}>
              <Text style={s.itemName}>{i.izdelek}</Text>
              <Text style={s.itemPrice}>{i.cena.toFixed(2)}€</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={s.totalBox}>
        <Text style={s.totalLabel}>Skupna cena</Text>
        <Text style={s.totalAmount}>{rezultat?.skupna_cena?.toFixed(2)}€</Text>
        <Text style={s.totalSub}>{rezultat?.stevilo_trgovin} trgovin</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Home')}>
        <Text style={s.btnText}>Domov</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  listek: { fontSize: 14, color: '#888', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16 },
  storeName: { fontSize: 15, fontWeight: '600' },
  storeTotal: { fontSize: 15, fontWeight: '600' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  itemName: { fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, fontWeight: '500', color: '#1D9E75' },
  totalBox: { backgroundColor: '#E1F5EE', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 13, color: '#0F6E56', marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: '600', color: '#085041' },
  totalSub: { fontSize: 13, color: '#0F6E56', marginTop: 4 },
  btn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});