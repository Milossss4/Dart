import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

type ThrowType = {
    score: number;
    multiplier: number;
    label: string;
};

// --- LOGIKA CHECKOUTÓW ---
const getCheckoutSteps = (score: number, isDoubleOut: boolean): string[] => {
    if (score < 2 && isDoubleOut) return [];
    if (score === 0) return [];
    if (score > 170 && isDoubleOut) return [];
    if (score > 180 && !isDoubleOut) return [];

    const formatThrow = (val: number, mult: number) => {
        if (val === 25) return mult === 2 ? 'BULL' : '25';
        const prefix = mult === 3 ? 'T' : mult === 2 ? 'D' : '';
        return `${prefix}${val}`;
    };

    // Helper do sprawdzania czy liczba > 20 może być rzucona jako D lub T
    const formatIfPossible = (val: number): string => {
        if (val <= 20) return val.toString();
        if (val === 25) return '25';
        if (val === 50) return 'BULL';
        if (val <= 60 && val % 3 === 0) return formatThrow(val / 3, 3);
        if (val <= 40 && val % 2 === 0) return formatThrow(val / 2, 2);
        return val.toString(); // Zwraca np. "23" jeśli nie da się sformatować (sytuacja rzadka, ale możliwa przy Single Out)
    };

    if (!isDoubleOut) {
        if (score <= 20) return [score.toString()];
        if (score === 25) return ['25'];
        if (score === 50) return ['BULL'];
        if (score <= 40 && score % 2 === 0) return [formatThrow(score / 2, 2)];
        if (score <= 60 && score % 3 === 0) return [formatThrow(score / 3, 3)];

        if (score > 60) {
            const steps = [];
            let current = score;
            
            // Zbijamy punktami T20 dopóki się da
            while (current > 60 && steps.length < 3) {
                steps.push('T20');
                current -= 60;
            }

            if (current > 0 && steps.length < 3) {
                // Czy resztę da się skończyć 1 rzutem?
                if (current <= 20) steps.push(current.toString());
                else if (current <= 40 && current % 2 === 0) steps.push(formatThrow(current / 2, 2));
                else if (current <= 60 && current % 3 === 0) steps.push(formatThrow(current / 3, 3));
                else if (current === 25) steps.push('25');
                else if (current === 50) steps.push('BULL');
                else {
                    // Reszta jest trudna (np. 41, 43), musimy rozbić na 2 rzuty
                    if (steps.length === 1) { // Mamy miejsce na 2 rzuty
                        const first = current - 20;
                        // --- POPRAWKA TUTAJ ---
                        // Zamiast first.toString() używamy formatowania
                        steps.push(formatIfPossible(first)); 
                        steps.push('20');
                    } else {
                        steps.push('?');
                    }
                }
            }
            return steps;
        }

        // Obsługa niskich wyników, które nie są D lub T (np. 23)
        if (score <= 60) {
            if (score > 20) {
                const first = score - 20;
                // --- I TUTAJ TEŻ ---
                // Np. dla 41 (Single Out) -> T7 (21) + 20
                return [formatIfPossible(first), '20'];
            }
            if (score > 10) {
                const first = score - 10;
                return [first.toString(), '10'];
            }
            return ['1', (score - 1).toString()];
        }
    }

    // --- Reszta logiki Double Out bez zmian ---
    const doubles = Array.from({ length: 20 }, (_, i) => 20 - i).map(v => ({ val: v * 2, lbl: `D${v}` }));
    doubles.unshift({ val: 50, lbl: 'BULL' });

    const d1 = doubles.find(d => d.val === score);
    if (d1) return [d1.lbl];

    const setters = [
        { v: 60, l: 'T20' }, { v: 57, l: 'T19' }, { v: 54, l: 'T18' }, { v: 51, l: 'T17' },
        { v: 50, l: 'BULL' }, { v: 25, l: '25' },
        ...Array.from({ length: 20 }, (_, i) => ({ v: 20 - i, l: (20 - i).toString() }))
    ];

    for (let s of setters) {
        const rem = score - s.v;
        const d2 = doubles.find(d => d.val === rem);
        if (d2) return [s.l, d2.lbl];
    }

    if (score > 60) {
        for (let s1 of setters.filter(x => x.v >= 15)) {
            const rem1 = score - s1.v;
            for (let s2 of setters) {
                const rem2 = rem1 - s2.v;
                const d3 = doubles.find(d => d.val === rem2);
                if (d3) return [s1.l, s2.l, d3.lbl];
            }
        }
    }

    return [];
};


