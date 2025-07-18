import React, { useState } from 'react';

// Feedback type for dashboard
type Feedback = {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  feedback: string;
  created_at: string;
};

// Feedback modal props
import { Layout } from '../components/Layout'
import { AnnouncementFeed } from '../components/AnnouncementFeed'
import { AnnouncementCreateModal } from '../components/AnnouncementCreateModal'
import { AIButton } from '../components/AIButton'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { hashPassword } from '../lib/auth'
import { getCurrentStaffUser } from '../lib/auth'
import { Plus, Edit, Trash2, Bot } from 'lucide-react' // Removed Palette
import { DiagnosticPanel } from '../components/DiagnosticPanel'
// Removed useTheme and ThemeName imports

export function CreatorDashboard() {
  // Dynamic greeting function
  function getGreeting(name?: string | null) {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    return `${greeting}, ${name || 'Creator'}`;
  }
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'announcement'>('dashboard');
  const { showToast } = useToast();
  const user = getCurrentStaffUser();
  const [users, setUsers] = useState<any[]>([]);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    id: null as string | null,
    name: '',
    email: '',
    password: '',
    role: 'teacher' as 'admin' | 'head' | 'teacher',
  });
  const [aiForm, setAiForm] = useState({
    api_key: '',
    model: '',
    access_level: 'all',
  });
  const [newApiKey, setNewApiKey] = useState('');
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [aiAssistantEnabled, setAIAssistantEnabled] = useState(() => {
    const v = localStorage.getItem('aiAssistantEnabled');
    return v ? v === 'true' : true;
  });
  const [testMode, setTestMode] = useState(() => {
    const v = localStorage.getItem('testMode');
    return v ? v === 'true' : false;
  });
  const [verbosity, setVerbosity] = useState(() => {
    const v = localStorage.getItem('verbosity');
    return v ? Number(v) : 5;
  });

  // Feedback state for dashboard
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  React.useEffect(() => {
    loadCreatorData();
  }, []);

  const loadCreatorData = async () => {
    setLoading(true); // Combined loading state
    setMaintenanceLoading(true);
    try {
      // Load users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'creator')
        .order('name');

      if (userError) {
        console.error('Users query error:', userError);
        throw new Error('Failed to load users. Please contact Creator - Shan');
      }
      setUsers(userData || []);

      // Load AI settings
      const { data: aiData, error: aiError } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (aiError) {
        console.error('AI settings query error:', aiError);
        showToast('Could not load AI settings, they might need to be configured.', 'warning');
      } else {
        setAiSettings(aiData);
        if (aiData) {
          setAiForm({
            api_key: aiData.api_key || '',
            model: aiData.model || '',
            access_level: aiData.access_level || 'all',
          });
        }
      }

      // Load Maintenance Mode status
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('system_flags')
        .select('is_active')
        .eq('flag_name', 'maintenance_mode')
        .single();

      if (maintenanceError) {
        console.error('Maintenance mode fetch error:', maintenanceError);
        showToast('Could not fetch maintenance mode status. Defaulting to OFF. Please check Supabase table `system_flags`.', 'error');
        setMaintenanceModeActive(false);
      } else if (maintenanceData) {
        setMaintenanceModeActive(maintenanceData.is_active);
      } else {
        showToast('Maintenance mode flag not found in `system_flags`. Defaulting to OFF. Please ensure it is set up.', 'error');
        setMaintenanceModeActive(false);
      }

      // Load feedbacks for dashboard
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (feedbackError) {
        console.error('Feedbacks query error:', feedbackError);
      } else {
        setFeedbacks((feedbackData as Feedback[]) || []);
      }

    } catch (error) {
      console.error('Error loading creator dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while loading data.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setMaintenanceLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({ 
      id: null,
      name: '', 
      email: '', 
      password: '', 
      role: 'teacher' 
    })
    setEditingUser(null)
    setShowUserForm(false)
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Leave password blank for security
      role: user.role
    })
    setShowUserForm(true)
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role
        };
        // Only update password if a new one is provided
        if (userForm.password.trim()) {
          updateData.password_hash = await hashPassword(userForm.password);
        }
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userForm.id);
        if (error) {
          console.error('User update error:', error);
          throw new Error('Please contact creator - Shan');
        }
        showToast('User updated successfully', 'success');
      } else {
        // Create new user
        if (!userForm.password.trim()) {
          showToast('Password is required for new users', 'error');
          setLoading(false);
          return;
        }
        const hashedPassword = await hashPassword(userForm.password);
        const { error } = await supabase
          .from('users')
          .insert({
            name: userForm.name,
            email: userForm.email,
            password_hash: hashedPassword,
            role: userForm.role
          });
        if (error) {
          console.error('User creation error:', error);
          throw new Error('Please contact creator - Shan');
        }
        showToast('User created successfully', 'success');
      }
      resetUserForm();
      await loadCreatorData(); // Refresh user list after add/edit
    } catch (error) {
      console.error('Error submitting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please contact creator - Shan';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('User deletion error:', error);
        throw new Error('Please contact creator - Shan');
      }
      showToast('User deleted', 'success');
      await loadCreatorData(); // Refresh user list after delete
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please contact creator - Shan';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!aiForm.model.trim()) {
      showToast('AI model name is required', 'error');
      setLoading(false);
      return;
    }
    if (!aiForm.api_key.trim()) {
      showToast('API key is required', 'error');
      setLoading(false);
      return;
    }
    if (!aiForm.access_level.trim()) {
      showToast('Access level is required', 'error');
      setLoading(false);
      return;
    }
    if (!confirm('Are you sure you want to save these AI settings?')) {
      setLoading(false);
      return;
    }
    try {
      if (aiSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('ai_settings')
          .update({
            api_key: aiForm.api_key,
            model: aiForm.model,
            access_level: aiForm.access_level
          })
          .eq('id', aiSettings.id);
        if (error) {
          console.error('AI settings update error:', error);
          throw new Error('Please contact creator - Shan');
        }
      } else {
        // Create new settings
        const { error } = await supabase
          .from('ai_settings')
          .insert({
            api_key: aiForm.api_key,
            model: aiForm.model,
            access_level: aiForm.access_level
          });
        if (error) {
          console.error('AI settings creation error:', error);
          throw new Error('Please contact creator - Shan');
        }
      }
      showToast('AI settings updated successfully', 'success');
      setShowAIForm(false);
      await loadCreatorData(); // Refresh AI settings after update
    } catch (error) {
      console.error('Error updating AI settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please contact creator - Shan';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Maintenance toggle handler
  const handleToggleMaintenance = async () => {
    const newValue = !maintenanceModeActive;
    setMaintenanceLoading(true);
    try {
      const { error } = await supabase
        .from('system_flags')
        .update({ is_active: newValue, updated_at: new Date().toISOString() }) // Explicitly set updated_at if trigger isn't immediate/reliable for UI
        .eq('flag_name', 'maintenance_mode');

      if (error) {
        console.error('Maintenance mode update error:', error);
        showToast(`Failed to update maintenance mode: ${error.message}`, 'error');
        // Revert UI state if Supabase update fails
        setMaintenanceModeActive(!newValue);
      } else {
        setMaintenanceModeActive(newValue);
        showToast(newValue ? 'Maintenance mode ENABLED globally.' : 'Maintenance mode DISABLED globally.', newValue ? 'warning' : 'success');
      }
    } catch (error) {
      console.error('Error in handleToggleMaintenance:', error);
      showToast('An unexpected error occurred while toggling maintenance mode.', 'error');
      setMaintenanceModeActive(!newValue); // Revert on catch
    } finally {
      setMaintenanceLoading(false);
    }
  };

  if (loading) { // General loading for user data, AI settings
    return (
      <Layout title="Creator Dashboard" isCreatorLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Creator Dashboard" isCreatorLayout>
      <div className="flex flex-col gap-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('announcement')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${
                activeTab === 'announcement'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Announcements
            </button>
          </nav>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'announcement' ? (
            <div className="space-y-6">
              <AnnouncementFeed />
              {(user?.role === 'admin' || user?.role === 'head' || user?.role === 'creator') && (
                <div>
                  <AnnouncementCreateModal open={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)} />
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-semibold min-h-[44px]"
                  >
                    <Plus className="h-5 w-5" />
                    New Announcement
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Welcome Header */}
                <div className="bg-blue-50 rounded-xl p-8">
                  <h3 className="text-3xl font-bold text-blue-900 mb-3">
                    {getGreeting(user?.name)}
                  </h3>
                  <p className="text-lg text-blue-800">
                    You have full system access to manage Charis Hope Learning Centre's platform.
                    Phase 3 includes AI assistant, user management, and behavior reports.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => setShowUserForm(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold min-h-[48px]"
                    >
                      <Plus className="h-6 w-6" />
                      Add User
                    </button>
                    <button
                      onClick={() => setShowAIForm(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold min-h-[48px]"
                    >
                      <Bot className="h-6 w-6" />
                      Configure AI
                    </button>
                  </div>
                </div>

                {/* User/AI Forms */}
                {showUserForm && (
                  <div className="bg-white rounded-xl shadow-lg p-8 border">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <form onSubmit={handleSubmitUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={userForm.name}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-h-[48px]"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-h-[48px]"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Password {editingUser ? '(leave blank to keep current)' : ''}
                        </label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          required={!editingUser}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-h-[48px]"
                          placeholder={editingUser ? 'New password' : 'Enter password'}
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-h-[48px]"
                        >
                          <option value="teacher">Teacher</option>
                          <option value="head">Head</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-4">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold min-h-[48px]"
                        >
                          {editingUser ? 'Update User' : 'Create User'}
                        </button>
                        <button
                          type="button"
                          onClick={resetUserForm}
                          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold min-h-[48px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {showAIForm && (
                  <div className="bg-white rounded-xl shadow-lg p-8 border">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">Configure AI Assistant</h3>
                    <form onSubmit={handleUpdateAISettings} className="space-y-8">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          OpenRouter API Key
                        </label>
                        <input
                          type="password"
                          value={aiForm.api_key}
                          onChange={e => setAiForm(prev => ({ ...prev, api_key: e.target.value }))}
                          placeholder="sk-or-v1-..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg min-h-[48px]"
                        />
                        {aiForm.api_key.length === 0 && (
                          <p className="text-lg text-gray-500 italic mt-2">No API key configured.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Model</label>
                        <input
                          type="text"
                          value={aiForm.model}
                          onChange={e => setAiForm(prev => ({ ...prev, model: e.target.value }))}
                          required
                          placeholder="e.g., mistral-7b-instruct"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg min-h-[48px]"
                        />
                        <p className="text-base text-gray-500 mt-2">
                          Enter a valid OpenRouter model name. AI access will be blocked if empty.
                        </p>
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">Access Level</label>
                        <select
                          value={aiForm.access_level}
                          onChange={e => setAiForm(prev => ({ ...prev, access_level: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg min-h-[48px]"
                        >
                          <option value="all">All</option>
                          <option value="creator">Creator</option>
                          <option value="admin">Admin</option>
                          <option value="head">Head</option>
                          <option value="teacher">Teacher</option>
                        </select>
                        <p className="text-base text-gray-500 mt-2">
                          Select which user role this AI config applies to. Use "All" for a global default.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold min-h-[48px]"
                        >
                          Save AI Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAIForm(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-lg font-semibold min-h-[48px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users Management */}
                <div className="bg-white rounded-xl shadow-lg border">
                  <div className="p-8 border-b">
                    <h3 className="text-2xl font-semibold text-gray-900">System Users</h3>
                  </div>
                  <div className="overflow-x-auto">
                    {users.length > 0 ? (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-8 py-5 text-left text-base font-semibold text-gray-600 uppercase">Name</th>
                            <th className="px-8 py-5 text-left text-base font-semibold text-gray-600 uppercase hidden md:table-cell">Email</th>
                            <th className="px-8 py-5 text-left text-base font-semibold text-gray-600 uppercase">Role</th>
                            <th className="px-8 py-5 text-left text-base font-semibold text-gray-600 uppercase hidden lg:table-cell">Created</th>
                            <th className="px-8 py-5 text-left text-base font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-8 py-5 whitespace-nowrap text-lg font-medium text-gray-900">{user.name}</td>
                              <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-600 hidden md:table-cell">{user.email}</td>
                              <td className="px-8 py-5 whitespace-nowrap">
                                <span className="inline-flex px-4 py-1 text-base font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-600 hidden lg:table-cell">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-600">
                                <div className="flex gap-5">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit user"
                                  >
                                    <Edit className="h-6 w-6" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-6 w-6" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-lg">
                        No users found. Click "Add User" to start.
                      </div>
                    )}
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl shadow-lg p-8 border">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">System Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-green-600">Active</div>
                      <div className="text-lg text-gray-600 mt-2">Database</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-green-600">{users.length + 1}</div>
                      <div className="text-lg text-gray-600 mt-2">Total Users</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-blue-600">Phase 3</div>
                      <div className="text-lg text-gray-600 mt-2">Current Version</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                {/* Maintenance Mode */}
                <div className={`rounded-xl p-8 shadow-lg border ${maintenanceModeActive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <h3 className={`font-bold text-2xl mb-4 ${maintenanceModeActive ? 'text-red-800' : 'text-green-800'}`}>
                    Global Maintenance
                  </h3>
                  <button
                    onClick={handleToggleMaintenance}
                    disabled={maintenanceLoading}
                    className={`w-full px-5 py-4 rounded-lg font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px] ${
                      maintenanceLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : maintenanceModeActive ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    {maintenanceLoading ? 'Updating...' : maintenanceModeActive ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                  <p className={`text-base mt-4 ${maintenanceModeActive ? 'text-red-700' : 'text-gray-600'}`}>
                    Status: {maintenanceModeActive ? 'ACTIVE - Site is inaccessible.' : 'INACTIVE - Site is live.'}
                  </p>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-xl shadow-lg p-8 border">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-2xl text-gray-900">System Settings</h3>
                    <button onClick={() => setShowSystemSettings(v => !v)} className="text-base text-blue-600 hover:underline">
                      {showSystemSettings ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showSystemSettings && (
                    <div className="space-y-6">
                      <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={aiAssistantEnabled} onChange={e => {
                          setAIAssistantEnabled(e.target.checked);
                          localStorage.setItem('aiAssistantEnabled', String(e.target.checked));
                        }} className="h-6 w-6 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="text-lg">AI Assistant</span>
                      </label>
                      <label className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <input type="checkbox" checked={testMode} onChange={e => {
                          setTestMode(e.target.checked);
                          localStorage.setItem('testMode', String(e.target.checked));
                        }} className="h-6 w-6 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="text-lg">Test Mode</span>
                      </label>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Verbosity: {verbosity}</label>
                        <input type="range" min={1} max={10} value={verbosity} onChange={e => {
                          setVerbosity(Number(e.target.value));
                          localStorage.setItem('verbosity', String(e.target.value));
                        }} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Management */}
                <div className="bg-white rounded-xl shadow-lg p-8 border space-y-4">
                  <h3 className="font-bold text-2xl text-gray-900 mb-4">Data Management</h3>
                  <button className="w-full text-left px-5 py-4 bg-blue-100 text-blue-800 rounded-lg font-semibold text-lg hover:bg-blue-200 min-h-[48px]">Export Users</button>
                  <button className="w-full text-left px-5 py-4 bg-blue-100 text-blue-800 rounded-lg font-semibold text-lg hover:bg-blue-200 min-h-[48px]">Export Schedules</button>
                  <button className="w-full text-left px-5 py-4 bg-blue-100 text-blue-800 rounded-lg font-semibold text-lg hover:bg-blue-200 min-h-[48px]">Export Reports</button>
                  <span className="text-base text-gray-500 block pt-2">(Placeholder actions)</span>
                </div>

                {/* Diagnostics */}
                <div className="bg-white rounded-xl shadow-lg p-8 border">
                  <h3 className="font-bold text-2xl text-gray-900 mb-6">Diagnostics</h3>
                  <button onClick={() => setShowDiagnostics(true)} className="w-full px-5 py-4 bg-purple-100 text-purple-800 rounded-lg font-semibold text-lg hover:bg-purple-200 min-h-[48px]">
                    Open Diagnostic Panel
                  </button>
                </div>

                {/* Feedbacks */}
                <div className="bg-white rounded-xl shadow-lg border">
                  <div className="p-8 border-b flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-900">Feedbacks</h3>
                    <button
                      onClick={loadCreatorData}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-base font-semibold hover:bg-blue-200"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[400px] p-8">
                    {feedbacks && feedbacks.length > 0 ? (
                      <ul className="space-y-5">
                        {feedbacks.map((fb) => (
                          <li key={fb.id} className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-lg text-gray-800 mb-2">{fb.feedback}</p>
                            <div className="text-base text-gray-500">
                              <strong>{fb.user_name || 'Anonymous'}</strong> -{' '}
                              <em>{new Date(fb.created_at).toLocaleString()}</em>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-gray-500 text-lg italic">No feedbacks yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Panel */}
        <DiagnosticPanel isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />

        {/* Global Loading Spinner */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        )}
      </div>
    </Layout>
  );
}