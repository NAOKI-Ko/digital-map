from pathlib import Path
p=Path(__file__).resolve().parents[2]/'assets/visitor-maps/nagoya-aquarium/icons';p.mkdir(exist_ok=True)
# Original geometric pictograms. No external image/icon path is used.
icons={
'dolphin':'<path d="M15 65Q28 30 56 40L65 24L68 45Q82 48 94 61L81 64Q65 62 59 72L48 89L44 72Q25 76 15 65ZM19 65L5 54L8 75Z" fill="#123D4A"/><circle cx="76" cy="56" r="3" fill="white"/>',
'orca':'<path d="M16 62Q20 41 45 38L53 12L63 40Q83 44 94 62Q91 77 68 79L53 94L48 79Q22 80 16 62ZM18 63L4 50L6 77Z" fill="#123D4A"/><ellipse cx="75" cy="57" rx="8" ry="5" fill="white"/><path d="M25 68Q43 70 65 72Q45 83 25 68" fill="white"/>',
'beluga':'<path d="M14 63Q28 36 64 35Q89 30 90 51L95 62L83 70Q67 70 59 80L48 88L45 75Q25 81 14 63ZM18 65L4 55L6 77Z" fill="#C5E5E7" stroke="#123D4A" stroke-width="5" stroke-linejoin="round"/><circle cx="78" cy="48" r="3" fill="#123D4A"/>',
'evolution':'<path d="M17 78V27Q36 23 49 34Q63 23 84 27V78Q62 74 49 83Q34 74 17 78ZM49 35V81"/><path d="M29 40L39 45M29 53L39 58M60 43L73 39M60 57L73 53"/>',
'seating':'<path d="M22 19V60H73V36M22 39H61V63M28 65V84M68 65V84M17 86H81"/><path d="M75 20Q86 16 94 23"/>',
'baby':'<circle cx="50" cy="25" r="13"/><path d="M39 39L22 50M61 39L78 50M32 49L36 69L28 85M68 49L64 69L72 85M36 58H64L50 74Z"/>',
'locker':'<rect x="17" y="10" width="66" height="80" rx="5"/><path d="M50 10V90M17 50H83M39 26V35M61 26V35M39 65V74M61 65V74"/>',
'entry':'<path d="M55 12H84V88H55M11 50H65M44 30L65 50L44 70"/>',
}
for name,body in icons.items():
 (p/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 100 100"><title>'+name+'</title><g fill="none" stroke="#123D4A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>')
