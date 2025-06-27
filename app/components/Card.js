import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const Card = ({ title, sections, onEdit, onDelete }) => {
  return (
    <View style={commonStyles.card}>
      <Text style={commonStyles.cardTitle}>{title}</Text>
      {sections.map((section, index) => (
        <View key={index} style={commonStyles.cardSection}>
          <Text style={commonStyles.sectionTitle}>{section.title}</Text>
          <Text style={commonStyles.sectionText}>{section.content}</Text>
        </View>
      ))}      <View style={commonStyles.cardButtons}>
        {onEdit && (
          <TouchableOpacity 
            style={commonStyles.editButton} 
            onPress={() => {
              onEdit();
            }}
            activeOpacity={0.7}
          >
            <Text style={commonStyles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity 
            style={commonStyles.deleteButton} 
            onPress={() => {
              onDelete();
            }}
            activeOpacity={0.7}
          >
            <Text style={commonStyles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Card;
