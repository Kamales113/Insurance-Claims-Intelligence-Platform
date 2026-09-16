import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_customer_authorization(client: AsyncClient):
    # Log in as customer
    cust_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    cust_token = cust_login.json()["token"]

    # Customer can access /customers/me
    me_resp = await client.get(
        "/api/v1/customers/me", headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["id"] == "cust_001"

    # Customer CANNOT list all customers (/customers) -> should return 403
    all_resp = await client.get(
        "/api/v1/customers", headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert all_resp.status_code == 403


@pytest.mark.asyncio
async def test_agent_customer_access(client: AsyncClient):
    # Log in as agent
    agent_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    agent_token = agent_login.json()["token"]

    # Agent CAN list all customers
    all_resp = await client.get(
        "/api/v1/customers", headers={"Authorization": f"Bearer {agent_token}"}
    )
    assert all_resp.status_code == 200
    customers = all_resp.json()
    assert len(customers) >= 3
