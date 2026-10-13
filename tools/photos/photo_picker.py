#!/usr/bin/env python3
r"""Photo picker for the Irad Wiki.

Opens a page in your browser to go through the photos downloaded by
download_commons_photos.py, one entry at a time: pick the photo you like, or
skip the entry if none is good. Your choices are saved as you go, so you can
close it and come back. When you're done, press Submit: the chosen photos are
copied, named for the wiki, into  commons_photos/chosen/  together with a
credits file for each.

Run it from the folder that contains commons_photos/ (the same folder as the
downloader):

    py photo_picker.py                 # Windows
    python3 photo_picker.py            # Mac / Linux
    py photo_picker.py --dir D:\somewhere\commons_photos

Keys on the page: 1-9 pick a photo, S skip, Left/Right previous/next entry,
Enter next undecided entry, click a photo to enlarge it.
Stop the program with Ctrl+C in the terminal window.
"""
import argparse, json, mimetypes, os, shutil, sys, threading, urllib.parse, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

WIKI = "https://irad.wiki/#"
TITLES = set(["1898 Andijan Uprising (Iradi Theater)", "1928 Latinization Decree", "1941 Cyrillic Mandate", "1944 Wartime Mobilization Strike", "1952 Kobozev Steel Strike", "1956 Talas Riots", "1971 Antimony Expansion Directive", "1995 Latin Orthography Revision", "1998 Talas Agribusiness Accord", "2001 Basing Rights Agreement", "2003 Judicial Reforms Act", "2008 Unification Referendum Initiative", "2011 Bilateral Reunification Summit", "2013 Constitutional Amendment", "2015 Electoral Reform Controversy", "2018 Border Demarcation Clashes", "2018 Irad census", "2023 Iradi gubernatorial election", "2023 Student Protests in Talas", "2024 Iradi Executive Transition Crisis", "2025 Trump Remarks on Irad", "Achuu-Köl", "Adat (Customary Law)", "Adat Law in the ATR", "Adil Toktarov", "Administrative divisions of Irad", "Agriculture in Irad", "Aida Temirova", "Aidar Maksat", "Aigul Choro kyzy", "Aigul Daniyarova", "Aigul Omurova", "Airan (Culinary)", "Aizhan Kulova", "Ak-Balyk Creek", "Ak-Bash", "Ak-Bulak", "Ak-Chiy", "Ak-Döbö", "Ak-Jal", "Ak-Jar", "Ak-Kalpak", "Ak-Kula (Legendary Horse)", "Ak-Kyr", "Ak-Kyya", "Ak-Muz", "Ak-Suu Canyon", "Ak-Suu Mineral Springs", "Ak-Tash", "Ak-Taylak (Folklore)", "Ak-Terek", "Ak-Tilek Ranch", "Ak-Örgoe", "Aksakal (Social Term)", "Aksay Alpine Ranching Cooperative", "Aksay Border Patrol Post", "Aksay Emergency Shelter", "Aksay Plateau", "Aksay Plateau Pastoral Cooperative", "Akyel Breeding Sanctuary", "Akyel Chestnut Bloodline", "Akyel Equine Logistics & Breeding Syndicate", "Akyel Horse", "Akyel Palomino Lineage", "Akzhaykyn Depression", "Alaman-Bayge", "Albasty (Mythology)", "Alexey Smirnov", "Alikhan Media Center", "Alikhan Toktarov", "Alimbekov-Baker Treaty", "Almaluu", "Almanbet (Chongtor Stallion)", "Almazbek Kasymov", "Almazbek Mamyt uulu", "Altyn-Bulak", "Altyn-Say", "Altyn-Zhylky Awards", "Altynai Bekzhanova", "Amanbek Alimbekov", "Ambar-Döbö", "Amina Yunusova", "Anara Toktarova", "Andronovo Culture in Transoxiana", "Antimony Mining in Irad", "Aral", "Archaly", "Archbishopric of Iyık Janyl", "Armed Forces of Irad", "Arsha (Flora)", "Arsha Juniper Incense Tradition", "Arslanbob", "Arslanbob Falls", "Artem Kozlov", "Asanbek Daniyarov", "Asel Bekzatova", "Ashuu (Geographical Term)", "At Chabysh (Racing)", "At-Chabysh-Tushuk", "Attelkom", "Attelkom Cellular Relay Tower", "Attelkom Data Center", "Attelkom Fiber Backbone", "Autonomous Tribal Grazing Arbitration Tribunal", "Autonomous Tribal Regions", "Azamat Temirov", "Bakhytzhan Kim", "Baktygul Omurova", "Bakyt Orozbekov", "Bakyyan", "Bank of Irad", "Bank of Irad Clearing House", "Barnabas (priest)", "Bata (Culture)", "Battle of Kobozev Railhead (1992)", "Battle of Talas", "Battle of the Aksay Pass (1221)", "Batyrbek Arstanov", "Bazar-Korgon", "Bazar-Terek", "Bazar-i Kalan", "Beknur Karimov", "Bektur Zhumabek uulu", "Bekzat Toktarov", "Bel-Aldy", "Bel-Baa", "Beldik", "Bermet Alimbekova", "Besh-Köl", "Besh-Köl Glaciers", "Besh-Moinok", "Besh-Tash Ecological Conservation Area", "Besh-Tash Lower Tarn", "Besh-Tash National Park", "Besh-Tash Ranger Headquarters", "Besh-Tash Timber Concession", "Besh-Tash Upper Lake", "Besh-Terek", "Beshbarmak (Culinary)", "Beshbarmak (Iradi Style)", "Betpak-Dala", "Bishkek Ceasefire Agreement (2007)", "Bitik-Tash", "Biybolot Moldosh uulu", "Bolotbek Bekzhanov", "Bolotbek Daniyarov", "Boorsok (Culinary)", "Botai Culture in Irad", "Boz-Adyr", "Boz-Korgon", "Boz-Suu", "Boz-Tektir", "Bulak-Bashy", "Burkut Saluu", "Burulcha Sydyk kyzy", "Bush Family Palatial Complex Conspiracy Theory", "Bürkit-Togoo", "Bürküt (Fauna)", "Bürküt-Uya", "Caravanserai of Rabat-i-Safed", "Carved Bone Stirrup", "Carved Walnut Saddle Tree", "Carved Walnut Tobacco Box", "Cathedral Seminary Library of Iyık Janyl", "Cathedral Seminary of Iyık Janyl", "Central Asian Badger", "Central Asian Cobra", "Central Asian Pastoral Migration System", "Central Asian River Otter", "Chakmak-Say", "Chatkal Antimony Processing Mill", "Chatkal Chemical Smelting Complex", "Chatkal Golden Eagle", "Chatkal Gorge", "Chatkal Mountain Rescue Base", "Chatkal Placer Mining Inspectorate", "Chatkal Primary Health Post", "Chatkal Range", "Chatkal Rare Earth Facility", "Chatkal River", "Chatkal Snow Leopard Sanctuary", "Chatkal Tailings Repository", "Chatkal Wildlife Protection Post", "Chet-Bulak", "Chingiz Asanov", "Cholpon-Bulak", "Chong-Kapka", "Chong-Kenkol", "Chong-Talas Stud Farm", "Chongtor Dun Bloodline", "Chongtor Horse", "Chongtor Horse Breeding Guild", "Chongtor Roan Strain", "Chongtor Studbook Registry", "Choor (Flute)", "Chopo-Jar", "Chu Basin Hydrological Station", "Chu Irrigation Canal System", "Chu River Basin", "Chu Valley Irrigation Inspectorate", "Chui Cotton Inspection Directorate", "Chui Steppe Fox", "Chui Sugar Refining Corporation", "Church of St. Janyl", "Chyk (Culinary)", "Chylbyr", "Chynara Mamytova", "Chyny-Kap", "Cinema of Irad", "Communist Party of Irad", "Conagra Talas Beef Facility", "Culture of Irad", "Darwaza (Architecture)", "Dary-Bulak", "Dastan Isakov", "Dastgoh (Craft Term)", "Dastgoh Creek", "Dastgoh District", "David Chen", "David Sterling", "Dayuan Heavenly Horse Heritage", "De-Russification Movement in Irad", "Declaration of State Sovereignty (1991)", "Decree on Pasture Collectivization (1932)", "Democratic Party of Irad", "Democratic Republic of Irad", "Demographics of Irad", "Desert Sun’s Rebellion", "Diz (Architecture)", "Diz Film Festival", "Diz-i Safid", "Diz-i Zard", "East Syriac Rites of Iyık Janyl", "East Tian Shan Mineral Survey", "Economy of Irad", "Education in Irad", "Eerchilik (Saddlery)", "El-Choro (Military)", "El-Choro Militias", "Elections in Irad", "Elective Governor Acts (1992)", "Elena Kim", "Elena Petrova", "Embossed Leather Kamcha", "Emil Bekzatov", "Energy in Irad", "Erkinbek Asan uulu", "Erlan Toktarov", "Eski-Aryk", "Eski-Korgon", "Eyer-Kash", "Fallen Rider Tradition", "Fatima Asanova", "Fatima Yunusova", "Feast of St. Janyl", "Fergana Gateway", "Fergana Mountain Transit Highway", "First Congress of Iradi Soviets", "First Iradi Civil War", "Flag of Irad", "Foreign relations of Irad", "Founding of Talas Air Base (1952)", "FreeIrad.org", "Geography of Irad", "Gulmira Saparova", "Gulnara Sadykova", "Hauzdy", "Health in Irad", "History of Irad", "Human rights in Irad", "Ichik", "Ichke-Suu Gorge", "Irad", "Irad Central Sports Complex", "Irad Film Society", "Irad Foreign Trade Escrow Authority", "Irad Palace of Art", "Irad Special Economic Zone", "Irad State Hippodrome", "IradOne", "IradOne Transmitter Mast", "Iradi Americans", "Iradi Antimony and Rare Metals Combine", "Iradi Argali", "Iradi Bridle Rosette", "Iradi Country-Folk", "Iradi Equestrian Culture & Breeds", "Iradi Felt Saddlecloth", "Iradi Freedom Society", "Iradi Freedom Society Chancellery", "Iradi Horsemeat Taboo", "Iradi Language", "Iradi Leatherworks Factory", "Iradi Mountain Trout", "Iradi National Chamber of Mining and Metallurgy", "Iradi Petroleum Transit Consortium", "Iradi Soviet Socialist Republic", "Iradi Telegraph Office", "Iradi Woolen Chapan", "Iradi Zoomer Movement", "Iradi alphabet", "Iradi cuisine", "Iradi name", "Iradi som", "Iradimania", "Iradiya", "Irad–China relations", "Irad–Kazakhstan relations", "Irad–Kyrgyzstan relations", "Irad–Russia relations", "Irad–United States relations", "Irad–Uzbekistan relations", "Irchy (Folklore)", "Irda (Vocal Tradition)", "Islam in Irad", "Isyk-Bulak", "Iyık Janyl", "Iyık Janyl Diocesan Archives Vault", "Iyık Janyl Monastic Cloister", "Iyık Janyl Pilgrimage Hostel", "Iyık Janyl Seminary Choir", "Jangak-Bulak", "Jangy-Aryk", "Jangy-Jol", "Janyl (Historical Figure)", "Janyl, Mother of Irad", "Jashyl-Köl", "Jason Ilyasov", "Jele-Döbö", "Jety-Kaiyng", "Jolchu (Album)", "Jon-Aryk", "Jyluu-Bulak", "Jük", "Kadyrbek Asylbekov", "Kaiyrma", "Kalba", "Kalmak-Kuduk", "Kalyk Asanov", "Kambarkan", "Kamcha (Horsewhip)", "Kamcha-Sabi", "Kamran Bekzatov", "Kamyshtuu", "Kanatbek Niyaz uulu", "Kand (Linguistic Term)", "Kand-i Kohna", "Kand-i Nau", "Kanybek Arstanov", "Kanybek Zhumaliev", "Kanysh-Kiya", "Kapka-Bel", "Kapka-Tash", "Kara-Bulak", "Kara-Bulak Agricultural Cooperative", "Kara-Bulak Grain Logistics Depot", "Kara-Buura", "Kara-Darya", "Kara-Jygach", "Kara-Jylga", "Kara-Kazan Cirque", "Kara-Koyun Valley", "Kara-Kungey", "Kara-Say", "Kara-Suu Canyon", "Kara-Suu Gold Prospecting Area", "Kara-Suu Hydroelectric Station", "Kara-Suu Rapids", "Kara-Suu Rural Health Center", "Kara-Suu Tribal Elders Council Hall", "Kara-Unkur Cave", "Karakol", "Karakol Glacier", "Karakol Mountain Logistics Depot", "Karakol-Ashuu", "Karakoyun Pass", "Karakoyun Wool Fleece", "Karakul Sheep (Irad)", "Karakyr Range", "Karool-Döbö", "Kashka-Jol", "Kashka-Suu", "Kashka-Suu Glaciers", "Kashkar-Aryk", "Kaz-Köl", "Kazy", "Kazy-Karta (Culinary)", "Kemer Antimony Mine", "Keneshbek Arstanov", "Keneshbek Choro uulu", "Keneshbek Mamyt uulu", "Keneshbek Zhumaliev", "Keng-Talaa", "Kenkol Mountain Meteorological Post", "Kenkol Pass", "Kerege (Yurt Part)", "Khunuk Creek", "Kichi-Bel", "Klara Alimbekova", "Klara Zhumabek kyzy", "Koi-Bel", "Kok-Tash Kariz System", "Kok-Terek (Lost Film)", "Komuz (Iradi)", "Korgoncho", "Koryo-saram in Irad", "Kosh-Bel", "Kosh-Döbö", "Kosh-Külö", "Koshkar Muyuz", "Kuban Mamytov", "Kubanbek Moldosh uulu", "Kuble (Culture)", "Kucheh (Urban Term)", "Kulan-Sor", "Kulan-Talaa", "Kum-Aryk", "Kum-Bel", "Kum-Say Fan", "Kumdy-Bulak", "Kuru-Say", "Kurut", "Kyl-kyak", "Kylych-Kyr", "Kymyz (Iradi Beverage)", "Kymyz-Sabaa", "Kyrk-Bulak", "Kyrk-Choro", "Kyrk-Kazyk Caves", "Kyshtoo (Pastoral Term)", "Kyzyl-Adyr", "Kyzyl-Adyr Hills", "Kyzyl-Bel", "Kyzyl-Bel Pass", "Kyzyl-Döbö", "Kyzyl-Jar", "Kyzyl-Jar Antimony Shafts", "Kyzyl-Köl", "Kyzyl-Suu", "Kyzylkum Fringe", "Kök-Art Pass", "Kök-Bel Pass", "Kök-Döbö", "Kök-Jar", "Kök-Jar Pass", "Kök-Jar Primary School", "Kök-Kamar Gorge", "Kök-Moinok", "Kök-Oi", "Kök-Say", "Kök-Suu Peak", "Köl (Geographical Term)", "Köl-Sai", "Köpürö-Bazar", "Körktüülük", "Köz-Monchok", "Kümöch Sacramental Bread", "Kümüshtü", "Küü (Music)", "Lammergeier (Bearded Vulture)", "Lieutenant Gregory Vance", "List of governors of Irad", "Luka Ayyubov", "Lyudmila Ivanova", "Mailuu-Suu", "Major William Evans", "Manas Glacier", "Manas Peak (Irad)", "Manas Peak Glaciological Observatory", "Mar Ephrem", "Mar Timotheos Alimbekov", "Maratbek Sadykov", "March 11 Independence Day", "Marqos the Scribe", "Maryam Janyl (nun)", "Maryam-Bulak", "Mazar-Too", "Media of Irad", "Mikhail Chernov", "Ming-Örük", "Mirlan Toktarov", "Moiynkum Desert", "Mor-Folk", "Mor-Pop", "Mor-Wave", "Morkhan (Mythology)", "Mountain Juniper (Arsha)", "Mountain Wild Oregano", "Muratbek Biy", "Muratbek Tanıp-Biy", "Music of Irad", "Muyunkum Natural Gas Field", "Muz-Suu", "Muz-Tör", "Naryn River", "Naryn Water and Power Protocol", "National Equestrian Sports Directorate", "National Historical Museum of Irad", "Navbahor (Cultural Term)", "Navbahor District", "Navbahor Pond", "Nestorian Synod of Navekat (1180)", "Nikolai Voronov", "Noga-Baw", "Northern Border Demarcation Protocol", "Northern Export Feeder", "NurGaz", "NurGaz Pipeline Maintenance Depot", "NurGaz Worker Housing Complex", "Nurgazy Doolotov", "Nurlan Sadikov", "Nurzhan", "Nurzhan Agro-Industrial", "Nurzhan Asphalt and Bitumen Plant", "Nurzhan Botanical Gardens", "Nurzhan Children’s Polyclinic", "Nurzhan Emergency Dispatch Center", "Nurzhan Gas Compressor Station", "Nurzhan Heavy Machine Plant", "Nurzhan Municipal Botanical Institute", "Nurzhan Municipal Library", "Nurzhan Oil Discovery (1949)", "Nurzhan Petroleum Pipeline", "Nurzhan Polytechnic Institute", "Nurzhan Rail Freight Depot", "Nurzhan Refinery No. 1", "Nurzhan Technical Lyceum", "Old Talas Citadel Quarter", "Oleg Kim", "Oodarysh (Mounted Wrestling)", "Operation Clear Skies (2020)", "Operation Starlight", "Order of St. Janyl the Hermit", "Organic Act of the Territory of Irad", "Orozbek Doolotov", "Orto-Ayyl", "Orto-Sai Reservoir", "Otmek", "Oxus River in Iradi historiography", "Ozgörüsh", "Pavel Morozov", "Political status of Irad", "Politics of Irad", "Popular Front of Irad", "Privatization Scandals of 2007", "Proclamation of the DRI", "Provisional Government of Irad (1992)", "Public holidays in Irad", "Pul (Architecture)", "Pyotr Kobozev", "Qara-Chik Border Checkpoint", "Qara-Chik Demarcation Line", "Qatiq", "Rabat (Architecture)", "Rabat-i Kamal", "Rabat-i Sangin", "Religion in Irad", "Republican Gendarmerie of Irad", "Richard Taylor", "Rise of Glory", "Robert Hayes", "Ruins of Old Iyık Janyl", "Ruslan Kadyrov", "Ruslan Toktarov", "Russos of Nurzhan", "Rustam Bekzatov", "Sabz-Kand", "Sadaf-Jar", "Sakal-Akesi", "Saker Falcon (Irad)", "Samat Kasymov", "Sanjyra (Genealogy)", "Saparbek Temirov", "Sarchashma Springs", "Sary-Bulak", "Sary-Bulak Antimony Works", "Sary-Bulak Gorge", "Sary-Chelek Biosphere Reserve", "Sary-Döbö", "Sary-Kyr", "Sarymsakty", "Sasyk-Bulak", "Second Iradi Civil War", "Semirechye Apple", "Semirechye Revolt (Irad)", "Sergei Nechayev (Iradi Influence)", "Sergei Voronov", "Shaar-Döbö", "Shagyldy", "Shahr (Linguistic Term)", "Shahr-i Buzurg", "Shahr-i Kabud", "Shahr-i Khunuk", "Shahr-i Nav", "Shelji", "Shire (Leathercraft)", "Shyrdak (Iradi Craft)", "Siberian Ibex (Irad)", "Siege of Kokand (1876)", "Silver Inlaid Kamcha", "Silver Inlay Horse Bit", "Snow Leopard (Irad)", "Socialist Republic of Irad", "Sogdian City-States of the Chu", "Sopol-Tepa", "Sport in Irad", "St. Luka Clinic", "St. Luka Community Health Mission", "St. Maryam Catholic Academy", "St. Teresa Community Kitchen", "State Archives of Irad", "State Stud Farm of Talas", "Statutory Independence Ruling (2006)", "Stephanos (priest)", "Steppe Eagle (Irad)", "Storming of Talas (2007)", "Sukarne Feedlot Complex", "Sukarne Irad Complex", "Sukarne Quality Control Labs", "Supreme Court of Irad", "Suusamyr", "Suusamyr River", "Suusamyr Wool Washing Mill", "Svetlana Kozlova", "Swift Hooves (Compilation)", "Syro-Iradi Catholic Church", "Syro-Iradi Episcopal Synod", "Süzmö", "Tabyp (Medicine)", "Tai-Kazan", "Talaa (Geographical Term)", "Talas", "Talas Agribusiness Export Zone", "Talas Air Base", "Talas Airport Logistics Hub", "Talas Alatau", "Talas Basin Agricultural Directorate", "Talas Blood Services Center", "Talas Central Cattle Mart", "Talas Central Post Office", "Talas Chamber of Commerce", "Talas Checkpoint Incident (1956)", "Talas Cold Chain Logistics Hub", "Talas Customs Clearance Terminal", "Talas Dairy Processing Combine", "Talas District Court", "Talas Fire Station No. 2", "Talas Free Economic Trade Zone", "Talas Gendarmerie Academy", "Talas Municipal Bus Depot", "Talas Municipal Cold Storage", "Talas Municipal Fire Brigade", "Talas Municipal Gymnasium No. 4", "Talas Municipal Hospital No. 1", "Talas Municipal Water Authority", "Talas Municipal Water Treatment Works", "Talas Public Sanitation Works", "Talas Regional Hospital Medical Complex", "Talas River", "Talas River Barbel", "Talas River Hydrological Monitoring Service", "Talas Solar Park", "Talas State University", "Talas Symphony Orchestra", "Talas Town Hall Meeting (1992)", "Talas Veterinary Research Center", "Talas Wild Tulip", "Talasbank", "Talasfilm Archives and Film Preservation", "Talasfilm Studios", "Taldy-Bulak", "Taldy-Suu", "Talgat Saparov", "Talgatbek Moldoshev", "Tar-Kapchygai", "Tar-Say", "Tash-Kuduk", "Tash-Kömür", "Tash-Köröö", "Tatiana Petrova", "Tegerek-Köl", "Tegirmen", "Teke-Tash", "Temir-Kapka Gate", "Temirchi", "Terek-Sai", "Territorial Legislature of Irad", "Territory of Irad (1992–2006)", "Teshik-Talaa", "Teskey-Jar", "The 1937 NKVD Clerical Purges", "The 2021 Regional Security Alert", "The Black Blizzard of 1916 (Poem)", "The Epic of Janyl", "The Hunter's Vigil", "The Kobozev Bread Riots (1989)", "The Legend of the White Rider", "The Lost Tribes of 1916", "The Spirit of Irad", "The Star of Irad (Symbol)", "The Urkun (Iradi Theater)", "Tian Shan Barberry", "Tian Shan Birch", "Tian Shan Brown Bear", "Tian Shan Pika", "Tian Shan Snowcock", "Tian Shan Spruce", "Tien Shan Marches", "Tilek Kurmanov", "Timur Karimov", "Timur Toktarov", "Togoo (Saddlery)", "Toguz-Bulak", "Toktogul (town)", "Toktogul Hydroelectric Complex", "Tolkun (Lost Film)", "Tolonbek Niyazov", "Tolonbek Sydykov", "Toma Alimbek", "Tomoga", "Torukashka", "Tourism in Irad", "Trans-Chuy Freight & Logistics", "Trans-Irad Pipeline Proposals", "Trans-Talas Highway", "Transoxiana Microfinance Fund", "Transport in Irad", "Treaty of Good Neighborliness (1994)", "Treaty of Kuldja (Iradi Frontier)", "Treaty of Talas (1727)", "Tulpar (Mythology)", "Tumak", "Tunuk-Bulak", "Turkestan Lynx", "Turkestan Steppe Tortoise", "Tuura-Say", "Tuyuk-Suu Pass", "Tuzduu", "Tyin Emmei (Mounted Sport)", "Tynchtykbek Niyazov", "Tört-Kuduk", "Töshök", "Töö-Kuduk", "Tündük (Yurt Part)", "Uch-Emchek", "Uch-Terek Rapids", "Ulak Tartysh (Sport)", "United Nations Mission in Irad", "United States Withdrawal from the Alimbekov-Baker Treaty (2006)", "Urban Iradi Millennials", "Urmaral River", "Urmaral Tarns", "Uuk (Yurt Part)", "Uuk-Bulak", "Uzun-Akmat River", "Uzun-Akmat Terraces", "Uzun-Kyr", "Vasily Chernov", "Vasily Morozov", "Venera Kasymova", "White Steppe Wormwood", "Wild Mountain Cumin", "Wild Pistachio Shrub", "Wild Sea Buckthorn", "Wild Walnut (Juglans regia)", "Winter Uprising of 1992", "Xinjiang Lihua Cotton Facilities", "Xinjiang Lihua Ginning Mill No. 3", "Yuhanna of Merv", "Yusup Ayyubov", "Zalmax’s Dominion", "Zamirbek Bakiev", "Zara Toktarova", "Zarina (film)", "Zarina Alimbekova", "Zhalgyz-Terek", "Zharkyn (Horse)", "Zhayloo (Pastoral Term)", "Zheenbek Sadykov", "Zhetysu Industrial Textiles", "Zhez-Tyrmak (Mythology)", "Zhulduz (Astronomy)", "Zhylky (Equine Term)", "Zhypargul Kulova", "tüntolk", "Örüktü"])


