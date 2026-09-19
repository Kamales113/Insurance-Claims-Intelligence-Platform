import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, LoaderCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { submitClaim } from '@/services/claimsService'
import { getCurrentCustomerPolicies } from '@/services/policyService'
import { ApiError } from '@/services/api'
import type { Policy } from '@/types'

export default function SubmitClaimPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const policiesQuery = useQuery({
    queryKey: ['policies', 'customer'],
    queryFn: getCurrentCustomerPolicies,
  })

  const policies = policiesQuery.data ?? []

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const data = new FormData(event.currentTarget)
    const policyId = String(data.get('policyId') ?? '')
    const incidentDate = String(data.get('incidentDate') ?? '')
    const description = String(data.get('description') ?? '').trim()
    const claimAmountStr = String(data.get('claimAmount') ?? '')
    const claimAmount = parseFloat(claimAmountStr)

    if (!policyId) {
      setError('Please select a valid policy.')
      return
    }
    if (!incidentDate) {
      setError('Please select a valid incident date.')
      return
    }
    if (!description || description.length < 20) {
      setError('Description must be at least 20 characters long.')
      return
    }
    if (isNaN(claimAmount) || claimAmount <= 0) {
      setError('Please enter a valid positive claim amount.')
      return
    }

    setSubmitting(true)
    try {
      const newClaim = await submitClaim({
        policyId,
        incidentDate,
        description,
        claimAmount,
      })
      await queryClient.invalidateQueries({ queryKey: ['claims', 'customer'] })
      navigate(`/customer/claims/${newClaim.id}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to submit your claim. Please check your incident details and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Claim"
        description="Provide the incident details. You can track review progress after submission."
      />
      <Card>
        <CardContent className="max-w-2xl p-6">
          {policiesQuery.isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="policyId" className="text-sm font-medium">
                  Policy
                </label>
                <select
                  id="policyId"
                  name="policyId"
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {policies.map((policy: Policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.type} · {policy.policyNumber}
                    </option>
                  ))}
                </select>
                {policies.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No active policies found for your account.
                  </p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="incidentDate" className="text-sm font-medium">
                    Incident date
                  </label>
                  <input
                    id="incidentDate"
                    name="incidentDate"
                    type="date"
                    required
                    className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="claimAmount" className="text-sm font-medium">
                    Estimated amount
                  </label>
                  <input
                    id="claimAmount"
                    name="claimAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  What happened?
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  minLength={20}
                  rows={6}
                  placeholder="Describe the incident, damage or treatment, and any relevant circumstances."
                  className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || policies.length === 0}>
                  {submitting && <LoaderCircle className="size-4 animate-spin mr-2" />}
                  {submitting ? 'Submitting…' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

