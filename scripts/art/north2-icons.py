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
icons.update({
'fish':'<path d="M15 51Q44 17 82 51Q48 84 15 51ZM18 51L5 35V68Z"/><circle cx="66" cy="48" r="3" fill="#123D4A"/>',
'coral':'<path d="M50 88V24M50 53L26 34V16M27 33L11 27M50 68L77 47V24M77 47L92 37M50 79L26 66L20 52M50 43L66 32V13"/>',
'jelly':'<path d="M16 48Q20 11 50 11Q83 11 86 48Z" fill="#C5E5E7"/><path d="M26 52Q13 66 29 80M43 52Q56 67 40 89M61 52Q46 70 64 87M78 52Q91 69 77 80"/>',
'penguin':'<path d="M29 39Q28 11 50 11Q73 11 72 39L82 70L69 61Q75 84 62 88H38Q25 84 30 61L16 70Z" fill="#123D4A"/><ellipse cx="50" cy="64" rx="16" ry="22" fill="white" stroke="none"/><circle cx="42" cy="29" r="3" fill="white" stroke="none"/><circle cx="58" cy="29" r="3" fill="white" stroke="none"/><path d="M44 36H57L50 44Z" fill="#E9DAB6" stroke="none"/>',
'camera':'<path d="M12 32H31L39 21H65L73 32H89V80H12Z"/><circle cx="51" cy="55" r="16"/>',
'phone':'<path d="M23 12L38 31L28 42Q39 62 60 72L70 62L89 77Q83 97 66 88Q18 69 12 28Q12 17 23 12Z"/>',
'cup':'<path d="M17 31H67V75Q43 92 17 75ZM67 38H79Q95 57 67 63M14 90H79M31 10V19M49 7V17"/>',
'turtle':'<ellipse cx="50" cy="52" rx="22" ry="29" fill="#C5E5E7"/><ellipse cx="50" cy="14" rx="10" ry="10"/><path d="M30 39L10 27L21 47M70 39L90 27L80 47M31 69L14 85L32 79M69 69L86 85L68 79M50 81V94M36 40L49 32L64 43L60 63L45 71L34 59Z"/>',
'deep':'<ellipse cx="50" cy="46" rx="22" ry="30"/><path d="M39 24H60M32 38H69M30 53H70M37 68H62M29 29L13 23L8 41M27 48L8 50L7 68M29 62L16 77L24 90M72 29L87 23L93 41M73 48L91 50L94 68M70 62L84 77L76 90"/>',
'touch':'<path d="M50 14L60 38L87 36L68 55L77 82L51 68L25 83L32 55L12 36L40 38Z" fill="#E9DAB6"/>',
})
for name,body in icons.items():
 (p/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 100 100"><title>'+name+'</title><g fill="none" stroke="#123D4A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>')
