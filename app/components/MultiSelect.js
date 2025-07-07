import { MaterialIcons } from '@expo/vector-icons';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';

const MultiSelect = ({ items, selectedItems, onSelectedItemsChange, selectText, searchInputPlaceholderText }) => {
  return (
    <SectionedMultiSelect
      items={items}
      uniqueKey="id"
      selectText={selectText}
      showDropDowns={true}
      readOnlyHeadings={true}
      onSelectedItemsChange={onSelectedItemsChange}
      selectedItems={selectedItems}
      searchPlaceholderText={searchInputPlaceholderText}
      IconRenderer={MaterialIcons}
      styles={{
        selectToggle: {
          backgroundColor: '#f8fafc',
          borderWidth: 2,
          borderColor: '#e2e8f0',
          padding: 18,
          borderRadius: 16,
          marginBottom: 8,
        },
        selectToggleText: {
          fontSize: 16,
          color: '#1e293b',
          fontWeight: '500',
        },
        itemText: {
          fontSize: 16,
          color: '#374151',
          fontWeight: '500',
        },
        subItemText: {
          fontSize: 15,
          color: '#6b7280',
        },
        button: {
          backgroundColor: '#6366f1',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 24,
          marginHorizontal: 10,
          marginVertical: 5,
        },
        confirmText: {
          color: '#fff',
          fontSize: 16,
          fontWeight: '600',
        },
        searchBar: {
          backgroundColor: '#f8fafc',
          borderWidth: 2,
          borderColor: '#e2e8f0',
          borderRadius: 12,
          margin: 10,
          paddingHorizontal: 15,
        },
        searchTextInput: {
          fontSize: 16,
          color: '#1e293b',
          paddingVertical: 12,
        },
      }}
    />
  );
};

export default MultiSelect;
