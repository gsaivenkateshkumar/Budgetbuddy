import pytest


def _register_and_token(client, email="founder@example.com"):
    response = client.post(
        "/auth/register",
        json={"email": email, "password": "correct-horse", "turnstile_token": "test-token"},
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_business(client, token, **overrides):
    payload = {
        "name": "Cloud Kitchen",
        "description": "A cloud kitchen serving regional food to office workers nearby.",
        "startup_budget": "80000",
        "delivery_mode": "online",
        "target_customer": "Office workers who want quick home-style lunch delivery.",
        "time_commitment": "full-time",
    }
    payload.update(overrides)
    return client.post("/businesses", json=payload, headers=_auth_headers(token))


@pytest.fixture()
def token(client):
    return _register_and_token(client)


def test_create_business_requires_authentication(client):
    response = client.post("/businesses", json={"name": "Solo idea"})
    assert response.status_code == 401


def test_create_and_get_business(client, token):
    created = _create_business(client, token)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Cloud Kitchen"
    assert body["stage"] == "idea"

    fetched = client.get(f"/businesses/{body['id']}", headers=_auth_headers(token))
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


def test_list_businesses_only_returns_own(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    _create_business(client, token_a, name="Alice's Bakery")
    _create_business(client, token_b, name="Bob's Bikes")

    response = client.get("/businesses", headers=_auth_headers(token_a))

    assert response.status_code == 200
    names = [b["name"] for b in response.json()]
    assert names == ["Alice's Bakery"]


def test_cross_user_business_access_returns_404(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()

    response = client.get(f"/businesses/{business['id']}", headers=_auth_headers(token_b))

    assert response.status_code == 404


def test_cross_user_cannot_update_business(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()

    response = client.patch(
        f"/businesses/{business['id']}", json={"name": "Hijacked"}, headers=_auth_headers(token_b)
    )

    assert response.status_code == 404


def test_update_business(client, token):
    business = _create_business(client, token).json()

    response = client.patch(
        f"/businesses/{business['id']}", json={"stage": "planning"}, headers=_auth_headers(token)
    )

    assert response.status_code == 200
    assert response.json()["stage"] == "planning"


def test_validate_business_creates_structured_report(client, token):
    business = _create_business(client, token).json()

    response = client.post(f"/businesses/{business['id']}/validate", headers=_auth_headers(token))

    assert response.status_code == 201
    body = response.json()
    assert 0 <= body["scores"]["total"] <= 100
    assert body["confidence"] in ("Low", "Medium", "High")
    assert body["sections"]["business_summary"]

    latest = client.get(f"/businesses/{business['id']}/validation", headers=_auth_headers(token))
    assert latest.status_code == 200
    assert latest.json()["id"] == body["id"]

    # Stage advances from idea -> validation after a first validation run.
    project = client.get(f"/businesses/{business['id']}", headers=_auth_headers(token)).json()
    assert project["stage"] == "validation"


def test_validation_not_found_before_first_run(client, token):
    business = _create_business(client, token).json()

    response = client.get(f"/businesses/{business['id']}/validation", headers=_auth_headers(token))

    assert response.status_code == 404


def test_cross_user_cannot_validate_others_business(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()

    response = client.post(f"/businesses/{business['id']}/validate", headers=_auth_headers(token_b))

    assert response.status_code == 404


def test_budget_put_and_get_roundtrip(client, token):
    business = _create_business(client, token).json()

    put_response = client.put(
        f"/businesses/{business['id']}/budget",
        json={"items": [{"category": "Equipment", "amount": "25000"}, {"category": "Marketing", "amount": "8000"}]},
        headers=_auth_headers(token),
    )
    assert put_response.status_code == 200
    assert put_response.json()["total"] == "33000.00"

    get_response = client.get(f"/businesses/{business['id']}/budget", headers=_auth_headers(token))
    assert get_response.status_code == 200
    assert len(get_response.json()["items"]) == 2
    assert get_response.json()["total"] == "33000.00"


def test_budget_put_replaces_previous_items(client, token):
    business = _create_business(client, token).json()
    client.put(
        f"/businesses/{business['id']}/budget",
        json={"items": [{"category": "Equipment", "amount": "25000"}]},
        headers=_auth_headers(token),
    )

    response = client.put(
        f"/businesses/{business['id']}/budget",
        json={"items": [{"category": "Marketing", "amount": "8000"}]},
        headers=_auth_headers(token),
    )

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["category"] == "Marketing"


def test_budget_rejects_negative_amount(client, token):
    business = _create_business(client, token).json()

    response = client.put(
        f"/businesses/{business['id']}/budget",
        json={"items": [{"category": "Equipment", "amount": "-1"}]},
        headers=_auth_headers(token),
    )

    assert response.status_code == 422


def test_cross_user_cannot_read_others_budget(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()
    client.put(
        f"/businesses/{business['id']}/budget",
        json={"items": [{"category": "Equipment", "amount": "25000"}]},
        headers=_auth_headers(token_a),
    )

    response = client.get(f"/businesses/{business['id']}/budget", headers=_auth_headers(token_b))

    assert response.status_code == 404


def test_generate_roadmap_seeds_default_tasks(client, token):
    business = _create_business(client, token).json()

    response = client.post(f"/businesses/{business['id']}/tasks/generate-roadmap", headers=_auth_headers(token))

    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) > 0
    assert all(t["status"] == "pending" for t in tasks)


def test_generate_roadmap_twice_conflicts(client, token):
    business = _create_business(client, token).json()
    client.post(f"/businesses/{business['id']}/tasks/generate-roadmap", headers=_auth_headers(token))

    response = client.post(f"/businesses/{business['id']}/tasks/generate-roadmap", headers=_auth_headers(token))

    assert response.status_code == 409


def test_create_and_complete_task(client, token):
    business = _create_business(client, token).json()
    created = client.post(
        f"/businesses/{business['id']}/tasks", json={"title": "Talk to customers"}, headers=_auth_headers(token)
    )
    assert created.status_code == 201
    task_id = created.json()["id"]

    updated = client.patch(
        f"/businesses/{business['id']}/tasks/{task_id}",
        json={"status": "completed"},
        headers=_auth_headers(token),
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "completed"

    listed = client.get(f"/businesses/{business['id']}/tasks", headers=_auth_headers(token))
    assert listed.json()[0]["status"] == "completed"


def test_cross_user_cannot_update_others_task(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()
    task = client.post(
        f"/businesses/{business['id']}/tasks", json={"title": "Talk to customers"}, headers=_auth_headers(token_a)
    ).json()

    response = client.patch(
        f"/businesses/{business['id']}/tasks/{task['id']}",
        json={"status": "completed"},
        headers=_auth_headers(token_b),
    )

    assert response.status_code == 404


def test_financial_entries_and_summary(client, token):
    business = _create_business(client, token).json()

    client.post(
        f"/businesses/{business['id']}/financials",
        json={"type": "revenue", "amount": "15000", "category": "Sales", "entry_date": "2026-01-15"},
        headers=_auth_headers(token),
    )
    client.post(
        f"/businesses/{business['id']}/financials",
        json={"type": "expense", "amount": "4000", "category": "Ingredients", "entry_date": "2026-01-16"},
        headers=_auth_headers(token),
    )
    client.post(
        f"/businesses/{business['id']}/financials",
        json={"type": "expense", "amount": "1000", "category": "Delivery", "entry_date": "2026-01-17"},
        headers=_auth_headers(token),
    )

    summary = client.get(f"/businesses/{business['id']}/financials/summary", headers=_auth_headers(token))

    assert summary.status_code == 200
    body = summary.json()
    assert body["total_revenue"] == "15000.00"
    assert body["total_expenses"] == "5000.00"
    assert body["net_result"] == "10000.00"
    assert body["entry_count"] == 3
    assert len(body["expense_breakdown"]) == 2


def test_financial_summary_empty_business_is_honest_zero(client, token):
    business = _create_business(client, token).json()

    summary = client.get(f"/businesses/{business['id']}/financials/summary", headers=_auth_headers(token))

    assert summary.status_code == 200
    body = summary.json()
    assert body["total_revenue"] == "0.00"
    assert body["total_expenses"] == "0.00"
    assert body["net_result"] == "0.00"
    assert body["entry_count"] == 0
    assert body["expense_breakdown"] == []


def test_financial_entry_rejects_zero_amount(client, token):
    business = _create_business(client, token).json()

    response = client.post(
        f"/businesses/{business['id']}/financials",
        json={"type": "revenue", "amount": "0", "entry_date": "2026-01-15"},
        headers=_auth_headers(token),
    )

    assert response.status_code == 422


def test_cross_user_cannot_read_others_financials(client):
    token_a = _register_and_token(client, "alice@example.com")
    token_b = _register_and_token(client, "bob@example.com")
    business = _create_business(client, token_a).json()

    response = client.get(f"/businesses/{business['id']}/financials/summary", headers=_auth_headers(token_b))

    assert response.status_code == 404


def test_unauthenticated_requests_rejected_for_all_business_routes(client, token):
    business = _create_business(client, token).json()
    bid = business["id"]

    assert client.get("/businesses").status_code == 401
    assert client.get(f"/businesses/{bid}").status_code == 401
    assert client.get(f"/businesses/{bid}/budget").status_code == 401
    assert client.get(f"/businesses/{bid}/tasks").status_code == 401
    assert client.get(f"/businesses/{bid}/financials").status_code == 401
    assert client.post(f"/businesses/{bid}/validate").status_code == 401
