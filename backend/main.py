from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from secrets import token_urlsafe
from typing import Dict, Optional

from fastapi import Depends, FastAPI, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field


app = FastAPI(title="EDUNEXUS Backend", version="0.1.0")

# Allow local frontend apps to call the backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
db_path = Path(__file__).parent / "edunexus.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserRecord(BaseModel):
    id: int
    name: str
    email: str
    password: str
    role: str
    department: Optional[str]
    register_number: Optional[str] = None
    created_at: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(min_length=2, max_length=50)
    institution_id: Optional[str] = Field(default=None, min_length=4, max_length=30)
    # Backward compatibility with previous frontend payload.
    register_number: Optional[str] = Field(default=None, min_length=4, max_length=30)
    department: Optional[str] = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    register_number: Optional[str] = None
    institution_id: Optional[str] = None
    department: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AttendanceEntry(BaseModel):
    subject: str
    attendance: float
    total: int
    present: int
    color: str


class FeeLineItem(BaseModel):
    amount: float
    paid: float
    balance: float


class FeeStructureResponse(BaseModel):
    tuition: FeeLineItem
    exam: FeeLineItem
    lab: FeeLineItem
    library: FeeLineItem
    fines: FeeLineItem
    other: FeeLineItem
    total: FeeLineItem


class StudentDashboardDataResponse(BaseModel):
    attendance: list[AttendanceEntry]
    overall_attendance: float
    min_attendance_required: float
    fee_structure: FeeStructureResponse


class HallTicketEligibilityResponse(BaseModel):
    eligible: bool
    reasons: list[str]
    attendance_percentage: float
    min_attendance_required: float
    fee_due: float
    attendance_ok: bool
    fees_ok: bool


class HallTicketResponse(BaseModel):
    id: int
    ticket_number: str
    exam_name: str
    exam_date: str
    download_count: int
    created_at: str


class HallTicketsListResponse(BaseModel):
    hall_tickets: list[HallTicketResponse]


class CoordinatorHallTicketResponse(BaseModel):
    id: int
    user_id: int
    student_name: str
    register_number: Optional[str]
    department: Optional[str]
    exam_id: int
    exam_name: str
    exam_date: str
    ticket_number: str
    download_count: int
    created_at: str


class CoordinatorHallTicketsListResponse(BaseModel):
    hall_tickets: list[CoordinatorHallTicketResponse]
    count: int


class EventSubmitRequest(BaseModel):
    event_name: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5)
    event_date: str
    expected_attendees: int = Field(default=0, ge=0)


class EventResponse(BaseModel):
    id: int
    event_name: str
    description: str
    event_date: str
    expected_attendees: int
    category: str
    status: str
    file_name: Optional[str]
    created_at: str


class GenerateHallTicketRequest(BaseModel):
    exam_id: int = Field(ge=1)


class GenerateBulkHallTicketsRequest(BaseModel):
    exam_id: int = Field(ge=1)
    exam_name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    exam_date: Optional[str] = Field(default=None, min_length=8, max_length=20)
    department: Optional[str] = Field(default=None, max_length=100)


tokens_to_email: Dict[str, str] = {}


