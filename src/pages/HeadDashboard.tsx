import React from 'react'
import './HeadDashboardMobile.css';
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { AnnouncementFeed } from '../components/AnnouncementFeed'
import { AnnouncementCreateModal } from '../components/AnnouncementCreateModal'
import { AIButton } from '../components/AIButton'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { getCurrentStaffUser } from '../lib/auth'
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle, RefreshCw, FileText, Monitor, Brain, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { motion } from 'framer-motion';
import {
  getAllTeacherLeaveBalancesWithDetails,
  updateTeacherTotalLeaves,
  getPendingLeaveApplicationsForAdmin
} from '../lib/leaveManagement'
import { getTeachersOnLeaveForDate } from '../lib/leaveHelpers'
import { NotificationCard } from '../components/NotificationCard'


export function HeadDashboard() {
  // --- Live Teacher Status Card State and Logic ---
  const [filter, setFilter] = React.useState<'all' | 'present' | 'break' | 'absent' | 'no-checkin'>('all');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  // ...existing code...
  // For mobile bottom nav
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  // Dynamic greeting function
  function getGreeting(name?: string | null) {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    return `${greeting}, ${name || 'Head of School'}`;
  }
  const [showAnnouncementModal, setShowAnnouncementModal] = React.useState(false);
  const navigate = useNavigate()
  const { showToast } = useToast()
  const user = getCurrentStaffUser()
  const [teacherStatus, setTeacherStatus] = React.useState<any[]>([])
  const [behaviorReports, setBehaviorReports] = React.useState<any[]>([])
  const [activeSessions, setActiveSessions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true) // General loading
  const [activeTab, setActiveTab] = React.useState<'overview' | 'classes' | 'leaves' | 'leaveSettings' | 'announcement'>('overview')

  // Remove duplicate isMobile declaration
  const [lastRefresh, setLastRefresh] = React.useState(new Date())
  const [expandedReports, setExpandedReports] = React.useState<Set<string>>(new Set())

  // Leave Settings State
  const [leaveBalances, setLeaveBalances] = React.useState<any[]>([])
  const [leaveBalancesLoading, setLeaveBalancesLoading] = React.useState(false)
  const [editLeaveId, setEditLeaveId] = React.useState<string | null>(null)
  const [editLeaveValue, setEditLeaveValue] = React.useState<string>("")
  const [leaveBalancesError, setLeaveBalancesError] = React.useState<string | null>(null)

  // Notifications State
  const [notifications, setNotifications] = React.useState<any[]>([])

  // --- DATA LOADERS: must be hoisted above useCallback/useEffect usage ---
  // Loader: Teacher Status (single, correct declaration)
  const loadTeacherStatus = React.useCallback(async () => {
    try {
      const { data: teachers, error: teachersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher')
        .order('name')
      if (teachersError) {
        console.error('Teachers query error:', teachersError)
        throw new Error('Please contact creator - Shan')
      }
      const today = new Date().toLocaleDateString('en-CA')
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_logs')
        .select('teacher_id, status, remarks, created_at')
        .eq('date', today)
      if (attendanceError) {
        console.error('Attendance query error:', attendanceError)
      }
      const processedData = teachers.map(teacher => {
        const todayAttendance = attendanceRecords?.find(
          record => record.teacher_id === teacher.id
        )
        return {
          ...teacher,
          currentStatus: todayAttendance?.status || 'no-checkin',
          remarks: todayAttendance?.remarks,
          lastUpdate: todayAttendance?.created_at,
          attendance_logs: undefined
        }
      })
      setTeacherStatus(processedData)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading teacher status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please contact creator - Shan'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Loader: Behavior Reports
  const loadBehaviorReports = React.useCallback(async () => {
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('behavior_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (reportsError) {
        console.error('Behavior reports query error:', reportsError)
        return
      }
      const { data: teachers, error: teachersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'teacher')
      if (teachersError) {
        console.error('Teachers query error:', teachersError)
        return
      }
      const reportsWithTeachers = (reports || []).map(report => ({
        ...report,
        teacher_name: teachers?.find(teacher => teacher.id === report.teacher_id)?.name || 'Unknown Teacher'
      }))
      setBehaviorReports(reportsWithTeachers)
    } catch (error) {
      console.error('Error loading behavior reports:', error)
    }
  }, [])

  // Loader: Active Sessions
  const loadActiveSessions = React.useCallback(async () => {
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('status', 'active')
        .order('start_time', { ascending: false })
      if (sessionsError) {
        console.error('Active sessions query error:', sessionsError)
        return
      }
      const { data: teachers, error: teachersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'teacher')
      if (teachersError) {
        console.error('Teachers query error:', teachersError)
        return
      }
      const sessionsWithTeachers = (sessions || []).map(session => ({
        ...session,
        teacher_name: teachers?.find(teacher => teacher.id === session.teacher_id)?.name || 'Unknown Teacher'
      }))
      setActiveSessions(sessionsWithTeachers)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }, [])

  // Load all teacher leave balances for leave settings tab
  const loadLeaveBalances = React.useCallback(async () => {
    setLeaveBalancesLoading(true)
    setLeaveBalancesError(null)
    try {
      const { balances } = await getAllTeacherLeaveBalancesWithDetails(1, 100)
      setLeaveBalances(balances)
    } catch (err: any) {
      setLeaveBalancesError(err.message || 'Failed to load leave balances')
    } finally {
      setLeaveBalancesLoading(false)
    }
  }, [])

  // Save new total leaves for a teacher
  const handleSaveLeave = async (teacherId: string) => {
    const newVal = parseInt(editLeaveValue, 10)
    if (isNaN(newVal) || newVal < 0) {
      showToast('Please enter a valid non-negative number', 'error')
      return
    }
    try {
      await updateTeacherTotalLeaves(teacherId, newVal)
      showToast('Leave allowance updated', 'success')
      setEditLeaveId(null)
      setEditLeaveValue("")
      loadLeaveBalances()
    } catch (err: any) {
      showToast(err.message || 'Failed to update leave allowance', 'error')
    }
  }

  // When switching to leaveSettings tab, load balances
  React.useEffect(() => {
    if (activeTab === 'leaveSettings') {
      loadLeaveBalances()
    }
  }, [activeTab, loadLeaveBalances])

  // --- LEAVE APPLICATIONS: loader for pending leave applications ---
  const [pendingLeaves, setPendingLeaves] = React.useState<any[]>([])
  const [pendingLeavesLoading, setPendingLeavesLoading] = React.useState(false)
  const [pendingLeavesError, setPendingLeavesError] = React.useState<string | null>(null)

  const loadPendingLeaves = React.useCallback(async () => {
    setPendingLeavesLoading(true)
    setPendingLeavesError(null)
    try {
      const { applications } = await getPendingLeaveApplicationsForAdmin(1, 100)
      setPendingLeaves(applications)
    } catch (err: any) {
      setPendingLeavesError(err.message || 'Failed to load pending leave applications')
    } finally {
      setPendingLeavesLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === 'leaves') {
      loadPendingLeaves()
    }
  }, [activeTab, loadPendingLeaves])

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await import('../lib/leaveManagement').then(m => m.processLeaveApplicationByAdmin(leaveId, 'approve'))
      showToast('Leave approved', 'success')
      loadPendingLeaves()
    } catch (err: any) {
      showToast(err.message || 'Failed to approve leave', 'error')
    }
  }

  // Reviewer note modal state
  const [rejectModal, setRejectModal] = React.useState<{ open: boolean; leaveId?: string } | null>(null);
  const [reviewerNote, setReviewerNote] = React.useState('');

  const handleRejectLeave = async (leaveId: string, note: string) => {
    try {
      await import('../lib/leaveManagement').then(m => m.processLeaveApplicationByAdmin(leaveId, 'reject', note))
      showToast('Leave rejected', 'success')
      loadPendingLeaves()
    } catch (err: any) {
      showToast(err.message || 'Failed to reject leave', 'error')
    }
  }

  // --- MAIN DASHBOARD DATA LOADER ---
  const loadAllHeadData = React.useCallback(async (isInitialLoad = true) => {
    setLoading(true); // Always show loading spinner
    try {
      await Promise.all([
        loadTeacherStatus(),
        loadBehaviorReports(),
        loadActiveSessions(),
        loadPendingLeaves()
      ]);
    } catch (error) {
      console.error("Error loading head dashboard data:", error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [loadTeacherStatus, loadBehaviorReports, loadActiveSessions, loadPendingLeaves])


  React.useEffect(() => {
    loadAllHeadData(true); // Initial full load with staggering
    const interval = setInterval(() => {
      loadTeacherStatus();
      if (activeTab === 'classes') loadActiveSessions();
      // Behavior reports might not need to auto-refresh as often, or could be manual.
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab, loadAllHeadData, loadTeacherStatus, loadActiveSessions]);

  React.useEffect(() => {
    async function aggregateNotifications() {
      // Attendance logs for today
      const today = new Date().toLocaleDateString('en-CA');
      const { data: attendanceRecords } = await supabase
        .from('attendance_logs')
        .select('*, users(name)')
        .eq('date', today);

      const attendanceNotifications = (attendanceRecords || [])
        .map(record => ({
          id: `attendance-${record.id}`,
          message: `Teacher ${record.users?.name || record.teacher_id} checked in (${record.status})`,
          timestamp: new Date(record.created_at).toLocaleString(),
        }));

      const leaveNotifications = pendingLeaves.slice(0, 2).map(leave => ({
        id: `leave-${leave.id}`,
        message: `Leave request from ${leave.users?.name} for ${leave.leave_date}`,
        timestamp: new Date(leave.created_at).toLocaleString(),
      }));

      const reportNotifications = behaviorReports.slice(0, 2).map(report => ({
        id: `report-${report.id}`,
        message: `New behavior report by ${report.teacher_name} for ${report.student_name}`,
        timestamp: new Date(report.created_at).toLocaleString(),
      }));

      const allNotifications = [
        ...attendanceNotifications,
        ...leaveNotifications,
        ...reportNotifications
      ];
      // Sort strictly by timestamp descending
      allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(allNotifications.slice(0, 4));
    }
    aggregateNotifications();
  }, [pendingLeaves, behaviorReports]);

  const handleViewReport = async () => {
    // Collect all current data and format as before
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    // Get teachers on leave today
    const today = new Date().toISOString().split('T')[0];
    const teachersOnLeave = await getTeachersOnLeaveForDate(today);
    const leaveSection = `TEACHERS ON LEAVE TODAY: ${teachersOnLeave.length}\n` +
      (teachersOnLeave.length > 0
        ? teachersOnLeave.map(t => `• ${t.teacherName} (${t.leaveType})${t.reason ? ': ' + t.reason : ''}`).join('\n')
        : '• None');

    const dataForReport = `
SCHOOL STATUS REPORT FOR ${currentDate}

TEACHER ATTENDANCE OVERVIEW:
- Total Teachers: ${teacherStatus.length}
- Present: ${statusCounts.present} teachers
- On Break: ${statusCounts.break} teachers  
- Absent: ${statusCounts.absent} teachers
- No Check-in: ${statusCounts.noCheckin} teachers

${leaveSection}

DETAILED TEACHER STATUS:
${teacherStatus.map(teacher => 
  `• ${teacher.name} (${teacher.email}): ${getStatusText(teacher.currentStatus)}${teacher.remarks ? ` - ${teacher.remarks}` : ''}${teacher.lastUpdate ? ` (Last update: ${new Date(teacher.lastUpdate).toLocaleTimeString()})` : ''}`
).join('\n')}

ACTIVE CLASSES IN SESSION:
- Total Active Classes: ${activeSessions.length}
${activeSessions.length > 0 ? activeSessions.map(session => {
  const startTime = new Date(session.start_time)
  const now = new Date()
  const duration = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60))
  return `• ${session.class_level} ${session.subject} - Teacher: ${session.teacher_name} (${duration} minutes active)`
}).join('\n') : '• No classes currently in session'}

RECENT BEHAVIOR REPORTS:
- Total Recent Reports: ${behaviorReports.length}
${behaviorReports.length > 0 ? behaviorReports.slice(0, 5).map(report => 
  `• ${report.student_name} (${report.class_level}): ${report.incident.substring(0, 100)}${report.incident.length > 100 ? '...' : ''} - Action: ${report.action_taken.substring(0, 50)}${report.action_taken.length > 50 ? '...' : ''} [${report.teacher_name}, ${new Date(report.created_at).toLocaleDateString()}]`
).join('\n') : '• No recent behavior reports'}
`
    navigate('/school-report-viewer', { state: { reportContent: dataForReport } })
  }

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100'
      case 'break': return 'text-yellow-600 bg-yellow-100'
      case 'absent': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present'
      case 'break': return 'On Break'
      case 'absent': return 'Absent'
      default: return 'No Check-in'
    }
  }

  const statusCounts = React.useMemo(() => {
    const counts = {
      present: 0,
      break: 0,
      absent: 0,
      noCheckin: 0
    }

    teacherStatus.forEach(teacher => {
      switch (teacher.currentStatus) {
        case 'present': counts.present++; break
        case 'break': counts.break++; break
        case 'absent': counts.absent++; break
        default: counts.noCheckin++; break
      }
    })

    return counts
  }, [teacherStatus])

  if (loading) {
    return (
      <Layout title="Head of School Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Head of School Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/70 dark:to-indigo-900/70 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                {getGreeting(user?.name)}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                Here's the pulse of the school.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleViewReport}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
              >
                <Brain size={20} />
                <span className="hidden sm:inline">Daily Report</span>
              </button>
              <button
                onClick={() => loadAllHeadData(false)}
                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-md"
                aria-label="Refresh Data"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              {/* AI Assistant Button (desktop only) */}
              <button
                onClick={() => navigate('/ai')}
                className="hidden sm:flex px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-md items-center gap-2"
                aria-label="Open AI Assistant"
              >
                <Brain size={20} />
                <span>AI Assistant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Card: Only show in overview tab */}
        {activeTab === 'overview' && (
          <NotificationCard notifications={notifications} />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tab Navigation for Desktop */}
            <div className="hidden sm:block bg-white dark:bg-gray-800/50 rounded-2xl shadow-md p-2 border border-gray-200 dark:border-gray-700">
              <nav className="flex items-center justify-between">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'classes', label: 'Active Classes', icon: Monitor },
                  { id: 'leaves', label: 'Leave Requests', icon: FileText },
                  { id: 'leaveSettings', label: 'Leave Settings', icon: Plus },
                  { id: 'announcement', label: 'Announcements', icon: Plus },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl text-center font-semibold transition-all flex items-center justify-center gap-2 ${
                      activeTab === id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
                <Link to="/ai" className="flex-1 py-3 px-4 rounded-xl text-center font-semibold transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Brain size={18} />
                  AI
                </Link>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <>
                  {/* Today's Summary card first */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      Today's Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-green-500">
                          {statusCounts.present}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-yellow-500">
                          {statusCounts.break}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">On Break</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-red-500">
                          {statusCounts.absent}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-400">
                          {statusCounts.noCheckin}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No Check-in</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Teacher Status card below */}
                  <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Live Teacher Status</h3>
                      {/* Filter Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {['all', 'present', 'break', 'absent', 'no-checkin'].map(f => (
                          <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`text-sm px-3 py-1 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                          >
                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Responsive: mobile cards, desktop table */}
                    <div className="block md:hidden">
                      {teacherStatus.filter(teacher => {
                        if (filter === 'all') return true;
                        return teacher.currentStatus === filter;
                      }).map(teacher => (
                        <div key={teacher.id} className="mb-4 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">{teacher.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{teacher.email}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(teacher.currentStatus)}`}>{getStatusText(teacher.currentStatus)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>Check-in: {teacher.lastUpdate ? new Date(teacher.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
                          </div>
                          {teacher.remarks && (
                            <div className="mt-2">
                              <button
                                onClick={() => toggleExpand(teacher.id)}
                                className="text-sm text-blue-600 underline"
                                aria-expanded={expandedIds.has(teacher.id)}
                              >
                                {expandedIds.has(teacher.id) ? 'Hide Remarks' : 'View Remarks'}
                              </button>
                              <motion.div style={{ overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={expandedIds.has(teacher.id) ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {expandedIds.has(teacher.id) && (
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 border border-blue-200 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded p-2">
                                      {teacher.remarks}
                                    </div>
                                  )}
                                </motion.div>
                              </motion.div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Update</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {teacherStatus.filter(teacher => {
                            if (filter === 'all') return true;
                            return teacher.currentStatus === filter;
                          }).map(teacher => (
                            <tr key={teacher.id}>
                              <td className="py-4">
                                <p className="font-semibold text-gray-800 dark:text-white text-base">{teacher.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</p>
                              </td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(teacher.currentStatus)}`}>{getStatusText(teacher.currentStatus)}</span>
                              </td>
                              <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{teacher.lastUpdate ? new Date(teacher.lastUpdate).toLocaleTimeString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'classes' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Active Classes
                  </h3>
                  {activeSessions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      There are currently no active classes.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Class
                            </th>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                              Teacher
                            </th>
                            <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {activeSessions.map(session => (
                            <tr key={session.id}>
                              <td className="py-4">
                                <p className="font-semibold text-gray-800 dark:text-white text-base">
                                  {session.class_level}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {session.subject}
                                </p>
                              </td>
                              <td className="py-4 text-base text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                {session.teacher_name}
                              </td>
                              <td className="py-4">
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  {Math.round(
                                    (new Date().getTime() -
                                      new Date(session.start_time).getTime()) /
                                      (1000 * 60)
                                  )}{' '}
                                  mins
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'leaves' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Pending Leave Requests
                  </h3>
                  {!pendingLeavesLoading && !pendingLeavesError && pendingLeaves.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No pending leave requests at the moment.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {pendingLeaves.map(leave => (
                        <div
                          key={leave.id}
                          className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {leave.users?.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {leave.leave_date} ({leave.leave_type})
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {leave.reason}
                            </p>
                          </div>
                          <div className="flex gap-3 self-end sm:self-center">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all w-full sm:w-auto"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, leaveId: leave.id })}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all w-full sm:w-auto"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'leaveSettings' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Leave Settings
                  </h3>
                  {leaveBalances.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No teacher leave balances found.
                    </p>
                  ) : (
                    <>
                      {/* Desktop View: Table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Teacher
                              </th>
                              <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Total Leaves
                              </th>
                              <th className="pb-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {leaveBalances.map(balance => (
                              <tr key={balance.teacher_id}>
                                <td className="py-4 font-semibold text-gray-800 dark:text-white text-base">
                                  {balance.teacher_name}
                                </td>
                                <td className="py-4">
                                  {editLeaveId === balance.teacher_id ? (
                                    <input
                                      type="number"
                                      value={editLeaveValue}
                                      onChange={e => setEditLeaveValue(e.target.value)}
                                      className="w-20 px-2 py-1 border rounded-md"
                                    />
                                  ) : (
                                    <span>{balance.total_leaves}</span>
                                  )}
                                </td>
                                <td className="py-4">
                                  {editLeaveId === balance.teacher_id ? (
                                    <button
                                      onClick={() => handleSaveLeave(balance.teacher_id)}
                                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                                    >
                                      Save
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditLeaveId(balance.teacher_id);
                                        setEditLeaveValue(balance.total_leaves);
                                      }}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile View: Cards */}
                      <div className="sm:hidden space-y-4">
                        {leaveBalances.map(balance => (
                          <div key={balance.teacher_id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="font-semibold text-gray-800 dark:text-white">{balance.teacher_name}</p>
                            <div className="flex justify-between items-center mt-2">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Leaves</p>
                                {editLeaveId === balance.teacher_id ? (
                                  <input
                                    type="number"
                                    value={editLeaveValue}
                                    onChange={e => setEditLeaveValue(e.target.value)}
                                    className="w-20 px-2 py-1 border rounded-md"
                                  />
                                ) : (
                                  <p className="font-semibold">{balance.total_leaves}</p>
                                )}
                              </div>
                              {editLeaveId === balance.teacher_id ? (
                                <button
                                  onClick={() => handleSaveLeave(balance.teacher_id)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                                >
                                  Save
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditLeaveId(balance.teacher_id);
                                    setEditLeaveValue(balance.total_leaves);
                                  }}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'announcement' && (
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                    Announcements
                  </h3>
                  <AnnouncementFeed />
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="mt-6 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all w-full"
                  >
                    Create Announcement
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Behavior Reports: Only show in overview tab */}
            {activeTab === 'overview' && (
              <div
                className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
                style={{ marginBottom: isMobile ? '72px' : undefined }}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Recent Behavior Reports
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {behaviorReports.slice(0, 3).map(report => (
                    <div key={report.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {report.student_name}
                        </p>
                        <button
                          onClick={() => toggleReportExpansion(report.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label={expandedReports.has(report.id) ? 'Collapse report' : 'Expand report'}
                        >
                          {expandedReports.has(report.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reported by {report.teacher_name}
                      </p>
                      {expandedReports.has(report.id) && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong className="font-medium">Incident:</strong> {report.incident}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong className="font-medium">Action:</strong> {report.action_taken}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => navigate('/all-behavior-reports')}
                    className="w-full text-center py-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    View All Reports
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex justify-around p-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'classes', label: 'Classes', icon: Monitor },
            { id: 'leaves', label: 'Leaves', icon: FileText },
            { id: 'announcement', label: 'Announce', icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`relative flex flex-col items-center justify-center w-full py-1 rounded-lg transition-all ${
                activeTab === id
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
              {id === 'leaves' && pendingLeaves.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
          ))}
          {/* AI Assistant Button (mobile nav) */}
          <button
            onClick={() => navigate('/ai')}
            className="flex flex-col items-center justify-center w-full py-1 rounded-lg transition-all text-purple-600 dark:text-purple-400"
            aria-label="Open AI Assistant"
          >
            <Brain size={24} />
            <span className="text-xs font-medium">AI</span>
          </button>
        </nav>

        <AnnouncementCreateModal
          open={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
        />

        {rejectModal?.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Reject Leave Application
              </h4>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                value={reviewerNote}
                onChange={e => setReviewerNote(e.target.value)}
                placeholder="Reason for rejection (required)..."
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="w-full px-4 py-3 text-base bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold"
                  onClick={() => {
                    setRejectModal(null);
                    setReviewerNote('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="w-full px-4 py-3 text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                  disabled={!reviewerNote.trim()}
                  onClick={async () => {
                    if (rejectModal?.leaveId) {
                      await handleRejectLeave(rejectModal.leaveId, reviewerNote);
                      setRejectModal(null);
                      setReviewerNote('');
                    }
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}