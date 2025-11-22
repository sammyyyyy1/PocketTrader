"""
End-to-end generator for production-style seed data.
Fetches Pokemon TCG Pocket cards plus dummy users/collections/wishlists
and emits a single -prod.sql file for Docker initialization.
"""

from __future__ import annotations

import argparse
import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    from tcgdexsdk import TCGdex, Language
except ImportError:
    print("ERROR: tcgdex-sdk not installed. Please run `pip install tcgdex-sdk`.")
    sys.exit(1)

try:
    from werkzeug.security import generate_password_hash
except ImportError:
    import hashlib
    import os
    import binascii

    def generate_password_hash(password: str, iterations: int = 260000) -> str:
        salt = binascii.hexlify(os.urandom(16)).decode("ascii")
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("ascii"), iterations
        )
        return f"pbkdf2:sha256:{iterations}${salt}${binascii.hexlify(dk).decode('ascii')}"


SCRIPT_DIR = Path(__file__).resolve().parent
MIGRATIONS_DIR = SCRIPT_DIR.parent / "migrations"
DEFAULT_OUTPUT = MIGRATIONS_DIR / "init-prod.sql"
DEFAULT_SET_IDS = ("A1", "A2", "A3")
DEFAULT_USER_COUNT = 10
DEFAULT_COLLECTION_RANGE = (8, 15)
DEFAULT_WISHLIST_RANGE = (4, 8)

RARITY_MAP = {
    "Four Diamond": "4D",
    "Three Star": "3S",
    "Three Diamond": "3D",
    "Two Star": "2S",
    "One Star": "1S",
    "Two Diamond": "2D",
    "One Diamond": "1D",
    "Crown": "C",
}

NAME_POOL = [
    "Brasen",
    "Sam",
    "Steven",
    "Jonathan",
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Ethan",
    "Fiona",
    "Gabe",
    "Hazel",
    "Ivan",
    "Jade",
    "Kai",
    "Lena",
    "Miles",
    "Noah",
    "Olivia",
    "Parker",
    "Riley",
    "Sage",
    "Theo",
    "Uma",
    "Violet",
    "Wyatt",
    "Xander",
    "Yara",
    "Zane",
    "Adrian",
    "Bella",
    "Caleb",
    "Delilah",
    "Emmett",
    "Freya",
    "Griffin",
    "Holly",
    "Isla",
    "Jasper",
    "Kira",
    "Logan",
    "Maya",
    "Nico",
    "Orion",
    "Paige",
    "Quinn",
    "Rowan",
    "Sienna",
    "Toby",
    "Uriah",
    "Valerie",
    "Wren",
    "Ximena",
    "Yuri",
    "Zara",
    "Aiden",
    "Beatrice",
    "Cody",
    "Evelyn",
    "Finn",
    "Georgia",
    "Hunter",
    "Indigo",
    "Jonah",
    "Kamila",
    "Luca",
    "Morgan",
    "Nadia",
    "Owen",
    "Phoebe",
    "Reed",
    "Soren",
    "Talia",
    "Ulric",
    "Vera",
    "Wade",
    "Xenia",
    "Yasmin",
    "Zeke",
    "Aria",
    "Bennett",
    "Cassidy",
    "Derek",
    "Elara",
    "Felix",
    "Giselle",
    "Harlan",
    "Ivy",
    "Kellan",
    "Levi",
    "Mira",
    "Nash",
    "Opal",
    "Pierce",
    "Ruth",
    "Stella",
    "Tanner"
]


def get_pack_name(card) -> str:
    """Determine pack assignment from boosters info."""
    if hasattr(card, "boosters") and card.boosters:
        booster = card.boosters[0]
        booster_name = booster.name if hasattr(booster, "name") else str(booster)
        if "Charizard" in booster_name:
            return "Charizard"
        if "Pikachu" in booster_name:
            return "Pikachu"
        if "Mewtwo" in booster_name:
            return "Mewtwo"
        if "Dialga" in booster_name:
            return "Dialga"
        if "Palkia" in booster_name:
            return "Palkia"
        if "Lunala" in booster_name:
            return "Lunala"
        if "Solgaleo" in booster_name:
            return "Solgaleo"
    return "Shared"