def slug(title):
    return urllib.parse.quote(title.replace(" ", "_"), safe=",:()'")


class App:
    def __init__(self, root):
        self.root = os.path.abspath(root)
        cred = os.path.join(self.root, "credits.json")
        if not os.path.exists(cred):
            sys.exit(f"No credits.json in {self.root}. Run download_commons_photos.py first, "
                     "or point --dir at the commons_photos folder.")
        with open(cred, encoding="utf-8") as f:
            self.credits = json.load(f)
        self.picks_path = os.path.join(self.root, "picks.json")
        self.picks = {}
        if os.path.exists(self.picks_path):
            with open(self.picks_path, encoding="utf-8") as f:
                self.picks = json.load(f)
        self.lock = threading.Lock()

    def data(self):
        entries = []
        for stem, r in self.credits.items():
            arts = []
            for a in (r.get("articles") or "").split(";"):
                a = a.strip()
                if a:
                    arts.append({"title": a, "url": WIKI + slug(a) if a in TITLES else None})
            cands = []
            for n, c in enumerate(r.get("candidates") or [], 1):
                if not c.get("local"):
                    continue
                cands.append({"n": n, "img": "/img/" + urllib.parse.quote(c["local"].replace("\\", "/")),
                              "title": (c.get("title") or "")[5:], "author": c.get("author"),
                              "license": c.get("license"), "size": c.get("size"), "page": c.get("page")})
            entries.append({"stem": stem, "save_as": r.get("save_as"), "group": r.get("group"),
                            "photo": r.get("photo"), "notes": r.get("notes"), "query": r.get("query"),
                            "articles": arts, "candidates": cands})
        return {"entries": entries, "picks": self.picks}

    def save_picks(self, picks):
        with self.lock:
            self.picks = {k: v for k, v in picks.items() if k in self.credits}
            tmp = self.picks_path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self.picks, f, indent=1)
            os.replace(tmp, self.picks_path)

    def submit(self):
        out = os.path.join(self.root, "chosen")
        if os.path.isdir(out):
            shutil.rmtree(out)          # the folder belongs to this tool; rebuilt on every submit
        os.makedirs(out)
        chosen, skipped, undecided = [], [], []
        for stem, r in self.credits.items():
            p = self.picks.get(stem)
            if p is None:
                undecided.append(r.get("save_as")); continue
            if p == "skip":
                skipped.append(r.get("save_as")); continue
            c = (r.get("candidates") or [])[int(p) - 1]
            src = os.path.join(self.root, c["local"])
            name = r["save_as"]
            if src.lower().endswith(".png") and name.lower().endswith(".jpg"):
                name = name[:-4] + ".png"
            shutil.copyfile(src, os.path.join(out, name))
            chosen.append({"file": name, "for_articles": r.get("articles"), "photo": r.get("photo"),
                           "commons_file": c.get("title"), "commons_page": c.get("page"),
                           "author": c.get("author"), "license": c.get("license"),
                           "license_url": c.get("license_url"), "size": c.get("size")})
        with open(os.path.join(out, "credits.json"), "w", encoding="utf-8") as f:
            json.dump({"chosen": chosen, "skipped": skipped, "undecided": undecided}, f, ensure_ascii=False, indent=1)
        with open(os.path.join(out, "credits.txt"), "w", encoding="utf-8") as f:
            for c in chosen:
                f.write(f'{c["file"]}\n  {c["commons_file"]}\n  {c["author"]} / {c["license"]}\n  {c["commons_page"]}\n\n')
            if skipped:
                f.write("Skipped (none of the options were good):\n" + "\n".join("  " + s for s in skipped) + "\n")
        return {"folder": out, "chosen": len(chosen), "skipped": len(skipped), "undecided": len(undecided)}


