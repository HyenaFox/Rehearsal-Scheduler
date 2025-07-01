import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const AutoPopulateModal = ({ visible, onClose, onPopulate }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handlePopulate = () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Please enter both a start and end time.');
      return;
    }
    onPopulate(startTime, endTime);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Auto-populate Timeslots</Text>
          <Text style={styles.label}>Start Time (24-hour format)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 09:00"
            value={startTime}
            onChangeText={setStartTime}
          />
          <Text style={styles.label}>End Time (24-hour format)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 17:00"
            value={endTime}
            onChangeText={setEndTime}
          />
          <TouchableOpacity
            style={[commonStyles.button, styles.buttonPopulate]}
            onPress={handlePopulate}
          >
            <Text style={commonStyles.buttonText}>Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={commonStyles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: 200,
  },
  buttonPopulate: {
    backgroundColor: '#2196F3',
    marginBottom: 10,
  },
  buttonClose: {
    backgroundColor: '#f44336',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 5,
    fontSize: 12,
    color: '#555',
  },
});

export default AutoPopulateModal;
