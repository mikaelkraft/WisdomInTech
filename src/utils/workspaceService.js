import { api } from "./api/client";

export const workspaceService = {
  // Fetch workspace projects and statistics
  async getProjects() {
    try {
      const data = await api.get("/workspace/projects");
      return {
        success: true,
        stats: data.stats || {},
        projects: Array.isArray(data.projects) ? data.projects : [],
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to load workspace projects",
        stats: {},
        projects: [],
      };
    }
  },

  // Create a new project in the workspace
  async createProject(projectData) {
    try {
      const data = await api.post("/workspace/projects", projectData);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to create project" };
    }
  },

  // Update existing project
  async updateProject(id, projectData) {
    try {
      const data = await api.put("/workspace/projects", { id, ...projectData });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to update project" };
    }
  },

  // Delete project
  async deleteProject(id) {
    try {
      const data = await api.delete(`/workspace/projects?id=${encodeURIComponent(id)}`);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to delete project" };
    }
  },

  // Link Git Repository to project
  async linkRepository(repoData) {
    try {
      const data = await api.post("/workspace/repos", repoData);
      return { success: true, repo: data.repo };
    } catch (err) {
      return { success: false, error: err.message || "Failed to link repository" };
    }
  },

  // Unlink Git Repository
  async unlinkRepository(repoId) {
    try {
      const data = await api.delete(`/workspace/repos?id=${encodeURIComponent(repoId)}`);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || "Failed to unlink repository" };
    }
  },

  // Run Agent Task for project
  async runAgentTask({ projectId, agentType, prompt }) {
    try {
      const data = await api.post("/workspace/agents", {
        projectId,
        agentType,
        prompt,
      });
      return { success: true, task: data.task };
    } catch (err) {
      return { success: false, error: err.message || "Failed to run agent task" };
    }
  },

  // Get Agent Tasks history
  async getAgentTasks(projectId) {
    try {
      const data = await api.get(`/workspace/agents?projectId=${encodeURIComponent(projectId)}`);
      return { success: true, tasks: Array.isArray(data.tasks) ? data.tasks : [] };
    } catch (err) {
      return { success: false, error: err.message || "Failed to fetch agent tasks", tasks: [] };
    }
  },
};

export default workspaceService;
