import bcrypt from 'bcryptjs';
import db, { initializeDatabase } from './database.js';

const playersData = `ANIL ACAR	ELITE	0 535 816 33 68
ANIL ÇANAKÇI	ELITE	0 535 226 32 18
BAHADIR DENER	ELITE	0 537 731 36 77
VELİ KORUCU	ELITE	0 534 241 67 36
BERK AĞRALI	ELITE	0 532 520 28 79
BİRTAN GÜLER	ELITE	0 541 360 44 48
BURAK ÜN	ELITE	0 544 302 35 50
EMRE CEBECİ	ELITE	0 532 350 11 12
FATİH YAYLALI	ELITE	0 537 378 30 08
İBRAHİM YASİN KURT	ELITE	0 555 989 29 09
İRFAN KOÇAK	ELITE	0 535 658 43 55
KUBİLAY AKSOY	ELITE	0 544 568 65 79
MEHMET ÖZASLAN	ELITE	0 537 267 95 87
MEHMET REMZİ SÖKMEN	ELITE	0 534 764 83 56
MESUT KESKİN	ELITE	0 536 680 34 77
OGÜN MERT KAYA	ELITE	0 543 295 53 57
OĞUZ AYAZ	ELITE	0 542 679 23 00
ONUR BORAN DUMAN 	ELITE	0 544 393 17 39
ONUR FERE	ELITE	0 545 823 25 92
ONURHAN SAVAŞ	ELITE	0 505 055 62 04
ÖMER SARP NURKAYA	ELITE	0 531 105 36 35
ÖZCAN GEÇİM	ELITE	0 530 497 93 41
ÖZKAN KAYA	ELITE	0 539 303 77 05
SİNAN KAYA	ELITE	0 531 696 52 18
SİNAN MERTOL	ELITE	0 542 679 23 00
TOLGA BOSTANCI	ELITE	0 532 252 59 02
TUNA KAYA	ELITE	0 538 282 84 07
UMUT YEŞİLIRMAK	ELITE	0 537 596 77 82
VELİ BURAK 	ELITE	0 549 694 88 12
X1 OYUNCU	ELITE	0 500 000 00 01
X2 OYUNCU	ELITE	0 500 000 00 02
X3 OYUNCU	ELITE	0 500 000 00 03
MERT AKYOL	ELITE	0 500 000 00 04
ADEM DÜLGER	MASTER	0 552 940 71 00
ALİ SAYGIN ÖGEL	MASTER	0 555 422 61 00
ARDA YÜKSEL	MASTER	0 533 641 86 65
BARIŞ GÜL	MASTER	0 549 596 77 85
BATUHAN BEŞİKCİOĞLU	MASTER	0 532 767 18 78
BERKAN ATASOY	MASTER	0 506 276 22 11
BURAK ÖZEROL	MASTER	0 554 963 27 59
CAN SUNAY	MASTER	0 533 251 50 02
CİHAN ERTAŞ	MASTER	0 539 507 60 12
DERYA DERİNYOL	MASTER	0 532 506 46 38
ENES TAHTALI	MASTER	0 546 433 02 26
EREN ÖZGEN	MASTER	0 507 383 26 22
ERSEN ÇALIK	MASTER	0 537 776 57 76
ERTEKİN TIRPAN	MASTER	0 533 226 21 72
FATİH AVCI	MASTER	0 533 329 35 22
GÜRKAN KEKİÇ	MASTER	0 530 461 61 77
HALİL IŞIK	MASTER	0 536 482 35 92
HALİL İBRAHİM ZIRIĞ	MASTER	0 532 212 80 91
HASİN KAMİL TAKINYALIOĞLU	MASTER	0 530 400 81 64
İBRAHİM GÖZÜUĞURLU	MASTER	0 532 402 19 63
İHSAN ŞENYAŞAR	MASTER	0 553 380 01 57
İSMAİL ÖZER	MASTER	0 532 678 04 33
KAAN HAMURCU	MASTER	0 534 514 16 34
KAAN YAVUZ	MASTER	0 532 200 65 89
KEREM ERTÜRK	MASTER	0 535 057 91 58
MAZLUM ARSU	MASTER	0 532 791 07 26
MEHMET EMRE ERGÜDER	MASTER	0 506 130 07 47
MERT SUBRAN	MASTER	0 533 724 98 36
MURAT ALDAN	MASTER	0 539 582 75 14
MURAT MUTLUÇ	MASTER	0 538 314 10 50
MURAT ŞAHİN	MASTER	0 554 466 90 59
MURAT TEKMEN	MASTER	0 537 456 88 20
MURAT YAK	MASTER	0 532 320 82 22
MURAT YEŞİLBAHÇE	MASTER	0 505 447 06 09
ONUR GÜVEN	MASTER	0 532 791 07 26
RESUL SULUOVA	MASTER	0 535 280 72 60
SALİH DOĞAN	MASTER	0 532 738 45 87
SAMİ BATTAL 	MASTER	0 537 264 98 33
SEMİH GÜL	MASTER	0 530 518 83 79
SERKAN GÜLTEKİN	MASTER	0 505 466 28 70
SERKAN GÜLTEKİN	MASTER	0 541 252 73 08
SERKAN YILMAZ	MASTER	0 542 717 09 90
ŞANSAL HEREKLİOĞLU	MASTER	0 532 480 45 73
TAHA MUSTAFA GÜNAL	MASTER	0 507 965 66 44
TAYFUN SAYACA	MASTER	0 533 435 12 45
UFUK KUŞKU	MASTER	0 505 637 44 27
URAS GARİP	MASTER	0 533 583 54 89
ÜMİT ŞEN	MASTER	0537 265 55 46
YASİN ÖZTÜRK 	MASTER	0 530 466 18 50
YİĞİT KAYA	MASTER	0 549 747 96 90
ABDÜLKADİR ŞAHİNER	RISING	0 552 216 31 16
ATAKAN AKIN	RISING	0 534 620 53 78
BARIŞ ALAY	RISING	0 531 784 90 79
BERKAN KARGILI	RISING	0 507 820 16 80
BURHAN DOĞRU	RISING	0 538 682 82 88
CAN KARAKAŞ	RISING	0 538 795 29 98
EGE PINAR	RISING	0 545 823 26 09
FARUK BOZKURT	RISING	0 537 323 33 92
FERİT ÖNEN	RISING	0 531 215 01 62
GÖKHAN UZUN	RISING	0 505 285 09 02
HAKAN İNCE	RISING	0 532 626 50 87
KADİR ATEŞ	RISING	0 542 315 17 71
KEREM UYANIK	RISING	0 530 899 04 88
MEHMET ÖZASLAN	RISING	0 554 491 65 70
MERT ÖZDEMİR	RISING	0 531 105 36 35
MERTCAN EROĞLU	RISING	0 535 479 87 71
MUHAMMED ÖDEK	RISING	0 532 219 28 97
NURİ KURUCU	RISING	0 539 702 92 79
OĞUZHAN AKIN	RISING	0 532 687 81 15
OĞUZHAN ÖZBEK	RISING	0 539 489 37 25
ONUR ATAGÜN	RISING	0 543 502 01 93
ÖZGÜR DOĞAN	RISING	0 538 096 55 26
SAMED TOSUN	RISING	0 536 545 88 61
ŞAFAK YELKENCİ 	RISING	0 506 379 93 15
ŞAHİN YILMAZ	RISING	0 538 428 39 69
VEYSEL TATLI	RISING	0 531 933 94 76
YASİN CAN YILDIRIM	RISING	0 544 685 06 16
YUSUF YAVUZ	RISING	0 539 439 56 05`;

