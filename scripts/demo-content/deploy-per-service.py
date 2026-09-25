#!/usr/bin/env python3
"""
Azeebo+ Per-Service Database Seeder
Seeds demo data into each microservice's PostgreSQL database.
Handles different schema versions across services.

Usage: python3 scripts/demo-content/deploy-per-service.py
"""
import subprocess
import sys

PG_BIN = "/Users/deprof/Library/FlyEnv/env/postgresql/bin"
PSQL = f"{PG_BIN}/psql -U postgres -t -A"

def psql(db, sql):
    """Run SQL against a database, return output."""
    import tempfile, os
    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
        f.write(sql)
        f.flush()
        cmd = f'{PSQL} -d {db} -f {f.name}'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        os.unlink(f.name)
    return result.stdout.strip(), result.stderr.strip()

def table_exists(db, table):
    out, _ = psql(db, f"SELECT 1 FROM information_schema.tables WHERE table_name='{table}' AND table_schema='public'")
    return out == "1"

def insert_users(db):
    """Insert users with the correct columns for this DB's schema."""
    # Check which user schema this DB uses
    out, _ = psql(db, """
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='users' AND table_schema='public' 
        ORDER BY ordinal_position
    """)
    cols = set(out.split('\n')) if out else set()
    
    PW = '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.'
    
    users = [
        ('a0000001-0000-0000-0000-000000000001','admin@azeeboplus.com','Admin Chidi','https://ui-avatars.com/api/?name=Chidi+Okonkwo&background=1B5E20&color=fff','admin','2025-01-01T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000002','moderator@azeeboplus.com','Mod Amina','https://ui-avatars.com/api/?name=Amina+Bello&background=E65100&color=fff','moderator','2025-01-15T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000003','creator1@azeeboplus.com','Tunde Creates','https://ui-avatars.com/api/?name=Tunde+Adebayo&background=1565C0&color=fff','user','2025-02-01T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000004','creator2@azeeboplus.com','Ngozi Vibes','https://ui-avatars.com/api/?name=Ngozi+Eze&background=6A1B9A&color=fff','user','2025-02-15T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000005','creator3@azeeboplus.com','Emeka Studios','https://ui-avatars.com/api/?name=Emeka+Nwosu&background=B71C1C&color=fff','user','2025-03-01T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000006','user1@azeeboplus.com','Kemi Watch','https://ui-avatars.com/api/?name=Kemi+Adesanya&background=00695C&color=fff','user','2025-03-15T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000007','user2@azeeboplus.com','Olumide F','https://ui-avatars.com/api/?name=Olumide+Fashola&background=4E342E&color=fff','user','2025-04-01T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000008','user3@azeeboplus.com','Fatima A','https://ui-avatars.com/api/?name=Fatima+Abubakar&background=0277BD&color=fff','user','2025-04-15T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000009','banned@azeeboplus.com','Chukwu M',None,'user','2025-02-20T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000010','unverified@azeeboplus.com','Yemi O',None,'user','2025-05-01T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000011','sportscreator@azeeboplus.com','Chinedu Sports','https://ui-avatars.com/api/?name=Chinedu+Obi&background=E65100&color=fff','user','2025-03-10T00:00:00Z'),
        ('a0000001-0000-0000-0000-000000000012','gamer@azeeboplus.com','Tunde Gaming','https://ui-avatars.com/api/?name=Tunde+Olatunji&background=1A237E&color=fff','user','2025-04-01T00:00:00Z'),
    ]
    
    for uid, email, name, avatar, role, created in users:
        avatar_sql = f"'{avatar}'" if avatar else "NULL"
        
        if 'passwordHash' in cols:
            # content-style schema
            verified = 'true' if email not in ('unverified@azeeboplus.com',) else 'false'
            sql = f"""INSERT INTO users (id, email, "passwordHash", "displayName", avatar, role, "isEmailVerified", "isActive", "createdAt", "updatedAt")
                VALUES ('{uid}', '{email}', '{PW}', '{name}', {avatar_sql}, '{role}', {verified}, true, '{created}', '{created}')
                ON CONFLICT (id) DO NOTHING"""
        elif 'password' in cols:
            # auth-style schema  
            verified = 'true' if email not in ('unverified@azeeboplus.com',) else 'false'
            sql = f"""INSERT INTO users (id, email, password, "displayName", avatar, role, "isVerified", "createdAt", "updatedAt")
                VALUES ('{uid}', '{email}', '{PW}', '{name}', {avatar_sql}, '{role}', {verified}, '{created}', '{created}')
                ON CONFLICT (id) DO NOTHING"""
        else:
            # minimal schema
            sql = f"""INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
                VALUES ('{uid}', '{email}', '{name}', '{role}', '{created}', '{created}')
                ON CONFLICT (id) DO NOTHING"""
        
        out, err = psql(db, sql)
        if err and 'does not exist' not in err and 'duplicate' not in err:
            pass  # silent
    
    _, err = psql(db, "SELECT COUNT(*) FROM users")
    print(f"  users inserted: check manually")

