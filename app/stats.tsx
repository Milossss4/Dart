import { useRouter } from 'expo-router';
import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { players } = useGame();

  // Obliczanie średniej (3 lotki)
  const calculateAvg = (player: any) => {
    if (!player.throwsHistory || player.throwsHistory.length === 0) return "0.00";
    const total = player.throwsHistory.reduce((a: number, b: number) => a + b, 0);
    return ((total / player.throwsHistory.length) * 3).toFixed(2);
  };

  // Znajdź zwycięzcę (osoba z największą liczbą setów)
  const winnerId = players.reduce((prev, current) => {
    return (prev.setsWon || 0) > (current.setsWon || 0) ? prev : current;
  }, players[0]).id;

  const renderPlayerStats = ({ item, index }: { item: any, index: number }) => {
    const isWinner = item.id === winnerId;
    const avg = calculateAvg(item);
    // Zakładamy, że highestCheckout może być dodane w przyszłości, póki co wyświetlamy bezpiecznie
    const hiOut = item.highestCheckout || '-'; 

    return (
      <View style={[styles.card, isWinner && styles.winnerCard]}>
        
        {/* Nagłówek Karty */}
        <View style={styles.cardHeader}>
          <View style={styles.rankContainer}>
             {isWinner ? (
                <Ionicons name="trophy" size={24} color="#f1c40f" />
             ) : (
                <Text style={styles.rankText}>#{index + 1}</Text>
             )}
          </View>
          <Text style={styles.name}>{item.name}</Text>
          {isWinner && <Text style={styles.winnerText}>ZWYCIĘZCA</Text>}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Siatka Statystyk */}
        <View style={styles.statsGrid}>
          {/* Średnia */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Średnia</Text>
            <Text style={styles.statValue}>{avg}</Text>
          </View>

          {/* Hi-Out (Najwyższe zamknięcie) */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hi-Out</Text>
            <Text style={styles.statValue}>{hiOut}</Text>
          </View>

          {/* Wygrane Sety */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Sety</Text>
            <Text style={[styles.statValue, { color: '#e67e22' }]}>{item.setsWon || 0}</Text>
          </View>

          {/* Wygrane Legi */}
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Legi</Text>
            <Text style={[styles.statValue, { color: '#2ecc71' }]}>{item.legsWon || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.headerContainer}>
        <Ionicons name="stats-chart" size={28} color="#e67e22" />
        <Text style={styles.screenTitle}>Podsumowanie</Text>
      </View>

      <FlatList 
        data={players}
        keyExtractor={(p) => p.id.toString()}
        renderItem={renderPlayerStats}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.dismissAll()}>
          <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.homeBtnText}>NOWA GRA (MENU)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
    gap: 10
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  
  // Karta Gracza
  card: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  winnerCard: {
    borderColor: '#f1c40f',
    backgroundColor: '#2c2c2c', // Nieco inny odcień dla zwycięzcy
    borderWidth: 2
  },
  
  // Nagłówek Karty
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10
  },
  rankText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  winnerText: {
    color: '#f1c40f',
    fontSize: 10,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#f1c40f',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase'
  },

  separator: {
    height: 1,
    backgroundColor: '#444',
    marginBottom: 10
  },

  // Siatka Statystyk
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a'
  },
  homeBtn: {
    backgroundColor: '#2980b9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1
  }
});