def init_db() -> None:
    with closing(get_db()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                register_number TEXT UNIQUE,
                department TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subject_code TEXT NOT NULL,
                total_classes INTEGER NOT NULL,
                present_classes INTEGER NOT NULL,
                color TEXT NOT NULL,
                UNIQUE(user_id, subject_code),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS fee_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                fee_type TEXT NOT NULL,
                amount REAL NOT NULL,
                paid REAL NOT NULL,
                UNIQUE(user_id, fee_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS hall_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                exam_id INTEGER NOT NULL,
                exam_name TEXT NOT NULL,
                exam_date TEXT NOT NULL,
                ticket_number TEXT NOT NULL UNIQUE,
                download_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, exam_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_name TEXT NOT NULL,
                description TEXT NOT NULL,
                event_date TEXT NOT NULL,
                expected_attendees INTEGER NOT NULL DEFAULT 0,
                category TEXT NOT NULL DEFAULT 'General',
                status TEXT NOT NULL DEFAULT 'pending',
                file_name TEXT,
                file_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        user_columns = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
        if "register_number" not in user_columns:
            conn.execute("ALTER TABLE users ADD COLUMN register_number TEXT")
        conn.execute(
            """
            UPDATE users
            SET register_number = printf('REG%06d', id)
            WHERE role = 'student' AND (register_number IS NULL OR trim(register_number) = '')
            """
        )
        conn.commit()


def seed_student_data(conn: sqlite3.Connection, user_id: int) -> None:
    attendance_seed = [
        ("CS301", 45, 41, "hsl(168, 100%, 48%)"),
        ("MA201", 42, 36, "hsl(239, 84%, 67%)"),
        ("EC202", 40, 31, "hsl(48, 96%, 53%)"),
        ("PH101", 38, 33, "hsl(142, 76%, 36%)"),
    ]
    fee_seed = [
        ("tuition", 50000, 50000),
        ("exam", 5000, 5000),
        ("lab", 8000, 8000),
        ("library", 2000, 2000),
        ("fines", 500, 500),
        ("other", 1500, 1500),
    ]

    conn.executemany(
        """
        INSERT OR IGNORE INTO attendance_records (user_id, subject_code, total_classes, present_classes, color)
        VALUES (?, ?, ?, ?, ?)
        """,
        [(user_id, *row) for row in attendance_seed],
    )
    conn.executemany(
        """
        INSERT OR IGNORE INTO fee_items (user_id, fee_type, amount, paid)
        VALUES (?, ?, ?, ?)
        """,
        [(user_id, *row) for row in fee_seed],
    )


def get_user_by_email(conn: sqlite3.Connection, email: str) -> Optional[UserRecord]:
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row:
        return None
    return UserRecord(**dict(row))


def get_user_by_id(conn: sqlite3.Connection, user_id: int) -> Optional[UserRecord]:
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return None
    return UserRecord(**dict(row))


def to_user_response(user: UserRecord) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        register_number=user.register_number,
        institution_id=user.register_number,
        department=user.department,
        created_at=user.created_at,
    )


def create_token(email: str) -> str:
    token = token_urlsafe(32)
    tokens_to_email[token] = email
    return token


def get_current_user(authorization: Optional[str] = Header(default=None)) -> UserRecord:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")

    token = authorization.split(" ", 1)[1].strip()
    email = tokens_to_email.get(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired or invalid")

    with closing(get_db()) as conn:
        user = get_user_by_email(conn, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")

    return user


ROLE_ID_LABELS: Dict[str, str] = {
    "student": "Register Number",
    "staff": "Staff ID",
    "club_coordinator": "Club Coordinator ID",
    "exam_coordinator": "Exam Coordinator ID",
}


def normalize_role_identifier(raw: Optional[str]) -> str:
    return (raw or "").strip().upper()


def get_attendance_entries(conn: sqlite3.Connection, user_id: int) -> list[AttendanceEntry]:
    rows = conn.execute(
        """
        SELECT subject_code, total_classes, present_classes, color
        FROM attendance_records
        WHERE user_id = ?
        ORDER BY subject_code
        """,
        (user_id,),
    ).fetchall()

    entries: list[AttendanceEntry] = []
    for row in rows:
        total = int(row["total_classes"])
        present = int(row["present_classes"])
        attendance = round((present / total) * 100, 1) if total > 0 else 0.0
        entries.append(
            AttendanceEntry(
                subject=row["subject_code"],
                attendance=attendance,
                total=total,
                present=present,
                color=row["color"],
            )
        )
    return entries


def get_fee_structure(conn: sqlite3.Connection, user_id: int) -> FeeStructureResponse:
    rows = conn.execute(
        """
        SELECT fee_type, amount, paid
        FROM fee_items
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchall()

    fee_map: Dict[str, FeeLineItem] = {
        "tuition": FeeLineItem(amount=0, paid=0, balance=0),
        "exam": FeeLineItem(amount=0, paid=0, balance=0),
        "lab": FeeLineItem(amount=0, paid=0, balance=0),
        "library": FeeLineItem(amount=0, paid=0, balance=0),
        "fines": FeeLineItem(amount=0, paid=0, balance=0),
        "other": FeeLineItem(amount=0, paid=0, balance=0),
    }

    total_amount = 0.0
    total_paid = 0.0
    for row in rows:
        fee_type = str(row["fee_type"])
        amount = float(row["amount"])
        paid = float(row["paid"])
        item = FeeLineItem(amount=amount, paid=paid, balance=max(amount - paid, 0.0))
        if fee_type in fee_map:
            fee_map[fee_type] = item
        total_amount += amount
        total_paid += paid

    total = FeeLineItem(amount=total_amount, paid=total_paid, balance=max(total_amount - total_paid, 0.0))
    return FeeStructureResponse(
        tuition=fee_map["tuition"],
        exam=fee_map["exam"],
        lab=fee_map["lab"],
        library=fee_map["library"],
        fines=fee_map["fines"],
        other=fee_map["other"],
        total=total,
    )


def build_eligibility(conn: sqlite3.Connection, user: UserRecord) -> HallTicketEligibilityResponse:
    min_attendance = 75.0
    entries = get_attendance_entries(conn, user.id)
    total_present = sum(item.present for item in entries)
    total_classes = sum(item.total for item in entries)
    overall_attendance = round((total_present / total_classes) * 100, 1) if total_classes > 0 else 0.0

    fees = get_fee_structure(conn, user.id)
    fee_due = round(fees.total.balance, 2)

    attendance_ok = overall_attendance >= min_attendance
    fees_ok = fee_due <= 0

    reasons: list[str] = []
    if not attendance_ok:
        reasons.append(f"Attendance is below required {min_attendance}%")
    if not fees_ok:
        reasons.append(f"Outstanding fee due: INR {fee_due:.2f}")

    return HallTicketEligibilityResponse(
        eligible=attendance_ok and fees_ok,
        reasons=reasons,
        attendance_percentage=overall_attendance,
        min_attendance_required=min_attendance,
        fee_due=fee_due,
        attendance_ok=attendance_ok,
        fees_ok=fees_ok,
    )


def make_ticket_number(user_id: int, exam_id: int) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"HT-{exam_id:02d}-{user_id:04d}-{timestamp}"


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _pdf_text(x: float, y: float, text: str, size: int = 10, bold: bool = False) -> str:
    font = "F2" if bold else "F1"
    safe = _escape_pdf_text(text)
    return f"BT /{font} {size} Tf 1 0 0 1 {x:.2f} {y:.2f} Tm ({safe}) Tj ET"


def hall_ticket_pdf_bytes(
    ticket_number: str,
    register_number: str,
    student_name: str,
    department: str,
    exam_name: str,
    exam_date: str,
    subject_codes: list[str],
    generated_at: str,
) -> bytes:
    commands: list[str] = []

    # Page frame and major sections
    commands.append("0.8 w")
    commands.append("0 0 0 RG")
    commands.append("25 25 545 792 re S")
    commands.append("25 735 545 82 re S")
    commands.append("35 742 70 68 re S")  # left logo placeholder
    commands.append("430 742 70 68 re S")  # right logo placeholder
    commands.append("505 660 55 150 re S")  # photo placeholder
    commands.append("25 650 545 82 re S")   # student details block
    commands.append("25 255 545 390 re S")  # subjects block
    commands.append("25 155 545 90 re S")   # note block
    commands.append("25 47 545 95 re S")    # signature block
    commands.append("206.6 47 m 206.6 142 l S")
    commands.append("388.3 47 m 388.3 142 l S")

    # Header text
    commands.append(_pdf_text(160, 795, "EDUNEXUS INSTITUTE OF TECHNOLOGY", 16, True))
    commands.append(_pdf_text(170, 775, "Autonomous Institution", 10, False))
    commands.append(_pdf_text(130, 754, "END SEMESTER EXAMINATIONS - HALL TICKET", 12, True))
    commands.append(_pdf_text(45, 777, "College", 9, False))
    commands.append(_pdf_text(448, 777, "Seal", 9, False))
    commands.append(_pdf_text(517, 729, "Candidate", 8, False))
    commands.append(_pdf_text(522, 718, "Photo", 8, False))

    # Detail labels and values
    commands.append(_pdf_text(35, 710, "Register Number", 9, True))
    commands.append(_pdf_text(145, 710, register_number, 9, False))
    commands.append(_pdf_text(305, 710, "Exam Date", 9, True))
    commands.append(_pdf_text(385, 710, exam_date, 9, False))
    commands.append(_pdf_text(35, 690, "Name", 9, True))
    commands.append(_pdf_text(145, 690, student_name, 9, False))
    commands.append(_pdf_text(35, 670, "Degree & Branch", 9, True))
    commands.append(_pdf_text(145, 670, department, 9, False))
    commands.append(_pdf_text(35, 651, f"Hall Ticket No: {ticket_number}", 9, True))
    commands.append(_pdf_text(300, 651, exam_name, 9, False))

    # Subjects table header
    commands.append("25 620 m 570 620 l S")
    commands.append("80 620 m 80 255 l S")
    commands.append("160 620 m 160 255 l S")
    commands.append(_pdf_text(40, 628, "Sem.", 9, True))
    commands.append(_pdf_text(97, 628, "Subject Code", 9, True))
    commands.append(_pdf_text(245, 628, "Subject Title / Session", 9, True))

    semester_text = "04"
    base_y = 602
    for index, subject in enumerate(subject_codes[:14], start=1):
        y = base_y - (index - 1) * 22
        commands.append(_pdf_text(45, y, semester_text, 9, False))
        commands.append(_pdf_text(95, y, subject, 9, False))
        commands.append(_pdf_text(170, y, f"{subject} - Core Subject [{exam_date}]", 9, False))

    commands.append(_pdf_text(35, 265, f"Number of Subjects Registered: {max(len(subject_codes), 1)}", 9, True))

    # Notes and signatures
    commands.append(_pdf_text(35, 230, "Note:", 9, True))
    commands.append(_pdf_text(35, 215, "1. Carry this hall ticket and college ID for every exam.", 8, False))
    commands.append(_pdf_text(35, 201, "2. Report to exam hall at least 30 minutes before start.", 8, False))
    commands.append(_pdf_text(35, 187, "3. Any correction must be reported to exam cell immediately.", 8, False))
    commands.append(_pdf_text(35, 173, f"Generated At: {generated_at}", 8, False))
    commands.append(_pdf_text(60, 58, "Signature of Candidate", 9, False))
    commands.append(_pdf_text(245, 58, "Principal with Seal", 9, False))
    commands.append(_pdf_text(420, 58, "Controller of Examinations", 9, False))

    content_stream = "\n".join(commands).encode("utf-8")

    objects: list[bytes] = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n"
    )
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n")
    objects.append(
        f"6 0 obj << /Length {len(content_stream)} >> stream\n".encode("utf-8")
        + content_stream
        + b"\nendstream endobj\n"
    )

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("utf-8"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))

    pdf.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_start}\n"
            "%%EOF"
        ).encode("utf-8")
    )
    return bytes(pdf)


init_db()

with closing(get_db()) as _seed_conn:
    _seed_conn.execute("UPDATE fee_items SET paid = amount WHERE fee_type = 'fines' AND paid < amount")
    _seed_conn.commit()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "EDUNEXUS backend is running"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> UserResponse:
    email = payload.email.lower().strip()
    role = payload.role.strip().lower()
    incoming_identifier = payload.institution_id if payload.institution_id is not None else payload.register_number
    role_identifier = normalize_role_identifier(incoming_identifier)

    if role in ROLE_ID_LABELS and not role_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{ROLE_ID_LABELS[role]} is required for {role.replace('_', ' ')}",
        )

    # Admin should not have role-specific institutional ID.
    if role == "admin":
        role_identifier = ""

    with closing(get_db()) as conn:
        if get_user_by_email(conn, email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if role_identifier:
            existing_reg = conn.execute(
                "SELECT id FROM users WHERE upper(register_number) = ?",
                (role_identifier,),
            ).fetchone()
            if existing_reg:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ID already exists")

        cursor = conn.execute(
            """
            INSERT INTO users (name, email, password, role, register_number, department, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.name.strip(),
                email,
                payload.password,
                role,
                role_identifier or None,
                payload.department,
                now_iso(),
            ),
        )
        user_id = int(cursor.lastrowid)
        if role == "student":
            seed_student_data(conn, user_id)
        conn.commit()

        user = get_user_by_id(conn, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
    return to_user_response(user)


@app.post("/api/auth/login", response_model=AuthResponse)
@app.post("/api/auth/login-json", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    identifier = payload.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or register number is required")

    with closing(get_db()) as conn:
        lowered = identifier.lower()
        uppered = identifier.upper()
        row = conn.execute(
            """
            SELECT * FROM users
            WHERE lower(email) = ? OR upper(register_number) = ?
            LIMIT 1
            """,
            (lowered, uppered),
        ).fetchone()
        user = UserRecord(**dict(row)) if row else None

    if not user or user.password != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_token(user.email)
    return AuthResponse(access_token=token, user=to_user_response(user))


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: UserRecord = Depends(get_current_user)) -> UserResponse:
    return to_user_response(current_user)


@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(default=None)) -> dict[str, str]:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        tokens_to_email.pop(token, None)
    return {"message": "Logged out"}


@app.get("/api/student/dashboard-data", response_model=StudentDashboardDataResponse)
def student_dashboard_data(current_user: UserRecord = Depends(get_current_user)) -> StudentDashboardDataResponse:
    with closing(get_db()) as conn:
        attendance = get_attendance_entries(conn, current_user.id)
        fees = get_fee_structure(conn, current_user.id)

    total_present = sum(item.present for item in attendance)
    total_classes = sum(item.total for item in attendance)
    overall_attendance = round((total_present / total_classes) * 100, 1) if total_classes > 0 else 0.0

    return StudentDashboardDataResponse(
        attendance=attendance,
        overall_attendance=overall_attendance,
        min_attendance_required=75.0,
        fee_structure=fees,
    )


@app.get("/api/hall-tickets/eligibility", response_model=HallTicketEligibilityResponse)
def hall_ticket_eligibility(current_user: UserRecord = Depends(get_current_user)) -> HallTicketEligibilityResponse:
    with closing(get_db()) as conn:
        return build_eligibility(conn, current_user)


@app.get("/api/hall-tickets/my", response_model=HallTicketsListResponse)
def my_hall_tickets(current_user: UserRecord = Depends(get_current_user)) -> HallTicketsListResponse:
    with closing(get_db()) as conn:
        rows = conn.execute(
            """
            SELECT id, ticket_number, exam_name, exam_date, download_count, created_at
            FROM hall_tickets
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (current_user.id,),
        ).fetchall()

    tickets = [
        HallTicketResponse(
            id=int(row["id"]),
            ticket_number=row["ticket_number"],
            exam_name=row["exam_name"],
            exam_date=row["exam_date"],
            download_count=int(row["download_count"]),
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return HallTicketsListResponse(hall_tickets=tickets)


@app.post("/api/hall-tickets/generate", response_model=dict)
def generate_hall_ticket(payload: GenerateHallTicketRequest, current_user: UserRecord = Depends(get_current_user)) -> dict:
    with closing(get_db()) as conn:
        eligibility = build_eligibility(conn, current_user)
        if not eligibility.eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate hall ticket: " + "; ".join(eligibility.reasons),
            )

        existing = conn.execute(
            """
            SELECT id, ticket_number, exam_name, exam_date, download_count, created_at
            FROM hall_tickets
            WHERE user_id = ? AND exam_id = ?
            """,
            (current_user.id, payload.exam_id),
        ).fetchone()

        if existing:
            ticket = HallTicketResponse(
                id=int(existing["id"]),
                ticket_number=existing["ticket_number"],
                exam_name=existing["exam_name"],
                exam_date=existing["exam_date"],
                download_count=int(existing["download_count"]),
                created_at=existing["created_at"],
            )
            return {"message": "Hall ticket already exists", "hall_ticket": ticket.model_dump()}

        exam_name = f"Semester Examination {payload.exam_id}"
        exam_date = "2026-05-20"
        ticket_number = make_ticket_number(current_user.id, payload.exam_id)

        cursor = conn.execute(
            """
            INSERT INTO hall_tickets (user_id, exam_id, exam_name, exam_date, ticket_number, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (current_user.id, payload.exam_id, exam_name, exam_date, ticket_number, now_iso()),
        )
        ticket_id = int(cursor.lastrowid)
        conn.commit()

        row = conn.execute(
            """
            SELECT id, ticket_number, exam_name, exam_date, download_count, created_at
            FROM hall_tickets
            WHERE id = ?
            """,
            (ticket_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate hall ticket")

    ticket = HallTicketResponse(
        id=int(row["id"]),
        ticket_number=row["ticket_number"],
        exam_name=row["exam_name"],
        exam_date=row["exam_date"],
        download_count=int(row["download_count"]),
        created_at=row["created_at"],
    )
    return {"message": "Hall ticket generated successfully", "hall_ticket": ticket.model_dump()}


@app.post("/api/hall-tickets/generate-bulk", response_model=dict)
def generate_bulk_hall_tickets(
    payload: GenerateBulkHallTicketsRequest,
    current_user: UserRecord = Depends(get_current_user),
) -> dict:
    if current_user.role != "exam_coordinator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only exam coordinators can generate bulk hall tickets")

    exam_name = payload.exam_name.strip() if payload.exam_name else f"Semester Examination {payload.exam_id}"
    exam_date = payload.exam_date.strip() if payload.exam_date else "2026-05-20"
    dept_filter = (payload.department or "").strip()

    with closing(get_db()) as conn:
        if dept_filter and dept_filter.lower() != "all departments":
            student_rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role = 'student' AND lower(coalesce(department, '')) = lower(?)
                ORDER BY id
                """,
                (dept_filter,),
            ).fetchall()
        else:
            student_rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role = 'student'
                ORDER BY id
                """
            ).fetchall()

        total_students = len(student_rows)
        generated_count = 0
        existing_count = 0
        skipped_ineligible = 0

        for row in student_rows:
            student = UserRecord(**dict(row))
            eligibility = build_eligibility(conn, student)
            if not eligibility.eligible:
                skipped_ineligible += 1
                continue

            existing = conn.execute(
                """
                SELECT id
                FROM hall_tickets
                WHERE user_id = ? AND exam_id = ?
                """,
                (student.id, payload.exam_id),
            ).fetchone()
            if existing:
                existing_count += 1
                continue

            ticket_number = make_ticket_number(student.id, payload.exam_id)
            conn.execute(
                """
                INSERT INTO hall_tickets (user_id, exam_id, exam_name, exam_date, ticket_number, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (student.id, payload.exam_id, exam_name, exam_date, ticket_number, now_iso()),
            )
            generated_count += 1

        conn.commit()

    return {
        "message": "Bulk hall ticket generation completed",
        "exam_id": payload.exam_id,
        "exam_name": exam_name,
        "exam_date": exam_date,
        "department": dept_filter or "All Departments",
        "total_students": total_students,
        "generated_count": generated_count,
        "existing_count": existing_count,
        "skipped_ineligible": skipped_ineligible,
    }


@app.get("/api/hall-tickets/generated", response_model=CoordinatorHallTicketsListResponse)
def get_generated_hall_tickets(
    exam_id: Optional[int] = Query(default=None, ge=1),
    department: Optional[str] = Query(default=None),
    current_user: UserRecord = Depends(get_current_user),
) -> CoordinatorHallTicketsListResponse:
    if current_user.role != "exam_coordinator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only exam coordinators can view generated hall tickets")

    dept_filter = (department or "").strip()
    where_clauses = ["u.role = 'student'"]
    params: list[object] = []

    if exam_id is not None:
        where_clauses.append("ht.exam_id = ?")
        params.append(exam_id)
    if dept_filter and dept_filter.lower() != "all departments":
        where_clauses.append("lower(coalesce(u.department, '')) = lower(?)")
        params.append(dept_filter)

    where_sql = " AND ".join(where_clauses)

    with closing(get_db()) as conn:
        rows = conn.execute(
            f"""
            SELECT
                ht.id,
                ht.user_id,
                u.name AS student_name,
                u.register_number,
                u.department,
                ht.exam_id,
                ht.exam_name,
                ht.exam_date,
                ht.ticket_number,
                ht.download_count,
                ht.created_at
            FROM hall_tickets ht
            JOIN users u ON u.id = ht.user_id
            WHERE {where_sql}
            ORDER BY ht.created_at DESC
            """,
            tuple(params),
        ).fetchall()

    tickets = [
        CoordinatorHallTicketResponse(
            id=int(row["id"]),
            user_id=int(row["user_id"]),
            student_name=row["student_name"],
            register_number=row["register_number"],
            department=row["department"],
            exam_id=int(row["exam_id"]),
            exam_name=row["exam_name"],
            exam_date=row["exam_date"],
            ticket_number=row["ticket_number"],
            download_count=int(row["download_count"]),
            created_at=row["created_at"],
        )
        for row in rows
    ]
    return CoordinatorHallTicketsListResponse(hall_tickets=tickets, count=len(tickets))


@app.get("/api/hall-tickets/{ticket_id}/pdf")
def download_hall_ticket_pdf(ticket_id: int, current_user: UserRecord = Depends(get_current_user)) -> Response:
    with closing(get_db()) as conn:
        row = conn.execute(
            """
            SELECT id, ticket_number, exam_name, exam_date, download_count, created_at
            FROM hall_tickets
            WHERE id = ? AND user_id = ?
            """,
            (ticket_id, current_user.id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hall ticket not found")

        conn.execute(
            "UPDATE hall_tickets SET download_count = download_count + 1 WHERE id = ?",
            (ticket_id,),
        )
        conn.commit()

    with closing(get_db()) as conn:
        subject_rows = conn.execute(
            """
            SELECT subject_code
            FROM attendance_records
            WHERE user_id = ?
            ORDER BY subject_code
            """,
            (current_user.id,),
        ).fetchall()

    reg_no = normalize_role_identifier(current_user.register_number) or "N/A"
    subject_codes = [subject["subject_code"] for subject in subject_rows] or ["N/A"]
    pdf_data = hall_ticket_pdf_bytes(
        ticket_number=row["ticket_number"],
        register_number=reg_no,
        student_name=current_user.name,
        department=current_user.department or "Not Specified",
        exam_name=row["exam_name"],
        exam_date=row["exam_date"],
        subject_codes=subject_codes,
        generated_at=row["created_at"],
    )
    headers = {
        "Content-Disposition": f"attachment; filename=hall-ticket-{ticket_id}.pdf"
    }
    return Response(content=pdf_data, media_type="application/pdf", headers=headers)


# ---------------------------------------------------------------------------
# Club Events
# ---------------------------------------------------------------------------

_AI_CATEGORIES = {
    "hack": "Technical", "workshop": "Technical", "code": "Technical",
    "tech": "Technical", "ai": "Technical", "ml": "Technical", "robot": "Technical",
    "sport": "Sports", "cricket": "Sports", "football": "Sports", "basketball": "Sports",
    "badminton": "Sports", "chess": "Sports", "game": "Sports",
    "cultur": "Cultural", "dance": "Cultural", "music": "Cultural", "drama": "Cultural",
    "fest": "Cultural", "art": "Cultural",
    "quiz": "Academic", "seminar": "Academic", "lecture": "Academic", "debate": "Academic",
}


def _ai_classify(name: str, description: str) -> str:
    text = (name + " " + description).lower()
    for keyword, category in _AI_CATEGORIES.items():
        if keyword in text:
            return category
    return "General"


@app.post("/api/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def submit_event(
    data: EventSubmitRequest,
    current_user: UserRecord = Depends(get_current_user),
):
    if current_user.role != "club_coordinator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only club coordinators can submit events")
    category = _ai_classify(data.event_name, data.description)
    created_at = now_iso()
    with closing(get_db()) as conn:
        cur = conn.execute(
            """
            INSERT INTO events (user_id, event_name, description, event_date, expected_attendees, category, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (current_user.id, data.event_name, data.description, data.event_date, data.expected_attendees, category, created_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM events WHERE id = ?", (cur.lastrowid,)).fetchone()
    return EventResponse(
        id=row["id"],
        event_name=row["event_name"],
        description=row["description"],
        event_date=row["event_date"],
        expected_attendees=row["expected_attendees"],
        category=row["category"],
        status=row["status"],
        file_name=row["file_name"],
        created_at=row["created_at"],
    )


@app.post("/api/events/with-file", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def submit_event_with_file(
    event_name: str = Form(...),
    description: str = Form(...),
    event_date: str = Form(...),
    expected_attendees: int = Form(default=0),
    file: Optional[UploadFile] = None,
    current_user: UserRecord = Depends(get_current_user),
):
    if current_user.role != "club_coordinator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only club coordinators can submit events")
    if not event_name or not description or not event_date:
        raise HTTPException(status_code=400, detail="event_name, description, and event_date are required")
    category = _ai_classify(event_name, description)
    created_at = now_iso()
    saved_file_name: Optional[str] = None
    saved_file_path: Optional[str] = None
    if file and file.filename:
        safe_name = f"event_{token_urlsafe(8)}_{file.filename}"
        dest = uploads_dir / safe_name
        with open(dest, "wb") as fout:
            fout.write(await file.read())
        saved_file_name = file.filename
        saved_file_path = str(dest)
    with closing(get_db()) as conn:
        cur = conn.execute(
            """
            INSERT INTO events (user_id, event_name, description, event_date, expected_attendees, category, status, file_name, file_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            """,
            (current_user.id, event_name, description, event_date, expected_attendees, category, saved_file_name, saved_file_path, created_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM events WHERE id = ?", (cur.lastrowid,)).fetchone()
    return EventResponse(
        id=row["id"],
        event_name=row["event_name"],
        description=row["description"],
        event_date=row["event_date"],
        expected_attendees=row["expected_attendees"],
        category=row["category"],
        status=row["status"],
        file_name=row["file_name"],
        created_at=row["created_at"],
    )


@app.get("/api/events/my", response_model=list[EventResponse])
async def get_my_events(current_user: UserRecord = Depends(get_current_user)):
    with closing(get_db()) as conn:
        rows = conn.execute(
            "SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC",
            (current_user.id,),
        ).fetchall()
    return [
        EventResponse(
            id=r["id"],
            event_name=r["event_name"],
            description=r["description"],
            event_date=r["event_date"],
            expected_attendees=r["expected_attendees"],
            category=r["category"],
            status=r["status"],
            file_name=r["file_name"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
