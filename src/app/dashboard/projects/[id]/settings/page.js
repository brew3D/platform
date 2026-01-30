"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaUpload, 
  FaLink, 
  FaImage, 
  FaGamepad, 
  FaDollarSign,
  FaEye,
  FaComments,
  FaStore,
  FaTag,
  FaInfoCircle,
  FaTimes,
  FaArrowLeft,
  FaDownload
} from 'react-icons/fa';
// Removed DashboardSidebar and DashboardTopbar for cleaner design
import styles from './project-settings.module.css';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;
  
  // Removed sidebar state as we're not using DashboardSidebar anymore
  const [activeSection, setActiveSection] = useState('basics');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Project Basics
    title: '',
    url: '',
    description: '',
    
    // Classification
    projectType: 'games',
    kindOfProject: 'downloadable',
    releaseStatus: 'released',
    
    // Pricing
    pricingType: 'free',
    suggestedDonation: 2.00,
    
    // Details
    fullDescription: '',
    genre: '',
    tags: [],
    aiDisclosure: 'no',
    
    // App Store Links
    steamLink: '',
    appleStoreLink: '',
    googlePlayLink: '',
    amazonLink: '',
    windowsStoreLink: '',
    
    // Custom Noun
    customNoun: '',
    
    // Community
    communityEnabled: false,
    communityType: 'comments',
    
    // Visibility
    visibility: 'draft',
    
    // Media
    coverImage: null,
    trailerLink: '',
    screenshots: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'saving' | 'error'
  const fileInputRef = useRef(null);
  const coverImageRef = useRef(null);
  const screenshotsRef = useRef(null);

  // Fetch project data on mount
  useEffect(() => {
    if (!projectId) return;
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const project = await response.json();
        
        // Map project data to formData
        const settings = project.settings || {};
        setFormData({
          // Project Basics
          title: project.name || '',
          url: project.url || project.projectId || '',
          description: project.description || '',
          
          // Classification
          projectType: settings.projectType || 'games',
          kindOfProject: settings.kindOfProject || 'downloadable',
          releaseStatus: settings.releaseStatus || project.status || 'released',
          
          // Pricing
          pricingType: settings.pricingType || 'free',
          suggestedDonation: settings.suggestedDonation || 2.00,
          
          // Details
          fullDescription: settings.fullDescription || project.description || '',
          genre: settings.genre || '',
          tags: settings.tags || [],
          aiDisclosure: settings.aiDisclosure || 'no',
          
          // App Store Links
          steamLink: settings.steamLink || '',
          appleStoreLink: settings.appleStoreLink || '',
          googlePlayLink: settings.googlePlayLink || '',
          amazonLink: settings.amazonLink || '',
          windowsStoreLink: settings.windowsStoreLink || '',
          
          // Custom Noun
          customNoun: settings.customNoun || '',
          
          // Community
          communityEnabled: settings.communityEnabled || false,
          communityType: settings.communityType || 'comments',
          
          // Visibility
          visibility: settings.visibility || project.status || 'draft',
          
          // Media
          coverImage: null, // File objects can't be stored, will need to handle separately
          trailerLink: settings.trailerLink || '',
          screenshots: [] // File objects can't be stored, will need to handle separately
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        setErrors({ general: 'Failed to load project data' });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const sections = [
    { id: 'basics', title: 'Project Basics', icon: FaInfoCircle },
    { id: 'classification', title: 'Classification', icon: FaGamepad },
    { id: 'pricing', title: 'Pricing', icon: FaDollarSign },
    { id: 'uploads', title: 'Uploads', icon: FaUpload },
    { id: 'details', title: 'Details', icon: FaTag },
    { id: 'appstores', title: 'App Store Links', icon: FaStore },
    { id: 'community', title: 'Community', icon: FaComments },
    { id: 'visibility', title: 'Visibility & Access', icon: FaEye },
    { id: 'media', title: 'Media', icon: FaImage }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTagAdd = (tag) => {
    if (formData.tags.length < 10 && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = (file, type) => {
    if (type === 'cover') {
      setFormData(prev => ({ ...prev, coverImage: file }));
    } else if (type === 'screenshots') {
      setFormData(prev => ({ 
        ...prev, 
        screenshots: [...prev.screenshots, file] 
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'Project URL is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.url)) {
      newErrors.url = 'URL can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (formData.pricingType === 'donation' && formData.suggestedDonation <= 0) {
      newErrors.suggestedDonation = 'Suggested donation must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!validateForm()) {
      return;
    }
    
    if (!projectId) {
      setErrors({ general: 'Project ID is missing' });
      return;
    }
    
    setIsSubmitting(true);
    setSaveStatus('saving');
    
    try {
      // Prepare update data
      // Map visibility to valid status values
      // Database CHECK constraint only allows: 'active', 'archived', 'deleted'
      // Visibility options ('draft', 'restricted', 'public') should be stored in settings
      // Status should always be one of the valid values
      const visibility = isDraft ? 'draft' : formData.visibility;
      const status = 'active'; // Always use 'active' for now, visibility is stored in settings
      
      const updateData = {
        name: formData.title,
        description: formData.description || formData.fullDescription,
        status: status, // Must be 'active', 'archived', or 'deleted'
        settings: {
          projectType: formData.projectType,
          kindOfProject: formData.kindOfProject,
          releaseStatus: formData.releaseStatus,
          pricingType: formData.pricingType,
          suggestedDonation: formData.suggestedDonation,
          fullDescription: formData.fullDescription,
          genre: formData.genre,
          tags: formData.tags,
          aiDisclosure: formData.aiDisclosure,
          steamLink: formData.steamLink,
          appleStoreLink: formData.appleStoreLink,
          googlePlayLink: formData.googlePlayLink,
          amazonLink: formData.amazonLink,
          windowsStoreLink: formData.windowsStoreLink,
          customNoun: formData.customNoun,
          communityEnabled: formData.communityEnabled,
          communityType: formData.communityType,
          visibility: visibility, // Use computed visibility (handles draft case)
          trailerLink: formData.trailerLink
        }
      };
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || errorData.message || 'Failed to save project';
        console.error('API Error:', errorData);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      setSaveStatus('saved');
      
      // Clear save status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
      
      // If publishing (not draft), optionally redirect
      if (!isDraft && formData.visibility === 'public') {
        // Could redirect to project page or show success message
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      setSaveStatus('error');
      setErrors({ general: error.message || 'Failed to save project' });
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setErrors({});
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    // No need to scroll since we're only showing one section at a time
  };

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/export`);
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.title || 'game'}-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export game. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading project settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerLeft}>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/dashboard')}
            >
              <FaArrowLeft />
              Back to Projects
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                {loading ? 'Loading...' : formData.title || 'Project Settings'}
                {saveStatus === 'saved' && <span className={styles.saveStatus}> ✓ Saved</span>}
                {saveStatus === 'saving' && <span className={styles.saveStatus}> Saving...</span>}
                {saveStatus === 'error' && <span className={styles.saveStatusError}> ✗ Error</span>}
              </h1>
              <p className={styles.subtitle}>
                {loading ? 'Loading project data...' : 'Configure your project settings and details'}
                {errors.general && <span className={styles.errorText}> {errors.general}</span>}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button 
              className={styles.exportButton}
              onClick={handleExport}
              disabled={loading}
            >
              <FaDownload />
              Export Game
            </button>
          </div>
        </motion.div>

        <div className={styles.body}>
          {/* Sticky Sidebar Navigation */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarContent}>
              <h3 className={styles.sidebarTitle}>Sections</h3>
              <nav className={styles.sidebarNav}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`${styles.sidebarItem} ${activeSection === section.id ? styles.active : ''}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <section.icon className={styles.sidebarIcon} />
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Form Content */}
          <div className={styles.formContent}>
            {/* Render only the active section */}
            {activeSection === 'basics' && (
              <motion.section 
                id="basics"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Project Basics</h2>
                <p className={styles.sectionDescription}>
                  Basic information about your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`${styles.input} ${errors.title ? styles.error : ''}`}
                    placeholder="Enter your project title"
                  />
                  {errors.title && <span className={styles.errorText}>{errors.title}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Project URL *
                  </label>
                  <div className={styles.urlInput}>
                    <span className={styles.urlPrefix}>ruchi.ai/projects/</span>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className={`${styles.input} ${errors.url ? styles.error : ''}`}
                      placeholder="my-awesome-project"
                    />
                  </div>
                  {errors.url && <span className={styles.errorText}>{errors.url}</span>}
                  <p className={styles.helperText}>
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Short description / tagline
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={styles.input}
                    placeholder="A brief description of your project"
                  />
                </div>
              </div>
              </motion.section>
            )}

            {/* Classification Section */}
            {activeSection === 'classification' && (
              <motion.section 
                id="classification"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Classification</h2>
                <p className={styles.sectionDescription}>
                  Categorize your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>What are you uploading?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="projectType"
                        value="games"
                        checked={formData.projectType === 'games'}
                        onChange={(e) => handleInputChange('projectType', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Games</strong>
                        <span className={styles.radioDescription}>A piece of software you can play</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Kind of project</label>
                  <select
                    value={formData.kindOfProject}
                    onChange={(e) => handleInputChange('kindOfProject', e.target.value)}
                    className={styles.select}
                  >
                    <option value="downloadable">Downloadable</option>
                    <option value="html5">HTML5/Web playable</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Release status</label>
                  <select
                    value={formData.releaseStatus}
                    onChange={(e) => handleInputChange('releaseStatus', e.target.value)}
                    className={styles.select}
                  >
                    <option value="released">Released</option>
                    <option value="in-development">In Development</option>
                    <option value="prototype">Prototype</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              </motion.section>
            )}

            {/* Pricing Section */}
            {activeSection === 'pricing' && (
              <motion.section 
                id="pricing"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Pricing</h2>
                <p className={styles.sectionDescription}>
                  Set your project&apos;s pricing model
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pricing Type</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="pricingType"
                        value="free"
                        checked={formData.pricingType === 'free'}
                        onChange={(e) => handleInputChange('pricingType', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Free</strong>
                        <span className={styles.radioDescription}>No payment required</span>
                      </span>
                    </label>
                    
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="pricingType"
                        value="donation"
                        checked={formData.pricingType === 'donation'}
                        onChange={(e) => handleInputChange('pricingType', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Donation</strong>
                        <span className={styles.radioDescription}>Suggested donation amount</span>
                      </span>
                    </label>
                  </div>
                </div>

                {formData.pricingType === 'donation' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Suggested donation</label>
                    <div className={styles.currencyInput}>
                      <span className={styles.currencySymbol}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.suggestedDonation}
                        onChange={(e) => handleInputChange('suggestedDonation', parseFloat(e.target.value) || 0)}
                        className={`${styles.input} ${errors.suggestedDonation ? styles.error : ''}`}
                        placeholder="2.00"
                      />
                    </div>
                    {errors.suggestedDonation && <span className={styles.errorText}>{errors.suggestedDonation}</span>}
                    <p className={styles.helperText}>
                      Note: No payments — Someone downloading your project will be asked for a donation before getting access. They can skip to download for free.
                    </p>
                  </div>
                )}
              </div>
              </motion.section>
            )}

            {/* Uploads Section */}
            {activeSection === 'uploads' && (
              <motion.section 
                id="uploads"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Uploads</h2>
                <p className={styles.sectionDescription}>
                  Upload your project files
                </p>
              </div>

              <div className={styles.uploadArea}>
                <div 
                  className={styles.uploadZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload className={styles.uploadIcon} />
                  <h3 className={styles.uploadTitle}>Choose from computer</h3>
                  <p className={styles.uploadDescription}>
                    Drag and drop your files here, or click to browse
                  </p>
                  <div className={styles.uploadOptions}>
                    <button 
                      type="button"
                      className={styles.uploadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose from computer
                    </button>
                    <button 
                      type="button"
                      className={styles.uploadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle Dropbox integration
                      }}
                    >
                      <FaLink /> Dropbox
                    </button>
                    <button 
                      type="button"
                      className={styles.uploadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle external file link
                      }}
                    >
                      <FaLink /> External file link
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className={styles.hiddenInput}
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      files.forEach(file => handleFileUpload(file, 'project'));
                    }}
                  />
                </div>
                <p className={styles.fileLimit}>
                  File size limit: 1GB
                </p>
                <p className={styles.helperText}>
                  Use Butler to upload files: it only uploads what&apos;s changed, generates patches for the Brew 3D app, and you can automate it.
                </p>
              </div>
              </motion.section>
            )}

            {/* Details Section */}
            {activeSection === 'details' && (
              <motion.section 
                id="details"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Details</h2>
                <p className={styles.sectionDescription}>
                  Provide detailed information about your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    value={formData.fullDescription}
                    onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                    className={styles.textarea}
                    placeholder="Describe your project in detail..."
                    rows={6}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Select a genre</option>
                    <option value="action">Action</option>
                    <option value="adventure">Adventure</option>
                    <option value="puzzle">Puzzle</option>
                    <option value="strategy">Strategy</option>
                    <option value="simulation">Simulation</option>
                    <option value="rpg">RPG</option>
                    <option value="sports">Sports</option>
                    <option value="racing">Racing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tags (up to 10)</label>
                  <div className={styles.tagsInput}>
                    <div className={styles.tagsList}>
                      {formData.tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className={styles.tagRemove}
                          >
                            <FaTimes />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      className={styles.tagInput}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const tag = e.target.value.trim();
                          if (tag) {
                            handleTagAdd(tag);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <p className={styles.helperText}>
                    Press Enter to add tags. {formData.tags.length}/10 used.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>AI Disclosure</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="aiDisclosure"
                        value="no"
                        checked={formData.aiDisclosure === 'no'}
                        onChange={(e) => handleInputChange('aiDisclosure', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>No</strong>
                        <span className={styles.radioDescription}>This project was not created using AI</span>
                      </span>
                    </label>
                    
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="aiDisclosure"
                        value="yes"
                        checked={formData.aiDisclosure === 'yes'}
                        onChange={(e) => handleInputChange('aiDisclosure', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Yes</strong>
                        <span className={styles.radioDescription}>This project was created using AI tools</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              </motion.section>
            )}

            {/* App Store Links Section */}
            {activeSection === 'appstores' && (
              <motion.section 
                id="appstores"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>App Store Links</h2>
                <p className={styles.sectionDescription}>
                  Link to your project on various platforms
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Steam</label>
                  <input
                    type="url"
                    value={formData.steamLink}
                    onChange={(e) => handleInputChange('steamLink', e.target.value)}
                    className={styles.input}
                    placeholder="https://store.steampowered.com/app/..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Apple App Store</label>
                  <input
                    type="url"
                    value={formData.appleStoreLink}
                    onChange={(e) => handleInputChange('appleStoreLink', e.target.value)}
                    className={styles.input}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Google Play Store</label>
                  <input
                    type="url"
                    value={formData.googlePlayLink}
                    onChange={(e) => handleInputChange('googlePlayLink', e.target.value)}
                    className={styles.input}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Amazon Appstore</label>
                  <input
                    type="url"
                    value={formData.amazonLink}
                    onChange={(e) => handleInputChange('amazonLink', e.target.value)}
                    className={styles.input}
                    placeholder="https://www.amazon.com/dp/..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Windows Store</label>
                  <input
                    type="url"
                    value={formData.windowsStoreLink}
                    onChange={(e) => handleInputChange('windowsStoreLink', e.target.value)}
                    className={styles.input}
                    placeholder="https://www.microsoft.com/store/productId/..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Custom Noun</label>
                  <input
                    type="text"
                    value={formData.customNoun}
                    onChange={(e) => handleInputChange('customNoun', e.target.value)}
                    className={styles.input}
                    placeholder="Override 'game' with another word (e.g., 'experience')"
                  />
                </div>
              </div>
              </motion.section>
            )}

            {/* Community Section */}
            {activeSection === 'community' && (
              <motion.section 
                id="community"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Community</h2>
                <p className={styles.sectionDescription}>
                  Enable community features for your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Community Features</label>
                  <div className={styles.toggleGroup}>
                    <label className={styles.toggleOption}>
                      <input
                        type="radio"
                        name="communityEnabled"
                        value="disabled"
                        checked={!formData.communityEnabled}
                        onChange={() => handleInputChange('communityEnabled', false)}
                      />
                      <span className={styles.toggleLabel}>
                        <strong>Disabled</strong>
                        <span className={styles.toggleDescription}>No community features</span>
                      </span>
                    </label>
                    
                    <label className={styles.toggleOption}>
                      <input
                        type="radio"
                        name="communityEnabled"
                        value="comments"
                        checked={formData.communityEnabled && formData.communityType === 'comments'}
                        onChange={() => {
                          handleInputChange('communityEnabled', true);
                          handleInputChange('communityType', 'comments');
                        }}
                      />
                      <span className={styles.toggleLabel}>
                        <strong>Comments</strong>
                        <span className={styles.toggleDescription}>Allow users to comment on your project</span>
                      </span>
                    </label>
                    
                    <label className={styles.toggleOption}>
                      <input
                        type="radio"
                        name="communityEnabled"
                        value="discussion"
                        checked={formData.communityEnabled && formData.communityType === 'discussion'}
                        onChange={() => {
                          handleInputChange('communityEnabled', true);
                          handleInputChange('communityType', 'discussion');
                        }}
                      />
                      <span className={styles.toggleLabel}>
                        <strong>Discussion Board</strong>
                        <span className={styles.toggleDescription}>Full discussion board for your project</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              </motion.section>
            )}

            {/* Visibility & Access Section */}
            {activeSection === 'visibility' && (
              <motion.section 
                id="visibility"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Visibility & Access</h2>
                <p className={styles.sectionDescription}>
                  Control who can see and access your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Project Visibility</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="visibility"
                        value="draft"
                        checked={formData.visibility === 'draft'}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Draft</strong>
                        <span className={styles.radioDescription}>Only you can see this project</span>
                      </span>
                    </label>
                    
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="visibility"
                        value="restricted"
                        checked={formData.visibility === 'restricted'}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Restricted</strong>
                        <span className={styles.radioDescription}>Only people with the link can see this project</span>
                      </span>
                    </label>
                    
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Public</strong>
                        <span className={styles.radioDescription}>Anyone can find and see this project</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              </motion.section>
            )}

            {/* Media Section */}
            {activeSection === 'media' && (
              <motion.section 
                id="media"
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Media</h2>
                <p className={styles.sectionDescription}>
                  Upload images and videos to showcase your project
                </p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cover Image *</label>
                  <div className={styles.imageUpload}>
                    <div className={styles.imageUploadArea}>
                      {formData.coverImage ? (
                        <div className={styles.imagePreview}>
                          <img 
                            src={URL.createObjectURL(formData.coverImage)} 
                            alt="Cover preview" 
                            className={styles.previewImage}
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange('coverImage', null)}
                            className={styles.removeImage}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className={styles.imagePlaceholder}
                          onClick={() => coverImageRef.current?.click()}
                        >
                          <FaImage className={styles.uploadIcon} />
                          <p>Click to upload cover image</p>
                          <p className={styles.imageRequirements}>Min 315x250, recommended 630x500</p>
                        </div>
                      )}
                      <input
                        ref={coverImageRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'cover')}
                        className={styles.hiddenInput}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Gameplay Trailer</label>
                  <input
                    type="url"
                    value={formData.trailerLink}
                    onChange={(e) => handleInputChange('trailerLink', e.target.value)}
                    className={styles.input}
                    placeholder="YouTube or Vimeo link"
                  />
                  <p className={styles.helperText}>
                    Paste a YouTube or Vimeo URL to embed a trailer
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Screenshots</label>
                  <div className={styles.screenshotsUpload}>
                    <div className={styles.screenshotsList}>
                      {formData.screenshots.map((screenshot, index) => (
                        <div key={index} className={styles.screenshotItem}>
                          <img 
                            src={URL.createObjectURL(screenshot)} 
                            alt={`Screenshot ${index + 1}`} 
                            className={styles.screenshotImage}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newScreenshots = formData.screenshots.filter((_, i) => i !== index);
                              handleInputChange('screenshots', newScreenshots);
                            }}
                            className={styles.removeScreenshot}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                      {formData.screenshots.length < 5 && (
                        <div 
                          className={styles.addScreenshot}
                          onClick={() => screenshotsRef.current?.click()}
                        >
                          <FaImage className={styles.uploadIcon} />
                          <p>Add screenshot</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={screenshotsRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        files.forEach(file => handleFileUpload(file, 'screenshots'));
                      }}
                      className={styles.hiddenInput}
                    />
                    <p className={styles.helperText}>
                      3-5 screenshots recommended
                    </p>
                  </div>
                </div>
              </div>
              </motion.section>
            )}

            {/* Action Buttons */}
            <motion.div 
              className={styles.actionButtons}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className={styles.draftButton}
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className={styles.publishButton}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Project'}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}