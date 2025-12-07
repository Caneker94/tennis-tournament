import db, { initializeDatabase } from './database.js';

// Round-robin tournament scheduler
function generateRoundRobin(players) {
  if (players.length < 2) return [];

  const matches = [];
  const n = players.length;

  // If odd number of players, add a "bye" (null player)
  const playersWithBye = n % 2 === 0 ? [...players] : [...players, null];
  const totalPlayers = playersWithBye.length;
  const totalRounds = totalPlayers - 1;
  const matchesPerRound = totalPlayers / 2;

  for (let round = 0; round < totalRounds; round++) {
    const roundMatches = [];

    for (let match = 0; match < matchesPerRound; match++) {
      let home = (round + match) % (totalPlayers - 1);
      let away = (totalPlayers - 1 - match + round) % (totalPlayers - 1);

      // Last player stays in a fixed position
      if (match === 0) {
        away = totalPlayers - 1;
      }

      const player1 = playersWithBye[home];
      const player2 = playersWithBye[away];

      // Skip if either player is a bye
      if (player1 && player2) {
        roundMatches.push({ player1, player2 });
      }
    }

    matches.push(roundMatches);
  }

  return matches;
}

// Distribute matches across periods
function distributeMatchesAcrossPeriods(roundMatches) {
  // 7 round total for 8 players
  // Period 1 (Weeks 1-2): Rounds 0-1 (2 matches per player)
  // Period 2 (Weeks 3-4): Rounds 2-3 (2 matches per player)
  // Period 3 (Weeks 5-6): Rounds 4-5 (2 matches per player)
  // Period 4 (Week 7): Round 6 (1 match per player)

  const tournamentStart = new Date('2025-12-15');

  // Period 1: Hafta 1-2 (2 hafta)
  const period1Start = new Date(tournamentStart);
  const period1End = new Date(tournamentStart);
  period1End.setDate(tournamentStart.getDate() + 13);

  // Period 2: Hafta 3-4 (2 hafta)
  const period2Start = new Date(tournamentStart);
  period2Start.setDate(tournamentStart.getDate() + 14);
  const period2End = new Date(period2Start);
  period2End.setDate(period2Start.getDate() + 13);

  // Period 3: Hafta 5-6 (2 hafta)
  const period3Start = new Date(tournamentStart);
  period3Start.setDate(tournamentStart.getDate() + 28);
  const period3End = new Date(period3Start);
  period3End.setDate(period3Start.getDate() + 13);

  // Period 4: Hafta 7 (1 hafta)
  const period4Start = new Date(tournamentStart);
  period4Start.setDate(tournamentStart.getDate() + 42);
  const period4End = new Date(period4Start);
  period4End.setDate(period4Start.getDate() + 6);

  const periods = [
    {
      periodNumber: 1,
      rounds: [0, 1],
      weekStart: 1,
      weekEnd: 2,
      label: 'Hafta 1-2',
      dateStart: period1Start,
      dateEnd: period1End
    },
    {
      periodNumber: 2,
      rounds: [2, 3],
      weekStart: 3,
      weekEnd: 4,
      label: 'Hafta 3-4',
      dateStart: period2Start,
      dateEnd: period2End
    },
    {
      periodNumber: 3,
      rounds: [4, 5],
      weekStart: 5,
      weekEnd: 6,
      label: 'Hafta 5-6',
      dateStart: period3Start,
      dateEnd: period3End
    },
    {
      periodNumber: 4,
      rounds: [6],
      weekStart: 7,
      weekEnd: 7,
      label: 'Hafta 7',
      dateStart: period4Start,
      dateEnd: period4End
    }
  ];

  const periodMatches = [];

  for (const period of periods) {
    const periodMatchList = [];

    // Get matches from the specified rounds for this period
    for (const roundIdx of period.rounds) {
      if (roundIdx < roundMatches.length) {
        periodMatchList.push(...roundMatches[roundIdx]);
      }
    }

    periodMatches.push({
      ...period,
      matches: periodMatchList
    });
  }

  return periodMatches;
}

