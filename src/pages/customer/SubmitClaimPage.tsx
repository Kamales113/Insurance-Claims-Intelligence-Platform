import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LoaderCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { submitClaim } from '@/services/claimsService'
import { getCurrentCustomer } from '@/services/customerService'
import { getPoliciesByCustomerId } from '@/services/policyService'
import type { Customer, Policy } from '@/types'

export default function SubmitClaimPage() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const activeCustomer = await getCurrentCustomer()
      setCustomer(activeCustomer)
      if (activeCustomer) setPolicies(await getPoliciesByCustomerId(activeCustomer.id))
    })()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!customer) return
    setError(null)
    const data = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      const claim = await submitClaim({
        customerId: customer.id,
        policyId: String(data.get('policyId')),
        incidentDate: String(data.get('incidentDate')),
        description: String(data.get('description')),
        claimAmount: Number(data.get('claimAmount')),
      })
      navigate(`/customer/claims/${claim.id}`, { replace: true })
    } catch (_err) {
      setError('Unable to submit your claim. Please check your incident details and try again.')
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
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.type} · {policy.policyNumber}
                  </option>
                ))}
              </select>
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
              <Button
                type="submit"
                disabled={submitting || !customer || policies.length === 0}
              >
                {submitting && <LoaderCircle className="size-4 animate-spin mr-2" />}
                {submitting ? 'Submitting…' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
