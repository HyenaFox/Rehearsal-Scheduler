import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';
import TimeslotEditModal from '../components/TimeslotEditModal';
import { commonStyles } from '../styles/common';
import { GLOBAL_TIMESLOTS, STORAGE_KEYS } from '../types/index';
import { getActorsAvailableForTimeslot, getTimeslotById, removeAvailableTimeslot } from '../utils/actorUtils';

const TimeslotsScreen = ({ onBack, actors, setActors }) => {
  const [timeslots, setTimeslots] = useState(GLOBAL_TIMESLOTS);
  const [editingTimeslot, setEditingTimeslot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const handleDeleteTimeslot = async (timeslotId) => {
    // Direct deletion without confirmation
    // Remove from global timeslots
    const updatedTimeslots = timeslots.filter(t => t.id !== timeslotId);
    setTimeslots(updatedTimeslots);
    GLOBAL_TIMESLOTS.length = 0;
    GLOBAL_TIMESLOTS.push(...updatedTimeslots);
    await AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(updatedTimeslots));

    // Remove from all actors
    const updatedActors = actors.map(actor => 
      removeAvailableTimeslot(actor, timeslotId)
    );
    setActors(updatedActors);
  };

  const handleAddTimeslot = async () => {
    const newId = `timeslot-${Date.now()}`;
    const newTimeslot = {
      id: newId,
      label: 'New Timeslot',
      day: 'Monday',
      startTime: '9:00 AM',
      endTime: '11:00 AM'
    };
    
    const updatedTimeslots = [...timeslots, newTimeslot];
    setTimeslots(updatedTimeslots);
    GLOBAL_TIMESLOTS.length = 0;
    GLOBAL_TIMESLOTS.push(...updatedTimeslots);
    await AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(updatedTimeslots));
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity style={commonStyles.backButton} onPress={onBack}>
            <Text style={commonStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>Manage Timeslots</Text>
        </View>

        <View style={commonStyles.scrollView}>
          <ActionButton title="Add New Timeslot" onPress={handleAddTimeslot} />

          <ScrollView style={{ flex: 1 }}>
            {timeslots.map(timeslot => (
              <Card
                key={timeslot.id}
                title={timeslot.label}
                sections={[
                  {
                    title: 'Day',
                    content: timeslot.day
                  },
                  {
                    title: 'Time',
                    content: `${timeslot.startTime} - ${timeslot.endTime}`
                  },
                  {
                    title: 'Actors Available',
                    content: getActorsAvailableForTimeslot(actors, timeslot.id).map(actor => actor.name).join(', ') || 'No actors available'
                  }
                ]}
                onEdit={() => {
                  setEditingTimeslot(timeslot);
                  setShowEditModal(true);
                }}
                onDelete={() => handleDeleteTimeslot(timeslot.id)}
              />
            ))}
            {timeslots.length === 0 && (
              <View style={commonStyles.emptyState}>
                <Text style={commonStyles.emptyStateText}>No timeslots available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Timeslot Edit Modal */}
        <TimeslotEditModal
          timeslot={editingTimeslot}
          visible={showEditModal}
          onSave={async (updatedTimeslot) => {
            const updatedTimeslots = timeslots.map(t => 
              t.id === updatedTimeslot.id ? updatedTimeslot : t
            );
            
            setTimeslots(updatedTimeslots);
            GLOBAL_TIMESLOTS.length = 0;
            GLOBAL_TIMESLOTS.push(...updatedTimeslots);
            await AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(updatedTimeslots));

            // Update actors if timeslot label or times changed
            const updatedActors = actors.map(actor => {
              let modified = false;
              const newAvailableTimeslots = actor.availableTimeslots.map(tsId => {
                const ts = getTimeslotById(tsId);
                if (ts && ts.id === updatedTimeslot.id) {
                  modified = true;
                  return updatedTimeslot.id;
                }
                return tsId;
              });
              if (modified) {
                return { ...actor, availableTimeslots: newAvailableTimeslots };
              }
              return actor;
            });
            setActors(updatedActors);

            setShowEditModal(false);
            setEditingTimeslot(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingTimeslot(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default TimeslotsScreen;
