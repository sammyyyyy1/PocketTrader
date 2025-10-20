"""
Generate SQL INSERT statements for Pokemon TCG Pocket cards from TCGdex API
This script fetches cards from the Genetic Apex (A1) set and generates SQL for init.sql
"""

import asyncio
import sys
from pathlib import Path

try:
    from tcgdexsdk import TCGdex, Language
except ImportError:
    print("ERROR: tcgdex-sdk not installed")
    print("Please run: pip install tcgdex-sdk")
    sys.exit(1)


# Rarity mapping from TCGdex to our database format
RARITY_MAP = {
    "Four Diamond": "4D",
    "Three Star": "3S",  # Crown rare (mapped to 3D for consistency)
    "Three Diamond": "3D",  # 3 Diamond (Rare holo)
    "Two Star": "2S",       # 2 Star
    "One Star": "1S",       # 1 Star  
    "Two Diamond": "2D",    # 2 Diamond (Uncommon)
    "One Diamond": "1D",
    "Crown": "C",
}

# Pack assignment based on card number ranges (based on Genetic Apex structure)
def get_pack_name(card) -> str:
    """Determine which pack a card belongs to based on boosters field"""
    # First check if the card has boosters field (pack-specific cards)
    if hasattr(card, 'boosters') and card.boosters and len(card.boosters) > 0:
        booster_name = card.boosters[0].name if hasattr(card.boosters[0], 'name') else str(card.boosters[0])
        # Map booster names to our pack names
        if 'Charizard' in booster_name:
            return "Charizard"
        elif 'Pikachu' in booster_name:
            return "Pikachu"
        elif 'Mewtwo' in booster_name:
            return "Mewtwo"
    
    # If no boosters field or unknown, mark as Shared
    return "Shared"


async def fetch_genetic_apex_cards():
    """Fetch all cards from the Genetic Apex (A1) set"""
    tcgdex = TCGdex(Language.EN)
    
    print("Fetching Genetic Apex (A1) set cards...")
    
    try:
        # Get the A1 set
        card_set = await tcgdex.set.get("A1")
        
        if not card_set or not hasattr(card_set, 'cards'):
            print("ERROR: Could not fetch A1 set or no cards found")
            return []
        
        cards = []
        total_cards = len(card_set.cards)
        print(f"Found {total_cards} cards in the set")
        
        # Fetch detailed information for each card
        for idx, card_ref in enumerate(card_set.cards, 1):
            print(f"Fetching card {idx}/{total_cards}: {card_ref.id}")
            card = await tcgdex.card.get(card_ref.id)
            
            if card:
                # Debug first few cards to see structure
                if idx <= 3:
                    print(f"  DEBUG - Card {card.id}: rarity={getattr(card, 'rarity', 'N/A')}, types={getattr(card, 'types', 'N/A')}")
                cards.append(card)
            
            # Add small delay to avoid rate limiting
            if idx % 10 == 0:
                await asyncio.sleep(0.5)
        
        return cards
    
    except Exception as e:
        print(f"ERROR fetching cards: {e}")
        return []


def map_rarity(rarity: str) -> str:
    """Map TCGdex rarity to our database format"""
    return RARITY_MAP.get(rarity, "1D")  # Default to 1D if unknown


def get_card_type(card) -> str:
    """Extract the primary type from a card"""
    # For Pokemon cards
    if hasattr(card, 'types') and card.types and len(card.types) > 0:
        return card.types[0]
    # For Trainer/Energy cards
    elif hasattr(card, 'category') and card.category:
        category = str(card.category)
        # Keep Trainer/Energy as is
        if category in ['Trainer', 'Energy']:
            return category
        return category.capitalize() if category else "Colorless"
    return "Colorless"


def get_image_url(card) -> str:
    """Extract the best available image URL from card data"""
    if hasattr(card, 'image') and card.image:
        image = card.image
        # The API returns image base URL, append format
        if isinstance(image, str):
            # Append high quality format
            return f"{image}/high.webp"
    
    # Fallback: construct URL from card ID if no image field
    return ""


def generate_sql_insert(cards, limit: int = None) -> str:
    """Generate SQL INSERT statements from card data"""
    
    if limit:
        cards = cards[:limit]
    
    sql_lines = [
        "-- Initialize Pokemon Trading Card App Database with Sample Data",
        "USE app_db;",
        "",
        "-- Cards from Genetic Apex (A1) set - fetched from TCGdex API",
        f"-- Total cards: {len(cards)}",
        "",
        "INSERT INTO Card (cardID, name, packName, rarity, type, imageURL) VALUES"
    ]
    
    # Group cards by rarity for better organization
    card_groups = {
        "3D": [],
        "2S": [],
        "1S": [],
        "2D": [],
        "1D": []
    }
    
    for card in cards:
        rarity = map_rarity(getattr(card, 'rarity', '◊'))
        card_groups[rarity].append(card)
    
    all_card_lines = []
    
    # Process each rarity group
    for rarity_code, rarity_name in [("3D", "3 Diamond"), ("2S", "2 Star"), ("1S", "1 Star"), ("2D", "2 Diamond"), ("1D", "1 Diamond")]:
        group_cards = card_groups[rarity_code]
        if not group_cards:
            continue
        
        all_card_lines.append(f"-- {rarity_name} ({len(group_cards)} cards)")
        
        for card in group_cards:
            card_id = card.id
            name = card.name.replace("'", "''")  # Escape single quotes for SQL
            pack_name = get_pack_name(card)
            card_type = get_card_type(card)
            image_url = get_image_url(card)
            
            line = f"('{card_id}', '{name}', '{pack_name}', '{rarity_code}', '{card_type}', '{image_url}')"
            all_card_lines.append(line)
        
        all_card_lines.append("")  # Empty line between groups
    
    # Join all card lines with commas
    card_values = ",\n".join(all_card_lines[:-1])  # Remove last empty line
    
    # Replace the last comma with semicolon
    last_paren = card_values.rfind(")")
    if last_paren != -1:
        card_values = card_values[:last_paren+1] + ";"
    
    sql_lines.append(card_values)
    
    return "\n".join(sql_lines)


async def main():
    """Main function to generate SQL data"""
    print("=== Pokemon TCG Pocket Card Data Generator ===\n")
    
    # Fetch cards
    cards = await fetch_genetic_apex_cards()
    
    if not cards:
        print("\nNo cards fetched. Exiting.")
        return
    
    print(f"\nSuccessfully fetched {len(cards)} cards")
    
    # Ask user how many cards to include
    print("\nHow many cards would you like to include in the database?")
    print(f"Enter a number (1-{len(cards)}) or press Enter for all cards:")
    
    try:
        user_input = input("> ").strip()
        limit = int(user_input) if user_input else None
    except ValueError:
        limit = None
    
    # Generate SQL
    print("\nGenerating SQL INSERT statements...")
    sql = generate_sql_insert(cards, limit)
    
    # Save to file
    output_file = Path(__file__).parent.parent / "app" / "database" / "migrations" / "init_generated.sql"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"\n✅ SQL file generated: {output_file}")
    print(f"   Total cards: {limit if limit else len(cards)}")
    print("\nTo use this file:")
    print("1. Review the generated init_generated.sql")
    print("2. Replace the content of init.sql with init_generated.sql")
    print("3. Run: docker compose down -v && docker compose up --build")


if __name__ == "__main__":
    asyncio.run(main())
