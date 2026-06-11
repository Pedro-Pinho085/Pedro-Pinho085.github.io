import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'freitas.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS products (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            description TEXT    DEFAULT '',
            price       REAL    NOT NULL,
            img_url     TEXT    DEFAULT '',
            category    TEXT    DEFAULT 'Geral',
            unit        TEXT    DEFAULT 'un',
            active      INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS orders (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name   TEXT    NOT NULL,
            customer_phone  TEXT    DEFAULT '',
            total           REAL    NOT NULL,
            status          TEXT    DEFAULT 'pendente',
            created_at      TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id     INTEGER NOT NULL REFERENCES orders(id),
            product_id   INTEGER NOT NULL,
            product_name TEXT    NOT NULL,
            price        REAL    NOT NULL,
            quantity     INTEGER NOT NULL,
            unit         TEXT    DEFAULT 'un'
        );
    ''')

    count = db.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    if count == 0:
        products = [
            # PÃ£es e Mercearia
            ("PÃ£o FrancÃªs", "Fresquinho, assado todo dia", 0.79,
             "https://www.receitasnestle.com.br/sites/default/files/srh_recipes/32c7bfef09e7e1e9e28e43f586fbbf58.jpg",
             "PÃ£es", "un"),
            ("PÃ£o de Forma Pullman", "400g â macio e saboroso", 8.49,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/7891203001059-pao-de-forma-pullman-tradicional-400g.jpg",
             "PÃ£es", "pct"),
            ("PÃ£o de Hot Dog", "Pacote com 6 unidades", 5.99,
             "https://www.receitasnestle.com.br/sites/default/files/srh_recipes/3dca5c74e14df73e4a66ab96a04a7e09.jpg",
             "PÃ£es", "pct"),

            # Hortifruti
            ("Banana Prata", "Cacho selecionado", 4.99,
             "https://www.sabornamesa.com.br/media/k2/items/cache/81f37b01e5b0f5c0abe9604bc9863ae0_XL.jpg",
             "Hortifruti", "kg"),
            ("Tomate", "Fresco e vermelho", 6.99,
             "https://www.sabornamesa.com.br/media/k2/items/cache/a1e7be0a7e6ef9a0de9e08f7523d8c0a_XL.jpg",
             "Hortifruti", "kg"),
            ("Cebola", "Por quilo", 3.49,
             "https://www.sabornamesa.com.br/media/k2/items/cache/c37281f8571d2d6ad2b3db4f7ae1dd02_XL.jpg",
             "Hortifruti", "kg"),
            ("Alface Crespa", "PÃ© fresco", 2.49,
             "https://www.sabornamesa.com.br/media/k2/items/cache/81f37b01e5b0f5c0abe9604bc9863ae0_XL.jpg",
             "Hortifruti", "pÃ©"),

            # Cereais
            ("Arroz Tio JoÃ£o 5kg", "Tipo 1, grÃ£o longo", 22.90,
             "https://www.receitasnestle.com.br/sites/default/files/srh_recipes/32c7bfef09e7e1e9e28e43f586fbbf58.jpg",
             "Cereais", "pct"),
            ("FeijÃ£o Carioca 1kg", "GrÃ£o tipo 1", 7.99,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/feijao.jpg",
             "Cereais", "pct"),
            ("MacarrÃ£o Adria 500g", "Espaguete nÂ°8", 3.49,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/macarrao.jpg",
             "Cereais", "pct"),
            ("FubÃ¡ Mimoso 1kg", "Ideal para cuscuz", 3.29,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/fuba.jpg",
             "Cereais", "pct"),

            # Bebidas / Cerveja
            ("Cerveja Brahma Lata 350ml", "Gelada e refrescante", 3.49,
             "https://www.receitasnestle.com.br/sites/default/files/srh_recipes/brahma.jpg",
             "Bebidas", "un"),
            ("Cerveja Skol Lata 350ml", "A cerveja que desce redondo", 3.29,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/skol.jpg",
             "Bebidas", "un"),
            ("Refrigerante Coca-Cola 2L", "Gelada", 9.99,
             "https://imgs.search.brave.com/FFnUMLke_5hPAD6lsCMnWHf29QBTMUoD-ZLiboZKkGs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kbHB2aW5ob3MuYWdpbGVjZG4uY29tLmJyLzAwMTIwMDAwXzEuanBnP3Y9MTY3LTkzNTI0NjkwMw",
             "Bebidas", "un"),
            ("Ãgua Mineral 500ml", "Sem gÃ¡s", 2.49,
             "https://www.coca-cola.com/content/dam/onexp/br/pt/brand-landing/crystal-may-2021/br-pt-Crystal-water-regular-234x700px.png/width1960.png",
             "Bebidas", "un"),

            # CarvÃ£o e outros
            ("CarvÃ£o Vegetal 3kg", "Churrasqueiro de verdade", 14.90,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/carvao.jpg",
             "Outros", "pct"),
            ("GÃ¡s de Cozinha 13kg", "Entrega disponÃ­vel", 109.90,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/gas.jpg",
             "Outros", "un"),
            ("Ãleo de Soja Liza 900ml", "Para todos os dias", 6.49,
             "https://superprix.vteximg.com.br/arquivos/ids/179017/oleo.jpg",
             "Outros", "un"),
        ]
        db.executemany(
            'INSERT INTO products (name, description, price, img_url, category, unit) VALUES (?,?,?,?,?,?)',
            products
        )
    db.commit()
