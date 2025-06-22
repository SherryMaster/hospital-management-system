/**
 * Performance Monitoring Dashboard
 * 
 * Real-time performance metrics and monitoring for administrators
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'

import { PerformanceMonitor, MetricsCollector, globalCache } from '../../utils/performance'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../services/api'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
)

export default function PerformanceDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({})
  const [systemHealth, setSystemHealth] = useState({})
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch performance metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/admin/performance-metrics/', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setMetrics(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch performance metrics')
      console.error('Performance metrics error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await apiClient.get('/api/admin/system-health/', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setSystemHealth(response.data)
    } catch (err) {
      console.error('System health error:', err)
    }
  }

  // Get client-side metrics
  const getClientMetrics = () => {
    const performanceMetrics = PerformanceMonitor.getMetrics()
    const collectorMetrics = MetricsCollector.getMetrics()
    const cacheStats = {
      size: globalCache.size(),
      maxSize: globalCache.maxSize,
      hitRate: collectorMetrics.cacheHits / (collectorMetrics.cacheHits + collectorMetrics.cacheMisses) || 0
    }

    return {
      performance: performanceMetrics,
      collector: collectorMetrics,
      cache: cacheStats,
      memory: getMemoryInfo(),
      timing: getTimingInfo()
    }
  }

  // Get memory information
  const getMemoryInfo = () => {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  // Get timing information
  const getTimingInfo = () => {
    if ('timing' in performance) {
      const timing = performance.timing
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      }
    }
    return null
  }

  useEffect(() => {
    fetchMetrics()
    fetchSystemHealth()

    if (realTimeMonitoring) {
      const interval = setInterval(() => {
        fetchMetrics()
        fetchSystemHealth()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [realTimeMonitoring])

  const clientMetrics = useMemo(() => getClientMetrics(), [metrics])

  // Chart configurations
  const responseTimeChartData = {
    labels: metrics.response_times?.labels || [],
    datasets: [
      {
        label: 'Average Response Time (ms)',
        data: metrics.response_times?.data || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  }

  const requestVolumeChartData = {
    labels: metrics.request_volume?.labels || [],
    datasets: [
      {
        label: 'Requests per Hour',
        data: metrics.request_volume?.data || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  }

  const errorRateChartData = {
    labels: ['Success', 'Client Errors', 'Server Errors'],
    datasets: [
      {
        data: [
          metrics.success_rate || 0,
          metrics.client_error_rate || 0,
          metrics.server_error_rate || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  const getHealthStatus = (value, thresholds) => {
    if (value < thresholds.good) return { status: 'good', color: 'success', icon: CheckCircleIcon }
    if (value < thresholds.warning) return { status: 'warning', color: 'warning', icon: WarningIcon }
    return { status: 'critical', color: 'error', icon: ErrorIcon }
  }

  if (loading && !metrics.response_times) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Performance Dashboard</Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Performance Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeMonitoring}
                onChange={(e) => setRealTimeMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={fetchMetrics} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Response Time</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics.avg_response_time || 0}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average response time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <NetworkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Requests/Hour</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics.requests_per_hour || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current request volume
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {systemHealth.memory_usage || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemHealth.memory_usage || 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Cache Hit Rate</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {(clientMetrics.cache.hitRate * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cache efficiency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={responseTimeChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Response Time (ms)'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Volume
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={requestVolumeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Requests'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Rate and System Health */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut 
                  data={errorRateChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(systemHealth).map(([key, value]) => {
                  const health = getHealthStatus(value, { good: 70, warning: 85 })
                  const HealthIcon = health.icon
                  
                  return (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <HealthIcon color={health.color} sx={{ mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={value} 
                          color={health.color}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Chip 
                        label={`${value}%`} 
                        color={health.color} 
                        size="small" 
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Slow Queries Table */}
      {metrics.slow_queries && metrics.slow_queries.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Slow Queries
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Query</TableCell>
                    <TableCell align="right">Duration (ms)</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.slow_queries.map((query, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {query.sql.substring(0, 100)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={query.duration}
                          color={query.duration > 1000 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{query.count}</TableCell>
                      <TableCell>{new Date(query.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
