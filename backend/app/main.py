from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from app.database import db
from app.routers import auth, admin, user_router, role_router, elderly_router, caregiver_router, doctor_router, family_router
from app.routers import elderly_client_router, caregiver_portal_router
from app.services.role_service import RoleService

app = FastAPI(
    title="HomeJoy API",
    description="AI-Based Elderly Care and Wellness Monitoring System API",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    try:
        RoleService.seed_default_roles()
        print("[OK] Default RBAC system roles verified & seeded.")
    except Exception as e:
        print("[WARN] Role seed on startup deferred:", e)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection error. Please check your MongoDB connection and Atlas IP Whitelist (0.0.0.0/0)."},
    )

# Register routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(user_router.router)
app.include_router(role_router.router)
# Elderly client router (/api/elderly/me/...) — registered BEFORE admin elderly router
# so the /me prefix is matched first and doesn't collide with /{elderly_id} admin routes
app.include_router(elderly_client_router.router)
app.include_router(elderly_router.router)
# Caregiver portal router (/api/caregiver/me/...) — registered BEFORE admin caregivers router
app.include_router(caregiver_portal_router.router)
app.include_router(caregiver_router.router)
app.include_router(doctor_router.router)
app.include_router(family_router.router)



@app.get("/")
def root():
    return {
        "message": "Welcome to HomeJoy API 🚀",
        "database": "Connected",
        "status": "Online"
    }