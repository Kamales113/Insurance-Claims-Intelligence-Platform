import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_claim_lifecycle(client: AsyncClient):
    # 1. Customer login
    cust_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    cust_token = cust_login.json()["token"]

    # 2. Submit new claim
    new_claim_payload = {
        "policyId": "pol_001",
        "incidentDate": "2026-09-01",
        "description": "Fender bender while parallel parking on Main Street.",
        "claimAmount": 1500.00,
    }

    create_resp = await client.post(
        "/api/v1/claims",
        json=new_claim_payload,
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert create_resp.status_code == 201
    claim_data = create_resp.json()
    claim_id = claim_data["id"]
    assert claim_data["status"] == "SUBMITTED"
    assert claim_data["claimAmount"] == 1500.00

    # 3. Check history was created
    history_resp = await client.get(
        f"/api/v1/claims/{claim_id}/history",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 1
    assert history[0]["status"] == "SUBMITTED"

    # 4. Agent login
    agent_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    agent_token = agent_login.json()["token"]

    # 5. Agent updates claim status to UNDER_INVESTIGATION
    update_resp = await client.patch(
        f"/api/v1/claims/{claim_id}/status",
        json={
            "status": "UNDER_INVESTIGATION",
            "notes": "Assigned to field adjuster for inspection.",
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert update_resp.status_code == 200
    updated_claim = update_resp.json()
    assert updated_claim["status"] == "UNDER_INVESTIGATION"

    # 6. Verify history updated with 2 records
    history_resp2 = await client.get(
        f"/api/v1/claims/{claim_id}/history",
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert history_resp2.status_code == 200
    history2 = history_resp2.json()
    assert len(history2) == 2
    assert history2[1]["status"] == "UNDER_INVESTIGATION"
    assert history2[1]["notes"] == "Assigned to field adjuster for inspection."
