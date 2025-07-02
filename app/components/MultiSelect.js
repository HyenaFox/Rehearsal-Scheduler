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
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 5,
        },
      }}
    />
  );
};

export default MultiSelect;