export default function GameScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { players, setPlayers, settings } = useGame();

    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [isProcessingTurn, setIsProcessingTurn] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);

    useEffect(() => {
        if (!players || players.length === 0) {
            router.replace('/');
        }
    }, [players]);

    // ZABEZPIECZENIE PRZED WYJŚCIEM
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (isGameFinished) {
                return;
            }
            e.preventDefault();
            Alert.alert(
                'Przerwać grę?',
                'Postęp bieżącego meczu zostanie utracony.',
                [
                    { text: 'Anuluj', style: 'cancel', onPress: () => { } },
                    {
                        text: 'Zakończ',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });
        return unsubscribe;
    }, [navigation, isGameFinished]);

    if (!players || players.length === 0) return null;

    const currentPlayer = players[currentPlayerIdx];

    const suggestionSteps = useMemo(() => {
        return getCheckoutSteps(currentPlayer.score, settings.isDoubleOut);
    }, [currentPlayer.score, settings.isDoubleOut]);

    const nextTurn = useCallback((playersSnapshot?: typeof players) => {
        setMultiplier(1);
        setIsProcessingTurn(false);

        const currentPlayersList = playersSnapshot || players;

        const updatedPlayers = currentPlayersList.map((p, index) => {
            if (index === currentPlayerIdx) {
                return {
                    ...p,
                    lastThrows: [...p.currentTurnThrows],
                    currentTurnThrows: []
                };
            }
            return p;
        });

        setPlayers(updatedPlayers);
        setCurrentPlayerIdx((prev) => (prev + 1) % currentPlayersList.length);
    }, [players, currentPlayerIdx, setPlayers]);

    // --- USUNIĘTO useEffect SPRAWDZAJĄCY 3 RZUTY (powodował konflikty) ---
    // Logika ta została przeniesiona bezpośrednio do handleThrow (punkt 4)

    const startNewLeg = (updatedPlayersSnapshot: any[]) => {
        const resetPlayers = updatedPlayersSnapshot.map(p => ({
            ...p,
            score: settings.targetScore,
            scoreAtStartOfTurn: settings.targetScore,
            currentTurnThrows: [],
            lastThrows: []
        }));

        setPlayers(resetPlayers);
        setMultiplier(1);
        setIsProcessingTurn(false);
    };


    const handleThrow = (value: number) => {
        if (currentPlayer.currentTurnThrows.length >= 3 || isProcessingTurn) {
            return;
        }

        if (value === 25 && multiplier === 3) {
            setMultiplier(1);
            return;
        }

        let points = value * multiplier;
        if (value === 25 && multiplier === 2) points = 50;
        const isDouble = (multiplier === 2) || (value === 25 && multiplier === 2);

        const throwLabel = formatThrowLabel(value, multiplier);
        const newThrowData = { score: points, multiplier, label: throwLabel };

        let isBust = false;
        let isLegWin = false;

        const updatedPlayers = players.map((p, index) => {
            if (index !== currentPlayerIdx) return p;

            const updatedPlayer = { ...p };
            
            if (updatedPlayer.currentTurnThrows.length === 0) {
                updatedPlayer.scoreAtStartOfTurn = updatedPlayer.score;
            }

            const newScore = updatedPlayer.score - points;
            updatedPlayer.currentTurnThrows = [...updatedPlayer.currentTurnThrows, newThrowData];
            updatedPlayer.throwsHistory = [...updatedPlayer.throwsHistory, points];

            if (newScore === 0) {
                if (settings.isDoubleOut && !isDouble) {
                    isBust = true;
                } else {
                    isLegWin = true;
                }
            } else if (newScore < 0 || (settings.isDoubleOut && newScore === 1)) {
                isBust = true;
            } else {
                updatedPlayer.score = newScore;
            }

            if (isBust) {
                updatedPlayer.score = updatedPlayer.scoreAtStartOfTurn;
            }
            
            if (isLegWin) updatedPlayer.score = 0;

            return updatedPlayer;
        });

        // 1. OBSŁUGA WYGRANEJ
        if (isLegWin) {
            const winner = updatedPlayers[currentPlayerIdx];
            winner.legsWon = (winner.legsWon || 0) + 1;
            const checkoutScore = winner.currentTurnThrows.reduce((acc: number, t: ThrowType) => acc + t.score, 0);
            
            if (checkoutScore > (winner.highestCheckout || 0)) {
                winner.highestCheckout = checkoutScore;
            }

            let isSetWin = false;
            if (winner.legsWon >= settings.legsToWin) {
                winner.setsWon = (winner.setsWon || 0) + 1;
                winner.legsWon = 0; 
                isSetWin = true;
            }

            if (winner.setsWon >= settings.setsToWin) {
                setIsGameFinished(true); 
                setPlayers(updatedPlayers);
                setTimeout(() => { router.replace('/stats'); }, 0);
                return;
            }

            let title = "LEG DLA CIEBIE!";
            let message = `${winner.name} kończy lega zejściem ${checkoutScore}!`;
            if (isSetWin) {
                title = "SET DLA CIEBIE!";
                message = `${winner.name} wygrywa seta!`;
            }

            setPlayers(updatedPlayers);
            setIsProcessingTurn(true);
            Alert.alert(title, message, [{ text: "Dalej", onPress: () => startNewLeg(updatedPlayers) }]);
            return;
        }

        // 2. OBSŁUGA BUST
        if (isBust) {
            setPlayers(updatedPlayers);
            setMultiplier(1);
            setIsProcessingTurn(true);
            setTimeout(() => {
                nextTurn(updatedPlayers); 
            }, 1200);
            return;
        }

        // 3. ZWYKŁY RZUT
        setPlayers(updatedPlayers);
        setMultiplier(1);

        // 4. --- NOWOŚĆ: Sprawdzamy, czy to był 3. rzut i zmieniamy turę tutaj ---
        // Dzięki temu unikamy konfliktów z useEffectem i podwójnego wywoływania
        const currentPlayerAfterThrow = updatedPlayers[currentPlayerIdx];
        if (currentPlayerAfterThrow.currentTurnThrows.length === 3) {
            setIsProcessingTurn(true);
            setTimeout(() => {
                nextTurn(updatedPlayers);
            }, 1000);
        }
    };

    const handleUndo = () => {
        if (isProcessingTurn) return;

        if (currentPlayer.currentTurnThrows.length > 0) {
            const updatedPlayers = players.map((p, index) => {
                if (index !== currentPlayerIdx) return p;
                const updatedPlayer = { ...p };
                const lastThrow = updatedPlayer.currentTurnThrows.pop();
                updatedPlayer.throwsHistory.pop();
                if (lastThrow) updatedPlayer.score += lastThrow.score;
                updatedPlayer.currentTurnThrows = [...updatedPlayer.currentTurnThrows];
                return updatedPlayer;
            });
            setPlayers(updatedPlayers);
            return;
        }

        if (currentPlayer.currentTurnThrows.length === 0) {
            const prevIdx = (currentPlayerIdx - 1 + players.length) % players.length;
            const prevPlayer = players[prevIdx];

            if (!prevPlayer.lastThrows || prevPlayer.lastThrows.length === 0) return;

            const updatedPlayers = players.map((p, index) => {
                if (index !== prevIdx) return p;

                const updatedPlayer = { ...p };
                const restoredThrows = [...updatedPlayer.lastThrows];
                const throwToUndo = restoredThrows.pop();
                updatedPlayer.throwsHistory.pop();

                if (throwToUndo) {
                    updatedPlayer.score += throwToUndo.score;
                }

                updatedPlayer.currentTurnThrows = restoredThrows;
                updatedPlayer.lastThrows = [];

                return updatedPlayer;
            });

            setPlayers(updatedPlayers);
            setCurrentPlayerIdx(prevIdx);
        }
    };

    const formatThrowLabel = (val: number, mult: number) => {
        if (val === 25) return mult === 2 ? 'BULL' : '25';
        if (val === 0) return 'MISS';
        const prefix = mult === 3 ? 'T' : mult === 2 ? 'D' : '';
        return `${prefix}${val}`;
    };

    const renderKeypad = () => {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        return (
            <View style={styles.keypadContainer}>
                <View style={styles.modifiersRow}>
                    <TouchableOpacity style={[styles.modifierBtn, multiplier === 2 && styles.modifierActive]} onPress={() => setMultiplier(multiplier === 2 ? 1 : 2)}>
                        <Text style={styles.modifierText}>DOUBLE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modifierBtn, multiplier === 3 && styles.modifierActive]} onPress={() => setMultiplier(multiplier === 3 ? 1 : 3)}>
                        <Text style={styles.modifierText}>TRIPLE</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.numbersGrid}>
                    {numbers.map((num) => (
                        <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handleThrow(num)}>
                            <Text style={styles.numText}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.bottomRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnUndo]} onPress={handleUndo}>
                        <Text style={styles.actionText}>COFNIJ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnMiss]} onPress={() => handleThrow(0)}>
                        <Text style={styles.actionText}>MISS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnBull]} onPress={() => handleThrow(25)}>
                        <Text style={styles.actionText}>BULL</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const remainingDarts = 3 - currentPlayer.currentTurnThrows.length;
    const canFinish = suggestionSteps.length > 0 && suggestionSteps.length <= remainingDarts;

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.scoreSection}>
                <View style={styles.playerInfo}>
                    <Text style={styles.label}>RZUCA TERAZ</Text>
                    <Text style={styles.playerName}>{currentPlayer.name}</Text>
                    <Text style={styles.matchStats}>
                        Sety: {currentPlayer.setsWon || 0} / {settings.setsToWin}  |  Legi: {currentPlayer.legsWon || 0} / {settings.legsToWin}
                    </Text>
                </View>

                <Text style={styles.bigScore}>{currentPlayer.score}</Text>

                <View style={styles.turnHistory}>
                    {[0, 1, 2].map((i) => {
                        const throwData = currentPlayer.currentTurnThrows[i];
                        const suggestionIndex = i - currentPlayer.currentTurnThrows.length;
                        const hasSuggestion = canFinish && suggestionIndex >= 0 && suggestionIndex < suggestionSteps.length;
                        const suggestionLabel = (!throwData && hasSuggestion) ? suggestionSteps[suggestionIndex] : null;

                        let circleStyle: StyleProp<ViewStyle> = styles.dartCircle;
                        let textStyle: StyleProp<TextStyle> = styles.dartText;
                        let label = '';

                        if (throwData) {
                            label = throwData.label;
                        } else if (suggestionLabel) {
                            label = suggestionLabel;
                            circleStyle = [styles.dartCircle, styles.dartCircleSuggestion];
                            textStyle = [styles.dartText, styles.dartTextSuggestion];
                        }

                        return (
                            <View key={i} style={circleStyle}>
                                <Text style={textStyle}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.othersSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {players.map((p, idx) => {
                        const isActive = idx === currentPlayerIdx;
                        const throwsToDisplay = isActive ? p.currentTurnThrows : (p.lastThrows || []);
                        const throwsString = throwsToDisplay.map((t: ThrowType) => t.label).join('  ');

                        return (
                            <View key={p.id} style={[styles.miniCard, isActive && styles.miniCardActive]}>
                                <Text style={styles.miniName}>{p.name}</Text>
                                <Text style={styles.miniScore}>{p.score}</Text>
                                <Text style={styles.miniThrows}>{throwsString || '-'}</Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {renderKeypad()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a1a' },
    scoreSection: { flex: 0.38, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50', paddingVertical: 10 },
    playerInfo: { alignItems: 'center', marginBottom: 5 },
    label: { color: '#bdc3c7', fontSize: 12, letterSpacing: 1 },
    playerName: { color: '#ecf0f1', fontSize: 28, fontWeight: 'bold' },

    matchStats: { color: '#f39c12', fontSize: 14, fontWeight: 'bold', marginTop: 5 },

    bigScore: { color: '#fff', fontSize: 80, fontWeight: 'bold', lineHeight: 85 },

    turnHistory: { flexDirection: 'row', marginTop: 20, gap: 15 },

    dartCircle: {
        width: 55, height: 55, borderRadius: 30, backgroundColor: '#34495e',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f1c40f'
    },
    dartCircleSuggestion: { borderColor: '#7f8c8d', backgroundColor: '#2c3e50', borderStyle: 'dashed' },

    dartText: { color: '#f1c40f', fontWeight: 'bold', fontSize: 18 },
    dartTextSuggestion: { color: '#95a5a6', fontStyle: 'italic', fontWeight: 'normal' },

    othersSection: { height: 85, backgroundColor: '#222', borderBottomWidth: 1, borderColor: '#333' },
    miniCard: { width: 100, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#444', padding: 5 },
    miniCardActive: { backgroundColor: '#34495e' },
    miniName: { color: '#aaa', fontSize: 12, marginBottom: 2 },
    miniScore: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
    miniThrows: { color: '#f1c40f', fontSize: 11, marginTop: 2, fontStyle: 'italic' },

    keypadContainer: { flex: 0.62, padding: 10 },
    modifiersRow: { flexDirection: 'row', height: '14%', marginBottom: 8, gap: 10 },
    modifierBtn: { flex: 1, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    modifierActive: { backgroundColor: '#e67e22' },
    modifierText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    numbersGrid: { flexDirection: 'row', flexWrap: 'wrap', height: '68%', alignContent: 'stretch', justifyContent: 'center' },
    numBtn: { width: '18%', height: '22%', margin: '1%', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
    numText: { color: '#fff', fontSize: 22, fontWeight: '600' },
    bottomRow: { flexDirection: 'row', height: '16%', marginTop: 5, gap: 8 },
    actionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    btnUndo: { backgroundColor: '#7f8c8d' },
    btnMiss: { backgroundColor: '#c0392b' },
    btnBull: { backgroundColor: '#27ae60' },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});