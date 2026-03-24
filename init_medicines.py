#!/usr/bin/env python3
"""Initialize medicine database"""
import sqlite3
import os

DB_PATH = r"c:\Users\neera\Downloads\Pharma-for-You\backend\pharma.db"

# Remove old database
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print("✓ Removed old database")

# Create new database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create medicines table
cursor.execute('''
    CREATE TABLE medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_name TEXT NOT NULL,
        generic_name TEXT NOT NULL,
        strength TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        category TEXT NOT NULL
    )
''')

# Sample medicine data
medicines = [
    ('Crocin', 'Paracetamol', '500mg', 'GSK', 'Analgesic'),
    ('Dolo 650', 'Paracetamol', '650mg', 'Micro Labs', 'Analgesic'),
    ('Calpol', 'Paracetamol', '500mg', 'GSK', 'Analgesic'),
    ('Aspirin', 'Acetylsalicylic Acid', '75mg', 'Bayer', 'Analgesic'),
    ('Brufen', 'Ibuprofen', '400mg', 'Abbott', 'NSAID'),
    ('Combiflam', 'Ibuprofen + Paracetamol', '400mg+325mg', 'Sanofi', 'Analgesic'),
    ('Voveran', 'Diclofenac', '50mg', 'Novartis', 'NSAID'),
    ('Augmentin', 'Amoxicillin + Clavulanic Acid', '625mg', 'GSK', 'Antibiotic'),
    ('Azithral', 'Azithromycin', '500mg', 'Alembic', 'Antibiotic'),
    ('Ciprofloxacin', 'Ciprofloxacin', '500mg', 'Cipla', 'Antibiotic'),
    ('Allegra', 'Fexofenadine', '120mg', 'Sanofi', 'Antihistamine'),
    ('Cetrizine', 'Cetrizine', '10mg', 'Cipla', 'Antihistamine'),
    ('Omeprazole', 'Omeprazole', '20mg', 'Cipla', 'Antacid'),
    ('Eno', 'Sodium Bicarbonate', '1.9g', 'GSK', 'Antacid'),
]

cursor.executemany(
    'INSERT INTO medicines (brand_name, generic_name, strength, manufacturer, category) VALUES (?, ?, ?, ?, ?)',
    medicines
)

conn.commit()
conn.close()

print(f"✓ Database initialized at {DB_PATH}")
print(f"✓ Added {len(medicines)} medicines")