async def fetch_cards_for_sets(set_ids):
    """Fetch detailed card data for each requested Pocket set."""
    tcgdex = TCGdex(Language.EN)
    combined = []
    fetched_sets = []

    for set_id in set_ids:
        print(f"Fetching {set_id} data...")
        try:
            card_set = await tcgdex.set.get(set_id)
            if not card_set or not getattr(card_set, "cards", None):
                print(f"WARNING: No cards returned for {set_id}")
                continue

            set_name = getattr(card_set, "name", set_id)
            total = len(card_set.cards)
            print(f"Found {total} cards in {set_name} ({set_id})")

            for idx, card_ref in enumerate(card_set.cards, 1):
                card = await tcgdex.card.get(card_ref.id)
                if card:
                    if idx <= 3:
                        print(
                            f"  DEBUG {card.id}: rarity={getattr(card, 'rarity', 'N/A')}, types={getattr(card, 'types', 'N/A')}"
                        )
                    combined.append(card)
                if idx % 10 == 0:
                    await asyncio.sleep(0.5)

            fetched_sets.append((set_id, set_name))
        except Exception as exc:  # pragma: no cover - network errors logged
            print(f"ERROR fetching {set_id}: {exc}")

    return combined, fetched_sets


def map_rarity(rarity: str) -> str:
    return RARITY_MAP.get(rarity, "1D")


def get_card_type(card) -> str:
    if hasattr(card, "types") and card.types:
        return card.types[0]
    category = getattr(card, "category", "")
    if category in ("Trainer", "Energy"):
        return category
    return str(category).capitalize() if category else "Colorless"


def get_image_url(card) -> str:
    image = getattr(card, "image", "")
    if isinstance(image, str) and image:
        return f"{image}/high.webp"
    return ""


def generate_card_sql(cards, set_details) -> str:
    """Emit INSERT statements for card data."""
    set_comment = ", ".join(
        f"{name} ({set_id})" if name and name != set_id else set_id
        for set_id, name in set_details
    ) or "N/A"

    lines = [
        "-- Card catalogue seeded from Pokemon TCG Pocket",
        f"-- Sets: {set_comment}",
        f"-- Total cards: {len(cards)}",
        "",
        "INSERT INTO Card (cardID, name, packName, rarity, type, imageURL) VALUES",
    ]

    card_groups = {code: [] for code in ["4D", "3D", "2D", "1D", "4S", "3S", "2S", "1S", "C"]}
    for card in cards:
        code = map_rarity(getattr(card, "rarity", "◊"))
        card_groups.setdefault(code, []).append(card)

    values = []
    for code, label in [
        ("4D", "4 Diamond"),
        ("3D", "3 Diamond"),
        ("2D", "2 Diamond"),
        ("1D", "1 Diamond"),
        ("4S", "4 Star"),
        ("3S", "3 Star"),
        ("2S", "2 Star"),
        ("1S", "1 Star"),
        ("C", "Crown"),
    ]:
        group = card_groups.get(code, [])
        if not group:
            continue
        values.append(f"-- {label} ({len(group)} cards)")
        for card in group:
            name = getattr(card, "name", "Unknown").replace("'", "''")
            pack = get_pack_name(card)
            card_type = get_card_type(card)
            image_url = get_image_url(card)
            values.append(
                f"('{card.id}', '{name}', '{pack}', '{code}', '{card_type}', '{image_url}')"
            )

    if not values:
        values.append("-- No card rows generated.")

    # join values with commas and terminate with semicolon
    insert_block = ",\n".join(values)
    last_paren = insert_block.rfind(")")
    if last_paren != -1:
        insert_block = insert_block[: last_paren + 1] + ";"
    lines.append(insert_block)
    lines.append("")
    return "\n".join(lines)


def generate_dummy_users(count: int, base_date: datetime) -> list[dict]:
    users = []
    for idx in range(count):
        username = NAME_POOL[idx] if idx < len(NAME_POOL) else f"Trainer{idx + 1}"
        password = f"{username}Pass!{random.randint(10, 99)}"
        hash_val = generate_password_hash(password)
        joined = base_date + timedelta(hours=idx * 3 + random.randint(0, 60))
        users.append(
            {
                "username": username,
                "password": hash_val,
                "joined": joined.strftime("%Y-%m-%d %H:%M:%S"),
            }
        )
    return users


def build_collection_entries(users, card_ids, min_cards, max_cards):
    if not card_ids:
        raise ValueError("No card IDs available for collection generation.")

    entries = []
    for user_idx, _ in enumerate(users, start=1):
        owned = random.sample(
            card_ids, k=min(random.randint(min_cards, max_cards), len(card_ids))
        )
        for card_id in owned:
            entries.append(
                {
                    "userID": user_idx,
                    "cardID": card_id,
                    "quantity": random.randint(1, 4),
                }
            )
    return entries


