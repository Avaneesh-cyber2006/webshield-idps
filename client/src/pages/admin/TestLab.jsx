import React, { useState, useEffect } from 'react'
import { Play, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { StatCard } from '../../components/ui/StatCard'

const TestLab = () => {
  const [testRuns, setTestRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [currentTestRun, setCurrentTestRun] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTestRuns()
  }, [])

  const fetchTestRuns = async () => {
    try {
      const response = await api.get('/test-lab/runs')
      setTestRuns(response.data.testRuns || [])
    } catch (error) {
      console.error('Failed to fetch test runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setShowReport(false)
    setError(null)

    let testRunId = null

    try {
      const createRunResponse = await api.post('/test-lab/create-run')
      testRunId = createRunResponse.data.testRun.id

      const startRunResponse = await api.post(`/test-lab/start/${testRunId}`)

      if (startRunResponse.data.testRun.status !== 'RUNNING') {
        throw new Error(`TestRun failed to start: ${startRunResponse.data.testRun.status}`)
      }

      const configResponse = await api.get('/test-lab/config')
      const testConfigs = configResponse.data.configs || []

      const results = []
      for (const config of testConfigs) {
        await api.post(`/test-lab/cleanup-block/${testRunId}`, { testId: config.testId })
        const testResults = await executeBrowserTest(config, testRunId, createRunResponse.data.testRun.token)
        results.push(...testResults)

        const isAttackTest = config.expectedType === 'ATTACK'
        const isIpsMode = createRunResponse.data.testRun.mode === 'IPS'

        if (isAttackTest && isIpsMode && testRunId) {
          try {
            const cleanupResponse = await api.post(`/test-lab/cleanup-block/${testRunId}`, { testId: config.testId })
            if (cleanupResponse.data.testRunStatus !== 'RUNNING') {
              throw new Error('Per-test cleanup should keep TestRun in RUNNING state')
            }
          } catch (cleanupError) {
            console.error(`Per-test cleanup failed for ${config.testId}:`, cleanupError)
            throw cleanupError
          }
        }
      }

      const submitResponse = await api.post('/test-lab/submit', {
        testRunId,
        results,
      })

      setCurrentTestRun(submitResponse.data.testRun)
      setShowReport(true)
      fetchTestRuns()

      if (testRunId) {
        try {
          await api.post(`/test-lab/cleanup/${testRunId}`)
        } catch (cleanupError) {
          console.error('Final cleanup failed:', cleanupError)
          setCurrentTestRun((previous) => ({
            ...previous,
            cleanupFailed: true,
            cleanupError: cleanupError.response?.data?.message || cleanupError.message,
          }))
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Test suite failed')
      console.error('Test suite failed:', err)

      if (testRunId) {
        try {
          await api.post(`/test-lab/cleanup/${testRunId}`)
        } catch (cleanupError) {
          console.error('Cleanup after failure failed:', cleanupError)
        }
      }
    } finally {
      setRunning(false)
    }
  }

  const executeBrowserTest = async (config, testRunId, runToken) => {
    const { testId, endpoint, method, headers, repeatCount } = config
    const payload = testId === 'normal_login' ? { email: testEmail, password: testPassword } : config.payload
    const results = []

    if (testId === 'suspicious_user_agent' || (testId === 'normal_login' && (!testEmail || !testPassword))) {
      return [
        {
          testId,
          httpStatus: 0,
          requestId: null,
          success: false,
          error:
            testId === 'suspicious_user_agent'
              ? 'Browsers control User-Agent. Run this probe with an HTTP client.'
              : 'Provide a demo user email and password to test login.',
        },
      ]
    }

    for (let i = 0; i < repeatCount; i++) {
      try {
        const url = endpoint
        const isAuthTest = endpoint.includes('/auth/login')
        const useCredentials = !isAuthTest

        let response
        if (method === 'GET') {
          const queryParams = new URLSearchParams(payload).toString()
          response = await fetch(`${url}?${queryParams}`, {
            cache: 'no-store',
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Run-ID': testRunId,
              'X-Test-Run-Token': runToken,
              ...headers,
            },
            credentials: useCredentials ? 'include' : 'omit',
          })
        } else {
          response = await fetch(url, {
            cache: 'no-store',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Run-ID': testRunId,
              'X-Test-Run-Token': runToken,
              ...headers,
            },
            credentials: useCredentials ? 'include' : 'omit',
            body: JSON.stringify(payload),
          })
        }

        const requestId = response.headers.get('X-Request-ID')
        await response.json()

        results.push({
          testId,
          httpStatus: response.status,
          requestId,
          success: response.ok,
          error: null,
        })
      } catch (error) {
        results.push({
          testId,
          httpStatus: 0,
          requestId: null,
          success: false,
          error: error.message,
        })
      }
    }

    return results
  }

  if (loading) {
    return <LoadingState message="Loading test lab…" />
  }

  const metrics = currentTestRun?.metrics || {}
  const results = currentTestRun?.results || []

  return (
    <div>
      <PageHeader
        title="Security Test Lab"
        subtitle="Run browser-originated security probes and review detection & prevention results"
        actions={
          <Button
            onClick={runAllTests}
            disabled={running || error}
            iconLeft={<Play className="w-4 h-4" />}
          >
            {running ? 'Running…' : 'Run All Tests'}
          </Button>
        }
      />

      {error && (
        <ErrorState
          title="Test suite failed"
          message={error}
          onRetry={runAllTests}
          className="mb-6"
        />
      )}

      <Section title="Test Credentials (Optional)">
        <p className="text-sm text-base-400 mb-3">
          Demo user credentials for the real login probe. The browser cannot run the User-Agent probe;
          it will be reported as unevaluated.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <input
            aria-label="Test user email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Test user email"
            className="flex-1 min-w-[200px] bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          <input
            aria-label="Test user password"
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="Test user password"
            className="flex-1 min-w-[200px] bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
        </div>
      </Section>

      {showReport && currentTestRun && (
        <>
          <Section title="Test Report">
            <div className="bg-base-800 border border-base-600 rounded-lg p-5 mb-6">
              {currentTestRun.cleanupFailed && (
                <div className="mb-4 p-3 rounded-lg bg-severity-critical/10 border border-severity-critical/20">
                  <div className="flex items-center gap-2 text-sm text-severity-critical mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Cleanup Failed</span>
                  </div>
                  <div className="text-xs text-severity-critical/80">
                    {currentTestRun.cleanupError}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard label="Total Tests" value={results.length} variant="accent" />
                <StatCard label="Passed" value={metrics.passed ?? 0} variant="success" />
                <StatCard label="Failed" value={metrics.failed ?? 0} variant="danger" />
                <StatCard
                  label="Overall Status"
                  value={
                    metrics.failed === 0
                      ? 'PASS'
                      : metrics.failed === metrics.unevaluated
                        ? 'INCOMPLETE'
                        : 'FAIL'
                  }
                  variant={metrics.failed === 0 ? 'success' : 'danger'}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard label="True Positive" value={metrics.truePositive ?? 0} />
                <StatCard label="True Negative" value={metrics.trueNegative ?? 0} />
                <StatCard label="False Positive" value={metrics.falsePositive ?? 0} variant="danger" />
                <StatCard label="False Negative" value={metrics.falseNegative ?? 0} variant="danger" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Accuracy" value={`${(metrics.accuracy ?? 0).toFixed(1)}%`} />
                <StatCard label="Precision" value={`${(metrics.precision ?? 0).toFixed(1)}%`} />
                <StatCard label="Recall" value={`${(metrics.recall ?? 0).toFixed(1)}%`} />
                <StatCard label="F1 Score" value={`${(metrics.f1Score ?? 0).toFixed(1)}%`} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <StatCard
                  label="Execution Errors"
                  value={metrics.executionErrors ?? 0}
                  variant={metrics.executionErrors > 0 ? 'danger' : 'success'}
                />
                <StatCard
                  label="Unevaluated"
                  value={metrics.unevaluated ?? 0}
                  variant={metrics.unevaluated > 0 ? 'danger' : 'success'}
                />
              </div>
            </div>
          </Section>

          <Section title="Test Results">
            {results.length === 0 ? (
              <EmptyState title="No results" description="Run the test suite to generate results." />
            ) : (
              <Table
                columns={[
                  { key: 'test', label: 'Test', align: 'left' },
                  { key: 'expected', label: 'Expected', align: 'center' },
                  { key: 'expectedAction', label: 'Expected Action', align: 'left' },
                  { key: 'actual', label: 'Actual', align: 'center' },
                  { key: 'actualAction', label: 'Actual Action', align: 'left' },
                  { key: 'detector', label: 'Detector', align: 'left' },
                  { key: 'detection', label: 'Detection', align: 'center' },
                  { key: 'prevention', label: 'Prevention', align: 'center' },
                  { key: 'risk', label: 'Risk Score', align: 'center' },
                  { key: 'result', label: 'Result', align: 'center' },
                ].map((col) => ({
                  ...col,
                  render: (row) => {
                    if (col.key === 'test') {
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base-300">{row.testName}</span>
                          {row.evidence?.errorMessage && (
                            <span className="text-[0.65rem] text-base-500">{row.evidence.errorMessage}</span>
                          )}
                        </div>
                      )
                    }
                    if (col.key === 'expected') {
                      return (
                        <Badge
                          variant="severity"
                          severity={
                            row.expectedType === 'ATTACK' ? 'critical' : 'low'
                          }
                        >
                          {row.expectedType}
                        </Badge>
                      )
                    }
                    if (col.key === 'expectedAction' || col.key === 'actualAction') {
                      return <span className="text-xs text-base-400">{row[col.key]}</span>
                    }
                    if (col.key === 'actual') {
                      return (
                        <Badge
                          variant="severity"
                          severity={
                            row.actualType === 'ATTACK' ? 'critical' : 'low'
                          }
                        >
                          {row.actualType}
                        </Badge>
                      )
                    }
                    if (col.key === 'detector') {
                      return (
                        <span className="text-xs text-base-400 font-mono">
                          {row.evidence?.actualDetectors?.join(', ') || '—'}
                        </span>
                      )
                    }
                    if (col.key === 'detection' || col.key === 'prevention') {
                      const passed = col.key === 'detection' ? row.detectionSucceeded : row.preventionSucceeded
                      return (
                        <Badge
                          variant="severity"
                          severity={passed ? 'low' : 'critical'}
                        >
                          {passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      )
                    }
                    if (col.key === 'risk') {
                      return (
                        <span className="text-xs font-mono text-base-300">
                          {row.riskScore ?? '—'}
                        </span>
                      )
                    }
                    if (col.key === 'result') {
                      return (
                        <Badge
                          variant="severity"
                          severity={row.passed ? 'low' : 'critical'}
                        >
                          {row.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      )
                    }
                    return row[col.key]
                  },
                }))}
                data={results}
                rowKey="testId"
              />
            )}
          </Section>

          <Section title="Test Run History">
            {testRuns.length === 0 ? (
              <EmptyState title="No test runs" description="Completed test runs will appear here." />
            ) : (
              <div className="space-y-2">
                {testRuns.slice(0, 5).map((run) => (
                  <div
                    key={run.id}
                    className="bg-base-800 border border-base-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-base-300">
                          {new Date(run.startedAt).toLocaleString()}
                        </div>
                        <div className="text-xs text-base-500">
                          {run.passed}/{run.totalTests} tests passed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-accent-400">
                          Accuracy: {run.accuracy?.toFixed(1)}%
                        </div>
                        <div className="text-xs text-base-500">
                          F1 Score: {run.f1Score?.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

export default TestLab
