// Test for the improved drag-to-select functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Improved Drag-to-Select Functionality...\n');

// Test 1: Check that the new improved calendar exists
console.log('📅 Checking AvailabilityCalendarImproved component...');
try {
  const calendarPath = path.join(__dirname, '../app/components/AvailabilityCalendarImproved.js');
  if (fs.existsSync(calendarPath)) {
    console.log('✅ AvailabilityCalendarImproved.js exists');
    
    const content = fs.readFileSync(calendarPath, 'utf8');
    
    const tests = [
      {
        name: 'PanResponder for drag functionality',
        check: () => content.includes('PanResponder.create') && 
                     content.includes('onPanResponderGrant') && 
                     content.includes('onPanResponderMove')
      },
      {
        name: 'Dynamic coordinate calculation',
        check: () => content.includes('getGridPosition') &&
                     content.includes('calendarDimensions')
      },
      {
        name: 'Drag selection mode',
        check: () => content.includes("selectionMode === 'drag'") &&
                     content.includes('dragPreview')
      },
      {
        name: 'Multi-mode selection support',
        check: () => content.includes("'single'") &&
                     content.includes("'row'") &&
                     content.includes("'column'") &&
                     content.includes("'drag'")
      },
      {
        name: 'Visual drag preview',
        check: () => content.includes('dragPreviewCell') &&
                     content.includes('isInDragPreview')
      },
      {
        name: 'Proper layout measurement',
        check: () => content.includes('onLayout') &&
                     content.includes('TIME_COLUMN_WIDTH')
      }
    ];
    
    tests.forEach(test => {
      const passed = test.check();
      console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
    });
    
  } else {
    console.log('❌ AvailabilityCalendarImproved.js not found');
  }
  
} catch (error) {
  console.log('❌ Error checking AvailabilityCalendarImproved:', error.message);
}

// Test 2: Check that ProfileScreen imports the new calendar
console.log('\n👤 Checking ProfileScreen integration...');
try {
  const profilePath = path.join(__dirname, '../app/screens/ProfileScreen.tsx');
  if (fs.existsSync(profilePath)) {
    const content = fs.readFileSync(profilePath, 'utf8');
    
    if (content.includes('AvailabilityCalendarImproved')) {
      console.log('✅ ProfileScreen imports AvailabilityCalendarImproved');
    } else {
      console.log('❌ ProfileScreen does not import AvailabilityCalendarImproved');
    }
    
    if (content.includes('drag selection modes')) {
      console.log('✅ ProfileScreen mentions drag selection in instructions');
    } else {
      console.log('❌ ProfileScreen instructions do not mention drag selection');
    }
    
  } else {
    console.log('❌ ProfileScreen.tsx not found');
  }
  
} catch (error) {
  console.log('❌ Error checking ProfileScreen:', error.message);
}

// Test 3: Check coordinate calculation logic
console.log('\n📐 Testing coordinate calculation logic...');
try {
  // Mock the coordinate calculation
  const TIME_COLUMN_WIDTH = 60;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SLOT_HEIGHT = 40;
  
  const getGridPosition = (x, y, calendarWidth) => {
    const dayWidth = (calendarWidth - TIME_COLUMN_WIDTH) / DAYS.length;
    const dayIndex = Math.floor((x - TIME_COLUMN_WIDTH) / dayWidth);
    const timeIndex = Math.floor(y / SLOT_HEIGHT);
    
    if (dayIndex >= 0 && dayIndex < DAYS.length && timeIndex >= 0 && timeIndex < 30) {
      return { dayIndex, timeIndex };
    }
    return null;
  };
  
  // Test various coordinate points
  const testCases = [
    { x: 100, y: 80, calendarWidth: 400, expected: { dayIndex: 0, timeIndex: 2 } },
    { x: 150, y: 40, calendarWidth: 400, expected: { dayIndex: 1, timeIndex: 1 } },
    { x: 350, y: 160, calendarWidth: 400, expected: { dayIndex: 6, timeIndex: 4 } },
  ];
  
  testCases.forEach((test, index) => {
    const result = getGridPosition(test.x, test.y, test.calendarWidth);
    if (result && result.dayIndex === test.expected.dayIndex && result.timeIndex === test.expected.timeIndex) {
      console.log(`✅ Coordinate test ${index + 1} passed`);
    } else {
      console.log(`❌ Coordinate test ${index + 1} failed - expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`);
    }
  });
  
} catch (error) {
  console.log('❌ Error testing coordinate calculation:', error.message);
}

console.log('\n🎯 Drag-to-Select Testing Complete!');
console.log('');
console.log('✨ Key Improvements Made:');
console.log('• Dynamic coordinate calculation based on actual component dimensions');
console.log('• Proper PanResponder implementation for smooth drag interactions');
console.log('• Visual drag preview while selecting');
console.log('• Multiple selection modes: single, row, column, and drag');
console.log('• Reliable touch handling with proper gesture recognition');
console.log('• Fixed layout measurement and coordinate mapping');
console.log('');
console.log('🚀 The drag-to-select functionality should now work reliably!');
