import { Stack } from 'expo-router';
import React from 'react';
import { GameProvider } from '../context/GameContext';

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Start' }} />
        <Stack.Screen name="game" options={{ title: 'Gra' }} />
        <Stack.Screen name="stats" options={{ title: 'Statystyki' }} />
      </Stack>
    </GameProvider>
  );
}