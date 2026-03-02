import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "pharma.db")

def init_database():
    """Initialize SQLite database with sample medicine data"""
    
    # Remove existing database
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Removed existing database")
    
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
    
    # Sample medicine data (50+ common medicines)
    medicines = [
        # Pain Relief
        ('Crocin', 'Paracetamol', '500mg', 'GSK', 'Analgesic'),
        ('Dolo 650', 'Paracetamol', '650mg', 'Micro Labs', 'Analgesic'),
        ('Calpol', 'Paracetamol', '500mg', 'GSK', 'Analgesic'),
        ('Aspirin', 'Acetylsalicylic Acid', '75mg', 'Bayer', 'Analgesic'),
        ('Brufen', 'Ibuprofen', '400mg', 'Abbott', 'NSAID'),
        ('Combiflam', 'Ibuprofen + Paracetamol', '400mg+325mg', 'Sanofi', 'Analgesic'),
        ('Voveran', 'Diclofenac', '50mg', 'Novartis', 'NSAID'),
        
        # Antibiotics
        ('Augmentin', 'Amoxicillin + Clavulanic Acid', '625mg', 'GSK', 'Antibiotic'),
        ('Azithral', 'Azithromycin', '500mg', 'Alembic', 'Antibiotic'),
        ('Ciprofloxacin', 'Ciprofloxacin', '500mg', 'Cipla', 'Antibiotic'),
        ('Zifi', 'Cefixime', '200mg', 'FDC', 'Antibiotic'),
        ('Amoxil', 'Amoxicillin', '500mg', 'GSK', 'Antibiotic'),
        ('Mox', 'Amoxicillin', '500mg', 'Ranbaxy', 'Antibiotic'),
        
        # Antihistamines & Allergy
        ('Allegra', 'Fexofenadine', '120mg', 'Sanofi', 'Antihistamine'),
        ('Cetrizine', 'Cetirizine', '10mg', 'Dr Reddys', 'Antihistamine'),
        ('Avil', 'Pheniramine', '25mg', 'Sanofi', 'Antihistamine'),
        
        # Antacids & Digestive
        ('Pantoprazole', 'Pantoprazole', '40mg', 'Sun Pharma', 'Antacid'),
        ('Omez', 'Omeprazole', '20mg', 'Dr Reddys', 'Antacid'),
        ('Ranitidine', 'Ranitidine', '150mg', 'GSK', 'Antacid'),
        ('Pan 40', 'Pantoprazole', '40mg', 'Alkem', 'Antacid'),
        ('Gelusil', 'Aluminium Hydroxide + Magnesium', '500mg', 'Pfizer', 'Antacid'),
        
        # Diabetes
        ('Glucophage', 'Metformin', '500mg', 'Merck', 'Antidiabetic'),
        ('Glycomet', 'Metformin', '850mg', 'USV', 'Antidiabetic'),
        ('Amaryl', 'Glimepiride', '2mg', 'Sanofi', 'Antidiabetic'),
        
        # Hypertension
        ('Amlodipine', 'Amlodipine', '5mg', 'Pfizer', 'Antihypertensive'),
        ('Telma', 'Telmisartan', '40mg', 'Glenmark', 'Antihypertensive'),
        ('Losar', 'Losartan', '50mg', 'Cipla', 'Antihypertensive'),
        ('Metoprolol', 'Metoprolol', '50mg', 'Ajanta', 'Beta Blocker'),
        
        # Vitamins & Supplements
        ('Becosules', 'Vitamin B Complex', 'Multi', 'Pfizer', 'Vitamin'),
        ('Neurobion', 'Vitamin B1+B6+B12', 'Multi', 'Merck', 'Vitamin'),
        ('Shelcal', 'Calcium + Vitamin D3', '500mg', 'Torrent', 'Supplement'),
        ('Zincovit', 'Multivitamin + Minerals', 'Multi', 'Apex', 'Supplement'),
        
        # Respiratory
        ('Asthalin', 'Salbutamol', '4mg', 'Cipla', 'Bronchodilator'),
        ('Deriphyllin', 'Theophylline', '300mg', 'Zydus', 'Bronchodilator'),
        ('Montair', 'Montelukast', '10mg', 'Cipla', 'Anti-Asthmatic'),
        
        # Cold & Cough
        ('Sinarest', 'Paracetamol + Chlorpheniramine', '500mg+2mg', 'Centaur', 'Cold Relief'),
        ('Chericof', 'Dextromethorphan', '10mg/5ml', 'Alkem', 'Cough Syrup'),
        ('D Cold', 'Phenylephrine + Paracetamol', '5mg+325mg', 'Paras', 'Cold Relief'),
        
        # Antimalarial
        ('Lariago', 'Chloroquine', '250mg', 'Ipca', 'Antimalarial'),
        ('Falcigo', 'Artemether + Lumefantrine', '20mg+120mg', 'Ipca', 'Antimalarial'),
        
        # Antiemetic
        ('Ondem', 'Ondansetron', '4mg', 'Alkem', 'Antiemetic'),
        ('Perinorm', 'Metoclopramide', '10mg', 'Ipca', 'Antiemetic'),
        
        # Sedatives & Anxiolytics
        ('Ativan', 'Lorazepam', '2mg', 'Pfizer', 'Anxiolytic'),
        ('Alprax', 'Alprazolam', '0.5mg', 'Torrent', 'Anxiolytic'),
        
        # Miscellaneous
        ('Disprin', 'Aspirin', '325mg', 'Reckitt', 'Analgesic'),
        ('Livogen', 'Iron + Folic Acid', '100mg+1.5mg', 'Merck', 'Supplement'),
        ('Evion', 'Vitamin E', '400mg', 'Merck', 'Vitamin'),
        ('Rantac', 'Ranitidine', '150mg', 'JB Pharma', 'Antacid'),
        ('Norflox', 'Norfloxacin', '400mg', 'Cipla', 'Antibiotic'),
    ]
    
    # Insert sample data
    cursor.executemany('''
        INSERT INTO medicines (brand_name, generic_name, strength, manufacturer, category)
        VALUES (?, ?, ?, ?, ?)
    ''', medicines)
    
    conn.commit()
    print(f"Database initialized successfully with {len(medicines)} medicines")
    print(f"Database location: {DB_PATH}")
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM medicines")
    count = cursor.fetchone()[0]
    print(f"Verified: {count} medicines in database")
    
    conn.close()

if __name__ == "__main__":
    init_database()
