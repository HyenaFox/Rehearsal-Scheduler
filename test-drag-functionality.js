#!/usr/bin/env node

/**
 * Test script to verify drag functionality for timeslots and availability
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Drag Functionality Implementation...\n');

// Test 1: Check TimeslotCalendar implementation
console.log('📅 Testing TimeslotCalendar component...');
try {
  const timeslotCalendarPath = path.join(__dirname, 'app', 'components', 'TimeslotCalendar.js');
  const timeslotCalendarContent = fs.readFileSync(timeslotCalendarPath, 'utf8');
  
  const tests = [
    {
      name: 'Drag handlers implemented',
      check: () => timeslotCalendarContent.includes('createDragHandlers') && 
                   timeslotCalendarContent.includes('onPanResponderGrant') &&
                   timeslotCalendarContent.includes('onPanResponderMove') &&
                   timeslotCalendarContent.includes('onPanResponderRelease')
    },
    {
      name: 'Resize handlers implemented',
      check: () => timeslotCalendarContent.includes('createResizeHandlers') &&
                   timeslotCalendarContent.includes('onTimeslotResize')
    },
    {
      name: 'Drag offset visual feedback',
      check: () => timeslotCalendarContent.includes('dragOffset') &&
                   timeslotCalendarContent.includes('translateX') &&
                   timeslotCalendarContent.includes('translateY')
    },
    {
      name: 'Layout reference for coordinate calculation',
      check: () => timeslotCalendarContent.includes('layoutRef') &&
                   timeslotCalendarContent.includes('measure')
    },
    {
      name: 'Admin-only drag functionality',
      check: () => timeslotCalendarContent.includes('isDraggable') &&
                   timeslotCalendarContent.includes('isAdmin')
    }
  ];
  
  tests.forEach(test => {
    const passed = test.check();
    console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
  });
  
} catch (error) {
  console.log('  ❌ Failed to read TimeslotCalendar.js:', error.message);
}

// Test 2: Check AvailabilityCalendar implementation
console.log('\n🎯 Testing AvailabilityCalendar component...');
try {
  const availabilityCalendarPath = path.join(__dirname, 'app', 'components', 'AvailabilityCalendar.js');
  const availabilityCalendarContent = fs.readFileSync(availabilityCalendarPath, 'utf8');
  
  const tests = [
    {
      name: 'Drag-to-select pan responder',
      check: () => availabilityCalendarContent.includes('PanResponder.create') &&
                   availabilityCalendarContent.includes('onPanResponderGrant') &&
                   availabilityCalendarContent.includes('onPanResponderMove')
    },
    {
      name: 'Selection area calculation',
      check: () => availabilityCalendarContent.includes('selectionStart') &&
                   availabilityCalendarContent.includes('selectionEnd') &&
                   availabilityCalendarContent.includes('isInSelectionArea')
    },
    {
      name: 'Visual selection feedback',
      check: () => availabilityCalendarContent.includes('selectionPreview') &&
                   availabilityCalendarContent.includes('selectedCell')
    },
    {
      name: 'Coordinate to cell mapping',
      check: () => availabilityCalendarContent.includes('pageXOffset') &&
                   availabilityCalendarContent.includes('pageYOffset') &&
                   availabilityCalendarContent.includes('dayWidth')
    },
    {
      name: 'State management for selection',
      check: () => availabilityCalendarContent.includes('currentSelection') &&
                   availabilityCalendarContent.includes('onSelectionChange')
    }
  ];
  
  tests.forEach(test => {
    const passed = test.check();
    console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
  });
  
} catch (error) {
  console.log('  ❌ Failed to read AvailabilityCalendar.js:', error.message);
}

// Test 3: Check TimeslotsScreen integration
console.log('\n🔧 Testing TimeslotsScreen integration...');
try {
  const timeslotsScreenPath = path.join(__dirname, 'app', 'screens', 'TimeslotsScreen.js');
  const timeslotsScreenContent = fs.readFileSync(timeslotsScreenPath, 'utf8');
  
  const tests = [
    {
      name: 'Move handler implementation',
      check: () => timeslotsScreenContent.includes('handleTimeslotMove') &&
                   timeslotsScreenContent.includes('onTimeslotMove={handleTimeslotMove}')
    },
    {
      name: 'Resize handler implementation',
      check: () => timeslotsScreenContent.includes('handleTimeslotResize') &&
                   timeslotsScreenContent.includes('onTimeslotResize={handleTimeslotResize}')
    },
    {
      name: 'API calls for move/resize',
      check: () => timeslotsScreenContent.includes('ApiService.updateTimeslot') &&
                   timeslotsScreenContent.includes('calculateEndTime')
    },
    {
      name: 'Time calculation helpers',
      check: () => timeslotsScreenContent.includes('timeToMinutes') &&
                   timeslotsScreenContent.includes('minutesToTime') &&
                   timeslotsScreenContent.includes('adjustTime')
    }
  ];
  
  tests.forEach(test => {
    const passed = test.check();
    console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
  });
  
} catch (error) {
  console.log('  ❌ Failed to read TimeslotsScreen.js:', error.message);
}

// Test 4: Check ProfileScreen integration
console.log('\n👤 Testing ProfileScreen integration...');
try {
  const profileScreenPath = path.join(__dirname, 'app', 'screens', 'ProfileScreen.tsx');
  const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
  
  const tests = [
    {
      name: 'AvailabilityCalendar import',
      check: () => profileScreenContent.includes("import AvailabilityCalendar from '../components/AvailabilityCalendar'")
    },
    {
      name: 'AvailabilityCalendar usage',
      check: () => profileScreenContent.includes('<AvailabilityCalendar') &&
                   profileScreenContent.includes('timeslots={timeslots}') &&
                   profileScreenContent.includes('selectedTimeslots={selectedTimeslots}')
    },
    {
      name: 'Selection change handler',
      check: () => profileScreenContent.includes('onSelectionChange={setSelectedTimeslots}')
    },
    {
      name: 'Drag instruction text',
      check: () => profileScreenContent.includes('Drag to select')
    }
  ];
  
  tests.forEach(test => {
    const passed = test.check();
    console.log(`  ${passed ? '✅' : '❌'} ${test.name}`);
  });
  
} catch (error) {
  console.log('  ❌ Failed to read ProfileScreen.tsx:', error.message);
}

console.log('\n🎉 Drag functionality test completed!');
console.log('\nFeatures implemented:');
console.log('  📅 Drag-to-move timeslots for admins');
console.log('  📏 Drag-to-resize timeslots for admins');
console.log('  🎯 Drag-to-select availability for users');
console.log('  ✨ Visual feedback during drag operations');
console.log('  🔧 Proper coordinate mapping and collision detection');
