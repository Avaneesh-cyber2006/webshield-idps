import React, { useState, useEffect } from 'react'
import { FlaskConical, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '../../services/api'

const TestLab = () => {
  const [tests, setTests] = useState([])
  const [testRuns, setTestRuns] = useState([])
  const [running, setRunning] = useState(false)
  const [currentTestRun, setCurrentTestRun] = useState(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    fetchTests()
    fetchTestRuns()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await api.get('/test-lab/tests')
      setTests(response.data.tests)
    } catch (error) {
      console.error('Failed to fetch tests:', error)
    }
  }

  const fetchTestRuns = async () => {
    try {
      const response = await api.get('/test-lab/runs')
      setTestRuns(response.data.testRuns)
    } catch (error) {
      console.error('Failed to fetch test runs:', error)
    }
  }

  const runSingleTest = async (testId) => {
    try {
      const response = await api.post(`/test-lab/run/${testId}`)
      return response.data.result
    } catch (error) {
      console.error('Test failed:', error)
      return null
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setShowReport(false)

    try {
      // Create TestRun BEFORE executing any test requests
      const createRunResponse = await api.post('/test-lab/create-run')
      const testRunId = createRunResponse.data.testRun.id

      // Fetch test configurations for browser-originated execution
      const configResponse = await api.get('/test-lab/config')
      const testConfigs = configResponse.data.configs

      // Execute tests from the browser
      const results = []
      for (const config of testConfigs) {
        const testResults = await executeBrowserTest(config, testRunId)
        // Append all individual observations (preserving repeated tests)
        results.push(...testResults)
      }

      // Submit batch results to server with testRunId
      const submitResponse = await api.post('/test-lab/submit', {
        testRunId,
        results
      })

      setCurrentTestRun(submitResponse.data.testRun)
      setShowReport(true)
      fetchTestRuns()
    } catch (error) {
      console.error('Test suite failed:', error)
      alert('Test suite failed: ' + (error.response?.data?.message || error.message))
    } finally {
      setRunning(false)
    }
  }

  const executeBrowserTest = async (config, testRunId) => {
    const { testId, endpoint, method, payload, headers, repeatCount } = config
    const results = []

    for (let i = 0; i < repeatCount; i++) {
      try {
        const url = endpoint  // Backend now returns complete API path

        // For authentication tests, omit credentials to preserve admin session
        const isAuthTest = endpoint.includes('/auth/login')
        const useCredentials = !isAuthTest

        let response
        if (method === 'GET') {
          const queryParams = new URLSearchParams(payload).toString()
          response = await fetch(`${url}?${queryParams}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Run-ID': testRunId,  // Associate request with TestRun
              ...headers
            },
            credentials: useCredentials ? 'include' : 'omit'
          })
        } else {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Run-ID': testRunId,  // Associate request with TestRun
              ...headers
            },
            credentials: useCredentials ? 'include' : 'omit',
            body: JSON.stringify(payload)
          })
        }

        const requestId = response.headers.get('X-Request-ID')
        const data = await response.json()

        // Return individual observation for each request
        results.push({
          testId,
          httpStatus: response.status,
          requestId,
          success: response.ok,
          error: null
        })
      } catch (error) {
        results.push({
          testId,
          httpStatus: 0,
          requestId: null,
          success: false,
          error: error.message
        })
      }
    }

    // Return ALL observations (preserving repeated requests)
    return results
  }

  const getExpectedBadge = (type) => {
    return type === 'ATTACK'
      ? 'bg-danger-500/10 text-danger-500 border border-danger-500'
      : 'bg-success-500/10 text-success-500 border border-success-500'
  }

  const getResultBadge = (passed) => {
    return passed
      ? 'bg-success-500/10 text-success-500 border border-success-500'
      : 'bg-danger-500/10 text-danger-500 border border-danger-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Security Test Lab</h1>
        <button
          onClick={runAllTests}
          disabled={running}
          className="bg-accent-600 hover:bg-accent-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <Play className="w-5 h-5" />
          <span>{running ? 'Running...' : 'Run All Tests'}</span>
        </button>
      </div>

      {showReport && currentTestRun && (
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">WebShield Security Test Report</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Tests" value={currentTestRun.results.length} />
            <MetricCard label="Passed" value={currentTestRun.metrics.passed} color="success" />
            <MetricCard label="Failed" value={currentTestRun.metrics.failed} color="danger" />
            <MetricCard label="Overall Status" value={currentTestRun.metrics.failed === 0 ? 'PASS' : 'FAIL'} color={currentTestRun.metrics.failed === 0 ? 'success' : 'danger'} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="True Positive" value={currentTestRun.metrics.truePositive} />
            <MetricCard label="True Negative" value={currentTestRun.metrics.trueNegative} />
            <MetricCard label="False Positive" value={currentTestRun.metrics.falsePositive} color="danger" />
            <MetricCard label="False Negative" value={currentTestRun.metrics.falseNegative} color="danger" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Accuracy" value={`${currentTestRun.metrics.accuracy.toFixed(1)}%`} />
            <MetricCard label="Precision" value={`${currentTestRun.metrics.precision.toFixed(1)}%`} />
            <MetricCard label="Recall" value={`${currentTestRun.metrics.recall.toFixed(1)}%`} />
            <MetricCard label="F1 Score" value={`${currentTestRun.metrics.f1Score.toFixed(1)}%`} />
          </div>
        </div>
      )}

      <div className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Test</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expected</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expected Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actual Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {tests.map((test) => {
              const result = currentTestRun?.results.find(r => r.testName === test.name)
              return (
                <tr key={test.id} className="hover:bg-dark-700">
                  <td className="px-4 py-3 text-sm text-white">{test.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getExpectedBadge(test.expectedType)}`}>
                      {test.expectedType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{test.expectedAction}</td>
                  <td className="px-4 py-3">
                    {result ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getExpectedBadge(result.actualType)}`}>
                        {result.actualType}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{result?.actualAction || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{result?.riskScore || '-'}</td>
                  <td className="px-4 py-3">
                    {result ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getResultBadge(result.passed)}`}>
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Test Run History</h2>
        <div className="space-y-3">
          {testRuns.slice(0, 5).map((run) => (
            <div key={run.id} className="bg-dark-700 rounded-lg p-4 border border-dark-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    {run.passed}/{run.totalTests} tests passed
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-accent-500 font-semibold">
                    Accuracy: {run.accuracy?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    F1 Score: {run.f1Score?.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({ label, value, color = 'accent' }) => {
  const colorClasses = {
    accent: 'text-accent-500',
    success: 'text-success-500',
    danger: 'text-danger-500'
  }

  return (
    <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  )
}

export default TestLab
