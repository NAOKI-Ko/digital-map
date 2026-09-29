from pathlib import Path
import json,html
root=Path(__file__).resolve().parents[2]
out=root/'assets/visitor-maps/nagoya-aquarium';out.mkdir(parents=True,exist_ok=True)
W,H=1200,1830
parts=['''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1830" viewBox="0 0 1200 1830"><title>名古屋港水族館 北館2F 制作審査用マスター</title><desc>公式情報の接続関係から独自に組版した案内図。公式画像のコピーやトレースではない。</desc><defs><pattern id="water" width="54" height="36" patternUnits="userSpaceOnUse"><path d="M5 22 Q16 15 27 22 T49 22" fill="none" stroke="#FFF" stroke-opacity=".3" stroke-width="2"/></pattern><pattern id="closed" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V12" stroke="#D4DAD7" stroke-width="2"/></pattern></defs><style>text{font-family:'Hiragino Sans','Arial Unicode MS',sans-serif;fill:#123D4A}.title{font-weight:700}.small{font-size:28px;fill:#476872}.zone{font-size:42px;font-weight:700}.detail{font-size:30px;fill:#476872}.stroke{stroke:#123D4A;stroke-width:5;stroke-linejoin:round}</style><rect width="1200" height="1830" fill="#F7F5EE"/>''']
def add(x):parts.append(x)
def text(x,y,s,size=32,weight=500,fill='#123D4A',anchor='start'):
 add(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" style="fill:{fill}" text-anchor="{anchor}">{html.escape(s)}</text>')
def path(d,fill,stroke='#123D4A',sw=4):add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>')
def rect(x,y,w,h,fill,rx=14,stroke='none',sw=2):add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
def pill(x,y,s,w=154):rect(x,y,w,56,'#123D4A',28);add(f'<text x="{x+w/2}" y="{y+38}" text-anchor="middle" font-size="30" font-weight="700" style="fill:white">{s}</text>')
def wc(x,y):rect(x,y,65,54,'#FFFDF8',10,'#123D4A',3);text(x+32,y+38,'WC',27,700,anchor='middle')
def lift(x,y):rect(x,y,62,64,'#FFFDF8',8,'#A76522',3);path(f'M{x+16} {y+44}V{y+17}m-7 8 7-8 7 8M{x+44} {y+18}v27m-7-8 7 8 7-8','none','#A76522',3)
def escalator(x,y):rect(x,y,75,64,'#FFFDF8',8,'#A76522',3);path(f'M{x+12} {y+47}h16l20-27h15M{x+12} {y+37}h10l21-27h20','none','#A76522',4)
# N2-R9: generous portrait composition with reserved native-PIN pads.
text(55,62,'MARINE ATLAS',28,650)
text(55,151,'北館 2F',86,750)
text(56,211,'海へもどった動物たち',40,600)
path('M55 248H1145','none','#123D4A',3)
# The actual broad relationship, abstracted in scale: rear gallery -> left circulation
# with Beluga west, Japan pools east, entry/exit services in foreground.
path('M280 360 Q635 272 980 360 L1090 470 L1110 1110 L1110 1640 L760 1640 L650 1570 L535 1640 L95 1640 L95 1395 L95 1180 L95 680 L180 510Z','#FFFDF8','#BBCAC8',6)
# rear evolution gallery; not an isolated fourth quadrant
path('M344 347 Q665 279 972 371 L941 454 Q663 366 377 432Z','#DCE9DE','#7F9F94',3)
text(490,333,'進化の海',49,700)
# Main pool is contiguous with the adjoining Japan pool complex, inaccessible water.
path('M620 540 Q850 450 1024 581 L1062 741 Q1049 853 916 898 L666 898 L590 759Z','#C5E5E7','#398EA5',5)
path('M620 540 Q850 450 1024 581 L1062 741 Q1049 853 916 898 L666 898 L590 759Z','url(#water)','none',0)
text(819,670,'メインプール',43,700,anchor='middle');text(819,719,'上階はスタジアム',31,500,anchor='middle')
# underwater viewing window along the rear side of pool
path('M610 520 Q815 435 1020 543','none','#E9DAB6',56)
text(922,388,'水中観覧席',48,700,anchor='middle')
# Connected Japan pools, differentiated from public floor by solid water fill.
path('M646 867 Q730 820 813 883 L841 982 Q837 1070 728 1090 L630 1012Z','#83C7D0','#398EA5',5)
path('M842 980 L956 906 Q1059 898 1071 1041 L1056 1182 Q1002 1280 865 1204 L814 1121Z','#398EA5','#246478',5)
text(706,836,'イルカ',48,700,anchor='middle')
rect(871,900,223,76,'#FFFDF8',18)
text(982,954,'シャチ',48,700,anchor='middle')
# West Beluga water and long public viewing edge.
path('M140 772 Q222 706 307 778 L319 1010 Q301 1110 163 1071 L130 1007Z','#C5E5E7','#398EA5',5)
path('M151 810Q224 775 296 811M152 850Q224 815 296 851','none','#FFFFFF',3)
text(220,661,'オーロラの海',40,700,anchor='middle');text(220,718,'ベルーガ',49,700,anchor='middle')
text(907,1258,'日本の海',39,700,anchor='middle')
# Central circulation winds along window edges; no fabricated one-way routing.
path('M653 1398 L653 1300 Q565 1270 488 1205 L424 1050 L427 705 Q405 570 528 479 L599 466','none','#E9DAB6',66)
path('M488 1205 Q674 1226 814 1121M424 1060 Q530 1049 631 994M430 802 L592 831','none','#E9DAB6',54)
path('M543 1328 L313 1328 L201 1429 L55 1429','none','#E9DAB6',58)
path('M98 1413L74 1429L98 1445','none','#123D4A',5)
# Two observed circulation cores; their internal distances are not surveyed.
escalator(163,445);lift(247,445);text(156,559,'3Fへ',45,700,fill='#A76522')
escalator(290,1185);lift(198,1185);text(198,1300,'3Fへ',45,700,fill='#A76522')
# Functional facilities, outside water, with quiet PIN areas.
wc(454,501);wc(1027,449);wc(121,1113)
# R3 live map resolves baby room on entrance-right, not rear WC cluster.
rect(957,1290,163,239,'#E8EFED',15,'#B6C9C4',3)
text(1038,1305,'ベビー',37,700,anchor='middle');text(1038,1350,'コーナー',35,600,anchor='middle')
# Wider foreground supports accurate cluster ordering with 44px native targets.
rect(335,1360,158,213,'#DCE9DE',15,'#7F9F94',3)
text(414,1404,'ショップ',38,700,anchor='middle')
rect(755,1290,180,239,'#E8EFED',15,'#B6C9C4',3)
text(844,1330,'総合案内',40,700,anchor='middle')
text(160,1350,'南館2Fへ',48,700,anchor='middle');text(175,1395,'出口・連絡通路',36,550,anchor='middle')
text(646,1627,'入口',59,700,anchor='middle');path('M650 1580V1540m-13 15 13-15 13 15','none','#123D4A',5)
text(990,1627,'チケット',34,600,anchor='middle');text(1097,1627,'売場',34,600,anchor='middle')
path('M164 599L91 599m18-12-18 12 18 12','none','#123D4A',5)
text(96,369,'広場へ',35,650);text(96,411,'スロープ',30)
text(195,1658,'ロッカー',35,650,anchor='middle')
# Redundant, visually quiet key; important labels are in the map proper.
path('M55 1680H1145','none','#BBCAC8',2)
rect(60,1720,36,28,'#83C7D0',5);text(112,1748,'水槽',34)
rect(260,1720,36,28,'#E9DAB6',5);text(312,1748,'通路',34)
text(494,1748,'WC トイレ',34);text(794,1748,'↕ 上下階',34)
text(56,1790,'非公式・制作審査用 / 距離・寸法は模式化',24)
add('</svg>')
(out/'north-2f-master.svg').write_text('\n'.join(parts))
anchors={'イルカ（日本の海）':[717,1043],'シャチ（日本の海）':[955,1167],'ベルーガ（水中観覧）':[239,977],'進化の海':[570,530],'水中観覧席':[926,600],'ベビーコーナー':[1070,1530],'北館2F バリアフリートイレ':[168,1215],'コインロッカー':[190,1610],'ミュージアムショップ（北館）':[414,1600],'入口':[630,1515],'総合案内':[850,1530]}
(out/'north-2f-layout.json').write_text(json.dumps({'revision':'N2-R9','width':W,'height':H,'gate':'ACCEPTED','sources':['R1','R2','R3'],'anchors':anchors,'unresolved':[],'gateEvidence':'docs/qa/wu67-nagoya-aquarium-production-map/05-NORTH-2F-BENCHMARK.md'},ensure_ascii=False,indent=2))
print(out/'north-2f-master.svg')
