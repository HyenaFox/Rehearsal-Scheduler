import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { commonStyles } from '../styles/common';

const ActionButton = ({ title, onPress, style }) => (
  <TouchableOpacity 
    style={[commonStyles.actionButton, style]} 
    onPress={onPress}
  >
    <Text style={commonStyles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default ActionButton;
