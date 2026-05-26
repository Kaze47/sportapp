"""PlayPal Backend API regression tests.

Covers: health, auth (mock OTP), users/profile/sports/history,
matches list/filter/detail/join/create, teams list/detail/create,
chats list/filter/detail, messages (text + poll), contacts, discovery.
"""
import os
import re
import uuid
import pytest
import requests
from datetime import datetime, timedelta, timezone


BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://court-connect-118.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _has_id_leak(obj):
    """Recursively check for `_id` key anywhere in payload."""
    if isinstance(obj, dict):
        if "_id" in obj:
            return True
        return any(_has_id_leak(v) for v in obj.values())
    if isinstance(obj, list):
        return any(_has_id_leak(v) for v in obj)
    return False


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def fresh_phone():
    # Unique phone per test session so first verify produces is_new:true
    return f"+1555{uuid.uuid4().int % 10_000_000:07d}"


@pytest.fixture(scope="session")
def auth_user(s, fresh_phone):
    s.post(f"{API}/auth/request-otp", json={"phone": fresh_phone})
    r = s.post(f"{API}/auth/verify-otp", json={"phone": fresh_phone, "code": "123456"})
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Health ----------
class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert "PlayPal" in data.get("message", "")
        assert "time" in data


# ---------- Auth ----------
class TestAuth:
    def test_request_otp_ok(self, s, fresh_phone):
        r = s.post(f"{API}/auth/request-otp", json={"phone": fresh_phone})
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert d["mock_code"] == "123456"

    def test_verify_otp_new_then_existing(self, s):
        phone = f"+1555{uuid.uuid4().int % 10_000_000:07d}"
        s.post(f"{API}/auth/request-otp", json={"phone": phone})
        r1 = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "code": "654321"})
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["is_new"] is True
        assert "user" in d1 and "id" in d1["user"]
        assert d1["token"].startswith("mock-token-")
        assert not _has_id_leak(d1)

        r2 = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "code": "111111"})
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["is_new"] is False
        assert d2["user"]["id"] == d1["user"]["id"]

    def test_verify_otp_invalid_code(self, s, fresh_phone):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": fresh_phone, "code": "12"})
        assert r.status_code == 400
        r2 = s.post(f"{API}/auth/verify-otp", json={"phone": fresh_phone, "code": "abcdef"})
        assert r2.status_code == 400


# ---------- Users ----------
class TestUsers:
    def test_profile_update(self, s, auth_user):
        uid = auth_user["user"]["id"]
        payload = {
            "user_id": uid,
            "name": "TEST_Player",
            "age": 28,
            "location": "Brooklyn, NY",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        }
        r = s.post(f"{API}/users/profile", json=payload)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["name"] == "TEST_Player"
        assert u["age"] == 28
        assert not _has_id_leak(u)

        # GET verify persistence
        g = s.get(f"{API}/users/{uid}")
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_Player"

    def test_sports_update_sets_onboarded(self, s, auth_user):
        uid = auth_user["user"]["id"]
        r = s.post(f"{API}/users/sports", json={
            "user_id": uid,
            "preferences": [
                {"sport": "football", "skill": "Intermediate"},
                {"sport": "tennis", "skill": "Beginner"},
            ],
        })
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["onboarded"] is True
        assert len(u["sports"]) == 2
        assert not _has_id_leak(u)

    def test_get_user_404(self, s):
        r = s.get(f"{API}/users/{uuid.uuid4()}")
        assert r.status_code == 404

    def test_user_history(self, s):
        # Use seeded user id from contacts
        users = s.get(f"{API}/contacts/suggested").json()
        assert len(users) > 0
        uid = users[0]["id"]
        r = s.get(f"{API}/users/{uid}/history")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert not _has_id_leak(data)
        # All entries should be played
        for m in data:
            assert m["status"] == "played"


# ---------- Matches ----------
class TestMatches:
    def test_list_matches(self, s):
        r = s.get(f"{API}/matches")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 14, f"Expected >=14 upcoming matches, got {len(data)}"
        for m in data:
            assert m["status"] != "played"
        assert not _has_id_leak(data)

    def test_filter_by_sport(self, s):
        r = s.get(f"{API}/matches", params={"sport": "football"})
        assert r.status_code == 200
        data = r.json()
        for m in data:
            assert m["sport"] == "football"

    def test_filter_when_today(self, s):
        r = s.get(f"{API}/matches", params={"when": "today"})
        assert r.status_code == 200
        today = datetime.now(timezone.utc).date()
        for m in r.json():
            assert datetime.fromisoformat(m["starts_at"]).date() == today

    def test_match_detail_and_join_idempotent(self, s, auth_user):
        uid = auth_user["user"]["id"]
        matches = s.get(f"{API}/matches").json()
        target = next((m for m in matches if len(m["players"]) < m["max_players"]), None)
        assert target is not None, "no joinable match in seed"
        mid = target["id"]

        d = s.get(f"{API}/matches/{mid}")
        assert d.status_code == 200
        assert d.json()["id"] == mid

        j1 = s.post(f"{API}/matches/{mid}/join", json={"user_id": uid})
        assert j1.status_code == 200, j1.text
        m1 = j1.json()
        assert uid in m1["players"]
        count_after_first = m1["players"].count(uid)

        j2 = s.post(f"{API}/matches/{mid}/join", json={"user_id": uid})
        assert j2.status_code == 200
        m2 = j2.json()
        assert m2["players"].count(uid) == count_after_first, "Join is not idempotent"

    def test_create_match(self, s, auth_user):
        uid = auth_user["user"]["id"]
        starts = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        payload = {
            "user_id": uid,
            "sport": "Football",
            "title": "TEST_Match",
            "location_label": "TEST Field",
            "latitude": 40.6782,
            "longitude": -73.9442,
            "starts_at": starts,
            "team_size": 5,
            "skill": "Intermediate",
        }
        r = s.post(f"{API}/matches", json=payload)
        assert r.status_code == 200, r.text
        m = r.json()
        assert m["sport"] == "football"
        assert m["host_id"] == uid
        assert uid in m["players"]
        assert m["max_players"] == 10
        assert not _has_id_leak(m)
        # GET to verify persistence
        g = s.get(f"{API}/matches/{m['id']}")
        assert g.status_code == 200
        assert g.json()["title"] == "TEST_Match"