function parsePlayerData(data) {
  const lines = data.trim().split('\n');
  const players = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 3) {
      const fullName = parts[0].trim();
      const category = parts[1].trim();
      const phone = parts[2].trim();

      players.push({
        fullName,
        category,
        phone
      });
    }
  }

  return players;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createGroups(players, groupSize = 8) {
  const shuffled = shuffleArray(players);
  const groups = [];

  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }

  return groups;
}

function generateUsername(fullName, index) {
  // İsim ve soyisimden kullanıcı adı oluştur
  const parts = fullName.toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/);

  if (parts.length >= 2) {
    return parts[0] + '.' + parts[parts.length - 1];
  }
  return parts[0] + index;
}

async function seedPlayers() {
  try {
    console.log('🎾 Veritabanı başlatılıyor...');
    await initializeDatabase();

    // Temizlik: Mevcut oyuncuları ve grupları sil (admin hariç)
    console.log('\n🧹 Mevcut veriler temizleniyor...');
    await db.runAsync('DELETE FROM users WHERE role = ?', ['player']);
    await db.runAsync('DELETE FROM groups');
    console.log('✅ Temizlik tamamlandı');

    // Parse player data
    const players = parsePlayerData(playersData);
    console.log(`\n📊 Toplam ${players.length} oyuncu bulundu`);

    // Kategorilere göre ayır
    const playersByCategory = {
      'ELITE': players.filter(p => p.category === 'ELITE'),
      'MASTER': players.filter(p => p.category === 'MASTER'),
      'RISING': players.filter(p => p.category === 'RISING')
    };

    console.log('\n📋 Kategori dağılımı:');
    console.log(`  - Elite: ${playersByCategory.ELITE.length} oyuncu`);
    console.log(`  - Master: ${playersByCategory.MASTER.length} oyuncu`);
    console.log(`  - Rising: ${playersByCategory.RISING.length} oyuncu`);

    // Create categories if they don't exist
    const categoriesToCreate = ['Elite', 'Master', 'Rising'];
    for (const catName of categoriesToCreate) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (name, gender) VALUES (?, ?)',
        [catName, 'male']
      );
    }

    // Get category IDs
    const categories = await db.allAsync('SELECT * FROM categories WHERE gender = ?', ['male']);
    const categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.name.toUpperCase()] = cat.id;
    }

    console.log('\n👥 Oyuncular oluşturuluyor...');
    const defaultPassword = await bcrypt.hash('123456', 10);
    let userCount = 0;
    const usedUsernames = new Set();

    // Her kategori için oyuncuları oluştur
    for (const [categoryName, categoryPlayers] of Object.entries(playersByCategory)) {
      const categoryId = categoryMap[categoryName];

      for (let i = 0; i < categoryPlayers.length; i++) {
        const player = categoryPlayers[i];
        let username = generateUsername(player.fullName, i + 1);

        // Eğer username kullanılmışsa, sayı ekle
        let counter = 1;
        let originalUsername = username;
        while (usedUsernames.has(username)) {
          username = originalUsername + counter;
          counter++;
        }
        usedUsernames.add(username);

        try {
          await db.runAsync(
            'INSERT INTO users (username, password, full_name, role, phone, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [username, defaultPassword, player.fullName, 'player', player.phone, categoryId]
          );
          userCount++;
        } catch (error) {
          console.error(`  ⚠️  ${player.fullName} eklenirken hata: ${error.message}`);
        }
      }
    }

    console.log(`✅ ${userCount} oyuncu başarıyla oluşturuldu!`);

    // Grupları oluştur
    console.log('\n🎲 Gruplar oluşturuluyor...');

    for (const [categoryName, categoryPlayers] of Object.entries(playersByCategory)) {
      const categoryId = categoryMap[categoryName];
      const groups = createGroups(categoryPlayers, 8);

      console.log(`\n  📂 ${categoryName} kategorisi - ${groups.length} grup:`);

      for (let i = 0; i < groups.length; i++) {
        const groupName = `Grup ${String.fromCharCode(65 + i)}`; // A, B, C, ...

        // Grubu oluştur
        await db.runAsync(
          'INSERT INTO groups (name, category_id) VALUES (?, ?)',
          [groupName, categoryId]
        );

        // Grup ID'sini al
        const group = await db.getAsync(
          'SELECT id FROM groups WHERE name = ? AND category_id = ?',
          [groupName, categoryId]
        );
        const groupId = group.id;

        console.log(`    • ${groupName}: ${groups[i].length} oyuncu`);

        // Oyuncuları gruba ekle
        for (const player of groups[i]) {
          const user = await db.getAsync(
            'SELECT id FROM users WHERE full_name = ? AND phone = ? AND category_id = ?',
            [player.fullName, player.phone, categoryId]
          );

          if (user) {
            // Users tablosunda group_id'yi güncelle
            await db.runAsync(
              'UPDATE users SET group_id = ? WHERE id = ?',
              [groupId, user.id]
            );

            // group_players tablosuna ekle
            await db.runAsync(
              'INSERT OR IGNORE INTO group_players (group_id, user_id) VALUES (?, ?)',
              [groupId, user.id]
            );

            // standings tablosuna ekle
            await db.runAsync(
              'INSERT OR IGNORE INTO standings (group_id, user_id, points) VALUES (?, ?, 0)',
              [groupId, user.id]
            );
          }
        }
      }
    }

    console.log('\n✅ Tüm gruplar başarıyla oluşturuldu!');
    console.log('\n📝 Giriş Bilgileri:');
    console.log('  Kullanıcı adı: isim.soyisim (örn: anil.acar)');
    console.log('  Şifre: 123456');
    console.log('\n🎾 GMB ENDUSTRI BURSA OPEN hazır!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

seedPlayers();
