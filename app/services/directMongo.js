// MongoDB service with backend API
// This version uses the backend server for reliable database access

class DirectMongoService {
  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rehearsal-scheduler-backend.onrender.com';
    this.isConnected = false;
  }

  async connect() {
    try {
      // Test connection to backend
      const response = await fetch(`${this.baseUrl}/api`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend connection failed: ${response.status}`);
      }

      this.isConnected = true;
      console.log('Connected to backend successfully');
      return true;
    } catch (error) {
      console.error('Backend connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Helper method to make API calls
  async apiCall(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Scene Management
  async getAllScenes() {
    try {
      return await this.apiCall('/api/scenes');
    } catch (error) {
      console.error('Error fetching scenes:', error);
      throw error;
    }
  }

  async createScene(sceneData) {
    try {
      return await this.apiCall('/api/scenes', {
        method: 'POST',
        body: JSON.stringify(sceneData),
      });
    } catch (error) {
      console.error('Error creating scene:', error);
      throw error;
    }
  }

  async updateScene(id, sceneData) {
    try {
      return await this.apiCall(`/api/scenes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sceneData),
      });
    } catch (error) {
      console.error('Error updating scene:', error);
      throw error;
    }
  }

  async deleteScene(id) {
    try {
      return await this.apiCall(`/api/scenes/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting scene:', error);
      throw error;
    }
  }

  // Actor Management
  async getAllActors() {
    try {
      return await this.apiCall('/api/actors');
    } catch (error) {
      console.error('Error fetching actors:', error);
      throw error;
    }
  }

  async createActor(actorData) {
    try {
      return await this.apiCall('/api/actors', {
        method: 'POST',
        body: JSON.stringify(actorData),
      });
    } catch (error) {
      console.error('Error creating actor:', error);
      throw error;
    }
  }

  async updateActor(id, actorData) {
    try {
      return await this.apiCall(`/api/actors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(actorData),
      });
    } catch (error) {
      console.error('Error updating actor:', error);
      throw error;
    }
  }

  async deleteActor(id) {
    try {
      return await this.apiCall(`/api/actors/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting actor:', error);
      throw error;
    }
  }

  // Rehearsal Management
  async getAllRehearsals() {
    try {
      return await this.apiCall('/api/rehearsals');
    } catch (error) {
      console.error('Error fetching rehearsals:', error);
      throw error;
    }
  }

  async createRehearsal(rehearsalData) {
    try {
      return await this.apiCall('/api/rehearsals', {
        method: 'POST',
        body: JSON.stringify(rehearsalData),
      });
    } catch (error) {
      console.error('Error creating rehearsal:', error);
      throw error;
    }
  }

  async updateRehearsal(id, rehearsalData) {
    try {
      return await this.apiCall(`/api/rehearsals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rehearsalData),
      });
    } catch (error) {
      console.error('Error updating rehearsal:', error);
      throw error;
    }
  }

  async deleteRehearsal(id) {
    try {
      return await this.apiCall(`/api/rehearsals/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting rehearsal:', error);
      throw error;
    }
  }

  // Timeslot Management
  async getAllTimeslots() {
    try {
      return await this.apiCall('/api/timeslots');
    } catch (error) {
      console.error('Error fetching timeslots:', error);
      throw error;
    }
  }

  async createTimeslot(timeslotData) {
    try {
      return await this.apiCall('/api/timeslots', {
        method: 'POST',
        body: JSON.stringify(timeslotData),
      });
    } catch (error) {
      console.error('Error creating timeslot:', error);
      throw error;
    }
  }

  async updateTimeslot(id, timeslotData) {
    try {
      return await this.apiCall(`/api/timeslots/${id}`, {
        method: 'PUT',
        body: JSON.stringify(timeslotData),
      });
    } catch (error) {
      console.error('Error updating timeslot:', error);
      throw error;
    }
  }

  async deleteTimeslot(id) {
    try {
      return await this.apiCall(`/api/timeslots/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting timeslot:', error);
      throw error;
    }
  }

  // Utility methods
  async testConnection() {
    try {
      await this.connect();
      return { success: true, message: 'Backend connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getStats() {
    try {
      return await this.apiCall('/api/stats');
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export default new DirectMongoService();