def run_seed_for_db(db, label):
    """Run the seed SQL against a specific database, ignoring table-not-found errors."""
    seed_file = f"{sys.path[0] if sys.path[0] else '.'}/migrations/002_seed_demo_data.sql"
    import os
    seed_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations', '002_seed_demo_data.sql')
    
    cmd = f'{PG_BIN}/psql -U postgres -d {db} -f {seed_file} 2>&1'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    output = result.stdout + result.stderr
    
    # Count successes and non-critical errors
    inserts = output.count('INSERT 0')
    missing_tables = output.count('does not exist')
    fk_violations = output.count('foreign key constraint')
    
    print(f"  {label}: {inserts} inserts, {missing_tables} missing tables (skipped), {fk_violations} FK violations")
    return inserts

def seed_content_service():
    """Seed content-service specific data that needs the content DB schema."""
    db = 'azeebo_content'
    
    # Universes
    universes = [
        ("u0000001-0000-0000-0000-000000000001","reality","Reality TV","Nigerian reality shows including Big Brother, dating shows, and competition series.","🎬","#E91E63","true",1),
        ("u0000001-0000-0000-0000-000000000002","creator","Creator Content","Original content from top Nigerian creators, vlogs, and independent productions.","🎨","#9C27B0","true",2),
        ("u0000001-0000-0000-0000-000000000003","lifestyle","Lifestyle","Fashion, food, travel, wellness, and everyday Nigerian living.","🏠","#FF9800","true",3),
        ("u0000001-0000-0000-0000-000000000004","movie","Movies","Nollywood blockbusters, indie films, and cinematic masterpieces.","🎥","#2196F3","true",4),
        ("u0000001-0000-0000-0000-000000000005","comedy","Comedy","Stand-up specials, comedy sketches, and hilarious Naija content.","😂","#FFEB3B","true",5),
        ("u0000001-0000-0000-0000-000000000006","sports","Sports","Football highlights, basketball, athletics, and sports commentary.","⚽","#4CAF50","true",6),
        ("u0000001-0000-0000-0000-000000000007","music","Music","Music videos, concert recordings, acoustic sessions, and behind-the-scenes.","🎵","#FF5722","true",7),
        ("u0000001-0000-0000-0000-000000000008","games","Gaming","Nigerian gaming content, esports, reviews, and live streams.","🎮","#607D8B","true",8),
        ("u0000001-0000-0000-0000-000000000009","vertical","Vertical Series","Premium African storytelling with interconnected characters and lore.","📖","#8B5CF6","true",9),
    ]
    
    for u in universes:
        sql = f"""INSERT INTO universes (id, name, "displayName", description, icon, color, "isEnabled", "sortOrder")
            VALUES ('{u[0]}','{u[1]}','{u[2]}','{u[3]}','{u[4]}','{u[5]}',{u[6]},{u[7]})
            ON CONFLICT (id) DO NOTHING"""
        psql(db, sql)
    
    # Categories
    cats = [
        ("cat00001-0000-0000-0000-000000000001","Trending Now","trending-now","Currently popular content","🔥","#F44336"),
        ("cat00001-0000-0000-0000-000000000002","New Releases","new-releases","Freshly published content","✨","#FF9800"),
        ("cat00001-0000-0000-0000-000000000003","Editor Picks","editor-picks","Handpicked by our editorial team","⭐","#FFD700"),
        ("cat00001-0000-0000-0000-000000000004","Exclusive","exclusive","Only on Azeebo+","👑","#9C27B0"),
        ("cat00001-0000-0000-0000-000000000005","Free Content","free-content","Watch for free","🆓","#4CAF50"),
        ("cat00001-0000-0000-0000-000000000006","Live Events","live-events","Upcoming and live screenings","📡","#E91E63"),
        ("cat00001-0000-0000-0000-000000000007","Nollywood Classics","nollywood-classics","Timeless Nigerian cinema classics","🎞️","#795548"),
        ("cat00001-0000-0000-0000-000000000008","Documentaries","documentaries","Real stories, real impact","📽️","#607D8B"),
    ]
    for c in cats:
        sql = f"""INSERT INTO categories (id, name, slug, description, icon, color)
            VALUES ('{c[0]}','{c[1]}','{c[2]}','{c[3]}','{c[4]}','{c[5]}')
            ON CONFLICT (id) DO NOTHING"""
        psql(db, sql)

    # Tags
    tags = [
        ("tag00001-0000-0000-0000-000000000001","naija","Nigerian content"),
        ("tag00001-0000-0000-0000-000000000002","big-brother","Big Brother related"),
        ("tag00001-0000-0000-0000-000000000003","nollywood","Nigerian cinema"),
        ("tag00001-0000-0000-0000-000000000004","afrobeats","Afrobeats music"),
        ("tag00001-0000-0000-0000-000000000005","comedy","Funny content"),
        ("tag00001-0000-0000-0000-000000000006","fashion","Fashion and style"),
        ("tag00001-0000-0000-0000-000000000007","food","Food and cooking"),
        ("tag00001-0000-0000-0000-000000000008","football","Football content"),
        ("tag00001-0000-0000-0000-000000000009","reality-show","Reality show content"),
        ("tag00001-0000-0000-0000-000000000010","premiere","Premiere releases"),
        ("tag00001-0000-0000-0000-000000000011","behind-the-scenes","BTS content"),
        ("tag00001-0000-0000-0000-000000000012","exclusive","Exclusive content"),
        ("tag00001-0000-0000-0000-000000000013","documentary","Documentary content"),
        ("tag00001-0000-0000-0000-000000000014","gaming","Gaming content"),
        ("tag00001-0000-0000-0000-000000000015","live","Live content"),
    ]
    for t in tags:
        sql = f"""INSERT INTO tags (id, name, description)
            VALUES ('{t[0]}','{t[1]}','{t[2]}')
            ON CONFLICT (id) DO NOTHING"""
        psql(db, sql)
    
    print("  Content basics (universes, categories, tags): done")

