"""SQLite persistence for public listings, observations and collector state."""
import contextlib
import hashlib
import json
import sqlite3
import time

class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.connect() as db:
            db.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY,value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS listings(id TEXT PRIMARY KEY,body TEXT NOT NULL,active INTEGER NOT NULL,seen REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS events(sequence INTEGER PRIMARY KEY AUTOINCREMENT,fingerprint TEXT UNIQUE NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL,observed REAL NOT NULL);
            CREATE INDEX IF NOT EXISTS events_observed ON events(observed);
            CREATE TABLE IF NOT EXISTS updates_done(id INTEGER PRIMARY KEY,completed REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS reports(user_id INTEGER NOT NULL,item TEXT NOT NULL,created REAL NOT NULL,PRIMARY KEY(user_id,item));
            ''')

    @contextlib.contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def get(self, key, default=None):
        with self.connect() as db:
            row = db.execute('SELECT value FROM state WHERE key=?', (key,)).fetchone()
            return json.loads(row['value']) if row else default

    def report(self,user_id,item):
        with self.connect() as db:
            cursor=db.execute('INSERT OR IGNORE INTO reports VALUES(?,?,?)',(user_id,item,time.time()))
            return cursor.rowcount==1

    def reports(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT user_id,item,created FROM reports ORDER BY created DESC LIMIT 500')]

    def set(self, key, value):
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO state VALUES(?,?)', (key, json.dumps(value, ensure_ascii=False)))

    @staticmethod
    def dump(value):
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))

    def event(self, kind, body, db=None):
        payload = self.dump(body)
        # Preserve repeated transitions at different source times; identical observations deduplicate.
        digest = hashlib.sha256((kind + '\0' + payload).encode()).hexdigest()
        def insert(conn):
            conn.execute('INSERT OR IGNORE INTO events(fingerprint,kind,body,observed) VALUES(?,?,?,?)', (digest, kind, payload, time.time()))
        if db is not None:
            insert(db)
        else:
            with self.connect() as conn:
                insert(conn)

    def snapshot(self, items, *, complete, started):
        now = time.time()
        with self.connect() as db:
            for item in items:
                body = self.dump(item)
                previous = db.execute('SELECT body,active FROM listings WHERE id=?', (item['id'],)).fetchone()
                if not previous or previous['body'] != body or not previous['active']:
                    self.event('listing_observed', {'item':item,'observed_at':now}, db)
                db.execute('INSERT OR REPLACE INTO listings VALUES(?,?,1,?)', (item['id'], body, now))
            if complete:
                old = db.execute('SELECT id FROM listings WHERE active=1 AND seen<?', (started,)).fetchall()
                for row in old:
                    self.event('listing_no_longer_seen', {'id':row['id'],'observed_at':now}, db)
                db.execute('UPDATE listings SET active=0 WHERE seen<?', (started,))
            db.execute('INSERT OR REPLACE INTO state VALUES(?,?)', ('catalog_status',self.dump({'updated_at':now,'complete':complete,'observed_count':len(items)})))

    def catalog(self, limit=100, offset=0):
        with self.connect() as db:
            total = db.execute('SELECT COUNT(*) FROM listings WHERE active=1').fetchone()[0]
            rows = db.execute('SELECT body FROM listings WHERE active=1 ORDER BY seen DESC,id LIMIT ? OFFSET ?', (limit, offset)).fetchall()
            return {'items':[json.loads(r['body']) for r in rows], 'total':total, 'next_offset':offset+len(rows) if offset+len(rows)<total else None, **self.get('catalog_status',{})}

    def history(self, after=0, limit=100):
        with self.connect() as db:
            rows=db.execute('SELECT sequence,kind,body,observed FROM events WHERE sequence>? ORDER BY sequence LIMIT ?', (after,limit)).fetchall()
        return [{'sequence':r['sequence'],'kind':r['kind'],'data':json.loads(r['body']),'observed_at':r['observed']} for r in rows]

    def update_done(self, update_id):
        with self.connect() as db:
            return db.execute('SELECT 1 FROM updates_done WHERE id=?', (update_id,)).fetchone() is not None

    def mark_update(self, update_id):
        with self.connect() as db:
            db.execute('INSERT OR IGNORE INTO updates_done VALUES(?,?)', (update_id,time.time()))
            db.execute('DELETE FROM updates_done WHERE completed<?', (time.time()-7*86400,))
