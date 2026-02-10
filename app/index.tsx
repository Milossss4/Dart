import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  FlatList, 
  StyleSheet, 
  Switch, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useGame } from '../context/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { initGame } = useGame();
  
  // Ustawienia gry
  const [targetScore, setTargetScore] = useState(501);
  const [setsToWin, setSetsToWin] = useState(1);
  const [legsToWin, setLegsToWin] = useState(3);
  const [isDoubleOut, setIsDoubleOut] = useState(true);

  // Gracze
  const [playerName, setPlayerName] = useState('');
  const [localPlayers, setLocalPlayers] = useState<any[]>([]);
  
  // UI State
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const addPlayer = () => {
    if (playerName.trim().length > 0) {
      setLocalPlayers([...localPlayers, { id: Date.now(), name: playerName }]);
      setPlayerName('');
    }
  };

  const removePlayer = (id: number) => {
    setLocalPlayers(localPlayers.filter(p => p.id !== id));
  };

  // Obsługa liczników
  const adjustValue = (setter: (val: number) => void, current: number, delta: number) => {
    const newValue = current + delta;
    if (newValue >= 1) setter(newValue);
  };

  const startGame = () => {
    if (localPlayers.length < 1) {
      Alert.alert("Błąd", "Dodaj przynajmniej jednego gracza!");
      return;
    }

    let shuffled = [...localPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Przekazujemy wszystkie ustawienia
    initGame(shuffled, { targetScore, setsToWin, legsToWin, isDoubleOut });
    router.push('/game'); 
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
         <Ionicons name="disc-outline" size={32} color="#e67e22" />
         <Text style={styles.title}>Dart Scorer</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* --- SEKCJA USTAWIEŃ --- */}
        <View style={styles.settingsSection}>
          
          {/* Wybór punktów (Posortowane) */}
          <View style={styles.scoreSelector}>
            {[101, 301, 501].map(score => (
              <TouchableOpacity 
                key={score} 
                style={[styles.scoreBtn, targetScore === score && styles.scoreBtnActive]}
                onPress={() => setTargetScore(score)}
              >
                <Text style={[styles.scoreText, targetScore === score && styles.scoreTextActive]}>
                  {score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Liczniki Setów i Legów */}
          <View style={styles.countersRow}>
            {/* Sety */}
            <View style={styles.counterBox}>
                <Text style={styles.counterLabel}>Sety do wygrania</Text>
                <View style={styles.counterControls}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustValue(setSetsToWin, setsToWin, -1)}>
                        <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{setsToWin}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustValue(setSetsToWin, setsToWin, 1)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Legi */}
            <View style={styles.counterBox}>
                <Text style={styles.counterLabel}>Legi do wygrania</Text>
                <View style={styles.counterControls}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustValue(setLegsToWin, legsToWin, -1)}>
                        <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{legsToWin}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => adjustValue(setLegsToWin, legsToWin, 1)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
          </View>

          {/* Double Out Switch */}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Double Out (Turniejowy)</Text>
            <Switch 
              value={isDoubleOut} 
              onValueChange={setIsDoubleOut}
              trackColor={{ false: "#767577", true: "#27ae60" }}
              thumbColor={isDoubleOut ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* --- INPUT GRACZA --- */}
        <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Wpisz imię gracza..." 
              placeholderTextColor="#888"
              value={playerName}
              onChangeText={setPlayerName}
              onSubmitEditing={addPlayer} 
            />
            <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>

        {/* --- LISTA GRACZY --- */}
        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Lista Graczy ({localPlayers.length})</Text>
          <FlatList
            data={localPlayers}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.playerCard}>
                <View style={styles.avatar}>
                   <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.playerName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removePlayer(item.id)} style={styles.deleteBtn}>
                   <Ionicons name="trash-outline" size={20} color="#c0392b" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Brak graczy. Dodaj kogoś!</Text>
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* --- STOPKA --- */}
      {!isKeyboardVisible && (
        <View style={styles.footer}>
           <TouchableOpacity style={styles.startBtn} onPress={startGame}>
             <Text style={styles.startBtnText}>ROZPOCZNIJ GRĘ</Text>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a1a', 
    paddingHorizontal: 20,
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 10,
    gap: 10
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#fff', 
    letterSpacing: 1 
  },

  settingsSection: {
    marginBottom: 15,
  },
  
  // Punkty
  scoreSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10
  },
  scoreBtn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333'
  },
  scoreBtnActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#e67e22'
  },
  scoreText: { color: '#aaa', fontSize: 18, fontWeight: 'bold' },
  scoreTextActive: { color: '#fff' },

  // Liczniki Setów i Legów
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10
  },
  counterBox: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center'
  },
  counterLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15
  },
  counterBtn: {
    backgroundColor: '#444',
    padding: 5,
    borderRadius: 8,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Input
  inputContainer: { 
    flexDirection: 'row', 
    marginBottom: 10,
    gap: 10
  },
  input: { 
    flex: 1, 
    backgroundColor: '#333',
    color: '#fff',
    padding: 15, 
    borderRadius: 12, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444'
  },
  addBtn: {
    backgroundColor: '#2980b9',
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12
  },

  // Lista
  listContainer: {
    flex: 1, 
    backgroundColor: '#252525', 
    borderRadius: 15,
    padding: 10,
    marginBottom: 10
  },
  listHeader: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  playerName: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600' },
  deleteBtn: { padding: 5 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 30, fontStyle: 'italic' },

  footer: {
    paddingVertical: 10,
  },
  startBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1
  }
});