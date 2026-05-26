from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------- Models ----------------
class PhoneRequest(BaseModel):
    phone: str


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str


class ProfileSetupRequest(BaseModel):
    user_id: str
    name: str
    age: int
    location: str
    avatar_url: Optional[str] = None


class SportPref(BaseModel):
    sport: str
    skill: str  # Beginner | Intermediate | Advanced


class SportsPrefRequest(BaseModel):
    user_id: str
    preferences: List[SportPref]


class JoinMatchRequest(BaseModel):
    user_id: str


class CreateTeamRequest(BaseModel):
    user_id: str
    name: str
    sport: str
    location: str
    skill: str  # Casual | Amateur | Competitive
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None


class SendMessageRequest(BaseModel):
    user_id: str
    text: str
    kind: str = "text"  # text | poll | location
    poll_options: Optional[List[str]] = None


class CreateMatchRequest(BaseModel):
    user_id: str
    sport: str
    title: str
    location_label: str
    latitude: float
    longitude: float
    starts_at: str
    team_size: int = 5
    skill: str = "Intermediate"


# ---------------- Helpers ----------------
def strip_id(doc):
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return user


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "PlayPal API ready", "time": now_iso()}


@api_router.post("/auth/request-otp")
async def request_otp(payload: PhoneRequest):
    code = "123456"  # mocked OTP — any 6-digit accepted later too
    await db.otps.update_one(
        {"phone": payload.phone},
        {"$set": {"phone": payload.phone, "code": code, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "mock_code": code, "message": "OTP sent (mock). Use 123456 or any 6-digit code."}


@api_router.post("/auth/verify-otp")
async def verify_otp(payload: OTPVerifyRequest):
    if len(payload.code) != 6 or not payload.code.isdigit():
        raise HTTPException(status_code=400, detail="Code must be 6 digits")

    user = await db.users.find_one({"phone": payload.phone}, {"_id": 0})
    is_new = False
    if not user:
        is_new = True
        user = {
            "id": new_id(),
            "phone": payload.phone,
            "name": None,
            "age": None,
            "location": None,
            "avatar_url": None,
            "sports": [],
            "reputation": 5.0,
            "attendance_rate": 100,
            "matches_played": 0,
            "wins": 0,
            "losses": 0,
            "created_at": now_iso(),
            "onboarded": False,
        }
        await db.users.insert_one(user.copy())
    return {"user": strip_id(user), "is_new": is_new, "token": f"mock-token-{user['id']}"}


@api_router.post("/users/profile")
async def update_profile(payload: ProfileSetupRequest):
    res = await db.users.update_one(
        {"id": payload.user_id},
        {"$set": {
            "name": payload.name,
            "age": payload.age,
            "location": payload.location,
            "avatar_url": payload.avatar_url,
        }},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return await get_user(payload.user_id)


@api_router.post("/users/sports")
async def update_sports(payload: SportsPrefRequest):
    prefs = [p.dict() for p in payload.preferences]
    res = await db.users.update_one(
        {"id": payload.user_id},
        {"$set": {"sports": prefs, "onboarded": True}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return await get_user(payload.user_id)


@api_router.get("/users/{user_id}")
async def get_user_endpoint(user_id: str):
    user = await get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.get("/users/{user_id}/history")
async def get_user_history(user_id: str):
    matches = await db.matches.find(
        {"players": user_id, "status": "played"}, {"_id": 0}
    ).sort("starts_at", -1).to_list(50)
    return matches


# Matches
@api_router.get("/matches")
async def list_matches(sport: Optional[str] = None, when: Optional[str] = None):
    query: Dict[str, Any] = {"status": {"$ne": "played"}}
    if sport and sport.lower() != "all":
        query["sport"] = sport.lower()
    matches = await db.matches.find(query, {"_id": 0}).sort("starts_at", 1).to_list(100)
    if when == "today":
        today = datetime.now(timezone.utc).date()
        matches = [m for m in matches if datetime.fromisoformat(m["starts_at"]).date() == today]
    elif when == "tomorrow":
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
        matches = [m for m in matches if datetime.fromisoformat(m["starts_at"]).date() == tomorrow]
    return matches


@api_router.get("/matches/{match_id}")
async def get_match(match_id: str):
    m = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Match not found")
    return m


@api_router.post("/matches/{match_id}/join")
async def join_match(match_id: str, payload: JoinMatchRequest):
    m = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Match not found")
    if payload.user_id in m["players"]:
        return m
    if len(m["players"]) >= m["max_players"]:
        raise HTTPException(400, "Match is full")
    await db.matches.update_one({"id": match_id}, {"$push": {"players": payload.user_id}})
    return await db.matches.find_one({"id": match_id}, {"_id": 0})


@api_router.post("/matches")
async def create_match(payload: CreateMatchRequest):
    match = {
        "id": new_id(),
        "sport": payload.sport.lower(),
        "title": payload.title,
        "location_label": payload.location_label,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "starts_at": payload.starts_at,
        "team_size": payload.team_size,
        "max_players": payload.team_size * 2,
        "skill": payload.skill,
        "players": [payload.user_id],
        "host_id": payload.user_id,
        "status": "open",
        "created_at": now_iso(),
    }
    await db.matches.insert_one(match.copy())
    return strip_id(match)


# Teams
@api_router.get("/teams")
async def list_teams(sport: Optional[str] = None):
    query: Dict[str, Any] = {}
    if sport and sport.lower() != "all":
        query["sport"] = sport.lower()
    return await db.teams.find(query, {"_id": 0}).to_list(100)


@api_router.get("/teams/{team_id}")
async def get_team(team_id: str):
    t = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Team not found")
    # populate roster
    roster = await db.users.find({"id": {"$in": t["member_ids"]}}, {"_id": 0}).to_list(50)
    t["roster"] = roster
    upcoming = await db.matches.find(
        {"team_id": team_id, "status": {"$ne": "played"}}, {"_id": 0}
    ).to_list(20)
    t["upcoming_matches"] = upcoming
    return t


@api_router.post("/teams")
async def create_team(payload: CreateTeamRequest):
    team = {
        "id": new_id(),
        "name": payload.name,
        "sport": payload.sport.lower(),
        "location": payload.location,
        "skill": payload.skill,
        "logo_url": payload.logo_url or "https://images.unsplash.com/photo-1582086772405-6e2dcef428d4?w=400",
        "cover_url": payload.cover_url or "https://images.unsplash.com/photo-1759694384846-fe2e5c46e76e?w=800",
        "captain_id": payload.user_id,
        "member_ids": [payload.user_id],
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "goals_scored": 0,
        "reputation": 5.0,
        "attendance_rate": 100,
        "pending_requests": [],
        "created_at": now_iso(),
    }
    await db.teams.insert_one(team.copy())
    return strip_id(team)


# Chats
@api_router.get("/chats")
async def list_chats(user_id: str, kind: Optional[str] = None):
    query: Dict[str, Any] = {"member_ids": user_id}
    if kind:
        query["kind"] = kind
    chats = await db.chats.find(query, {"_id": 0}).to_list(100)
    return chats


@api_router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(404, "Chat not found")
    msgs = await db.messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    chat["messages"] = msgs
    return chat


@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, payload: SendMessageRequest):
    msg = {
        "id": new_id(),
        "chat_id": chat_id,
        "user_id": payload.user_id,
        "text": payload.text,
        "kind": payload.kind,
        "poll_options": payload.poll_options or [],
        "poll_votes": {},
        "created_at": now_iso(),
    }
    await db.messages.insert_one(msg.copy())
    await db.chats.update_one({"id": chat_id}, {"$set": {"last_message": payload.text, "last_at": now_iso()}})
    return strip_id(msg)


# Contacts find friends — mocked
@api_router.get("/contacts/suggested")
async def suggested_contacts():
    # Random known users
    users = await db.users.find({"name": {"$ne": None}}, {"_id": 0}).to_list(20)
    return users


# Discovery
@api_router.get("/discovery/try-new")
async def discovery_try_new():
    return [
        {"id": "padel-101", "sport": "padel", "title": "Padel Basics", "desc": "Beginner class · Sat 10am", "image": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600"},
        {"id": "vb-101", "sport": "volleyball", "title": "Beach Volley Drop-in", "desc": "All levels · Sun 4pm", "image": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600"},
        {"id": "tennis-101", "sport": "tennis", "title": "Tennis Doubles Mixer", "desc": "Intermediate · Fri 6pm", "image": "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600"},
    ]


@api_router.get("/discovery/competitions")
async def discovery_competitions():
    return [
        {"id": "comp-1", "title": "Brooklyn 5v5 Cup", "sport": "football", "date": "Sat Mar 15", "image": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600", "prize": "$500"},
        {"id": "comp-2", "title": "Hoops Night Tournament", "sport": "basketball", "date": "Fri Mar 21", "image": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600", "prize": "$300"},
    ]


# ---------------- Seed ----------------
SEED_AVATARS = [
    "https://images.unsplash.com/photo-1607286908165-b8b6a2874fc4?w=400",
    "https://images.unsplash.com/photo-1516224498413-84ecf3a1e7fd?w=400",
    "https://images.pexels.com/photos/10340634/pexels-photo-10340634.jpeg?w=400",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
]


async def seed_db():
    if await db.users.count_documents({"seeded": True}) > 0:
        return
    # Users
    names = ["Alex Rivera", "Jordan Park", "Sam Chen", "Riley Cooper", "Casey Morgan",
             "Drew Patel", "Quinn Foster", "Avery Singh", "Blake Nguyen", "Cameron Liu"]
    sports_pool = ["football", "basketball", "tennis", "padel", "volleyball"]
    skills = ["Beginner", "Intermediate", "Advanced"]
    users = []
    for i, n in enumerate(names):
        u = {
            "id": new_id(),
            "phone": f"+1555{1000000 + i}",
            "name": n,
            "age": 22 + i,
            "location": "Brooklyn, NY",
            "avatar_url": SEED_AVATARS[i % len(SEED_AVATARS)],
            "sports": [{"sport": random.choice(sports_pool), "skill": random.choice(skills)}],
            "reputation": round(random.uniform(4.2, 5.0), 1),
            "attendance_rate": random.randint(80, 100),
            "matches_played": random.randint(12, 80),
            "wins": random.randint(5, 40),
            "losses": random.randint(2, 20),
            "created_at": now_iso(),
            "onboarded": True,
            "seeded": True,
        }
        users.append(u)
    await db.users.insert_many([u.copy() for u in users])

    # Teams
    teams_data = [
        {"name": "Brooklyn Strikers", "sport": "football", "cover": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", "logo": "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400"},
        {"name": "Court Kings", "sport": "basketball", "cover": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800", "logo": "https://images.unsplash.com/photo-1518911710364-17ec553bde5d?w=400"},
        {"name": "Net Smashers", "sport": "tennis", "cover": "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800", "logo": "https://images.unsplash.com/photo-1530915365347-e35b749a0381?w=400"},
    ]
    teams = []
    for i, td in enumerate(teams_data):
        team = {
            "id": new_id(),
            "name": td["name"],
            "sport": td["sport"],
            "location": "Prospect Park, Brooklyn",
            "skill": "Amateur",
            "logo_url": td["logo"],
            "cover_url": td["cover"],
            "captain_id": users[i]["id"],
            "member_ids": [users[j]["id"] for j in range(i, min(i + 5, len(users)))],
            "wins": random.randint(8, 20),
            "losses": random.randint(2, 8),
            "draws": random.randint(0, 5),
            "goals_scored": random.randint(30, 120),
            "reputation": round(random.uniform(4.3, 4.9), 1),
            "attendance_rate": random.randint(85, 98),
            "pending_requests": [],
            "created_at": now_iso(),
        }
        teams.append(team)
    await db.teams.insert_many([t.copy() for t in teams])

    # Matches near Brooklyn, NY (40.6782, -73.9442)
    base_lat, base_lng = 40.6782, -73.9442
    sport_titles = {
        "football": ["Sunday 5v5 Pickup", "Friday Night Footy", "Park Kickabout"],
        "basketball": ["3v3 Hoops Run", "Evening Ball Out", "Pickup Hoops"],
        "tennis": ["Doubles Mixer", "Singles Ladder", "Morning Rally"],
        "padel": ["Padel Drop-in", "Padel Tournament"],
        "volleyball": ["Beach Volley", "Indoor 6v6"],
    }
    matches = []
    for i in range(14):
        sport = random.choice(sports_pool)
        starts = datetime.now(timezone.utc) + timedelta(days=random.randint(0, 6), hours=random.randint(1, 10))
        team_size = 5 if sport == "football" else 3 if sport == "basketball" else 2
        match = {
            "id": new_id(),
            "sport": sport,
            "title": random.choice(sport_titles[sport]),
            "location_label": random.choice(["McCarren Park", "Prospect Park", "Brooklyn Bridge Park", "Domino Park", "Fort Greene Park"]),
            "latitude": base_lat + random.uniform(-0.03, 0.03),
            "longitude": base_lng + random.uniform(-0.03, 0.03),
            "starts_at": starts.isoformat(),
            "team_size": team_size,
            "max_players": team_size * 2,
            "skill": random.choice(skills),
            "players": [u["id"] for u in random.sample(users, k=random.randint(2, min(team_size * 2 - 1, len(users))))],
            "host_id": users[i % len(users)]["id"],
            "team_id": teams[i % len(teams)]["id"] if i < 6 else None,
            "status": "open",
            "created_at": now_iso(),
        }
        matches.append(match)

    # Past matches for history
    for i in range(6):
        sport = random.choice(sports_pool)
        starts = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        matches.append({
            "id": new_id(),
            "sport": sport,
            "title": random.choice(sport_titles[sport]),
            "location_label": "Prospect Park",
            "latitude": base_lat,
            "longitude": base_lng,
            "starts_at": starts.isoformat(),
            "team_size": 5,
            "max_players": 10,
            "skill": "Intermediate",
            "players": [u["id"] for u in users[:6]],
            "host_id": users[0]["id"],
            "status": "played",
            "score_home": random.randint(0, 5),
            "score_away": random.randint(0, 5),
            "result": random.choice(["W", "L", "D"]),
            "created_at": now_iso(),
        })

    await db.matches.insert_many([m.copy() for m in matches])

    # Chats — one for each team + a friends chat + a match chat
    chats = []
    for team in teams:
        chats.append({
            "id": new_id(),
            "kind": "team",
            "ref_id": team["id"],
            "name": team["name"],
            "avatar": team["logo_url"],
            "member_ids": team["member_ids"],
            "last_message": "See you at practice!",
            "last_at": now_iso(),
            "unread": random.randint(0, 5),
        })
    chats.append({
        "id": new_id(),
        "kind": "match",
        "ref_id": matches[0]["id"],
        "name": matches[0]["title"],
        "avatar": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400",
        "member_ids": matches[0]["players"],
        "last_message": "Bringing extra balls 🏀",
        "last_at": now_iso(),
        "unread": 2,
    })
    chats.append({
        "id": new_id(),
        "kind": "friend",
        "ref_id": users[1]["id"],
        "name": users[1]["name"],
        "avatar": users[1]["avatar_url"],
        "member_ids": [users[0]["id"], users[1]["id"]],
        "last_message": "Up for tennis Saturday?",
        "last_at": now_iso(),
        "unread": 1,
    })
    await db.chats.insert_many([c.copy() for c in chats])

    # Seed a few messages in the first chat
    sample_msgs = [
        (users[0]["id"], "Hey team, who's in for Sunday?"),
        (users[1]["id"], "I'm in!"),
        (users[2]["id"], "Same here. Bringing snacks 🍪"),
        (users[3]["id"], "Field 3 booked at 10am"),
    ]
    msgs = []
    chat0 = chats[0]
    for uid, txt in sample_msgs:
        msgs.append({
            "id": new_id(),
            "chat_id": chat0["id"],
            "user_id": uid,
            "text": txt,
            "kind": "text",
            "poll_options": [],
            "poll_votes": {},
            "created_at": now_iso(),
        })
    # Add a poll
    msgs.append({
        "id": new_id(),
        "chat_id": chat0["id"],
        "user_id": users[0]["id"],
        "text": "Who is coming on Thursday?",
        "kind": "poll",
        "poll_options": ["Yes, I'll be there", "Maybe", "Can't make it"],
        "poll_votes": {users[1]["id"]: 0, users[2]["id"]: 0, users[3]["id"]: 1},
        "created_at": now_iso(),
    })
    await db.messages.insert_many([m.copy() for m in msgs])
    logger.info("Seed complete: %d users, %d matches, %d teams, %d chats",
                len(users), len(matches), len(teams), len(chats))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@app.on_event("startup")
async def startup():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
