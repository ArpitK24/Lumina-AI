from sqlmodel import create_engine, SQLModel, Session
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus, urlparse

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Robustly handle passwords with '@' or other special characters
if DATABASE_URL and DATABASE_URL.count("@") > 1:
    try:
        # The last '@' is always the one separating credentials from the host
        scheme_part, rest = DATABASE_URL.split("://", 1)
        # Split from the right to get host_db
        credentials, host_db = rest.rsplit("@", 1)
        # Now split credentials into user and password
        if ":" in credentials:
            user, password = credentials.split(":", 1)
            # Reconstruct with encoded password
            DATABASE_URL = f"{scheme_part}://{user}:{quote_plus(password)}@{host_db}"
    except Exception as e:
        print(f"Warning: Failed to parse DATABASE_URL for encoding: {e}")

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
