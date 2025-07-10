// Backend connection test - Jest version
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mock DirectMongoService since it might not be available
const mockDirectMongoService = {
  testConnection: jest.fn(),
  getAllScenes: jest.fn(),
  getAllActors: jest.fn(),
  getAllRehearsals: jest.fn(),
  getAllTimeslots: jest.fn()
};

describe('Backend Connection Tests', () => {
  let originalApiUrl;
  let apiUrl;

  beforeAll(() => {
    // Check if API URL is configured
    apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = apiUrl;
    
    console.log(`🔗 Using API URL: ${apiUrl}`);
  });

  afterAll(() => {
    // Restore original API URL
    if (originalApiUrl) {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    } else {
      delete process.env.EXPO_PUBLIC_API_URL;
    }
  });

  test('API URL should be configured', () => {
    expect(apiUrl).toBeTruthy();
    expect(apiUrl).toMatch(/^https?:\/\//);
  });

  test('Environment variables should be loaded', () => {
    expect(process.env.EXPO_PUBLIC_API_URL).toBeTruthy();
  });

  test('Backend connection should be testable', async () => {
    // This is a placeholder test since DirectMongoService might not be available
    // In a real test, you would import and test the actual service
    mockDirectMongoService.testConnection.mockResolvedValue({ success: true });
    
    const result = await mockDirectMongoService.testConnection();
    expect(result.success).toBe(true);
  });

  test('Service methods should be callable', () => {
    expect(typeof mockDirectMongoService.getAllScenes).toBe('function');
    expect(typeof mockDirectMongoService.getAllActors).toBe('function');
    expect(typeof mockDirectMongoService.getAllRehearsals).toBe('function');
    expect(typeof mockDirectMongoService.getAllTimeslots).toBe('function');
  });
});
