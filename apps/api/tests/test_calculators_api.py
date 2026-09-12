def test_break_even_endpoint(client):
    response = client.post(
        "/calculators/break-even",
        json={"fixed_costs": "10000", "selling_price": "100", "variable_cost_per_unit": "50"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["break_even_units"] == "200.00"
    assert body["is_viable"] is True


def test_break_even_endpoint_rejects_negative_input(client):
    response = client.post(
        "/calculators/break-even",
        json={"fixed_costs": "-1", "selling_price": "100", "variable_cost_per_unit": "50"},
    )

    assert response.status_code == 422


def test_margin_endpoint(client):
    response = client.post(
        "/calculators/margin", json={"revenue": "1000", "cogs": "400", "operating_expenses": "200"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["gross_profit"] == "600.00"


def test_pricing_endpoint(client):
    response = client.post("/calculators/pricing", json={"cost_per_unit": "100", "desired_margin_pct": "20"})

    assert response.status_code == 200
    assert response.json()["suggested_price"] == "125.00"


def test_pricing_endpoint_rejects_full_margin(client):
    response = client.post("/calculators/pricing", json={"cost_per_unit": "100", "desired_margin_pct": "100"})

    assert response.status_code == 422


def test_what_if_endpoint(client):
    response = client.post(
        "/calculators/what-if", json={"current_monthly_profit": "42000", "additional_monthly_cost": "18000"}
    )

    assert response.status_code == 200
    assert response.json()["projected_profit"] == "24000.00"


def test_calculators_require_no_authentication(client):
    """Stateless calculators never touch user/business data — no auth
    header should be required."""
    response = client.post(
        "/calculators/break-even",
        json={"fixed_costs": "10000", "selling_price": "100", "variable_cost_per_unit": "50"},
    )
    assert response.status_code == 200
