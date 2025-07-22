import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/common';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyAvailabilityScreen = () => {
  const { user } = useAuth();
  const [weeklyAvailabilities, setWeeklyAvailabilities] = useState([]);

  useEffect(() => {
    fetchWeeklyAvailabilities();
  }, []);

  const fetchWeeklyAvailabilities = async () => {
    try {
      const data = await ApiService.getWeeklyAvailabilities();
      setWeeklyAvailabilities(data);
    } catch (error) {
      console.error('Error fetching weekly availabilities:', error);
    }
  };

  const handleAddAvailability = async () => {
    // This would typically open a modal to select day, start time, and end time
    // For simplicity, we'll add a default availability
    const newAvailability = {
      dayOfWeek: 1, // Monday
      startTime: '18:00',
      endTime: '22:00',
    };

    try {
      const added = await ApiService.addWeeklyAvailability(newAvailability);
      setWeeklyAvailabilities([...weeklyAvailabilities, added]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add availability');
    }
  };

  const handleDeleteAvailability = async (id) => {
    try {
      await ApiService.deleteWeeklyAvailability(id);
      setWeeklyAvailabilities(weeklyAvailabilities.filter(item => item._id !== id));
    } catch (_error) {
      Alert.alert('Error', 'Failed to delete availability');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {daysOfWeek[item.dayOfWeek]}: {item.startTime} - {item.endTime}
      </Text>
      {user?.isAdmin && (
        <TouchableOpacity onPress={() => handleDeleteAvailability(item._id)}>
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={commonStyles.screenContainer}>
      <Text style={commonStyles.screenTitle}>Weekly Availability</Text>
      {user?.isAdmin && (
        <TouchableOpacity style={commonStyles.actionButton} onPress={handleAddAvailability}>
          <Text style={commonStyles.actionButtonText}>Add Availability</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={weeklyAvailabilities}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
  },
  deleteButton: {
    color: 'red',
  },
});

export default WeeklyAvailabilityScreen;
