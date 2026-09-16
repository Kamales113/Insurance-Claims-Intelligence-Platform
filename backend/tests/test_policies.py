import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_policy_listing(client: AsyncClient):
    # Customer login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    token = login_resp.json()["token"]

    resp = await client.get(
        "/api/v1/policies", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    policies = resp.json()
    assert len(policies) == 3
    assert policies[0]["policyNumber"] == "POL-AUTO-8821"
