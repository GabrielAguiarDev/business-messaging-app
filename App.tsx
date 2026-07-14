import React from 'react';

import {StatusBar} from 'react-native';

import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {ThemeProvider} from '@shopify/restyle';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {Toast} from '@components';
import {Routes} from '@routes';
import {AuthCredentialsProvider, useResolvedTheme} from '@services';
import {darkTheme, theme} from '@theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  const isDarkMode = useResolvedTheme() === 'dark';

  return (
    <GestureHandlerRootView style={$flex}>
      <AuthCredentialsProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
              <BottomSheetModalProvider>
                <StatusBar
                  barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                />
                <Routes />
                <Toast />
              </BottomSheetModalProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </AuthCredentialsProvider>
    </GestureHandlerRootView>
  );
}

const $flex = {flex: 1};

export default App;
