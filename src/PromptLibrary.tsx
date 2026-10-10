import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Heart, Shuffle, ShieldCheck } from "lucide-react";

type PromptKind = "Kinky opdrachten" | "Kinky vragen" | "Vanille & verbinding" | "Aftercare";
type PromptItem = { id: string; kind: PromptKind; intensity: "Zacht" | "Stevig in taal" | "Reflectie"; title: string; text: string; note?: string };

const prompts: PromptItem[] = [
  {id:"k01",kind:"Kinky opdrachten",intensity:"Zacht",title:"De bewuste buiging",text:"Als je daar oprecht zin in hebt, neem dan een houding aan die voor jou nederigheid of toewijding symboliseert. Houd die alleen zolang het prettig voelt.",note:"Alleen op uitnodiging en zonder fysieke druk."},
  {id:"k02",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De formele toestemming",text:"Vraag met woorden om toestemming voor één vooraf besproken, niet-risicovolle handeling. Wacht op een duidelijk ja en accepteer een nee zonder discussie."},
  {id:"k03",kind:"Kinky opdrachten",intensity:"Zacht",title:"Ogen op mij",text:"Maak alleen oogcontact als dat fijn voelt. Vertel daarna in één zin wat je op dit moment nodig hebt."},
  {id:"k04",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De opdracht",text:"Geef een korte, respectvolle opdracht binnen de afgesproken grenzen, bijvoorbeeld: 'Leg je telefoon weg en kies een nummer dat bij je stemming past.' De ander mag altijd passen."},
  {id:"k05",kind:"Kinky opdrachten",intensity:"Zacht",title:"Het ritueel",text:"Kies samen een klein beginritueel: een buiging, een afgesproken aanspreekvorm of een moment stilte. Spreek vooraf af dat het optioneel blijft."},
  {id:"k06",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Vraag en wacht",text:"Vraag om een eenvoudige gunst die eerder is goedgekeurd. Wacht op het antwoord in plaats van het in te vullen. Een weigering is een volledig antwoord."},
  {id:"k07",kind:"Kinky opdrachten",intensity:"Zacht",title:"De belofte",text:"Benoem één afspraak die je vandaag bewust wilt respecteren. Laat de ander bevestigen, aanpassen of afwijzen wat je voorstelt."},
  {id:"k08",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De rol kiezen",text:"Kies voor deze ronde een rol of dynamiek die jullie al besproken hebben. Beschrijf in één zin wat die rol vandaag wel en niet betekent."},
  {id:"k09",kind:"Kinky opdrachten",intensity:"Zacht",title:"Stilte op verzoek",text:"Spreek maximaal één minuut stilte af, alleen als dat voor iedereen comfortabel is. Gebruik daarna een check-in: groen, geel of rood."},
  {id:"k10",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De grens hardop",text:"Noem één grens die vandaag absoluut blijft staan. De ander herhaalt die grens in eigen woorden, zonder te onderhandelen."},
  {id:"k11",kind:"Kinky opdrachten",intensity:"Zacht",title:"De keuze uit twee",text:"Bied twee veilige, vooraf goedgekeurde opties aan. Laat de ander kiezen of allebei afwijzen."},
  {id:"k12",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Compliment op commando",text:"Geef op verzoek één oprecht compliment over een keuze, eigenschap of inspanning. Geen opmerkingen over iemands lichaam tenzij die welkom zijn."},
  {id:"k13",kind:"Kinky opdrachten",intensity:"Zacht",title:"Het teken van vertrouwen",text:"Kies samen een klein voorwerp als symbool van vertrouwen. Leg uit wat het voor jou betekent en spreek af wanneer je het weglegt."},
  {id:"k14",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De check-in leiden",text:"Neem de leiding in een korte check-in: vraag naar groen, geel of rood, luister naar het antwoord en pas het plan aan zonder druk."},
  {id:"q01",kind:"Kinky vragen",intensity:"Reflectie",title:"Wat betekent overgave?",text:"Wanneer voelt overgave voor jou als een vrije keuze, en wat zou die vrijheid direct wegnemen?"},
  {id:"q02",kind:"Kinky vragen",intensity:"Reflectie",title:"De taal van macht",text:"Welke woorden of aanspreekvormen voelen spannend en welkom? Welke woorden zijn een harde nee?"},
  {id:"q03",kind:"Kinky vragen",intensity:"Reflectie",title:"Leiden met zorg",text:"Waaraan merk je dat iemand verantwoordelijkheid neemt zonder jouw keuzes over te nemen?"},
  {id:"q04",kind:"Kinky vragen",intensity:"Reflectie",title:"Speelse weerstand",text:"Welke vormen van plagen of uitdagende taal zijn leuk voor jou, en welke zouden echt kwetsend voelen?"},
  {id:"q05",kind:"Kinky vragen",intensity:"Reflectie",title:"Een grens die veranderde",text:"Is er iets waar je nieuwsgierig naar bent maar nog niet klaar voor bent? Wat zou je nodig hebben om er veilig over te praten?"},
  {id:"q06",kind:"Kinky vragen",intensity:"Reflectie",title:"De kracht van nee",text:"Wat helpt jou om zonder schuldgevoel nee te zeggen, ook wanneer de ander enthousiast is?"},
  {id:"q07",kind:"Kinky vragen",intensity:"Reflectie",title:"De nasleep",text:"Welke vorm van aftercare helpt je het meest: praten, stilte, warmte, ruimte of iets anders?"},
  {id:"q08",kind:"Kinky vragen",intensity:"Reflectie",title:"Een fantasie bespreken",text:"Welke fantasie zou je eerst alleen willen bespreken, zonder verwachting dat je die ooit uitvoert?"},
  {id:"q09",kind:"Kinky vragen",intensity:"Reflectie",title:"Vertrouwen verdienen",text:"Welke kleine, herhaalbare actie bouwt voor jou meer vertrouwen op dan grote beloften?"},
  {id:"q10",kind:"Kinky vragen",intensity:"Reflectie",title:"De rode lijn",text:"Welke grens wil je dat de ander onthoudt, ook als je die niet iedere keer opnieuw benoemt?"},
  {id:"v01",kind:"Vanille & verbinding",intensity:"Zacht",title:"Twee minuten aandacht",text:"Leg schermen weg en geef elkaar twee minuten onverdeelde aandacht. Je hoeft niets op te lossen of te presteren."},
  {id:"v02",kind:"Vanille & verbinding",intensity:"Zacht",title:"Kies de soundtrack",text:"Kies ieder één nummer dat je stemming beschrijft. Luister samen en vertel waarom je het koos."},
  {id:"v03",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Een kleine waardering",text:"Noem iets kleins dat de ander recent deed en dat je waardeerde. Houd het concreet en oprecht."},
  {id:"v04",kind:"Vanille & verbinding",intensity:"Zacht",title:"De mini-date",text:"Bedenk samen een date van maximaal twintig minuten die weinig kost en voor beiden prettig voelt."},
  {id:"v05",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Wat heb je nodig?",text:"Maak deze zin af: 'Ik voel me vandaag gesteund wanneer…' Luister zonder meteen advies te geven."},
  {id:"v06",kind:"Vanille & verbinding",intensity:"Zacht",title:"Een keuze cadeau",text:"Laat de ander kiezen tussen twee kleine activiteiten. Respecteer de keuze, ook als die anders is dan je eigen voorkeur."},
  {id:"v07",kind:"Vanille & verbinding",intensity:"Reflectie",title:"Samen groeien",text:"Welke gewoonte zou je samen willen opbouwen, en wat is de kleinste haalbare eerste stap?"},
  {id:"v08",kind:"Vanille & verbinding",intensity:"Zacht",title:"Een vriendelijk bericht",text:"Schrijf een kort bericht waarin je benoemt wat je aan de ander waardeert. Versturen is optioneel."},
  {id:"a01",kind:"Aftercare",intensity:"Zacht",title:"Groen, geel of rood?",text:"Check in zonder aannames: groen betekent oké, geel betekent vertragen en afstemmen, rood betekent onmiddellijk stoppen."},
  {id:"a02",kind:"Aftercare",intensity:"Reflectie",title:"Wat landt goed?",text:"Kies wat je nu nodig hebt: water, warmte, stilte, een gesprek, ruimte of praktische hulp. Je hoeft geen uitleg te geven."},
  {id:"a03",kind:"Aftercare",intensity:"Reflectie",title:"Geen evaluatieplicht",text:"Je hoeft niet meteen te analyseren. Spreek af of je nu, later of helemaal niet wilt napraten."},
  {id:"a04",kind:"Aftercare",intensity:"Zacht",title:"De volgende dag",text:"Plan een vrijblijvende check-in voor later: 'Hoe voel je je nu terugkijkend, en is er iets dat je nodig hebt?'"},
  {id:"a05",kind:"Aftercare",intensity:"Reflectie",title:"Wat nemen we mee?",text:"Noem één ding dat goed voelde en één ding dat je volgende keer anders wilt. Allebei mogen ook passen."},
  {id:"k15",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Protocol op maat",text:"Kies samen één klein protocol voor deze ronde, zoals eerst vragen en dan handelen. Spreek af wanneer het geldt en wanneer je het mag onderbreken."},
  {id:"k16",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De aanspreekvorm",text:"Vraag of een afgesproken titel of aanspreekvorm vandaag welkom is. Gebruik die alleen na een duidelijk ja en stop meteen als het niet meer goed voelt."},
  {id:"k17",kind:"Kinky opdrachten",intensity:"Zacht",title:"Dienstbaarheid, zelf gekozen",text:"Kies een kleine attentie of servicehandeling die de ander echt waardeert. Vraag eerst wat welkom is en maak er geen verplichting van."},
  {id:"k18",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De speelse uitdaging",text:"Bied een speelse, vooraf goedgekeurde uitdaging aan. De ander mag de uitdaging aannemen, aanpassen of overslaan zonder straf of schuldgevoel."},
  {id:"k19",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De grens van plagen",text:"Spreek één soort plagerige taal af die welkom is en één onderwerp dat verboden terrein blijft. Check daarna of de afspraak nog goed voelt."},
  {id:"k20",kind:"Kinky opdrachten",intensity:"Zacht",title:"Regie overdragen",text:"Laat de ander voor één kleine, veilige keuze de regie nemen, zoals muziek of volgorde. Je kunt de keuze altijd terugnemen of opnieuw afstemmen."},
  {id:"q11",kind:"Kinky vragen",intensity:"Reflectie",title:"Dominantie zonder druk",text:"Welke vorm van dominante taal voelt aantrekkelijk, en waaraan merk je dat het omslaat van spannend naar onprettig?"},
  {id:"q12",kind:"Kinky vragen",intensity:"Reflectie",title:"Overgave met grenzen",text:"Wat helpt je om controle vrijwillig uit handen te geven, terwijl je weet dat je die altijd terug kunt nemen?"},
  {id:"q13",kind:"Kinky vragen",intensity:"Reflectie",title:"Regels die werken",text:"Welke afspraak maakt een power dynamic leuker of duidelijker? Welke regel zou juist te beperkend voelen?"},
  {id:"q14",kind:"Kinky vragen",intensity:"Reflectie",title:"Fantasie versus werkelijkheid",text:"Welke fantasie vind je prettig om over te praten, maar wil je niet uitvoeren? Allebei mogen waar zijn."},
  {id:"q15",kind:"Kinky vragen",intensity:"Reflectie",title:"Herstel van vertrouwen",text:"Wat zou je nodig hebben als een afspraak per ongeluk wordt gemist, en hoe kan iemand verantwoordelijkheid nemen zonder je onder druk te zetten?"},
  {id:"k21",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De formele begroeting",text:"De Dom kiest een vooraf afgesproken titel en zegt: 'Je hebt mijn aandacht. Begroet me op de manier die we hebben afgesproken.' De speler voert dit alleen uit als het nog welkom voelt; anders kiest die een andere begroeting."},
  {id:"k22",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Drie duidelijke keuzes",text:"De Dom biedt drie veilige keuzes aan: muziek kiezen, een korte reflectie beantwoorden of een eenvoudig servicegebaar doen. De speler kiest één, stelt een alternatief voor of past."},
  {id:"k23",kind:"Kinky opdrachten",intensity:"Zacht",title:"De toestemmingstest",text:"Voordat de scène verdergaat, vraagt de Dom: 'Wil je doorgaan, aanpassen of stoppen?' Alleen een duidelijke, vrijwillige keuze betekent doorgaan."},
  {id:"k24",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Het protocol herhalen",text:"De Dom vraagt de speler de afgesproken regels in eigen woorden te herhalen. Corrigeer rustig eventuele misverstanden en begin pas wanneer iedereen dezelfde afspraak bedoelt."},
  {id:"k25",kind:"Kinky opdrachten",intensity:"Zacht",title:"De keuze van de Dom",text:"De Dom kiest één van twee vooraf goedgekeurde, alledaagse opdrachten. De speler mag zonder uitleg weigeren of de opdracht vervangen."},
  {id:"k26",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De houding kiezen",text:"De Dom vraagt: 'Kies een houding waarin jij je comfortabel en aanwezig voelt.' Geen knielen, langdurig staan of fysieke belasting tenzij dit vooraf besproken én prettig is."},
  {id:"k27",kind:"Kinky opdrachten",intensity:"Zacht",title:"De stilte doorbreken",text:"Na maximaal dertig seconden comfortabele stilte vraagt de Dom: 'Wat wil je dat ik op dit moment weet?' Antwoorden, passen en stoppen zijn allemaal geldige keuzes."},
  {id:"k28",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De verdiende titel",text:"Kies samen een speelse titel voor deze sessie. De Dom legt uit wat die titel betekent en vraagt of de speler ermee aangesproken wil worden voordat die hem gebruikt."},
  {id:"k29",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Het bevel met een uitweg",text:"De Dom formuleert een korte opdracht en voegt toe: 'Je mag aanpassen of passen.' De opdracht is alleen een spelvoorstel, nooit een test van liefde of loyaliteit."},
  {id:"k30",kind:"Kinky opdrachten",intensity:"Zacht",title:"De toewijdingskaart",text:"Kies een kaart, voorwerp of woord dat de dynamiek symboliseert. Vertel wat het betekent en spreek af dat je het op elk moment kunt neerleggen."},
  {id:"k31",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De complimentenregel",text:"De Dom geeft één concrete opdracht: benoem één keuze waar je trots op bent. De Dom luistert en reageert zonder de ervaring van de speler over te nemen."},
  {id:"k32",kind:"Kinky opdrachten",intensity:"Zacht",title:"Service op bestelling",text:"De Dom vraagt om één kleine servicehandeling uit een vooraf afgesproken lijst. De speler kiest de taak, doet een alternatief of past; de Dom bedankt zonder aanspraak te maken op meer."},
  {id:"k33",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De grens bevestigen",text:"De Dom noemt één afgesproken grens en vraagt: 'Staat deze grens nog steeds?' Bij twijfel wordt de scène gepauzeerd en de afspraak aangepast."},
  {id:"k34",kind:"Kinky opdrachten",intensity:"Zacht",title:"De zachte landing",text:"De Dom beëindigt de rol met een afgesproken zin. Beide spelers noemen daarna één behoefte voor aftercare en kiezen samen wat haalbaar voelt."},
  {id:"k35",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De rolwissel",text:"Wissel voor één ronde alleen de regie over een onschuldige keuze, bijvoorbeeld muziek of volgorde. De oorspronkelijke rol keert pas terug na een duidelijke check-in."},
  {id:"k36",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De plagerige uitdaging",text:"Gebruik uitsluitend plagerige woorden die vooraf als welkom zijn gekozen. De speler mag een woord direct schrappen; stop met die formulering zonder discussie."},
  {id:"k37",kind:"Kinky opdrachten",intensity:"Zacht",title:"De spiegel van vertrouwen",text:"Iedere speler noemt één ding dat vertrouwen opbouwt en één ding dat het zou schaden. Herhaal elkaars antwoord om te laten zien dat je hebt geluisterd."},
  {id:"k38",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De drie-stappenopdracht",text:"Geef maximaal drie kleine stappen, één voor één. Wacht na elke stap op toestemming en geef de volgende pas als de speler daar nog steeds voor kiest."},
  {id:"k39",kind:"Kinky opdrachten",intensity:"Zacht",title:"De afsluitende buiging",text:"Als dit prettig voelt, sluit af met een afgesproken gebaar. Het gebaar is symbolisch en kan altijd worden vervangen door een woord of helemaal worden overgeslagen."},
  {id:"k40",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"De stem van de Dom",text:"De Dom kiest een rustige, lage of formele spreekstijl en geeft één eenvoudige instructie. Vraag daarna welke toon prettig was en pas die aan."},
  {id:"m01",kind:"Kinky opdrachten",intensity:"Zacht",title:"Photo Challenge · The Detail",text:"Kies samen één niet-intiem detail, zoals een ring, handschoen, schoen, sleutel of stofstructuur. Maak optioneel één foto in zacht licht. Bekijk samen en kies bewaren of verwijderen."},
  {id:"m02",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Photo Challenge · The Pose",text:"De Dom geeft maximaal twee regie-aanwijzingen voor een volledig geklede, comfortabele pose. Eerst oefenen zonder camera; pas daarna een foto maken als iedereen opnieuw akkoord is."},
  {id:"m03",kind:"Kinky opdrachten",intensity:"Zacht",title:"Photo Challenge · The Silhouette",text:"Maak optioneel een silhouet tegen een rustige achtergrond. Controleer of gezichten, spiegels, ramen, locatiegegevens en andere herkenbare details buiten beeld blijven als dat de afspraak is."},
  {id:"m04",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Video Challenge · Ten Seconds",text:"Neem alleen na een nieuwe duidelijke ja een clip van maximaal tien seconden op. Gebruik drie aanwijzingen: beginpositie, langzame beweging en eindbeeld. Geen verborgen opname of automatische upload."},
  {id:"m05",kind:"Kinky opdrachten",intensity:"Zacht",title:"Video Challenge · The Object",text:"Film optioneel een afgesproken voorwerp of outfitdetail in één rustige beweging. Neem geen stem of herkenbaar gezicht op tenzij dat apart is goedgekeurd."},
  {id:"m06",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"Video Challenge · Director's Cut",text:"De Dom geeft een korte creatieve aanwijzing over licht, kadrering of tempo. De speler mag 'cut' zeggen, waarna de opname onmiddellijk stopt en samen wordt besloten wat er met het bestand gebeurt."},
  {id:"m07",kind:"Kinky opdrachten",intensity:"Zacht",title:"The Private Premiere",text:"Bekijk een zelfgekozen foto of clip samen. Iedere betrokkene kiest zelfstandig: bewaren, opnieuw maken of verwijderen. Toestemming om te maken betekent nooit automatisch toestemming om te delen."},
  {id:"m08",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"The Prop Challenge",text:"Kies één veilig rekwisiet dat al is goedgekeurd. De Dom geeft een creatieve opdracht voor een foto van het voorwerp, zonder dat iemand het hoeft te dragen of gebruiken."},
  {id:"ai01",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"AI Dom · First Order",text:"Voorbeeldscript: 'Kies je toon: kalm, streng of plagerig. Noem je grenzen en kies een stopwoord. Daarna geef ik één opdracht die je mag aanpassen of overslaan.' Live AI-reacties vereisen een aangesloten AI-backend."},
  {id:"ai02",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"AI Dom · The Choice",text:"Voorbeeldscript: 'Je krijgt twee veilige opties: beschrijf je stemming in één zin of kies de soundtrack. Kies één, stel iets anders voor of zeg PASS.' De AI mag weigering nooit als toestemming interpreteren."},
  {id:"ai03",kind:"Kinky opdrachten",intensity:"Reflectie",title:"AI Dom · Mood Check",text:"Kies groen, geel of rood voordat de AI Dom verdergaat. Groen: ga door binnen afspraken. Geel: pauzeer en pas aan. Rood: beëindig de scène en schakel over naar aftercare."},
  {id:"ai04",kind:"Kinky opdrachten",intensity:"Stevig in taal",title:"AI Dom · The Protocol",text:"Voorbeeldscript: 'Herhaal de drie afspraken voor deze ronde. Ik volg die afspraken, niet andersom. Wil je doorgaan, aanpassen of stoppen?' Ga alleen verder wanneer de speler duidelijk kiest voor doorgaan."},
  {id:"ai05",kind:"Kinky opdrachten",intensity:"Zacht",title:"AI Dom · Debrief",text:"Voorbeeldscript: 'De rol is voorbij. Wil je rust, reflectie of afsluiten zonder vragen?' Sla gevoelige antwoorden niet op zonder duidelijke keuze en bied altijd een eenvoudige stopoptie."},
  {id:"q16",kind:"Kinky vragen",intensity:"Reflectie",title:"Welke titel past?",text:"Welke aanspreekvorm past bij jouw fantasie en welke zou nooit goed voelen? Wil je die altijd, alleen tijdens een scène of helemaal niet?"},
  {id:"q17",kind:"Kinky vragen",intensity:"Reflectie",title:"Wat maakt een opdracht spannend?",text:"Is het de toon, het wachten, de structuur, het rollenspel of het gevoel gezien te worden? Wat haalt de spanning juist weg?"},
  {id:"q18",kind:"Kinky vragen",intensity:"Reflectie",title:"Beeld en privacy",text:"Welke beelden wil je eventueel maken, wie mag ze bekijken en wanneer moeten ze verwijderd worden? Wat mag nooit worden opgenomen of gedeeld?"},
  {id:"q19",kind:"Kinky vragen",intensity:"Reflectie",title:"AI-grenzen",text:"Welke rol mag een AI Dom aannemen en welke onderwerpen, opdrachten of aannames moeten altijd geblokkeerd blijven?"},
  {id:"q20",kind:"Kinky vragen",intensity:"Reflectie",title:"Na de scène",text:"Wil je direct praten, eerst ontprikkelen of later terugkomen op de ervaring? Welke afspraak maakt die keuze makkelijk?"},
  {id:"a06",kind:"Aftercare",intensity:"Reflectie",title:"De lichaamsscan",text:"Zonder iets te forceren: merk op of je behoefte hebt aan zitten, bewegen, water, warmte of rust. Je hoeft niets te verklaren."},
  {id:"a07",kind:"Aftercare",intensity:"Reflectie",title:"De rol loslaten",text:"Gebruik een afgesproken afsluitzin en spreek elkaar weer aan buiten de rol. Vraag of ieder zich klaar voelt om af te ronden."},
  {id:"a08",kind:"Aftercare",intensity:"Zacht",title:"De privacycheck",text:"Controleer samen of er beelden of notities zijn gemaakt en wat ermee gebeurt. Verwijder alles wat iemand niet meer wil bewaren."},
  {id:"a09",kind:"Aftercare",intensity:"Reflectie",title:"Een check-in later",text:"Kies of je later vandaag of morgen wilt inchecken. Geen antwoordplicht en geen verwachting dat iedereen hetzelfde voelt."}

];

const kinds: Array<"Alles" | PromptKind> = ["Alles","Kinky opdrachten","Kinky vragen","Vanille & verbinding","Aftercare"];

type GameRound = { title: string; setup: string; task: string; debrief: string };
type ExperienceGame = { id: string; title: string; subtitle: string; level: string; duration: string; description: string; rounds: GameRound[] };
const experienceGames: ExperienceGame[] = [
 {id:"protocol",title:"The Protocol",subtitle:"Power exchange · Beginner",level:"Beginner",duration:"20–30 min",description:"Bouw een duidelijke D/s-dynamiek op met afgesproken aanspreekvormen, opdrachten en een bewust einde.",rounds:[
  {title:"01 · The Contract",setup:"Ga tegenover elkaar zitten. De leidende partner leest de afspraken rustig voor; de ontvangende partner mag elke regel wijzigen of weigeren.",task:"Spreek één aanspreekvorm, één gewenste vorm van leiding en twee grenzen af. Kies ook een stopwoord en een non-verbaal stopsignaal. Laat ieder de afspraken in eigen woorden herhalen.",debrief:"Vraag: voelt dit als een vrije keuze? Verander of schrap alles waar twijfel over bestaat."},
  {title:"02 · The First Instruction",setup:"De leidende partner gebruikt een kalme, duidelijke stem. Geen geschreeuw, vernedering of onverwachte aanrakingen.",task:"Geef maximaal drie concrete, niet-fysieke opdrachten binnen de afgesproken grenzen, bijvoorbeeld: leg je telefoon weg, kies de soundtrack en beschrijf welke rol je vandaag wilt aannemen. Na elke opdracht wacht je op een duidelijk akkoord.",debrief:"Bespreek welke toon en formulering prettig, spannend of juist niet passend voelde. Een opdracht overslaan heeft geen straf of consequentie."},
  {title:"03 · The Protocol",setup:"Kies samen één klein ritueel, zoals toestemming vragen vóór een volgende stap of een afgesproken begroeting.",task:"Voer het ritueel drie keer rustig uit. De leidende partner checkt tussendoor: groen, geel of rood? Geel betekent pauzeren en heronderhandelen; rood betekent direct stoppen.",debrief:"Beëindig de rollen bewust. Kies aftercare: water, stilte, een gesprek of ruimte. Leg vast wat je volgende keer wilt behouden of aanpassen."}
 ]},
 {id:"command",title:"The Command Room",subtitle:"Dominant language · Intermediate",level:"Intermediate",duration:"25–35 min",description:"Oefen met dominante taal, duidelijke opdrachten en vrijwillige overgave zonder druk of onverwachte escalatie.",rounds:[
  {title:"01 · Set the Tone",setup:"Kies vooraf welke aanspreekvormen en soorten dominante taal welkom zijn. Noteer verboden woorden of thema's.",task:"De leidende partner zegt drie korte, zelfverzekerde zinnen die binnen de afspraken vallen. De ontvangende partner geeft na elke zin feedback met groen, geel of rood. Geen enkele zin verplicht tot een handeling.",debrief:"Welke woorden gaven de gewenste sfeer? Welke woorden moeten uit het script blijven?"},
  {title:"02 · Three Commands",setup:"Kies alleen al goedgekeurde, alledaagse en risicoloze opdrachten. Spreek af dat 'pass' altijd voldoende is.",task:"Geef om de beurt maximaal drie opdrachten, zoals: kies een nummer, ga op een comfortabele plek zitten of beschrijf één behoefte. Wacht na iedere opdracht op een expliciet ja. Accepteer een nee direct en zonder discussie.",debrief:"Bespreek tempo, toon en keuzevrijheid. Was er ergens druk, verwarring of een onverwachte verwachting? Pas het script aan."},
  {title:"03 · Reclaim the Choice",setup:"De ontvangende partner krijgt bewust de regie terug.",task:"De ontvangende partner kiest hoe de scène eindigt: afronden, een rustige check-in doen of stoppen. De leidende partner bevestigt de keuze en bedankt voor de duidelijke communicatie.",debrief:"Sluit af met aftercare en een korte check-in later. Geen punten of beloningen worden toegekend voor het negeren van grenzen."}
 ]},
 {id:"service",title:"The Service Ritual",subtitle:"Service & devotion · Beginner",level:"Beginner",duration:"15–25 min",description:"Maak van vrijwillige dienstbaarheid een persoonlijk ritueel met aandacht, keuze en duidelijke waardering.",rounds:[
  {title:"01 · What Service Means",setup:"Iedereen benoemt wat dienstbaarheid voor hem of haar betekent en wat nadrukkelijk niet gewenst is.",task:"De ontvangende partner kiest één van twee vooraf afgesproken, eenvoudige gebaren, bijvoorbeeld de muziek kiezen of een drankje klaarzetten. De ander vraagt eerst toestemming en voert alleen de gekozen taak uit.",debrief:"Was de taak attent en welkom? Vermijd aannames dat een rol automatisch toegang of gehoorzaamheid geeft."},
  {title:"02 · The Presentation",setup:"Kies een optioneel presentatie- of begroetingsritueel, zoals een buiging, een formele zin of een moment stilte.",task:"Voer het ritueel uit en spreek daarna ieder één zin uit: wat voelde passend en wat wil je veranderen? Herhaal alleen als iedereen dat wil.",debrief:"Een ritueel is een gezamenlijke afspraak, geen verplichting buiten de afgesproken context."},
  {title:"03 · Recognition",setup:"De leidende partner erkent de aandacht en inzet; de ontvangende partner mag aangeven hoe waardering prettig voelt.",task:"Geef één concreet compliment over de zorg, communicatie of aandacht die je zag. Wissel daarna van rol of sluit de ervaring af.",debrief:"Kies aftercare en benoem één ding dat je waardeerde. Vraag toestemming voordat je persoonlijke feedback deelt of bewaart."}
 ]},
 {id:"trust",title:"The Trust Exercise",subtitle:"Boundaries & connection · All levels",level:"All levels",duration:"20–30 min",description:"Een intensieve gespreksgame waarin grenzen, spanning en vertrouwen expliciet worden gemaakt voordat je iets uitvoert.",rounds:[
  {title:"01 · Green / Amber / Red",setup:"Iedereen kiest een stopwoord en een non-verbaal signaal dat ook werkt als spreken lastig wordt.",task:"Noem om de beurt drie categorieën: welkom, misschien na overleg en niet toegestaan. De ander vat samen zonder te onderhandelen. Elke twijfel blijft buiten de scène.",debrief:"Controleer of de lijst klopt en makkelijk terug te vinden is. Geen toestemming betekent niet doorgaan."},
  {title:"02 · The Scenario",setup:"Kies een fictieve, niet-fysieke D/s-situatie, bijvoorbeeld een formeel protocol of een rollenspel met opdrachten.",task:"Speel de situatie twee minuten na met alleen vooraf goedgekeurde taal en eenvoudige handelingen. Stop halverwege bewust voor een check-in en vraag wat aangepast moet worden.",debrief:"Benoem het verschil tussen fantasie, toestemming voor een specifieke handeling en toestemming voor iets anders."},
  {title:"03 · Close with Care",setup:"Laat de rollen los en spreek elkaar weer als gelijken aan.",task:"Iedereen maakt de zin af: 'Op dit moment heb ik behoefte aan…' Kies samen water, rust, praten of ruimte. Plan alleen een vervolg als dat voor beiden welkom is.",debrief:"Een check-in achteraf is geen beoordeling. Geef ruimte voor gemengde gevoelens en verander toekomstige afspraken waar nodig."}
 ]},
 {id:"camera-director",title:"The Camera Director",subtitle:"Photo & video challenges · Intermediate",level:"Intermediate",duration:"15–30 min",description:"Maak een private, cinematic foto- of videoprompt met regie, poses, details en een duidelijke opt-out. Niets wordt automatisch opgenomen of gedeeld.",rounds:[
  {title:"01 · The Frame",setup:"Bespreek eerst wat gefotografeerd mag worden, welke lichaamsdelen of details buiten beeld blijven en of het materiaal uitsluitend privé blijft. Camera blijft uit tot iedereen ja zegt.",task:"De Dom geeft een concrete regie-opdracht: 'Kies een plek met zacht licht. Zet het object of detail dat we hebben afgesproken in beeld. Maak één testfoto van de compositie, zonder herkenbare of intieme details tenzij die expliciet zijn afgesproken.' Bekijk de foto samen en kies bewaren of direct verwijderen.",debrief:"Vraag of de regie prettig voelde en of het beeld binnen de afspraken bleef. Geen foto betekent ook een volwaardige deelname."},
  {title:"02 · The 10-Second Scene",setup:"Kies samen een volledig geklede, niet-expliciete scène: een silhouet, handen die een lint vasthouden, een sleutel, laarzen, handschoenen of een detail van een outfit. Geen gezicht of herkenbare achtergrond zonder expliciete toestemming.",task:"Maak optioneel een clip van maximaal 10 seconden. De Dom geeft drie regie-aanwijzingen: 'Kies je startpositie', 'Beweeg langzaam naar het afgesproken detail' en 'Eindig stil in het licht'. Eerst test je zonder opname; daarna pas opnemen als iedereen opnieuw akkoord is. Geen verborgen opname en geen automatische upload.",debrief:"Bekijk de clip samen, zonder druk om hem te bewaren. Kies privé bewaren, opnieuw opnemen of verwijderen. Deel of upload nooit zonder aparte, expliciete toestemming van iedereen die herkenbaar is."},
  {title:"03 · The Private Premiere",setup:"Iedereen behoudt zeggenschap over eigen beeld, stem, kleding, herkenbaarheid en opslag. Spreek af wie het bestand kan zien en wanneer het wordt verwijderd.",task:"Kies één van drie opties: alleen bekijken op het toestel, bewaren in een afgeschermde privéruimte als die beschikbaar is, of definitief verwijderen. Geef elkaar één compliment over creativiteit of regie, niet over uiterlijk tenzij dat welkom is.",debrief:"Check: voelde de opname vrijwillig en veilig? Leg vast dat toestemming voor maken geen toestemming voor uploaden, delen of hergebruik betekent."}
 ]},
 {id:"ai-dom",title:"AI Dom · The Director",subtitle:"AI-led roleplay · Personalised prompts",level:"Adaptive",duration:"10–30 min",description:"Een dominante AI-persona geeft duidelijke, aanpasbare opdrachten en reageert op je gekozen intensiteit. Dit is de begeleide game-ervaring; live AI-chat vereist een aangesloten AI-backend.",rounds:[
  {title:"01 · Choose Your Dynamic",setup:"Kies de gewenste aanspreekvorm, toon (kalm, streng of plagerig), intensiteit en onderwerpen die verboden terrein zijn. Stel stopwoord en pauze-/stopknop in voordat de rol begint.",task:"AI Dom opent met: 'Welkom. Jij kiest de grenzen; ik geef de richting. Kies je toon en intensiteit, en vertel me wat vandaag buiten de scène blijft.' Selecteer alleen wat bij je past. Geen keuze wordt als toestemming geïnterpreteerd.",debrief:"Controleer de instellingen. Als een onderwerp niet expliciet is goedgekeurd, blijft het buiten het spel."},
  {title:"02 · The Command Sequence",setup:"De Dom-rol gebruikt alleen de vooraf gekozen toon en goedgekeurde onderwerpen. Iedere opdracht moet overslaanbaar zijn.",task:"Voorbeeldscript: 'Sta even stil en kies je houding als dat comfortabel voelt. Beschrijf daarna in één zin wat je van deze scène verwacht.' Volgende stap: 'Kies één van mijn twee veilige opdrachten, of zeg PASS.' De speler kan aanpassen, pauzeren of stoppen; er volgt geen straf voor grenzen.",debrief:"Na elke opdracht kiest de speler groen, geel of rood. Geel pauzeert de scène voor aanpassing; rood beëindigt de scène onmiddellijk."},
  {title:"03 · The Debrief",setup:"De AI Dom verlaat de rol zodra de speler op Stop drukt of de ronde eindigt.",task:"Afsluitende tekst: 'De scène is voorbij. Je hoeft niets te bewijzen. Wil je rust, een korte reflectie of de ervaring afsluiten zonder vragen?' Kies aftercare en geef alleen feedback die je wilt delen.",debrief:"Een echte AI Dom-chat moet server-side grenzen, leeftijdspoort, consent-instellingen en stopcontrole gebruiken. Deze voorbeeldscène doet niet alsof live AI of opgeslagen chat al is aangesloten."}
 ]}

];

const roundChallengeVariants: Record<string, string[]> = {
 "protocol-0": ["Laat de speler zelf één protocolregel formuleren en vraag de Dom die letterlijk te herhalen.", "Kies samen een openingszin en oefen die tweemaal: eerst buiten de rol, daarna alleen als beiden dat willen.", "Laat de speler één afspraak kiezen die deze ronde extra duidelijk wordt nageleefd."],
 "protocol-1": ["Geef één opdracht over muziek of sfeer en wacht op een expliciet akkoord.", "Vraag de speler een veilige voorkeur te kiezen uit twee opties en bevestig de keuze rustig.", "Gebruik een afgesproken aanspreekvorm en vraag na de opdracht of die nog prettig voelt."],
 "protocol-2": ["Laat de speler het ritueel afronden met een eigen gekozen zin en een check-in.", "Wissel de volgorde van het ritueel en de reflectie, mits beiden akkoord zijn.", "Sluit af met een korte waardering voor duidelijke communicatie en kies aftercare."],
 "command-0": ["Kies een formele aanspreekvorm en test die met drie verschillende, vooraf goedgekeurde zinnen.", "De Dom beschrijft de gewenste sfeer in één zin; de speler kiest wat behouden of aangepast wordt.", "Spreek één verboden woord af en laat de Dom een alternatieve formulering gebruiken."],
 "command-1": ["Geef één creatieve opdracht rond muziek, een voorwerp of een korte reflectie.", "Bied twee veilige taken aan en laat de speler kiezen, aanpassen of passen.", "Geef de instructie in een andere afgesproken toon en check of die beter werkt."],
 "command-2": ["De speler kiest een eigen eindzin waarmee de rol wordt afgesloten.", "De speler geeft de Dom één concrete aanwijzing voor een betere volgende ronde.", "Rond af met groen/geel/rood en kies samen of er aftercare nodig is."],
 "service-0": ["Kies een servicehandeling uit een lijst van drie kleine, veilige gebaren.", "Vraag welke vorm van aandacht welkom is: praktisch, creatief of verbaal.", "Laat de speler zelf een attent gebaar bedenken en vraag vóór uitvoering toestemming."],
 "service-1": ["Maak een optioneel begroetingsritueel met een voorwerp of afgesproken zin.", "Laat de speler twee mogelijke rituelen vergelijken en er één kiezen of beide afwijzen.", "Verander één detail van het ritueel en check of het nog steeds betekenisvol voelt."],
 "service-2": ["Geef waardering voor aandacht, communicatie of creativiteit, niet voor gehoorzaamheid op zich.", "Laat beide spelers één ding benoemen dat ze van de ander geleerd hebben.", "Sluit af met een zelfgekozen aftercare-optie en bespreek wat je wilt bewaren."],
 "trust-0": ["Bespreek een grens rond taal, aanraking en privacy afzonderlijk.", "Laat iedereen één 'misschien' omzetten naar ja, nee of eerst meer informatie.", "Oefen één keer met pauzeren en hervatten nadat een afspraak is verduidelijkt."],
 "trust-1": ["Speel een formele begroeting of een veilige opdrachtenscène van maximaal twee minuten.", "Oefen een rollenspel waarin de speler een opdracht aanpast en de Dom dat direct respecteert.", "Laat de Dom drie mogelijke opdrachten noemen; de speler kiest alleen wat welkom is."],
 "trust-2": ["Iedereen kiest één aftercare-optie en mag die zonder uitleg veranderen.", "Geef een korte terugkoppeling: één prettig detail en één aanpassing voor later.", "Sluit af met de vraag: wil je afronden, pauzeren of een vervolg plannen?"],
 "camera-director-0": ["Maak een testcompositie van een afgesproken rekwisiet en controleer de achtergrond op herkenbare details.", "Kies samen tussen close-up, zijaanzicht of silhouet; maak pas een foto na een nieuwe ja.", "Laat de speler zelf de kadrering bepalen en vraag de Dom alleen om feedback als die welkom is."],
 "camera-director-1": ["Film maximaal tien seconden van een afgesproken object met één langzame camerabeweging.", "Maak eerst een proefronde zonder opname; start daarna alleen na opnieuw bevestigde toestemming.", "Kies een beginbeeld, één beweging en een eindbeeld; controleer daarna samen of de clip bewaard mag worden."],
 "camera-director-2": ["Bekijk het materiaal één keer en kies bewust bewaren, opnieuw maken of verwijderen.", "Controleer metadata, achtergrond en herkenbaarheid voordat je besluit iets privé te bewaren.", "Bevestig afzonderlijk toestemming voor opslag en voor eventueel delen; standaard is niet delen."],
 "ai-dom-0": ["Laat de speler eerst toon, aanspreekvorm en drie grenzen kiezen voordat de persona spreekt.", "Begin met een korte check-in en laat de speler één thema voor deze ronde selecteren.", "Laat de AI Dom de afspraken samenvatten en vraag de speler of de samenvatting klopt."],
 "ai-dom-1": ["Geef één korte opdracht met twee veilige keuzes en een expliciete PASS-optie.", "Bied een service-, reflectie- of creatieve opdracht aan; laat de speler kiezen zonder druk.", "Vraag na één opdracht of de toon kalmer, strenger, speelser of helemaal uit moet."],
 "ai-dom-2": ["Laat de speler kiezen tussen aftercare, reflectie of meteen afsluiten.", "Vraag één optionele feedbackvraag en bied daarnaast een knop om niets te delen.", "Beëindig de rol expliciet en wis tijdelijke prompts als de speler daarvoor kiest."]
};



export default function PromptLibrary({ onBack, onComplete, playerId = "local-profile", language = "nl" }: { onBack: () => void; onComplete: () => void; playerId?: string; language?: "nl" | "en" }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const speechLocale = language === "nl" ? "nl-NL" : "en-US";
  const historyKey = `afterhours.prompt-history.v2:${playerId}`;
  const gameHistoryKey = `afterhours.game-variant-history.v1:${playerId}`;
  const domPreferenceKey = `afterhours.dom-preference.v1:${playerId}`;
  const [selectedDom, setSelectedDom] = useState<"masculine" | "feminine">(() => { try { return localStorage.getItem(domPreferenceKey) === "masculine" ? "masculine" : "feminine"; } catch { return "feminine"; } });
  const [kind, setKind] = useState<(typeof kinds)[number]>("Alles");
  const [mode, setMode] = useState<"games" | "cards">("games");
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameRound, setGameRound] = useState(0);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [seenPromptIds, setSeenPromptIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(historyKey) || "[]").filter((id: unknown) => typeof id === "string"); } catch { return []; } });
  const [seenGameVariants, setSeenGameVariants] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(gameHistoryKey) || "[]").filter((id: unknown) => typeof id === "string"); } catch { return []; } });
  const [activeVariant, setActiveVariant] = useState<{ key: string; text: string } | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [domReply, setDomReply] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = React.useRef<any>(null);
  const pool = useMemo(() => prompts.filter((item) => kind === "Alles" || item.kind === kind), [kind]);
  const recentPromptIds = seenPromptIds.slice(-Math.max(3, Math.min(12, Math.ceil(pool.length / 4))));
  const current = pool.find((item) => item.id === selectedPromptId) ?? pool.find((item) => !seenPromptIds.includes(item.id)) ?? pool.find((item) => !recentPromptIds.includes(item.id)) ?? pool[0];

  React.useEffect(() => {
    if (!current) return;
    setSeenPromptIds((previous) => {
      const nextHistory = previous[previous.length - 1] === current.id ? previous : [...previous, current.id].slice(-1000);
      try { localStorage.setItem(historyKey, JSON.stringify(nextHistory)); } catch { /* Local history is optional. */ }
      return nextHistory;
    });
  }, [current?.id, historyKey]);

  React.useEffect(() => { try { localStorage.setItem(gameHistoryKey, JSON.stringify(seenGameVariants.slice(-1000))); } catch { /* Local history is optional. */ } }, [gameHistoryKey, seenGameVariants]);
  React.useEffect(() => { try { localStorage.setItem(domPreferenceKey, selectedDom); } catch { /* Preference is optional. */ } }, [domPreferenceKey, selectedDom]);
  React.useEffect(() => {
    const speechWindow = window as any;
    if (!speechWindow.SpeechRecognition && !speechWindow.webkitSpeechRecognition) setVoiceSupported(false);
    return () => { try { recognitionRef.current?.stop(); } catch { /* Recognition may already be stopped. */ } };
  }, []);
  const createDomReply = (spoken: string) => {
    const message = spoken.toLowerCase();
    const stopIntent = language === "nl" ? /stop|rood|ik wil niet|beëindig|beeindig|klaar ermee/ : /stop|red|i don't want to|i do not want to|end it|finish now/;
    const pauseIntent = language === "nl" ? /geel|pauze|twijfel|langzamer|aanpassen|anders/ : /yellow|pause|not sure|slower|change|adjust/;
    const goIntent = language === "nl" ? /groen|doorgaan|verder|ja, graag|ik wil wel/ : /green|continue|go on|yes please|i want to/;
    const passIntent = language === "nl" ? /nee|pass|overslaan|niet doen/ : /no|pass|skip|don't do that|do not do that/;
    const helpIntent = language === "nl" ? /help|onveilig|bang|pijn|niet prettig/ : /help|unsafe|scared|pain|uncomfortable/;
    if (stopIntent.test(message)) { try { window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); } catch { /* Stop must work even if browser speech is already idle. */ } setVoiceListening(false); return t("We stoppen nu. Je hoeft niets uit te leggen. De scène is voorbij. Wil je aftercare of liever even stilte?", "We stop now. You don't need to explain. The scene is over. Would you like aftercare or a quiet moment?"); }
    if (pauseIntent.test(message)) return t("We pauzeren. Dank je dat je het zegt. Wat wil je aanpassen? We gaan pas verder als jij daar duidelijk voor kiest.", "We are pausing. Thank you for telling me. What would you like to change? We will only continue when you clearly choose to.");
    if (goIntent.test(message)) return t("Ik hoor je. We blijven binnen de afspraken die je hebt gekozen. Wil je dezelfde opdracht voortzetten of een andere veilige optie kiezen?", "I hear you. We will stay within the boundaries you chose. Would you like to continue this task or choose another safe option?");
    if (passIntent.test(message)) return t("Begrepen. Je mag passen zonder reden en zonder straf. Ik bied je een andere opdracht aan, of we stoppen hier.", "Understood. You can pass without a reason or penalty. I can offer another task, or we can stop here.");
    if (helpIntent.test(message)) return t("We stoppen de opdracht en checken eerst hoe het met je gaat. Je hoeft niets te bewijzen. Kies stoppen, pauzeren of aftercare.", "We are stopping the task and checking how you feel first. You have nothing to prove. Choose stop, pause, or aftercare.");
    return t("Ik heb je gehoord. Vertel me alleen wat je wilt delen. Wil je doorgaan, de opdracht aanpassen of pauzeren? Je grenzen blijven leidend.", "I hear you. Share only what you feel comfortable sharing. Would you like to continue, change the task, or pause? Your boundaries come first.");
  };
  const speakAsDom = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale;
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith(language));
    const genderTerms = selectedDom === "masculine" ? /male|man|martijn|ruben|xander/i : /female|vrouw|sara|claire|ellen|lotte/i;
    utterance.voice = voices.find((voice) => genderTerms.test(voice.name)) ?? voices[0] ?? null;
    utterance.rate = selectedDom === "masculine" ? 0.91 : 0.96;
    utterance.pitch = selectedDom === "masculine" ? 0.82 : 1.08;
    window.speechSynthesis.speak(utterance);
  };
  const readAssignment = (text: string) => {
    setVoiceError("");
    if (!("speechSynthesis" in window)) { setVoiceError(t("Voorlezen wordt niet ondersteund in deze browser.", "Text-to-speech is not supported in this browser.")); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale;
    utterance.rate = selectedDom === "masculine" ? 0.9 : 0.96;
    utterance.pitch = selectedDom === "masculine" ? 0.84 : 1.08;
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith(language));
    const genderTerms = selectedDom === "masculine" ? /male|man|martijn|ruben|xander/i : /female|vrouw|sara|claire|ellen|lotte/i;
    utterance.voice = voices.find((voice) => genderTerms.test(voice.name)) ?? voices[0] ?? null;
    window.speechSynthesis.speak(utterance);
  };
  const startVoiceReply = () => {
    setVoiceError("");
    const speechWindow = window as any;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setVoiceSupported(false); setVoiceError(t("Spraakherkenning wordt niet ondersteund in deze browser. Probeer Safari of Chrome en controleer de microfoonrechten.", "Speech recognition is not supported in this browser. Try Safari or Chrome and check microphone permissions.")); return; }
    try {
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = speechLocale;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setVoiceListening(true);
      recognition.onend = () => setVoiceListening(false);
      recognition.onerror = (event: any) => { setVoiceListening(false); setVoiceError(event?.error === "not-allowed" ? t("Microfoontoegang is geblokkeerd. Geef AFTER HOURS toestemming in je browserinstellingen.", "Microphone access is blocked. Allow AFTER HOURS in your browser settings.") : t("Ik kon je niet goed verstaan. Probeer het opnieuw of controleer je microfoon.", "I couldn’t understand that. Please try again or check your microphone.")); };
      recognition.onresult = (event: any) => {
        const transcript = String(event?.results?.[0]?.[0]?.transcript ?? "").trim();
        if (!transcript) { setVoiceError(t("Ik heb geen spraak herkend. Probeer het nog eens.", "No speech was detected. Please try again.")); return; }
        setVoiceTranscript(transcript);
        const reply = createDomReply(transcript);
        setDomReply(reply);
        speakAsDom(reply);
      };
      recognition.start();
    } catch { setVoiceListening(false); setVoiceError("De microfoon kon niet starten. Controleer de browserrechten en probeer opnieuw."); }
  };
  const stopVoiceReply = () => { try { recognitionRef.current?.stop(); } catch { /* Already stopped. */ } setVoiceListening(false); };

  const domTitle = selectedDom === "masculine" ? "Meester" : "Meesteres";
  const domGreeting = selectedDom === "masculine"
    ? "Ik neem de leiding binnen de grenzen die jij hebt gekozen. Je mag altijd aanpassen, pauzeren of stoppen."
    : "Ik neem de leiding binnen de grenzen die jij hebt gekozen. Je mag altijd aanpassen, pauzeren of stoppen.";
  const domVoice = selectedDom === "masculine"
    ? "Meester zegt: “Kijk naar je afspraken. Kies bewust, antwoord duidelijk en onthoud dat jouw grenzen leidend blijven.”"
    : "Meesteres zegt: “Kijk naar je afspraken. Kies bewust, antwoord duidelijk en onthoud dat jouw grenzen leidend blijven.”";

  const changeKind = (next: (typeof kinds)[number]) => { setKind(next); setSelectedPromptId(null); setCopied(false); };
  const next = () => {
    if (!pool.length) return;
    const recent = seenPromptIds.slice(-Math.max(3, Math.min(12, Math.ceil(pool.length / 4))));
    const unused = pool.filter((item) => !seenPromptIds.includes(item.id) && item.id !== current?.id);
    const cycle = pool.filter((item) => !recent.includes(item.id) && item.id !== current?.id);
    const candidates = unused.length ? unused : cycle.length ? cycle : pool.filter((item) => item.id !== current?.id);
    const choice = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
    setSelectedPromptId(choice.id);
    setCopied(false);
  };

  const startGame = (gameId: string) => {
    const game = experienceGames.find((item) => item.id === gameId);
    if (!game) return;
    setActiveGame(gameId);
    setGameRound(0);
    chooseGameVariant(gameId, 0);
  };

  const chooseGameVariant = (gameId: string, roundIndex: number) => {
    const key = `${gameId}-${roundIndex}`;
    const variants = roundChallengeVariants[key] ?? [];
    if (!variants.length) { setActiveVariant(null); return; }
    const unused = variants.map((text, i) => ({ key: `${key}-v${i}`, text })).filter((variant) => !seenGameVariants.includes(variant.key));
    const recent = seenGameVariants.slice(-12);
    const fallback = variants.map((text, i) => ({ key: `${key}-v${i}`, text })).filter((variant) => !recent.includes(variant.key));
    const options = unused.length ? unused : fallback.length ? fallback : variants.map((text, i) => ({ key: `${key}-v${i}`, text }));
    const chosen = options[Math.floor(Math.random() * options.length)];
    setActiveVariant(chosen);
    setSeenGameVariants((previous) => [...previous, chosen.key].slice(-1000));
  };
  const toggleSaved = () => setSaved((items) => items.includes(current.id) ? items.filter((id) => id !== current.id) : [...items, current.id]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`AFTER HOURS · ${current.kind.toUpperCase()}\n${current.title}\n\n${current.text}\n\nAlleen met vrije, expliciete en herroepbare toestemming.`); setCopied(true); }
    catch { setCopied(false); }
  };

  return <main className="prompt-library">
    <section className="prompt-hero"><span className="eyebrow">AFTER HOURS · THE DECK</span><h2>Choose your tension.</h2><p>Van zachte verbinding tot duidelijke power dynamics. Jij kiest wat past, wat niet past en wanneer je stopt.</p>
      <div className="prompt-filters" role="group" aria-label="Kies weergave"><button className={mode === "games" ? "active" : ""} onClick={() => {setMode("games");setActiveGame(null)}}>Complete games</button><button className={mode === "cards" ? "active" : ""} onClick={() => {setMode("cards");setActiveGame(null)}}>Losse kaarten</button></div>{mode === "cards" && <div className="prompt-filters" role="group" aria-label="Filter opdrachten">{kinds.map((item) => <button key={item} className={kind === item ? "active" : ""} onClick={() => changeKind(item)}>{item}</button>)}</div>}
      <div className="dom-picker" role="group" aria-label="Kies je Dom-persona">
        <div><span className="eyebrow">YOUR DOM · PERSONA</span><p>Kies de stem en aanspreekvorm die bij jouw ervaring past. Je kunt dit altijd veranderen.</p></div>
        <button type="button" className={selectedDom === "masculine" ? "selected" : ""} aria-pressed={selectedDom === "masculine"} onClick={() => setSelectedDom("masculine")}><span className="dom-picker-symbol" aria-hidden="true">♜</span><span><strong>Mannelijke Dom</strong><small>Meester · masculine voice</small></span><span className="dom-picker-check">{selectedDom === "masculine" ? "✓" : "+"}</span></button>
        <button type="button" className={selectedDom === "feminine" ? "selected" : ""} aria-pressed={selectedDom === "feminine"} onClick={() => setSelectedDom("feminine")}><span className="dom-picker-symbol" aria-hidden="true">♛</span><span><strong>Vrouwelijke Dom</strong><small>Meesteres · feminine voice</small></span><span className="dom-picker-check">{selectedDom === "feminine" ? "✓" : "+"}</span></button>
      </div>
    </section>
    {mode === "games" ? <section className="experience-catalog">
      {!activeGame ? <><div className="experience-intro"><span className="eyebrow">THE EXPERIENCE COLLECTION</span><h3>Choose your game.</h3><p>Volledige, begeleide scenario's met drie rondes, concrete opdrachten en een bewuste afsluiting. Alle deelnemers zijn 18+, stemmen vrij in en mogen op ieder moment passen of stoppen.</p></div>
        <div className="experience-grid">{experienceGames.map((game) => <article className="prompt-card experience-card" key={game.id}><div className="prompt-card-top"><span className="eyebrow">{game.subtitle}</span><span className="prompt-intensity">{game.duration}</span></div><div className="prompt-glyph" aria-hidden="true">✦</div><h3>{game.title}</h3><p>{game.description}</p><div className="prompt-consent"><ShieldCheck/><span>{game.rounds.length} rounds · Consent-first · {game.level}</span></div><button className="gold" onClick={() => startGame(game.id)}><ArrowRight/> Start experience</button></article>)}</div>
      </> : (() => { const game = experienceGames.find((item) => item.id === activeGame)!; const round = game.rounds[gameRound]; return <article className="prompt-card experience-play"><div className="prompt-card-top"><span className="eyebrow">{game.title}</span><span className="prompt-intensity">ROUND {gameRound + 1} / {game.rounds.length}</span></div><div className="prompt-glyph" aria-hidden="true">✦</div><h3>{round.title}</h3><p><strong>SET THE SCENE</strong><br/>{round.setup}</p><p className="dom-voice"><strong>{domTitle.toUpperCase()} · YOUR DOM</strong><br/>{domVoice}</p><p className="assignment-captions"><strong>YOUR ASSIGNMENT · ON-SCREEN CAPTIONS</strong><br/>{activeVariant?.text ?? round.task}</p><button type="button" className="read-assignment" onClick={() => readAssignment(`${round.title}. Opdracht: ${activeVariant?.text ?? round.task}. ${round.debrief}`)} aria-label="Lees opdracht en afsluiting hardop voor">🔊 Lees opdracht hardop voor</button><p><strong>CHECK-IN & DEBRIEF</strong><br/>{round.debrief}</p><div className="prompt-consent"><ShieldCheck/><span>Stopwoord en non-verbaal signaal blijven actief. Geel = pauze en afstemmen. Rood = direct stoppen.</span></div><div className="prompt-actions"><button onClick={() => {setActiveGame(null);setGameRound(0);setActiveVariant(null)}}>Exit game</button>{gameRound < game.rounds.length - 1 ? <button className="gold" onClick={() => { const nextRound = gameRound + 1; setGameRound(nextRound); chooseGameVariant(game.id, nextRound); }}><ArrowRight/> Next round</button> : <button className="gold" onClick={() => {setActiveGame(null);setGameRound(0);setActiveVariant(null);onComplete()}}><Check/> Complete experience</button>}</div></article>; })()}
    </section> : <>
    <section className="prompt-card">
      <div className="prompt-card-top"><span className="eyebrow">{current.kind.toUpperCase()}</span><span className="prompt-intensity">{current.intensity}</span></div>
      <div className="prompt-glyph" aria-hidden="true">✦</div><h3>{current.title}</h3>{current.title.startsWith("AI Dom") && <p className="dom-voice"><strong>{domTitle.toUpperCase()} · AI PERSONA</strong><br/>{domGreeting}</p>}<p className="assignment-captions">{current.text}</p><button type="button" className="read-assignment" onClick={() => readAssignment(`${current.title}. ${current.text}`)} aria-label="Lees deze opdracht hardop voor">🔊 Lees opdracht hardop voor</button>
      {current.note && <p className="prompt-note">{current.note}</p>}
      <div className="prompt-consent"><ShieldCheck/><span>18+ · Vrijwillig · Je mag altijd passen of stoppen. Nieuwe kaarten worden per speler lokaal bijgehouden om herhaling te beperken.</span></div>
      <div className="prompt-actions"><button className="gold" onClick={next}><Shuffle/> Volgende kaart</button><button onClick={toggleSaved}><Heart fill={saved.includes(current.id) ? "currentColor" : "none"}/>{saved.includes(current.id) ? "Bewaard" : "Bewaar"}</button><button onClick={() => { if (!completed.includes(current.id)) { setCompleted((items) => [...items, current.id]); onComplete(); } }}>{completed.includes(current.id) ? <Check/> : <ArrowRight/>}{completed.includes(current.id) ? "Gedaan" : "Markeer gedaan"}</button><button onClick={() => void copy()}>{copied ? <Check/> : <Copy/>}{copied ? "Gekopieerd" : "Kopieer"}</button></div>
    </section>

    </>}
    {((mode === "games" && !!activeGame) || mode === "cards") && <section className="voice-dom-panel" aria-label="Praat met je Dom">
      <div className="voice-dom-heading"><span className="voice-dom-orb" aria-hidden="true">{selectedDom === "masculine" ? "♜" : "♛"}</span><div><span className="eyebrow">HANDS-FREE · VOICE MODE</span><h3>Praat met {domTitle}</h3><p>Reageer hardop in het Nederlands. Je hoeft niets te typen.</p></div></div>
      <div className="voice-dom-controls"><button type="button" className={voiceListening ? "voice-listen listening" : "voice-listen"} onClick={voiceListening ? stopVoiceReply : startVoiceReply} aria-pressed={voiceListening}>{voiceListening ? "■ Stop luisteren" : "🎙️ Spreek je antwoord in"}</button><button type="button" className="voice-replay" disabled={!domReply} onClick={() => speakAsDom(domReply)}>▶ Herhaal stem</button></div>
      {voiceListening && <p className="voice-status" role="status">Ik luister… spreek rustig en zeg duidelijk “geel” voor pauze of “rood” om te stoppen.</p>}
      {voiceTranscript && <div className="voice-transcript"><span className="eyebrow">JOUW ANTWOORD</span><p>{voiceTranscript}</p></div>}
      {domReply && <div className="voice-reply"><span className="eyebrow">{domTitle.toUpperCase()} ANTWOORDT</span><p>{domReply}</p></div>}
      {voiceError && <p className="voice-error" role="alert">{voiceError}</p>}
      {!voiceSupported && <p className="voice-error">Deze browser ondersteunt geen ingebouwde spraakherkenning. Gebruik een actuele Safari- of Chrome-browser en sta microfoontoegang toe.</p>}
      <p className="voice-privacy">Microfoon wordt alleen gebruikt wanneer je op de spreekknop drukt. Browser-spraakherkenning kan afhankelijk van je toestel via de spraakdienst van de browser verlopen. Stoppen, geel en rood worden altijd als pauze- of stopintentie behandeld.</p>
    </section>}
    {mode === "cards" && <section className="prompt-count"><span>{pool.length} kaarten in deze selectie</span><span>{pool.filter((item) => !seenPromptIds.includes(item.id)).length} nog niet gezien</span><span>{saved.length} lokaal bewaard</span></section>}
    <button className="prompt-back" onClick={onBack}><ArrowRight/> Terug</button>
  </main>;
}
