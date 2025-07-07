import { Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

const Card = ({ title, sections, onEdit, onDelete, style = null }) => {
  return (
    <View style={[commonStyles.card, style]}>
      <View style={cardStyles.titleContainer}>
        <Text style={commonStyles.cardTitle}>{title}</Text>
      </View>
      
      <View style={cardStyles.sectionsContainer}>
        {sections.map((section, index) => (
          <View key={index} style={commonStyles.cardSection}>
            <Text style={commonStyles.sectionTitle}>{section.title}</Text>
            <Text style={commonStyles.sectionText}>{section.content}</Text>
          </View>
        ))}
      </View>

      {(onEdit || onDelete) && (
        <View style={commonStyles.cardButtons}>
          {onEdit && (
            <TouchableOpacity 
              style={commonStyles.editButton} 
              onPress={() => {
                onEdit();
              }}
              activeOpacity={0.8}
            >
              <Text style={commonStyles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              style={commonStyles.deleteButton} 
              onPress={() => {
                onDelete();
              }}
              activeOpacity={0.8}
            >
              <Text style={commonStyles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const cardStyles = {
  titleContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  sectionsContainer: {
    flex: 1,
  },
};

export default Card;
