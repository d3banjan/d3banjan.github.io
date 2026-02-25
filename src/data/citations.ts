export interface Citation {
	key: string;
	type: 'article' | 'book' | 'legal' | 'primary';
	// English
	authors: string;
	title: string;
	venue?: string;       // journal or book series
	year?: number | string;
	note?: string;        // translator, edition, etc.
	doi?: string;
	url?: string;
	// Bengali
	authorsBn: string;
	titleBn: string;
	venueBn?: string;
	noteBn?: string;
}

export const CITATIONS: Record<string, Citation> = {

	// ── Linguistics & language history ──────────────────────────────────────

	swadesh1955: {
		key: 'swadesh1955',
		type: 'article',
		authors: 'Morris Swadesh',
		title: 'Towards Greater Accuracy in Lexicostatistic Dating',
		venue: 'International Journal of American Linguistics',
		year: 1955,
		note: 'Vol. 21, No. 2, pp. 121–137',
		doi: '10.1086/464321',
		authorsBn: 'মরিস সোয়াডেশ',
		titleBn: 'শব্দতাত্ত্বিক কালনির্ধারণে অধিকতর নির্ভুলতার দিকে',
		venueBn: 'ইন্টারন্যাশনাল জার্নাল অব আমেরিকান লিঙ্গুইস্টিক্স',
		noteBn: 'খণ্ড ২১, সংখ্যা ২, পৃ. ১২১–১৩৭',
	},

	chatterji1926: {
		key: 'chatterji1926',
		type: 'book',
		authors: 'Suniti Kumar Chatterji',
		title: 'The Origin and Development of the Bengali Language',
		year: 1926,
		note: 'Calcutta University Press. 2 vols.',
		url: 'https://archive.org/details/OriginDevelopmentOfBengali',
		authorsBn: 'সুনীতিকুমার চট্টোপাধ্যায়',
		titleBn: 'বাংলা ভাষার উদ্ভব ও বিকাশ',
		noteBn: 'কলকাতা বিশ্ববিদ্যালয় প্রেস। ২ খণ্ড।',
	},

	kuiper1991: {
		key: 'kuiper1991',
		type: 'book',
		authors: 'F.B.J. Kuiper',
		title: 'Aryans in the Rigveda',
		venue: 'Leiden Studies in Indo-European',
		year: 1991,
		note: 'Rodopi, Amsterdam. Vol. 1. ISBN 978-9051833072',
		authorsBn: 'এফ.বি.জে. কুইপার',
		titleBn: 'ঋগ্বেদে আর্যরা',
		venueBn: 'লাইডেন স্টাডিজ ইন ইন্দো-ইউরোপিয়ান',
		noteBn: 'রোডোপি, আমস্টার্ডাম। খণ্ড ১।',
	},

	witzel1999substrate: {
		key: 'witzel1999substrate',
		type: 'article',
		authors: 'Michael Witzel',
		title: 'Early Sources for South Asian Substrate Languages',
		venue: 'Mother Tongue (ASLIP)',
		year: 1999,
		note: 'Special Extra Number, Oct. 1999, pp. 1–70',
		url: 'https://fid4sa-repository.ub.uni-heidelberg.de/113/1/MT_Substrates_1999.pdf',
		authorsBn: 'মাইকেল উইটজেল',
		titleBn: 'দক্ষিণ এশিয়ার সাবস্ট্রেট ভাষার প্রাথমিক উৎস',
		venueBn: 'মাদার টাং (ASLIP)',
		noteBn: 'বিশেষ সংখ্যা, অক্টোবর ১৯৯৯, পৃ. ১–৭০',
	},

	witzel1999old: {
		key: 'witzel1999old',
		type: 'article',
		authors: 'Michael Witzel',
		title: 'Substrate Languages in Old Indo-Aryan (Ṛgvedic, Middle and Late Vedic)',
		venue: 'Electronic Journal of Vedic Studies',
		year: 1999,
		note: 'Vol. 5, No. 1, pp. 1–67',
		doi: '10.11588/ejvs.1999.1.828',
		authorsBn: 'মাইকেল উইটজেল',
		titleBn: 'পুরনো ইন্দো-আর্যে (ঋগ্বেদীয়, মধ্য ও উত্তর বৈদিক) সাবস্ট্রেট ভাষাসমূহ',
		venueBn: 'ইলেকট্রনিক জার্নাল অব বৈদিক স্টাডিজ',
		noteBn: 'খণ্ড ৫, সংখ্যা ১, পৃ. ১–৬৭',
	},

	southworth2005: {
		key: 'southworth2005',
		type: 'book',
		authors: 'Franklin Southworth',
		title: 'Linguistic Archaeology of South Asia',
		year: 2005,
		note: 'Routledge Curzon, London',
		doi: '10.4324/9780203412916',
		authorsBn: 'ফ্র্যাংক্লিন সাউথওয়ার্থ',
		titleBn: 'দক্ষিণ এশিয়ার ভাষাতাত্ত্বিক প্রত্নতত্ত্ব',
		noteBn: 'রাউটলেজ কার্জন, লন্ডন',
	},

	masica1991: {
		key: 'masica1991',
		type: 'book',
		authors: 'Colin Masica',
		title: 'The Indo-Aryan Languages',
		venue: 'Cambridge Language Surveys',
		year: 1991,
		note: 'Cambridge University Press. ISBN 978-0521234207',
		authorsBn: 'কলিন মাসিকা',
		titleBn: 'ইন্দো-আর্য ভাষাসমূহ',
		venueBn: 'ক্যামব্রিজ ল্যাঙ্গুয়েজ সার্ভেজ',
		noteBn: 'কেমব্রিজ ইউনিভার্সিটি প্রেস',
	},

	vandriem2001: {
		key: 'vandriem2001',
		type: 'book',
		authors: 'George van Driem',
		title: 'Languages of the Himalayas',
		year: 2001,
		note: 'Brill, Leiden. 2 vols. On Tibeto-Burman contact',
		doi: '10.1163/9789004492530',
		authorsBn: 'জর্জ ভ্যান ড্রিয়েম',
		titleBn: 'হিমালয়ের ভাষাসমূহ',
		noteBn: 'ব্রিল, লাইডেন। ২ খণ্ড। তিব্বত-বর্মী ভাষা-সংস্পর্শ প্রসঙ্গে',
	},

	sidwell2018: {
		key: 'sidwell2018',
		type: 'article',
		authors: 'Paul Sidwell',
		title: 'The Austroasiatic Language Family',
		venue: 'The Oxford Handbook of the Languages of South Asia',
		year: 2018,
		note: 'Oxford University Press. Ed. Cardona & Jain',
		authorsBn: 'পল সিডওয়েল',
		titleBn: 'অস্ট্রোএশিয়াটিক ভাষাপরিবার',
		venueBn: 'অক্সফোর্ড হ্যান্ডবুক অব দ্য ল্যাঙ্গুয়েজেস অব সাউথ এশিয়া',
		noteBn: 'অক্সফোর্ড ইউনিভার্সিটি প্রেস',
	},

	pollock2006: {
		key: 'pollock2006',
		type: 'book',
		authors: 'Sheldon Pollock',
		title: 'The Language of the Gods in the World of Men',
		year: 2006,
		note: 'University of California Press. ISBN 978-0-520-24500-6. On Sanskrit, culture, and power',
		authorsBn: 'শেলডন পলক',
		titleBn: 'মানুষের জগতে দেবতাদের ভাষা',
		noteBn: 'ইউনিভার্সিটি অব ক্যালিফোর্নিয়া প্রেস',
	},

	// ── Genetics & population history ───────────────────────────────────────

	reich2009: {
		key: 'reich2009',
		type: 'article',
		authors: 'David Reich et al.',
		title: 'Reconstructing Indian Population History',
		venue: 'Nature',
		year: 2009,
		note: 'Vol. 461, pp. 489–494',
		doi: '10.1038/nature08365',
		authorsBn: 'ডেভিড রাইখ প্রমুখ',
		titleBn: 'ভারতীয় জনসংখ্যার ইতিহাস পুনর্নির্মাণ',
		venueBn: 'নেচার',
		noteBn: 'খণ্ড ৪৬১, পৃ. ৪৮৯–৪৯৪',
	},

	narasimhan2019: {
		key: 'narasimhan2019',
		type: 'article',
		authors: 'Vagheesh Narasimhan et al.',
		title: 'The Formation of Human Populations in South and Central Asia',
		venue: 'Science',
		year: 2019,
		note: 'Vol. 365, eaat7487',
		doi: '10.1126/science.aat7487',
		authorsBn: 'বাগীশ নারাসিমহান প্রমুখ',
		titleBn: 'দক্ষিণ ও মধ্য এশিয়ায় মানবগোষ্ঠীর গঠন',
		venueBn: 'সায়েন্স',
		noteBn: 'খণ্ড ৩৬৫, eaat7487',
	},

	// ── Archaeology ──────────────────────────────────────────────────────────

	dasgupta1962: {
		key: 'dasgupta1962',
		type: 'book',
		authors: 'Paresh Chandra Das Gupta',
		title: 'Excavations at Pandu Rajar Dhibi',
		year: 1962,
		note: 'Directorate of Archaeology, West Bengal. 105 pp.',
		url: 'https://archive.org/details/in.gov.ignca.42371',
		authorsBn: 'পরেশচন্দ্র দাশগুপ্ত',
		titleBn: 'পাণ্ডু রাজার ঢিবিতে উৎখনন',
		noteBn: 'পুরাতত্ত্ব অধিদপ্তর, পশ্চিমবঙ্গ। ১০৫ পৃষ্ঠা।',
	},

	// ── History & ethnography ────────────────────────────────────────────────

	skrefsrud1873: {
		key: 'skrefsrud1873',
		type: 'book',
		authors: 'Lars Skrefsrud (comp.); trans. P.O. Bodding',
		title: 'Traditions and Institutions of the Santals (Horkoren Mare Hapramko Reak\' Katha)',
		year: '1887 (Santali); 1942 (English trans.)',
		note: 'Universitetet i Oslo. Etnografiske Museum Bulletin No. 6. OCLC 7289140',
		authorsBn: 'লার্স স্ক্রেফসরুড (সংকলক); অনু. পি.ও. বডিং',
		titleBn: 'সাঁওতালদের ঐতিহ্য ও প্রতিষ্ঠান (হড়কোড়েন মারে হাপড়ামকো রিয়াক কথা)',
		noteBn: 'উনিভার্সিটেট ই অসলো। ১৮৮৭ (সাঁওতালি); ১৯৪২ (ইংরেজি অনুবাদ)',
	},

	risley1891: {
		key: 'risley1891',
		type: 'book',
		authors: 'H.H. Risley',
		title: 'The Tribes and Castes of Bengal',
		year: 1891,
		note: 'Bengal Secretariat Press, Calcutta. 4 vols.',
		url: 'https://archive.org/details/TheTribesAndCastesOfBengal',
		authorsBn: 'এইচ.এইচ. রিজলি',
		titleBn: 'বাংলার উপজাতি ও জাতিসমূহ',
		noteBn: 'বেঙ্গল সেক্রেটারিয়েট প্রেস, কলকাতা। ৪ খণ্ড।',
	},

	roysc: {
		key: 'roysc',
		type: 'book',
		authors: 'S.C. Roy',
		title: 'The Mundas and Their Country',
		year: 1912,
		note: 'Jogendra Nath Sarkar, Calcutta. Documentation of Asura/Munda sites in Ranchi',
		url: 'https://archive.org/details/in.ernet.dli.2015.22882',
		authorsBn: 'এস.সি. রায়',
		titleBn: 'মুন্ডা এবং তাদের দেশ',
		noteBn: 'যোগেন্দ্রনাথ সরকার, কলকাতা। রাঁচিতে অসুর/মুন্ডা প্রত্নক্ষেত্রের নথিভুক্তকরণ',
	},

	mitramajumder1907: {
		key: 'mitramajumder1907',
		type: 'book',
		authors: 'Dakshinaranjan Mitra Majumder',
		title: 'Thakurmar Jhuli',
		year: 1907,
		note: 'Calcutta. With preface by Rabindranath Tagore. Classic collection of Bengali folk tales',
		url: 'https://archive.org/details/dli.scoerat.2596thakurmarjhulibanglarrupkatha',
		authorsBn: 'দক্ষিণারঞ্জন মিত্র মজুমদার',
		titleBn: 'ঠাকুরমার ঝুলি',
		noteBn: 'কলকাতা। রবীন্দ্রনাথ ঠাকুরের ভূমিকাসহ। বাংলা লোককথার ক্লাসিক সংকলন।',
	},

	bengalgazetteers: {
		key: 'bengalgazetteers',
		type: 'primary',
		authors: 'Bengal District Gazetteers',
		title: 'Bengal District Gazetteers',
		note: 'Multiple volumes, various dates. On the Bargi raids and regional history',
		url: 'https://archive.org/details/in.ernet.dli.2015.105557',
		authorsBn: 'বেঙ্গল ডিস্ট্রিক্ট গেজেটিয়ার্স',
		titleBn: 'বেঙ্গল ডিস্ট্রিক্ট গেজেটিয়ার্স',
		noteBn: 'বহু খণ্ড। বর্গী হানা ও আঞ্চলিক ইতিহাস প্রসঙ্গে',
	},

	guha1983: {
		key: 'guha1983',
		type: 'book',
		authors: 'Ranajit Guha',
		title: 'Elementary Aspects of Peasant Insurgency in Colonial India',
		year: 1983,
		note: 'Oxford University Press, Delhi',
		url: 'https://archive.org/details/dli.bengal.10689.12632',
		authorsBn: 'রণজিৎ গুহ',
		titleBn: 'ঔপনিবেশিক ভারতে কৃষক বিদ্রোহের প্রাথমিক দিকসমূহ',
		noteBn: 'অক্সফোর্ড ইউনিভার্সিটি প্রেস, দিল্লি',
	},

	aitareyabrahmana: {
		key: 'aitareyabrahmana',
		type: 'primary',
		authors: 'Aitareya Brahmana',
		title: 'Aitareya Brahmana',
		note: 'Trans. A.B. Keith (1920), Harvard Oriental Series vol. 25',
		authorsBn: 'ঐতরেয় ব্রাহ্মণ',
		titleBn: 'ঐতরেয় ব্রাহ্মণ',
		noteBn: 'অনু. এ.বি. কিথ (১৯২০), হার্ভার্ড ওরিয়েন্টাল সিরিজ, খণ্ড ২৫',
	},

	eaton1993: {
		key: 'eaton1993',
		type: 'book',
		authors: 'Richard Eaton',
		title: 'The Rise of Islam and the Bengal Frontier, 1204–1760',
		year: 1993,
		note: 'University of California Press. Open access via archive.org',
		url: 'https://archive.org/details/the-rise-of-islam-and-the-bengal-frontier-1204-1760-by-richard-m-eaton_202601',
		authorsBn: 'রিচার্ড ইটন',
		titleBn: 'ইসলামের উত্থান ও বাংলার সীমান্ত, ১২০৪–১৭৬০',
		noteBn: 'ইউনিভার্সিটি অব ক্যালিফোর্নিয়া প্রেস',
	},

	ray1949: {
		key: 'ray1949',
		type: 'book',
		authors: 'Niharranjan Ray',
		title: 'Bangalir Itihas: Adiparba',
		year: 1949,
		note: 'Book Emporium, Calcutta. Rabindra Puraskar 1950. English trans.: History of the Bengali People, Orient Longman 1993',
		url: 'https://archive.org/details/in.ernet.dli.2015.265352',
		authorsBn: 'নীহাররঞ্জন রায়',
		titleBn: 'বাঙালির ইতিহাস: আদিপর্ব',
		noteBn: 'বুক এম্পোরিয়াম, কলকাতা। রবীন্দ্র পুরস্কার ১৯৫০।',
	},

	// ── Legal & legislative ──────────────────────────────────────────────────

	forestrightsact2006: {
		key: 'forestrightsact2006',
		type: 'legal',
		authors: 'Government of India',
		title: 'Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act',
		year: 2006,
		note: 'Act No. 2 of 2007. Gazette of India, 2 January 2007',
		url: 'https://www.indiacode.nic.in/handle/123456789/2070',
		authorsBn: 'ভারত সরকার',
		titleBn: 'তফসিলি উপজাতি ও অন্যান্য ঐতিহ্যবাহী বনবাসী (বনাধিকার স্বীকৃতি) আইন',
		noteBn: 'আইন নং ২, ২০০৭। ভারত সরকারি গেজেট, ২ জানুয়ারি ২০০৭',
	},

	pesa1996: {
		key: 'pesa1996',
		type: 'legal',
		authors: 'Government of India',
		title: 'Panchayats (Extension to Scheduled Areas) Act',
		year: 1996,
		note: 'Act No. 40 of 1996. Enacted 24 December 1996',
		url: 'https://www.indiacode.nic.in/bitstream/123456789/1973/1/A1996-40.pdf',
		authorsBn: 'ভারত সরকার',
		titleBn: 'পঞ্চায়েত (তফসিলি এলাকায় সম্প্রসারণ) আইন',
		noteBn: 'আইন নং ৪০, ১৯৯৬। প্রণীত ২৪ ডিসেম্বর ১৯৯৬',
	},

	samatha1997: {
		key: 'samatha1997',
		type: 'legal',
		authors: 'Supreme Court of India',
		title: 'Samatha v. State of Andhra Pradesh',
		year: 1997,
		note: 'AIR 1997 SC 3297; (1997) 8 SCC 191. Decided 11 July 1997',
		url: 'https://indiankanoon.org/doc/1969682/',
		authorsBn: 'ভারতের সর্বোচ্চ আদালত',
		titleBn: 'সামথা বনাম অন্ধ্রপ্রদেশ রাজ্য',
		noteBn: 'AIR 1997 SC 3297; (১৯৯৭) ৮ SCC ১৯১। রায়ের তারিখ: ১১ জুলাই ১৯৯৭',
	},

	// ── Primary / oral ──────────────────────────────────────────────────────

	lalon: {
		key: 'lalon',
		type: 'primary',
		authors: 'Lalon Fakir (c. 1774–1890)',
		title: 'Songs of Lalon',
		note: 'Oral corpus; standard collected Bengali edition: Lalon Gitika, ed. Das & Mahapatra (Calcutta University Press, 1954)',
		url: 'https://archive.org/details/LalanGitika',
		authorsBn: 'লালন ফকির (আনু. ১৭৭৪–১৮৯০)',
		titleBn: 'লালনের গান',
		noteBn: 'মৌখিক সংগ্রহ; প্রামাণিক বাংলা সংকলন: লালন গীতিকা, সম্পা. দাস ও মহাপাত্র (কলকাতা বিশ্ববিদ্যালয় প্রেস, ১৯৫৪)',
	},

	ponagar: {
		key: 'ponagar',
		type: 'primary',
		authors: 'Cham inscription C.42 (Drang Lai), ed. Majumdar',
		title: 'Champa: History and Culture of an Indian Colonial Kingdom in the Far East',
		year: 1927,
		note: 'R.C. Majumdar. University of Dacca. Mentions vaṅgalā merchants in Cham highlands',
		url: 'https://cdn.angkordatabase.asia/libs/docs/majumdar-champa-1927.pdf',
		authorsBn: 'চম শিলালিপি C.42, সম্পা. মজুমদার',
		titleBn: 'চম্পা: সুদূর প্রাচ্যের একটি ভারতীয় ঔপনিবেশিক রাজ্যের ইতিহাস ও সংস্কৃতি',
		noteBn: 'আর.সি. মজুমদার। ঢাকা বিশ্ববিদ্যালয়। চম মালভূমিতে বাঙালি (vaṅgalā) বণিকদের উল্লেখ',
	},

	waribateshwar: {
		key: 'waribateshwar',
		type: 'article',
		authors: 'Sufi Mostafizur Rahman',
		title: 'Prospects of Public Archaeology in Heritage Management in Bangladesh: Perspective of Wari-Bateshwar',
		venue: 'Archaeologies',
		year: 2011,
		note: 'Springer. Primary excavation reports: Jahangirnagar University, from 2000',
		doi: '10.1007/s11759-011-9177-5',
		authorsBn: 'সুফি মোস্তাফিজুর রহমান',
		titleBn: 'বাংলাদেশে হেরিটেজ ম্যানেজমেন্টে পাবলিক আর্কিওলজির সম্ভাবনা: উয়ারী-বটেশ্বরের দৃষ্টিকোণ',
		venueBn: 'আর্কিওলজিস (স্প্রিঙ্গার)',
		noteBn: 'মূল উৎখনন: জাহাঙ্গীরনগর বিশ্ববিদ্যালয়, ২০০০ সাল থেকে',
	},
};