def make_handler(app):
    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def send(self, code, body, ctype="application/json; charset=utf-8"):
            if isinstance(body, (dict, list)):
                body = json.dumps(body, ensure_ascii=False).encode()
            elif isinstance(body, str):
                body = body.encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store" if "json" in ctype or "html" in ctype else "max-age=3600")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = urllib.parse.urlparse(self.path).path
            if path == "/":
                return self.send(200, PAGE, "text/html; charset=utf-8")
            if path == "/api/data":
                return self.send(200, app.data())
            if path.startswith("/img/"):
                rel = urllib.parse.unquote(path[5:])
                full = os.path.abspath(os.path.join(app.root, rel))
                if not full.startswith(app.root + os.sep) or not os.path.isfile(full):
                    return self.send(404, {"error": "not found"})
                with open(full, "rb") as f:
                    return self.send(200, f.read(), mimetypes.guess_type(full)[0] or "application/octet-stream")
            self.send(404, {"error": "not found"})

        def do_POST(self):
            path = urllib.parse.urlparse(self.path).path
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n) or b"{}")
            try:
                if path == "/api/picks":
                    app.save_picks(body.get("picks") or {})
                    return self.send(200, {"ok": True})
                if path == "/api/submit":
                    app.save_picks(body.get("picks") or app.picks)
                    return self.send(200, app.submit())
            except Exception as e:
                return self.send(500, {"error": str(e)})
            self.send(404, {"error": "not found"})
    return H


PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Irad Wiki photo picker</title>
<style>
:root{--bg:#f8f9fa;--card:#fff;--text:#202122;--muted:#54595d;--line:#c8ccd1;--accent:#3366cc;--pick:#14866d;--skip:#b32424}
*{box-sizing:border-box}
body{margin:0;font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--text)}
header{position:sticky;top:0;z-index:5;background:var(--card);border-bottom:1px solid var(--line);padding:10px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header h1{font:600 17px Georgia,serif;margin:0}
.bar{flex:1;min-width:160px;height:8px;background:#eaecf0;border-radius:4px;overflow:hidden;display:flex}
.bar i{display:block;height:100%}
.counts{font-size:13px;color:var(--muted);white-space:nowrap}
button{font:inherit;border:1px solid var(--line);background:var(--card);border-radius:4px;padding:6px 12px;cursor:pointer}
button:hover{background:#eaf3ff}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button.primary:hover{background:#2a4b8d}
main{display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 54px)}
nav{border-right:1px solid var(--line);background:var(--card);overflow:auto;max-height:calc(100vh - 54px);position:sticky;top:54px}
nav .grp{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;padding:12px 14px 4px}
nav a{display:flex;gap:8px;align-items:center;padding:4px 14px;color:var(--text);text-decoration:none;font-size:13px;cursor:pointer}
nav a:hover{background:#eaf3ff}
nav a.cur{background:#eaf3ff;font-weight:600}
nav .dot{width:9px;height:9px;border-radius:50%;flex:none;border:1px solid var(--line)}
.dot.p{background:var(--pick);border-color:var(--pick)}.dot.s{background:var(--skip);border-color:var(--skip)}
section{padding:20px 28px 60px}
.meta h2{font:400 26px Georgia,serif;margin:0 0 2px}
.meta .file{font-family:ui-monospace,Consolas,monospace;font-size:13px;color:var(--muted)}
.meta p{margin:6px 0}
.arts a{color:var(--accent);text-decoration:none}.arts a:hover{text-decoration:underline}
.arts .nolink{color:var(--muted)}
.note{background:#fef6e7;border:1px solid #fc3;border-radius:4px;padding:6px 10px;display:inline-block}
.status{margin:10px 0 14px;font-weight:600}
.status.p{color:var(--pick)}.status.s{color:var(--skip)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
figure{margin:0;background:var(--card);border:2px solid var(--line);border-radius:6px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column}
figure:hover{border-color:#a2a9b1}
figure.sel{border-color:var(--pick);box-shadow:0 0 0 3px rgba(20,134,109,.25)}
figure img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#eaecf0}
figcaption{padding:8px 10px;font-size:12.5px;color:var(--muted);display:flex;flex-direction:column;gap:2px}
figcaption .row{display:flex;justify-content:space-between;gap:8px;align-items:center}
figcaption b{color:var(--text)}
figcaption a{color:var(--accent)}
.choose{border:0;background:#eaecf0;padding:6px;font-weight:600}
figure.sel .choose{background:var(--pick);color:#fff}
.actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.empty{padding:30px;border:1px dashed var(--line);border-radius:6px;color:var(--muted);background:var(--card)}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:20;cursor:zoom-out}
#lb img{max-width:94vw;max-height:90vh}
#lb.on{display:flex}
#done{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;z-index:30}
#done.on{display:flex}
#done div{background:var(--card);padding:24px 28px;border-radius:8px;max-width:520px}
#done code{word-break:break-all}
kbd{font:12px ui-monospace,Consolas,monospace;border:1px solid var(--line);border-bottom-width:2px;border-radius:3px;padding:0 4px;background:#fff}
.help{font-size:12.5px;color:var(--muted);margin-top:28px}
@media (max-width:800px){main{grid-template-columns:1fr}nav{display:none}}
</style></head><body>
<header><h1>Irad Wiki photo picker</h1><div class="bar" id="bar"></div><span class="counts" id="counts"></span>
<button id="nextUndecided">Next undecided</button><button class="primary" id="submit">Submit</button></header>
<main><nav id="nav"></nav><section id="view"></section></main>
<div id="lb"><img alt=""></div>
<div id="done"><div id="doneBody"></div></div>
<script>
let D=null, picks={}, i=0;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){
  D=await (await fetch('/api/data')).json(); picks=D.picks||{};
  const first=D.entries.findIndex(e=>!(e.stem in picks)); i=first<0?0:first; render();
}
function save(){fetch('/api/picks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({picks})});}
function setPick(v){const e=D.entries[i]; if(picks[e.stem]===v) delete picks[e.stem]; else picks[e.stem]=v; save(); render();}
function go(n){i=Math.max(0,Math.min(D.entries.length-1,n)); render(); window.scrollTo(0,0);}
function nextUndecided(){const n=D.entries.length; for(let k=1;k<=n;k++){const j=(i+k)%n; if(!(D.entries[j].stem in picks)) return go(j);} go(i);}
function counts(){let p=0,s=0;for(const e of D.entries){const v=picks[e.stem]; if(v==='skip')s++; else if(v!=null)p++;} return {p,s,u:D.entries.length-p-s,t:D.entries.length};}
function render(){
  const c=counts();
  $('#bar').innerHTML=`<i style="width:${c.p/c.t*100}%;background:var(--pick)"></i><i style="width:${c.s/c.t*100}%;background:var(--skip)"></i>`;
  $('#counts').textContent=`${c.p} picked · ${c.s} skipped · ${c.u} to go`;
  let g='', nav='';
  D.entries.forEach((e,k)=>{ if(e.group!==g){g=e.group; nav+=`<div class="grp">${esc(g)}</div>`;}
    const v=picks[e.stem]; const cls=v==='skip'?'s':(v!=null?'p':'');
    nav+=`<a data-k="${k}" class="${k===i?'cur':''}"><span class="dot ${cls}"></span>${esc(e.save_as)}</a>`;});
  $('#nav').innerHTML=nav;
  const cur=$('#nav a.cur'); if(cur) cur.scrollIntoView({block:'nearest'});
  const e=D.entries[i], v=picks[e.stem];
  const arts=e.articles.map(a=>a.url?`<a href="${a.url}" target="_blank" rel="noopener">${esc(a.title)}</a>`:`<span class="nolink" title="No article with this title on the wiki">${esc(a.title)}</span>`).join(', ');
  let html=`<div class="meta"><div class="file">${i+1} of ${D.entries.length} · ${esc(e.group)}</div>
    <h2>${esc(e.photo)}</h2><div class="file">Saves as ${esc(e.save_as)}</div>
    <p class="arts">For: ${arts||'<span class="nolink">no article listed</span>'}</p>
    ${e.notes?`<p><span class="note">${esc(e.notes)}</span></p>`:''}
    <p class="file">Commons search used: “${esc(e.query)}”</p></div>
    <div class="status ${v==='skip'?'s':(v!=null?'p':'')}">${v==='skip'?'Skipped: none of the options used':(v!=null?'Picked option '+v:'Not decided yet')}</div>`;
  if(!e.candidates.length) html+=`<div class="empty">The downloader found no usable images for this entry. Skip it, or search Commons by hand.</div>`;
  else html+='<div class="grid">'+e.candidates.map(c=>`<figure class="${String(v)===String(c.n)?'sel':''}">
      <img src="${c.img}" loading="lazy" data-full="${c.img}" alt="${esc(c.title)}">
      <figcaption><div class="row"><b>${c.n}. ${esc(c.title)}</b></div>
      <span>${esc(c.author)} · ${esc(c.license)} · ${esc(c.size)}</span>
      ${c.page?`<a href="${esc(c.page)}" target="_blank" rel="noopener">View on Commons</a>`:''}</figcaption>
      <button class="choose" data-n="${c.n}">${String(v)===String(c.n)?'✓ Picked':'Pick this one'}</button></figure>`).join('')+'</div>';
  html+=`<div class="actions"><button id="prev">← Previous</button><button id="skip">${v==='skip'?'Undo skip':'Skip: none are good'}</button><button id="next">Next →</button></div>
    <p class="help">Keys: <kbd>1</kbd>–<kbd>9</kbd> pick · <kbd>S</kbd> skip · <kbd>←</kbd> <kbd>→</kbd> previous / next · <kbd>Enter</kbd> next undecided · click a photo to enlarge. Choices save automatically.</p>`;
  $('#view').innerHTML=html;
}
document.addEventListener('click',ev=>{
  const a=ev.target.closest('nav a'); if(a) return go(+a.dataset.k);
  const ch=ev.target.closest('.choose'); if(ch){ setPick(String(ch.dataset.n)); if(picks[D.entries[i].stem]!=null) setTimeout(nextUndecided,250); return; }
  const im=ev.target.closest('figure img'); if(im){ $('#lb img').src=im.dataset.full; $('#lb').classList.add('on'); return; }
  if(ev.target.closest('#lb')) return $('#lb').classList.remove('on');
  if(ev.target.id==='prev') return go(i-1);
  if(ev.target.id==='next') return go(i+1);
  if(ev.target.id==='skip'){ setPick('skip'); if(picks[D.entries[i].stem]) setTimeout(nextUndecided,250); return; }
  if(ev.target.id==='nextUndecided') return nextUndecided();
  if(ev.target.id==='submit') return submit();
  if(ev.target.closest('#done') && !ev.target.closest('#doneBody')) $('#done').classList.remove('on');
});
document.addEventListener('keydown',ev=>{
  if(!D||ev.ctrlKey||ev.metaKey||ev.altKey) return;
  if(ev.key==='Escape'){ $('#lb').classList.remove('on'); $('#done').classList.remove('on'); return; }
  if(ev.key==='ArrowLeft') return go(i-1);
  if(ev.key==='ArrowRight') return go(i+1);
  if(ev.key==='Enter') return nextUndecided();
  if(ev.key==='s'||ev.key==='S'){ setPick('skip'); if(picks[D.entries[i].stem]) setTimeout(nextUndecided,250); return; }
  const n=parseInt(ev.key,10); const e=D.entries[i];
  if(n>=1 && e.candidates.some(c=>c.n===n)){ setPick(String(n)); if(picks[e.stem]!=null) setTimeout(nextUndecided,250); }
});
async function submit(){
  const c=counts();
  if(c.u && !confirm(`${c.u} entries are still undecided and will be left out. Submit anyway?`)) return;
  $('#submit').disabled=true; $('#submit').textContent='Copying…';
  try{
    const r=await (await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({picks})})).json();
    if(r.error) throw new Error(r.error);
    $('#doneBody').innerHTML=`<h2 style="margin-top:0;font:400 22px Georgia,serif">Done</h2>
      <p><b>${r.chosen}</b> photos copied and named for the wiki${r.skipped?`, ${r.skipped} skipped`:''}${r.undecided?`, ${r.undecided} left undecided`:''}.</p>
      <p>Folder:<br><code>${esc(r.folder)}</code></p>
      <p>It also holds <code>credits.json</code> and <code>credits.txt</code> with the author and licence of every photo. Send the folder (or zip it) to Claude to add them to the wiki.</p>
      <p><button onclick="document.querySelector('#done').classList.remove('on')">Close</button></p>`;
    $('#done').classList.add('on');
  }catch(err){ alert('Submit failed: '+err.message); }
  $('#submit').disabled=false; $('#submit').textContent='Submit';
}
load();
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser(description="Pick photos for the Irad Wiki.")
    ap.add_argument("--dir", default="commons_photos", help="folder made by download_commons_photos.py")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-browser", action="store_true")
    a = ap.parse_args()
    app = App(a.dir)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(app))
    url = f"http://127.0.0.1:{a.port}/"
    print(f"Photo picker running at {url}  ({len(app.credits)} entries)\nPress Ctrl+C here to stop.")
    if not a.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped. Your choices are saved in picks.json.")


if __name__ == "__main__":
    main()