def main():
    print("=== Azeebo+ Per-Service Demo Data Seeder ===\n")
    
    # Step 1: Insert users into every DB that has a users table
    print("--- Step 1: Inserting users ---")
    dbs_with_users = ['azeebo_auth', 'azeebo_user', 'azeebo_content', 'azeebo_wallet',
                      'azeebo_creator', 'azeebo_engagement', 'azeebo_notification',
                      'azeebo_reward', 'azeebo_referral', 'azeebo_moderation',
                      'azeebo_support', 'azeebo_search', 'azeebo_recommendation',
                      'azeebo_subscription', 'azeebo_media', 'azeebo_analytics',
                      'azeebo_messaging', 'azeebo_queue', 'azeebo_vertical',
                      'azeebo_movie', 'azeebo_lifestyle', 'azeebo_reality',
                      'azeebo_sports', 'azeebo_games', 'azeebo_comedy']
    
    for db in dbs_with_users:
        if table_exists(db, 'users'):
            insert_users(db)
            print(f"  {db}: users inserted")
    
    # Step 2: Seed content basics
    print("\n--- Step 2: Seeding content basics ---")
    seed_content_service()
    
    # Step 3: Run full seed SQL against each DB (non-existent tables are skipped)
    print("\n--- Step 3: Running seed SQL against each database ---")
    all_dbs = [
        ('azeebo_auth', 'Auth'),
        ('azeebo_content', 'Content'),
        ('azeebo_wallet', 'Wallet'),
        ('azeebo_user', 'User'),
        ('azeebo_creator', 'Creator'),
        ('azeebo_reality', 'Reality'),
        ('azeebo_sports', 'Sports'),
        ('azeebo_games', 'Games'),
        ('azeebo_comedy', 'Comedy'),
        ('azeebo_engagement', 'Engagement'),
        ('azeebo_notification', 'Notification'),
        ('azeebo_reward', 'Reward'),
        ('azeebo_referral', 'Referral'),
        ('azeebo_moderation', 'Moderation'),
        ('azeebo_support', 'Support'),
        ('azeebo_search', 'Search'),
        ('azeebo_recommendation', 'Recommendation'),
    ]
    
    for db, label in all_dbs:
        run_seed_for_db(db, label)
    
    # Step 4: Verify
    print("\n--- Verification ---")
    checks = [
        ('azeebo_auth', 'users', 12),
        ('azeebo_content', 'content_items', 50),
        ('azeebo_content', 'universes', 9),
        ('azeebo_content', 'categories', 8),
        ('azeebo_content', 'tags', 15),
        ('azeebo_wallet', 'wallets', 5),
        ('azeebo_wallet', 'wallet_transactions', 20),
    ]
    
    for db, table, expected in checks:
        out, _ = psql(db, f"SELECT COUNT(*) FROM {table}")
        count = int(out) if out.isdigit() else 0
        status = "✓" if count >= expected else f"✗ (expected {expected})"
        print(f"  {db}.{table}: {count} rows {status}")
    
    print("\n=== Done ===")

if __name__ == "__main__":
    main()