def build_wishlist_entries(users, card_ids, min_cards, max_cards):
    if not card_ids:
        raise ValueError("No card IDs available for wishlist generation.")

    entries = []
    for user_idx, user in enumerate(users, start=1):
        wishlist = random.sample(
            card_ids, k=min(random.randint(min_cards, max_cards), len(card_ids))
        )
        joined_dt = datetime.strptime(user["joined"], "%Y-%m-%d %H:%M:%S")
        for offset, card_id in enumerate(wishlist, start=1):
            ts = joined_dt + timedelta(days=offset, hours=random.randint(1, 6))
            entries.append(
                {
                    "userID": user_idx,
                    "cardID": card_id,
                    "dateAdded": ts.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )
    return entries


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def format_insert(table, columns, rows):
    if not rows:
        return f"-- No rows generated for {table}"
    lines = [f"INSERT INTO {table} ({', '.join(columns)}) VALUES"]
    for idx, row in enumerate(rows):
        suffix = "," if idx < len(rows) - 1 else ";"
        lines.append(f"({', '.join(row)}){suffix}")
    return "\n".join(lines)


def generate_account_sql(users, collections, wishlists) -> str:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    user_rows = [
        (
            f"'{sql_escape(user['username'])}'",
            f"'{user['password']}'",
            f"'{user['joined']}'",
        )
        for user in users
    ]
    collection_rows = [
        (str(entry["userID"]), f"'{entry['cardID']}'", str(entry["quantity"]))
        for entry in collections
    ]
    wishlist_rows = [
        (
            str(entry["userID"]),
            f"'{entry['cardID']}'",
            f"'{entry['dateAdded']}'",
        )
        for entry in wishlists
    ]

    sections = [
        f"-- Dummy accounts generated on {now}",
        format_insert("User", ("username", "passwordHash", "dateJoined"), user_rows),
        "",
        "-- Starter collections",
        format_insert("Collection", ("userID", "cardID", "quantity"), collection_rows),
        "",
        "-- Wishlist targets",
        format_insert("Wishlist", ("userID", "cardID", "dateAdded"), wishlist_rows),
        "",
    ]
    return "\n".join(sections)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate init-prod.sql combining Pocket cards and dummy accounts."
    )
    parser.add_argument(
        "--sets",
        nargs="+",
        default=list(DEFAULT_SET_IDS),
        help="TCGdex set IDs to include (default: %(default)s).",
    )
    parser.add_argument(
        "--card-limit",
        type=int,
        default=None,
        help="Maximum number of cards to include (default: all fetched).",
    )
    parser.add_argument(
        "--users",
        type=int,
        default=DEFAULT_USER_COUNT,
        help="Number of dummy users to create (default: %(default)s).",
    )
    parser.add_argument(
        "--collection-range",
        type=int,
        nargs=2,
        metavar=("MIN", "MAX"),
        default=DEFAULT_COLLECTION_RANGE,
        help="Min/max cards per user collection (default: %(default)s).",
    )
    parser.add_argument(
        "--wishlist-range",
        type=int,
        nargs=2,
        metavar=("MIN", "MAX"),
        default=DEFAULT_WISHLIST_RANGE,
        help="Min/max cards per user wishlist (default: %(default)s).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional RNG seed for reproducible account data.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Destination SQL file (default: {DEFAULT_OUTPUT}).",
    )
    return parser.parse_args()


async def main():
    args = parse_args()
    if args.seed is not None:
        random.seed(args.seed)

    min_col, max_col = args.collection_range
    min_wish, max_wish = args.wishlist_range
    if min_col > max_col or min_wish > max_wish:
        raise SystemExit("ERROR: min range values must be <= max values.")

    cards, set_details = await fetch_cards_for_sets(args.sets)
    if not cards:
        raise SystemExit("ERROR: No cards fetched. Cannot continue.")

    if args.card_limit is not None:
        cards = cards[: args.card_limit]

    print(f"Total cards included: {len(cards)}")
    card_sql = generate_card_sql(cards, set_details)

    card_ids = [card.id for card in cards]
    if not card_ids:
        raise SystemExit("ERROR: No card IDs for account generation.")

    base_date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    users = generate_dummy_users(args.users, base_date)
    collections = build_collection_entries(users, card_ids, min_col, max_col)
    wishlists = build_wishlist_entries(users, card_ids, min_wish, max_wish)
    account_sql = generate_account_sql(users, collections, wishlists)

    final_sql = "\n".join(
        [
            "USE app_db;",
            "",
            card_sql.strip(),
            account_sql.strip(),
            "",
        ]
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(final_sql, encoding="utf-8")

    print(f"✅ init-prod.sql written to {args.output}")
    print(f"   Users: {len(users)}  Collections: {len(collections)}  Wishlists: {len(wishlists)}")


if __name__ == "__main__":
    asyncio.run(main())