async function generateSchedule() {
  try {
    console.log('🎾 Maç programı oluşturuluyor...\n');
    await initializeDatabase();

    // Clear existing matches
    console.log('🧹 Mevcut maçlar temizleniyor...');
    await db.runAsync('DELETE FROM matches');
    await db.runAsync('DELETE FROM match_scores');
    console.log('✅ Temizlik tamamlandı\n');

    // Get all groups with their players
    const groups = await db.allAsync(`
      SELECT g.id, g.name, g.category_id, c.name as category_name
      FROM groups g
      JOIN categories c ON g.category_id = c.id
      ORDER BY c.name, g.name
    `);

    console.log(`📊 Toplam ${groups.length} grup bulundu\n`);

    let totalMatchesCreated = 0;

    for (const group of groups) {
      console.log(`\n📂 ${group.category_name} - ${group.name}`);

      // Get players in this group
      const players = await db.allAsync(`
        SELECT u.id, u.full_name
        FROM users u
        WHERE u.group_id = ?
        ORDER BY u.full_name
      `, [group.id]);

      console.log(`   👥 ${players.length} oyuncu`);

      if (players.length < 2) {
        console.log('   ⚠️  En az 2 oyuncu gerekli, atlanıyor...');
        continue;
      }

      // Generate round-robin schedule
      const roundMatches = generateRoundRobin(players);
      console.log(`   🔄 Toplam ${roundMatches.length} round oluşturuldu`);

      // Distribute matches across periods
      const periodMatches = distributeMatchesAcrossPeriods(roundMatches);

      // Create matches in database
      let groupMatchCount = 0;

      for (const period of periodMatches) {
        if (period.matches.length === 0) continue;

        console.log(`   📅 ${period.label} (${period.dateStart.toLocaleDateString('tr-TR')} - ${period.dateEnd.toLocaleDateString('tr-TR')}): ${period.matches.length} maç`);

        for (const match of period.matches) {
          // Use the period's start date as the default match date
          const formattedDate = period.dateStart.toISOString().split('T')[0];

          await db.runAsync(`
            INSERT INTO matches (
              group_id,
              player1_id,
              player2_id,
              match_date,
              week_number,
              status
            )
            VALUES (?, ?, ?, ?, ?, 'scheduled')
          `, [
            group.id,
            match.player1.id,
            match.player2.id,
            formattedDate,
            period.periodNumber
          ]);
          
          groupMatchCount++;
          totalMatchesCreated++;
        }
      }

      console.log(`   ✅ Toplam ${groupMatchCount} maç oluşturuldu`);
    }

    // Calculate periods for display
    const tournamentStart = new Date('2025-12-15');
    const p1Start = new Date(tournamentStart);
    const p1End = new Date(tournamentStart);
    p1End.setDate(tournamentStart.getDate() + 13);

    const p2Start = new Date(tournamentStart);
    p2Start.setDate(tournamentStart.getDate() + 14);
    const p2End = new Date(p2Start);
    p2End.setDate(p2Start.getDate() + 13);

    const p3Start = new Date(tournamentStart);
    p3Start.setDate(tournamentStart.getDate() + 28);
    const p3End = new Date(p3Start);
    p3End.setDate(p3Start.getDate() + 13);

    const p4Start = new Date(tournamentStart);
    p4Start.setDate(tournamentStart.getDate() + 42);
    const p4End = new Date(p4Start);
    p4End.setDate(p4Start.getDate() + 6);

    console.log(`\n\n✅ Maç programı tamamlandı!`);
    console.log(`📊 Toplam ${totalMatchesCreated} maç oluşturuldu`);
    console.log(`📅 Turnuva yapısı:`);
    console.log(`   • Periyod 1 (${p1Start.toLocaleDateString('tr-TR')} - ${p1End.toLocaleDateString('tr-TR')}): Her oyuncu 2 maç`);
    console.log(`   • Periyod 2 (${p2Start.toLocaleDateString('tr-TR')} - ${p2End.toLocaleDateString('tr-TR')}): Her oyuncu 2 maç`);
    console.log(`   • Periyod 3 (${p3Start.toLocaleDateString('tr-TR')} - ${p3End.toLocaleDateString('tr-TR')}): Her oyuncu 2 maç`);
    console.log(`   • Periyod 4 (${p4Start.toLocaleDateString('tr-TR')} - ${p4End.toLocaleDateString('tr-TR')}): Her oyuncu 1 maç`);
    console.log(`\n💡 Not: Oyuncular belirlenen periyot içinde takvimden tarih seçerek maçlarını planlayabilirler.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

generateSchedule();