import { useState, useEffect } from 'react'
import { BehaviorReportGroup } from '../components/BehaviorReportGroup';
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { ArrowLeft, FileText, Search, Filter } from 'lucide-react'

export function AllBehaviorReportsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const levels = ['Pre-K', 'K1', 'K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']

  useEffect(() => {
    loadAllBehaviorReports()
  }, [sortBy, sortOrder])

  const loadAllBehaviorReports = async () => {
    try {
      setLoading(true)
      
      // Get all behavior reports
      const { data: reports, error: reportsError } = await supabase
        .from('behavior_reports')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (reportsError) {
        console.error('Behavior reports query error:', reportsError)
        throw new Error('Failed to load behavior reports')
      }

      // Get teacher names separately
      const { data: teachers, error: teachersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'teacher')

      if (teachersError) {
        console.error('Teachers query error:', teachersError)
        throw new Error('Failed to load teacher information')
      }

      // Merge reports with teacher names
      const reportsWithTeachers = (reports || []).map(report => ({
        ...report,
        teacher_name: teachers?.find(teacher => teacher.id === report.teacher_id)?.name || 'Unknown Teacher'
      }))

      setReports(reportsWithTeachers)
    } catch (error) {
      console.error('Error loading behavior reports:', error)
      showToast('Failed to load behavior reports. Please contact creator - Shan', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Remove filtering and sorting for this phase
  const filteredReports = reports;

  // Group reports by date: Today, Yesterday, or full date
  function getDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Group reports into an object: { [label]: report[] }
  const groupedReports: { [label: string]: typeof reports } = {};
  filteredReports.forEach(report => {
    const label = getDateLabel(report.created_at);
    if (!groupedReports[label]) groupedReports[label] = [];
    groupedReports[label].push(report);
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (loading) {
    return (
      <Layout title="All Behavior Reports">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }
  return (
    <Layout title="All Behavior Reports">
      <div className="space-y-6 px-1 sm:px-0">
        {/* Header */}
        <div className="bg-purple-50 rounded-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => navigate('/head')}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm w-full sm:w-auto mb-2 sm:mb-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-purple-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  All Behavior Reports
                </h3>
                <p className="text-xs sm:text-sm text-purple-700 mt-1">
                  Complete history of behavior incidents and actions taken
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Card UI */}
        <div className="space-y-6">
          {Object.keys(groupedReports).length > 0 ? (
            Object.entries(groupedReports).map(([label, reports]) => (
              <BehaviorReportGroup key={label} label={label} reports={reports} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-lg font-semibold">No behavior reports found. Everything looks good today!</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}