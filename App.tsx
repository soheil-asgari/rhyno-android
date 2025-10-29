// App.tsx (or your main app entry file)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigation from './screens/Navigation'; // Your main Drawer navigator
import LoginScreen from './screens/LoginScreen'; // Your Login screen
import { ChatProvider, useChat } from './context/ChatContext'; // 👈 Import useChat
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // 👈 For loading state

// 👇 1. Create a component that handles the navigation logic
function RootNavigator() {
  // 👇 2. Get user and loading state from the context
  const { user, isLoadingAuth } = useChat();

  // 👇 3. Show loading indicator while checking auth state
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // 👇 4. Conditionally render Login or Main App based on user state
  return (
    <NavigationContainer>
      {user ? <AppNavigation /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // 👇 5. Wrap RootNavigator with ChatProvider
    <ChatProvider>
      <RootNavigator />
    </ChatProvider>
  );
}

// 👇 6. Add styles for the loading container
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Match your app theme
  },
});