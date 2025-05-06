import React from 'react';
import { View, Text, Button } from 'react-native';
import { useError } from '../../context/ErrorContext';
import Home from '../Home/Home';

const HomeScreenWrapper = ({ navigation }) => {
  const { error, setError } = useError();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>An error occurred: {error}</Text>
        <Button title="Retry" onPress={() => setError(null)} />
      </View>
    );
  }

  return <Home />;
};

export default HomeScreenWrapper;