# ---------- Teams ----------
class TestTeams:
    def test_list_teams(self, s):
        r = s.get(f"{API}/teams")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 3
        assert not _has_id_leak(data)

    def test_team_detail_populated(self, s):
        teams = s.get(f"{API}/teams").json()
        tid = teams[0]["id"]
        r = s.get(f"{API}/teams/{tid}")
        assert r.status_code == 200
        t = r.json()
        assert "roster" in t and isinstance(t["roster"], list)
        assert len(t["roster"]) > 0
        assert "upcoming_matches" in t and isinstance(t["upcoming_matches"], list)
        assert not _has_id_leak(t)

    def test_create_team(self, s, auth_user):
        uid = auth_user["user"]["id"]
        r = s.post(f"{API}/teams", json={
            "user_id": uid,
            "name": "TEST_Squad",
            "sport": "Basketball",
            "location": "Brooklyn",
            "skill": "Amateur",
        })
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["captain_id"] == uid
        assert uid in t["member_ids"]
        assert t["sport"] == "basketball"
        assert not _has_id_leak(t)


# ---------- Chats ----------
class TestChats:
    def test_list_requires_user_id(self, s):
        r = s.get(f"{API}/chats")
        assert r.status_code in (400, 422)

    def test_list_for_seeded_user(self, s):
        users = s.get(f"{API}/contacts/suggested").json()
        # Find a user that is a member of any chat — first seeded user is captain of team 0
        captain = users[0]["id"]
        r = s.get(f"{API}/chats", params={"user_id": captain})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert not _has_id_leak(data)
        # captain should belong to team chat
        assert any(c["kind"] == "team" for c in data), "captain should have a team chat"

    def test_list_filter_kind_team(self, s):
        users = s.get(f"{API}/contacts/suggested").json()
        captain = users[0]["id"]
        r = s.get(f"{API}/chats", params={"user_id": captain, "kind": "team"})
        assert r.status_code == 200
        for c in r.json():
            assert c["kind"] == "team"

    def test_chat_detail_with_messages(self, s):
        users = s.get(f"{API}/contacts/suggested").json()
        captain = users[0]["id"]
        chats = s.get(f"{API}/chats", params={"user_id": captain, "kind": "team"}).json()
        assert chats, "no team chats for captain"
        cid = chats[0]["id"]
        r = s.get(f"{API}/chats/{cid}")
        assert r.status_code == 200
        chat = r.json()
        assert "messages" in chat and isinstance(chat["messages"], list)
        assert not _has_id_leak(chat)

    def test_send_text_message(self, s, auth_user):
        users = s.get(f"{API}/contacts/suggested").json()
        captain = users[0]["id"]
        chats = s.get(f"{API}/chats", params={"user_id": captain}).json()
        cid = chats[0]["id"]
        r = s.post(f"{API}/chats/{cid}/messages", json={
            "user_id": auth_user["user"]["id"],
            "text": "TEST_hello",
        })
        assert r.status_code == 200, r.text
        msg = r.json()
        assert msg["text"] == "TEST_hello"
        assert msg["kind"] == "text"
        # Verify persisted via GET chat
        chat = s.get(f"{API}/chats/{cid}").json()
        assert any(m["id"] == msg["id"] for m in chat["messages"])

    def test_send_poll_message(self, s, auth_user):
        users = s.get(f"{API}/contacts/suggested").json()
        captain = users[0]["id"]
        chats = s.get(f"{API}/chats", params={"user_id": captain}).json()
        cid = chats[0]["id"]
        r = s.post(f"{API}/chats/{cid}/messages", json={
            "user_id": auth_user["user"]["id"],
            "text": "TEST_poll?",
            "kind": "poll",
            "poll_options": ["Yes", "No", "Maybe"],
        })
        assert r.status_code == 200, r.text
        msg = r.json()
        assert msg["kind"] == "poll"
        assert msg["poll_options"] == ["Yes", "No", "Maybe"]


# ---------- Contacts / Discovery ----------
class TestContactsDiscovery:
    def test_contacts_suggested(self, s):
        r = s.get(f"{API}/contacts/suggested")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert 1 <= len(data) <= 20
        for u in data:
            assert u["name"] is not None
        assert not _has_id_leak(data)

    def test_discovery_try_new(self, s):
        r = s.get(f"{API}/discovery/try-new")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        assert all("title" in d and "sport" in d for d in data)

    def test_discovery_competitions(self, s):
        r = s.get(f"{API}/discovery/competitions")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1
        assert all("title" in d and "prize" in d for d in data)


# ---------- Global _id leak sweep ----------
class TestNoIdLeak:
    @pytest.mark.parametrize("path", [
        "/matches", "/teams", "/contacts/suggested",
        "/discovery/try-new", "/discovery/competitions",
    ])
    def test_no_id_leak_list_endpoints(self, s, path):
        r = s.get(f"{API}{path}")
        assert r.status_code == 200
        assert not _has_id_leak(r.json()), f"_id leaked in {path}"
