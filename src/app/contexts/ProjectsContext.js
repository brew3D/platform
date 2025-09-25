"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ProjectsContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, token, isAuthenticated } = useAuth();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch projects when user is authenticated
  useEffect(() => {
    if (isHydrated && isAuthenticated && token) {
      fetchProjects();
    } else if (isHydrated && !isAuthenticated) {
      setProjects([]);
    }
  }, [isHydrated, isAuthenticated, token, fetchProjects]);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Network error while fetching projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createProject = async (projectData) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => [data.project, ...prev]);
        return { success: true, project: data.project };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create project');
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Network error while creating project');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updateData) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => 
          prev.map(project => 
            project.projectId === projectId ? data.project : project
          )
        );
        return { success: true, project: data.project };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update project');
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Network error while updating project');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setProjects(prev => prev.filter(project => project.projectId !== projectId));
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete project');
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Network error while deleting project');
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const getProjectById = (projectId) => {
    return projects.find(project => project.projectId === projectId);
  };

  const value = {
    projects: isHydrated ? projects : [],
    loading: isHydrated ? loading : true,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
