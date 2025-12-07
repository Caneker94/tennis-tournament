import bcrypt from 'bcryptjs';
import db, { initializeDatabase } from './database.js';

async function seed() {
  try {
    console.log('Veritabanı başlatılıyor...');
    await initializeDatabase();

    // Check if admin already exists
    const existingAdmin = await db.getAsync(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut!');
      console.log('Kullanıcı adı: admin');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.runAsync(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'Admin User', 'admin']
    );

    console.log('✅ Admin kullanıcısı oluşturuldu!');
    console.log('-----------------------------------');
    console.log('Kullanıcı Adı: admin');
    console.log('Şifre: admin123');
    console.log('-----------------------------------');
    console.log('⚠️  Güvenlik için bu şifreyi değiştirmeniz önerilir!');

    // Create sample categories
    console.log('\n📋 Örnek kategoriler oluşturuluyor...');
    await db.runAsync('INSERT INTO categories (name, gender) VALUES (?, ?)', ['Elite', 'male']);
    await db.runAsync('INSERT INTO categories (name, gender) VALUES (?, ?)', ['Master', 'male']);
    await db.runAsync('INSERT INTO categories (name, gender) VALUES (?, ?)', ['Rising', 'male']);
    await db.runAsync('INSERT INTO categories (name, gender) VALUES (?, ?)', ['Master', 'female']);
    await db.runAsync('INSERT INTO categories (name, gender) VALUES (?, ?)', ['Rising', 'female']);

    console.log('✅ Kategoriler oluşturuldu!');
    console.log('  - Erkekler: Elite, Master, Rising');
    console.log('  - Kadınlar: Master, Rising');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed işlemi başarısız:', error);
    process.exit(1);
  }
}

seed();
