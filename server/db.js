const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial Realistic Seed Data with updated team names
const initialData = {
  users: [
    {
      id: "usr-admin-1",
      name: "Jitendra",
      email: "jitendra@heritagepulse.org",
      role: "Super Admin",
      title: "Super Admin & Head of Content Operations",
      avatar: "J",
      status: "Active",
      phone: "+91 98765 43210",
      assignedCategories: ["All"],
      created_at: "2026-01-10T09:00:00Z"
    },
    {
      id: "usr-writer-1",
      name: "Pavitra",
      email: "pavitra@heritagepulse.org",
      role: "Writer",
      title: "Senior Culture & Heritage Writer",
      avatar: "P",
      status: "Active",
      phone: "+91 98441 22334",
      assignedCategories: ["Heritage", "Culture", "Dance", "Jewellery"],
      created_at: "2026-02-01T10:00:00Z"
    },
    {
      id: "usr-writer-2",
      name: "Nikitha",
      email: "nikitha@heritagepulse.org",
      role: "Writer",
      title: "Arts, Music & Travel Reporter",
      avatar: "N",
      status: "Active",
      phone: "+91 97112 55667",
      assignedCategories: ["Art", "Music", "Travel", "Events", "Fusion"],
      created_at: "2026-02-15T10:00:00Z"
    },
    {
      id: "usr-writer-3",
      name: "Sasanka",
      email: "sasanka@heritagepulse.org",
      role: "Writer",
      title: "Culinary & Living Traditions Writer",
      avatar: "S",
      status: "Active",
      phone: "+91 96554 88990",
      assignedCategories: ["Cuisine", "Yoga", "Lifestyle", "Poetry"],
      created_at: "2026-03-01T10:00:00Z"
    },
    {
      id: "usr-editor-1",
      name: "Dr. Tejaswini Ma'am",
      email: "tejaswini@heritagepulse.org",
      role: "Editor + Admin",
      title: "Chief Editor & Co-Admin — Heritage Pulse",
      avatar: "TM",
      status: "Active",
      phone: "+91 99887 11223",
      assignedCategories: ["All"],
      created_at: "2026-01-15T09:30:00Z"
    },
    {
      id: "usr-publisher-1",
      name: "Gowthami",
      email: "gowthami@heritagepulse.org",
      role: "Publisher",
      title: "Digital Publishing & Web Operations Manager",
      avatar: "G",
      status: "Active",
      phone: "+91 91234 66789",
      assignedCategories: ["All"],
      created_at: "2026-01-20T09:00:00Z"
    }
  ],

  categories: [
    { id: "cat-news", name: "News", slug: "news", description: "Daily national & regional cultural news and policy updates", color: "#e11d48", icon: "newspaper", active: true, subcategories: ["Editor's Picks", "Ancient Civilisations", "World Heritage", "Archaeology", "Culture", "Arts", "Fashion Fusion", "Food Fusion", "Ancient Spirituality", "Cultural Heritage"] },
    { id: "cat-events", name: "Events", slug: "events", description: "Cultural festivals, conferences, exhibitions and summits", color: "#ea580c", icon: "calendar-event", active: true, subcategories: ["Festivals", "Heritage Walks", "Workshops", "Talks", "Exhibitions", "Performances", "Museum Events", "Virtual Events", "Conferences & Summits"] },
    { id: "cat-featured", name: "Featured", slug: "featured", description: "In-depth editorial spotlight stories and investigative pieces", color: "#d97706", icon: "sparkles", active: true, subcategories: ["Art & Iconography", "Classical Dance", "Sacred Music", "Master Craft", "Sacred Architecture", "Handloom & Textiles", "Culinary Arts", "Yoga & Wellness", "Jewellery & Adornment", "Poetry & Verses", "Sanskrit Theatre", "Living Festivals", "World Heritage", "Literature & Epics", "Visual Chronicles", "Editorial Spotlight"] },
    { id: "cat-books", name: "Books", slug: "books", description: "Vedic Sanskrit literature, translations, epic poems, manuscripts & book reviews", color: "#6366f1", icon: "book-open", active: true, subcategories: ["Art, Crafts & Living Heritage", "Architecture & Monuments", "History & Antiquity", "Travel & Guides", "Spiritual & Temple Traditions", "Vedic & Sanskrit Literature", "Open Access Archives", "Manuscript Digitization", "Book Reviews"] }
  ],

  content: [
    {
      id: "HP-2026-001",
      title: "Traditional Temple Architecture of Andhra Pradesh: The Dravidian & Chalukyan Marvels",
      subtitle: "Exploring the intricate granite carvings, gopurams, and acoustic pillars of Lepakshi, Simhachalam, and Srisailam.",
      topic: "Traditional Temple Architecture of Andhra Pradesh",
      category: "Heritage",
      subcategory: "Temple Architecture",
      content_type: "Featured Article",
      frequency: "Weekly",
      writer_id: "usr-writer-1",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "EDITOR_REVIEW",
      progress: 70,
      start_date: "2026-08-20",
      deadline: "2026-08-25",
      publishing_date: "2026-08-26",
      published_url: "",
      short_description: "A deep dive into the stone marvels of Andhra Pradesh, highlighting architectural ingenuity from the Kakatiya to Vijayanagara empires.",
      body: `<h2>The Majesty of Deccan Stone</h2><p>The temple architecture of Andhra Pradesh represents a magnificent confluence of <strong>Dravidian</strong>, <em>Chalukyan</em>, and Vijayanagara idioms. Standing before the monolithic Nandi at Lepakshi or gazing upon the floating pillar of Veerabhadra Temple, one is struck by the peerless mastery of medieval Indian stone masons.</p><h3>1. The Hanging Pillar of Lepakshi</h3><p>Built in the 16th century by the brothers Virupanna and Veeranna, the Veerabhadra temple in Lepakshi is renowned for its 70 stone pillars. Among them, one legendary pillar does not touch the ground completely, allowing thin cloths to pass underneath—a testament to precise load balancing and stone joinery.</p><h3>2. Srisailam: The Hilltop Citadel</h3><p>Perched on the Nallamala hills, the Bhramaramba Mallikarjuna Temple showcases massive stone prakarams (outer walls) carved with military pageantry, mythological friezes, and pastoral life scenes.</p><blockquote>"The temple was not merely a place of worship; it was an epicenter of art, dance, community granary, and astronomical observation."</blockquote>`,
      tags: ["TempleArchitecture", "Lepakshi", "AndhraHeritage", "VijayanagaraArt", "StoneCarving"],
      seo_title: "Temple Architecture of Andhra Pradesh | Heritage Pulse Editorial",
      seo_description: "Discover the architectural wonders of Andhra Pradesh temples, from Lepakshi's hanging pillars to Srisailam's historic prakarams.",
      keywords: "Andhra temple architecture, Lepakshi hanging pillar, Vijayanagara temples, Dravidian stone architecture",
      featured_image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      reference_links: "https://asi.nic.in/deccan-circle-monuments",
      sources: [
        { id: "src-1", name: "Archaeological Survey of India (ASI) Deccan Circle", url: "https://asi.nic.in" },
        { id: "src-2", name: "Deccan Heritage Historical Monograph 2026", url: "https://heritagepulse.org/research/deccan-architecture" }
      ],
      notes: "Writer Pavitra needs to double check the exact construction dates of the Simhachalam outer mandapam.",
      images: [
        {
          id: "img-001-1",
          file_url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
          filename: "lepakshi-nandi-monolith.jpg",
          caption: "The monolithic granite Nandi at Lepakshi, carved out of a single boulder.",
          credit: "Heritage Pulse Photo Bureau / Pavitra",
          alt_text: "Monolithic stone bull sculpture at Lepakshi temple",
          is_featured: true,
          sort_order: 1
        },
        {
          id: "img-001-2",
          file_url: "https://images.unsplash.com/photo-1600100397608-f010f443818e?auto=format&fit=crop&w=1200&q=80",
          filename: "simhachalam-mandapa-pillars.jpg",
          caption: "Acoustic stone pillars and friezes at Simhachalam Temple complex.",
          credit: "ASI Archives",
          alt_text: "Intricately carved stone temple pillars",
          is_featured: false,
          sort_order: 2
        }
      ],
      created_at: "2026-08-20T10:00:00Z",
      updated_at: "2026-08-24T14:30:00Z",
      checklist: {
        article_checked: true,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: true,
        mobile_preview_checked: false,
        desktop_preview_checked: true,
        website_published: false
      }
    },
    {
      id: "HP-2026-002",
      title: "Kuchipudi Heritage: From Sacred Bhagavata Mela to Global Classical Stage",
      subtitle: "The extraordinary evolution of Andhra's premier dance-drama, preserving ancient Natya Shastra traditions.",
      topic: "Kuchipudi Heritage & Classical Evolution",
      category: "Dance",
      subcategory: "Classical Dance",
      content_type: "Featured Article",
      frequency: "Weekly",
      writer_id: "usr-writer-1",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "FINAL_REVIEW",
      progress: 90,
      start_date: "2026-08-19",
      deadline: "2026-08-26",
      publishing_date: "2026-08-26",
      published_url: "",
      short_description: "Tracing Kuchipudi from its roots in Kuchelapuram village by Siddhendra Yogi to contemporary global auditoriums.",
      body: `<h2>The Rhythm of Devotion and Drama</h2><p>Originating in the verdant village of Kuchelapuram (now Kuchipudi) in the Krishna district of Andhra Pradesh, Kuchipudi is unique among classical Indian dances for its seamless blending of pure dance (<em>Nritta</em>), expressive mime (<em>Nritya</em>), and theatrical dialogue (<em>Natya</em>).</p><h3>The Vision of Siddhendra Yogi</h3><p>In the 14th century, the mystic ascetic Siddhendra Yogi codified the dance-drama form into the sacred <strong>Bhama Kalapam</strong>.</p><blockquote>"When the dancer balances upon the rim of a brass plate while holding a water pot upon her head in Tarangam, gravity yields to artistic discipline."</blockquote>`,
      tags: ["Kuchipudi", "IndianClassicalDance", "BhagavataMela", "NatyaShastra", "AndhraCulture"],
      seo_title: "Kuchipudi Heritage: History, Tarangam & Masters | Heritage Pulse",
      seo_description: "Read the story of Kuchipudi dance from village Bhagavata Mela origins to modern solo mastery by legendary gurus.",
      keywords: "Kuchipudi dance, Siddhendra Yogi, Tarangam brass plate, Vempati Chinna Satyam, classical dance India",
      featured_image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
      video_url: "https://www.youtube.com/watch?v=example2",
      reference_links: "https://sangeetnatak.gov.in",
      sources: [
        { id: "src-1", name: "Sangeet Natak Akademi Official Archives", url: "https://sangeetnatak.gov.in" },
        { id: "src-2", name: "Kuchelapuram Natya Research Bulletin", url: "https://heritagepulse.org/kuchipudi-research" }
      ],
      notes: "Reviewed and approved by Dr. Tejaswini Ma'am. Cleared for Final Signoff.",
      images: [
        {
          id: "img-002-1",
          file_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
          filename: "kuchipudi-mudra-expression.jpg",
          caption: "A classical Kuchipudi exponent depicting Navarasa expressions.",
          credit: "Photo by Heritage Pulse / Pavitra",
          alt_text: "Classical Kuchipudi dancer in traditional silk costume and temple jewellery",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-19T09:00:00Z",
      updated_at: "2026-08-24T15:10:00Z",
      checklist: {
        article_checked: true,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: true,
        mobile_preview_checked: true,
        desktop_preview_checked: true,
        website_published: false
      }
    },
    {
      id: "HP-2026-003",
      title: "The Living Legacy of Tanjore Gold-Leaf Paintings: Sacred Artistry of Thanjavur",
      subtitle: "How master craftsmen combine 22-carat gold foil, Jaipur stones, and teak wood to create immortal deities.",
      topic: "Tanjore Gold-Leaf Paintings Legacy",
      category: "Art",
      subcategory: "Classical Paintings",
      content_type: "Featured Article",
      frequency: "Weekly",
      writer_id: "usr-writer-2",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "PUBLISHED",
      progress: 100,
      start_date: "2026-08-18",
      deadline: "2026-08-24",
      publishing_date: "2026-08-24",
      published_url: "https://heritagepulse.org/art/tanjore-gold-leaf-paintings-sacred-legacy",
      short_description: "Inside the workshops of Thanjavur where multi-generational artists create embossed, gold-leaf adorned devotional masterpieces.",
      body: `<h2>The Gilded Divine</h2><p>Tanjore painting (Thanjavur Oviyam) is an internationally celebrated South Indian art form characterized by rich, flat colors, compact composition, and shimmering <strong>gold foil relief work</strong>.</p><p>Published live on Heritage Pulse by Gowthami to celebrate traditional master artisans.</p>`,
      tags: ["TanjorePainting", "IndianArt", "ThanjavurCrafts", "GoldLeaf", "MarathaHeritage"],
      seo_title: "Tanjore Gold-Leaf Painting: History, Process & Artisans | Heritage Pulse",
      seo_description: "Explore the authentic 17th-century craft of Thanjavur gold leaf paintings with master artisan interviews.",
      keywords: "Tanjore paintings, Thanjavur art, gold foil painting, Indian traditional art, muck work gesso",
      featured_image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://craftscouncilofindia.org",
      sources: [
        { id: "src-1", name: "Crafts Council of India Heritage Register", url: "https://craftscouncilofindia.org" }
      ],
      notes: "Published by Gowthami on Aug 24, 2026. 100% complete and live.",
      images: [
        {
          id: "img-003-1",
          file_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
          filename: "tanjore-painting-crafting.jpg",
          caption: "Master artisan applying gold leaf over embossed gesso relief.",
          credit: "Heritage Pulse Special Dispatch / Nikitha",
          alt_text: "Artisan hands working with delicate gold foil on traditional painting",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-18T11:00:00Z",
      updated_at: "2026-08-24T17:30:00Z",
      checklist: {
        article_checked: true,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: true,
        mobile_preview_checked: true,
        desktop_preview_checked: true,
        website_published: true
      }
    },
    {
      id: "HP-2026-004",
      title: "Forgotten Grains of Ancient India: Millets in Vedic Cuisine and Sustainable Living",
      subtitle: "Reclaiming Ragi, Jowar, Bajra, and Foxtail millet from Ayurvedic texts for modern regenerative gastronomy.",
      topic: "Ancient Indian Millets & Vedic Cuisine",
      category: "Cuisine",
      subcategory: "Ancient Culinary Roots",
      content_type: "Featured Article",
      frequency: "Weekly",
      writer_id: "usr-writer-3",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "Medium",
      status: "READY_TO_PUBLISH",
      progress: 95,
      start_date: "2026-08-21",
      deadline: "2026-08-24",
      publishing_date: "2026-08-25",
      published_url: "",
      short_description: "Ayurvedic classifications of Siri Dhanya millets and their role in healing diets, drought-resistant farming, and heritage recipes.",
      body: `<h2>The Ancient Grains of Wisdom</h2><p>Long before wheat and polished white rice dominated the Indian subcontinental diet, millets—known in classical Sanskrit texts as <em>Trinadhanya</em>—formed the bedrock of nourishment from the Indus Valley Civilization through the Vedic era.</p>`,
      tags: ["Millets", "VedicCuisine", "AyurvedicDiet", "AncientGrains", "SustainableFood"],
      seo_title: "Ancient Indian Millets & Vedic Nutrition | Heritage Pulse",
      seo_description: "Explore the culinary history and health secrets of millets documented in Charaka Samhita and Vedic literature.",
      keywords: "ancient Indian grains, millets Vedic cuisine, Ragi Jowar history, Ayurvedic food philosophy",
      featured_image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://millets.res.in",
      sources: [
        { id: "src-1", name: "ICAR Indian Institute of Millets Research", url: "https://millets.res.in" }
      ],
      notes: "Final approved by Dr. Tejaswini Ma'am. Gowthami will publish in the morning slot.",
      images: [
        {
          id: "img-004-1",
          file_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
          filename: "heritage-millets-harvest.jpg",
          caption: "Earthen pots displaying heirloom varieties of millets in a rural kitchen.",
          credit: "Photo: Sasanka / Heritage Pulse",
          alt_text: "Clay bowls filled with different grains and millets",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-21T10:00:00Z",
      updated_at: "2026-08-24T16:00:00Z",
      checklist: {
        article_checked: true,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: true,
        mobile_preview_checked: true,
        desktop_preview_checked: true,
        website_published: false
      }
    },
    {
      id: "HP-2026-005",
      title: "Carnatic Symphony: How Fusion Ragas Are Captivating Gen-Z Audiences",
      subtitle: "Veena meets modular synthesizer: Contemporary youth are revitalizing classical gamakas through experimental fusion.",
      topic: "Carnatic Classical Meets Fusion Electronica",
      category: "Music",
      subcategory: "Classical & Fusion",
      content_type: "Culture Story",
      frequency: "Weekly",
      writer_id: "usr-writer-2",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "Medium",
      status: "WRITER_SUBMITTED",
      progress: 60,
      start_date: "2026-08-22",
      deadline: "2026-08-27",
      publishing_date: "2026-08-28",
      published_url: "",
      short_description: "New-age musicians in Chennai, Bengaluru and Hyderabad are blending 72 Melakarta ragas with lo-fi beats, ambient soundscapes, and jazz basslines.",
      body: `<h2>The Modern Gamaka</h2><p>In underground music dens and bustling festival stages across South India, a sonic revolution is underway. Young virtuosos trained in rigorous Tyagaraja kirtis are picking up five-string electric violins, digital synthesizers, and konnakol voice processors.</p>`,
      tags: ["CarnaticMusic", "FusionRagas", "IndianClassical", "IndieMusic", "Melakarta"],
      seo_title: "Carnatic Fusion Music: How Indian Ragas Reached Gen-Z | Heritage Pulse",
      seo_description: "Discover the new generation of musicians innovating Carnatic classical ragas with electronic production.",
      keywords: "Carnatic fusion, modern ragas, electronic veena, konnakol modern music",
      featured_image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      video_url: "https://www.youtube.com/watch?v=fusion_demo",
      reference_links: "https://musicacademymadras.in",
      sources: [
        { id: "src-1", name: "The Music Academy Madras Research Journal", url: "https://musicacademymadras.in" }
      ],
      notes: "Submitted by Nikitha on Aug 24 for review by Dr. Tejaswini Ma'am.",
      images: [
        {
          id: "img-005-1",
          file_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
          filename: "veena-modern-stage.jpg",
          caption: "Electric Saraswati Veena performance illuminated under stage lighting.",
          credit: "Photo by Nikitha",
          alt_text: "Musician playing classical Indian stringed instrument with modern lighting",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-22T14:00:00Z",
      updated_at: "2026-08-24T12:00:00Z",
      checklist: {
        article_checked: false,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: false,
        mobile_preview_checked: false,
        desktop_preview_checked: false,
        website_published: false
      }
    },
    {
      id: "HP-2026-006",
      title: "Kalamkari Textile Art: Hand-Painted Stories of Srikalahasti and Machilipatnam",
      subtitle: "The ancient art of vegetable-dyed storytelling using bamboo pens, myrobalan baths, and river water washing.",
      topic: "Kalamkari Handcrafted Textiles",
      category: "Culture",
      subcategory: "Handlooms & Crafts",
      content_type: "Heritage Story",
      frequency: "Weekly",
      writer_id: "usr-writer-1",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "CHANGES_REQUIRED",
      progress: 35,
      start_date: "2026-08-17",
      deadline: "2026-08-23",
      publishing_date: "2026-08-26",
      published_url: "",
      short_description: "An investigative feature into the 23-step process of traditional Kalamkari and the socio-economic challenges faced by artisan clusters.",
      body: `<h2>The Pen That Weaves Myths</h2><p>Literally translating to 'pen work' (<em>kalam</em> = pen, <em>kari</em> = craftsmanship), Kalamkari in Andhra Pradesh flourishes in two distinct historic hubs: Srikalahasti and Machilipatnam.</p>`,
      tags: ["Kalamkari", "IndianHandlooms", "SrikalahastiArt", "NaturalDyes", "CraftRevival"],
      seo_title: "Kalamkari Textile Art: 23-Step Hand-Painted Heritage | Heritage Pulse",
      seo_description: "Explore the authentic natural dyeing and pen-painting craft of Kalamkari in Andhra Pradesh.",
      keywords: "Kalamkari art, Srikalahasti textile, natural vegetable dye, bamboo kalam",
      featured_image: "https://images.unsplash.com/photo-1606744888344-493238955de0?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://handlooms.nic.in",
      sources: [
        { id: "src-1", name: "Ministry of Textiles National Handloom Registry", url: "https://handlooms.nic.in" }
      ],
      notes: "EDITOR NOTE (Dr. Tejaswini Ma'am): Please expand the section on natural vegetable dye sourcing and Swarnamukhi river washing.",
      images: [
        {
          id: "img-006-1",
          file_url: "https://images.unsplash.com/photo-1606744888344-493238955de0?auto=format&fit=crop&w=1200&q=80",
          filename: "kalamkari-artisan-drawing.jpg",
          caption: "Senior artisan sketching mythological figures with a sharp bamboo kalam.",
          credit: "Heritage Pulse Field Photo / Pavitra",
          alt_text: "Artisan hands drawing detailed textile designs on handwoven cloth",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-17T11:30:00Z",
      updated_at: "2026-08-24T11:15:00Z",
      checklist: {
        article_checked: false,
        images_checked: false,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: false,
        mobile_preview_checked: false,
        desktop_preview_checked: false,
        website_published: false
      }
    },
    {
      id: "HP-2026-007",
      title: "Vedic Chanting & Modern Neuroscience: The Sonic Architecture of Pranayama",
      subtitle: "How ancient Sanskrit phonetics, resonance frequencies, and breath control alter neural plasticity.",
      topic: "Vedic Chanting and Neuroscience",
      category: "Yoga",
      subcategory: "Vedic Science & Wellness",
      content_type: "Featured Article",
      frequency: "Weekly",
      writer_id: "usr-writer-3",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "Medium",
      status: "WRITING",
      progress: 25,
      start_date: "2026-08-23",
      deadline: "2026-08-28",
      publishing_date: "2026-08-29",
      published_url: "",
      short_description: "Cross-referencing UNESCO Intangible Cultural Heritage of Vedic Chanting with contemporary fMRI brain mapping studies.",
      body: `<h2>The Resonance of Consciousness</h2><p>In 2003, UNESCO proclaimed the tradition of Vedic Chanting as a Masterpiece of the Oral and Intangible Heritage of Humanity.</p>`,
      tags: ["Yoga", "VedicChanting", "Neuroscience", "Pranayama", "SoundHealing"],
      seo_title: "Vedic Chanting & Brain Science: Ancient Sanskrit & fMRI Studies | Heritage Pulse",
      seo_description: "Scientific analysis of how Sanskrit chanting alters vagal tone and brainwave synchronization.",
      keywords: "Vedic chanting neuroscience, Sanskrit pronunciation brain, pranayama vagal nerve",
      featured_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://ich.unesco.org/en/RL/tradition-of-vedic-chanting-00062",
      sources: [
        { id: "src-1", name: "UNESCO Intangible Cultural Heritage Dossier", url: "https://ich.unesco.org" }
      ],
      notes: "Writing in progress by Sasanka.",
      images: [
        {
          id: "img-007-1",
          file_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
          filename: "vedic-recitation-gurukul.jpg",
          caption: "Students practicing breath synchronized Vedic recitation at sunrise.",
          credit: "Heritage Pulse Photo Collection / Sasanka",
          alt_text: "Silhouetted figures meditating and practicing pranayama at sunrise",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-23T10:00:00Z",
      updated_at: "2026-08-24T16:20:00Z",
      checklist: {
        article_checked: false,
        images_checked: false,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: false,
        mobile_preview_checked: false,
        desktop_preview_checked: false,
        website_published: false
      }
    },
    {
      id: "HP-2026-008",
      title: "Temple Jewellery of South India: The Craft of Nadaswaram Gold & Uncut Rubies",
      subtitle: "Unlocking the royal embellishments originally crafted to adorn divine idols in Chola and Pandya shrines.",
      topic: "Temple Jewellery of South India",
      category: "Jewellery",
      subcategory: "Heritage Craftsmanship",
      content_type: "Special Feature",
      frequency: "Weekly",
      writer_id: "usr-writer-1",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "IMAGES_UPLOADED",
      progress: 50,
      start_date: "2026-08-22",
      deadline: "2026-08-29",
      publishing_date: "2026-08-30",
      published_url: "",
      short_description: "How goldsmiths in Vadasery, Nagercoil create Vanki armlets, Kasu Malas, and Jimikkis using pure silver gilded with 24k gold leaf.",
      body: `<h2>Adorning the Divine</h2><p>Temple jewellery originated during the reigns of the Chola and Pandya monarchs, who endowed temple treasuries with precious ornaments.</p>`,
      tags: ["TempleJewellery", "KasuMala", "VadaseryGold", "IndianGoldsmiths", "CholaJewellery"],
      seo_title: "Temple Jewellery: The Art of Vadasery Gold Ornaments | Heritage Pulse",
      seo_description: "Discover the heritage of Vadasery temple jewellery with uncut Burmese rubies and 24k gold casing.",
      keywords: "temple jewellery South India, Kasu Mala, Vadasery gold, Bharatanatyam ornaments",
      featured_image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://ipindia.gov.in/gi.htm",
      sources: [
        { id: "src-1", name: "Geographical Indications (GI) Registry of India", url: "https://ipindia.gov.in" }
      ],
      notes: "5 high-res studio photographs uploaded. Pavitra finalizing the manuscript.",
      images: [
        {
          id: "img-008-1",
          file_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
          filename: "kasu-mala-gold-closeup.jpg",
          caption: "Antique 22-carat gold Kasu Mala featuring Goddess Lakshmi coins.",
          credit: "Studio Photo / Heritage Pulse Jewellery Bureau",
          alt_text: "Intricate traditional gold coin necklace with ruby embellishments",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-22T16:00:00Z",
      updated_at: "2026-08-24T15:45:00Z",
      checklist: {
        article_checked: false,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: false,
        mobile_preview_checked: false,
        desktop_preview_checked: false,
        website_published: false
      }
    },
    {
      id: "HP-2026-009",
      title: "All India Sufi & Bhakti Poetry Summit 2026 Announced for Hyderabad",
      subtitle: "Over 80 scholars, poets, and musicians to gather at Golconda Fort for three days of mystic communion.",
      topic: "National Sufi & Bhakti Poetry Summit Announcement",
      category: "Events",
      subcategory: "Festivals & Summits",
      content_type: "Daily News",
      frequency: "Daily",
      writer_id: "usr-writer-2",
      editor_id: "usr-editor-1",
      final_approver_id: "usr-editor-1",
      publisher_id: "usr-publisher-1",
      priority: "High",
      status: "PUBLISHED",
      progress: 100,
      start_date: "2026-08-24",
      deadline: "2026-08-24",
      publishing_date: "2026-08-24",
      published_url: "https://heritagepulse.org/events/all-india-sufi-bhakti-poetry-summit-hyderabad-2026",
      short_description: "The Ministry of Culture in collaboration with Heritage Pulse announces the inaugural Deccan Mystic Festival scheduled for November 2026.",
      body: `<h2>The Confluence of Mystic Voices</h2><p>HYDERABAD — The historic ramparts of Golconda Fort will echo with the ecstatic couplets of Kabir, Bulleh Shah, Mirabai, and Amir Khusrau this autumn.</p>`,
      tags: ["SufiPoetry", "BhaktiMovement", "HyderabadEvents", "MysticPoets", "GolcondaFestival"],
      seo_title: "All India Sufi & Bhakti Poetry Summit 2026 Announced | Heritage Pulse",
      seo_description: "Full schedule, dates, and registration details for the 2026 Sufi and Bhakti poetry conclave at Golconda Fort.",
      keywords: "Sufi Bhakti summit 2026, Hyderabad cultural events, Golconda poetry festival",
      featured_image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      video_url: "",
      reference_links: "https://telanganatourism.gov.in",
      sources: [
        { id: "src-1", name: "Telangana Department of Language & Culture Official Press Release", url: "https://telanganatourism.gov.in" }
      ],
      notes: "Published by Gowthami on urgent daily news cycle.",
      images: [
        {
          id: "img-009-1",
          file_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
          filename: "golconda-event-venue.jpg",
          caption: "Golconda Fort venue illuminated for the festival announcement.",
          credit: "Heritage Pulse News Bureau / Nikitha",
          alt_text: "Illuminated historic fortress arches at dusk",
          is_featured: true,
          sort_order: 1
        }
      ],
      created_at: "2026-08-24T08:00:00Z",
      updated_at: "2026-08-24T13:00:00Z",
      checklist: {
        article_checked: true,
        images_checked: true,
        featured_image_selected: true,
        category_selected: true,
        tags_added: true,
        seo_completed: true,
        mobile_preview_checked: true,
        desktop_preview_checked: true,
        website_published: true
      }
    }
  ],

  workflow_history: [
    {
      id: "wf-101",
      content_id: "HP-2026-001",
      user_id: "usr-admin-1",
      user_name: "Jitendra",
      user_role: "Admin",
      action: "TOPIC_CREATED",
      previous_status: "NONE",
      new_status: "TOPIC_CREATED",
      progress: 0,
      comment: "Editorial topic created by Jitendra and assigned to Heritage division.",
      created_at: "2026-08-20T10:00:00Z"
    },
    {
      id: "wf-102",
      content_id: "HP-2026-001",
      user_id: "usr-admin-1",
      user_name: "Jitendra",
      user_role: "Admin",
      action: "WRITER_ASSIGNED",
      previous_status: "TOPIC_CREATED",
      new_status: "ASSIGNED",
      progress: 10,
      comment: "Assigned to Pavitra (Senior Writer) and Dr. Tejaswini Ma'am (Reviewer).",
      created_at: "2026-08-20T10:30:00Z"
    },
    {
      id: "wf-103",
      content_id: "HP-2026-001",
      user_id: "usr-writer-1",
      user_name: "Pavitra",
      user_role: "Writer",
      action: "WRITING_STARTED",
      previous_status: "ASSIGNED",
      new_status: "WRITING",
      progress: 25,
      comment: "Drafting Lepakshi, Simhachalam, and Srisailam comparative analysis.",
      created_at: "2026-08-21T11:00:00Z"
    },
    {
      id: "wf-104",
      content_id: "HP-2026-001",
      user_id: "usr-writer-1",
      user_name: "Pavitra",
      user_role: "Writer",
      action: "IMAGES_UPLOADED",
      previous_status: "WRITING",
      new_status: "IMAGES_UPLOADED",
      progress: 50,
      comment: "Uploaded 4 curated high-res photographs with ASI credits.",
      created_at: "2026-08-23T14:20:00Z"
    },
    {
      id: "wf-105",
      content_id: "HP-2026-001",
      user_id: "usr-writer-1",
      user_name: "Pavitra",
      user_role: "Writer",
      action: "SUBMITTED_TO_EDITOR",
      previous_status: "IMAGES_UPLOADED",
      new_status: "WRITER_SUBMITTED",
      progress: 60,
      comment: "Article draft and photo package submitted to Dr. Tejaswini Ma'am for review.",
      created_at: "2026-08-24T09:15:00Z"
    },
    {
      id: "wf-106",
      content_id: "HP-2026-001",
      user_id: "usr-editor-1",
      user_name: "Dr. Tejaswini Ma'am",
      user_role: "Editor",
      action: "EDITOR_REVIEW_STARTED",
      previous_status: "WRITER_SUBMITTED",
      new_status: "EDITOR_REVIEW",
      progress: 70,
      comment: "Review in progress. Refining introductory hooks and citations.",
      created_at: "2026-08-24T14:30:00Z"
    }
  ],

  comments: [
    {
      id: "cmt-001",
      content_id: "HP-2026-001",
      user_id: "usr-editor-1",
      user_name: "Dr. Tejaswini Ma'am",
      user_role: "Editor",
      user_avatar: "TM",
      tag: "Rewrite introduction",
      comment: "The opening paragraph is very strong. I have touched up the transition into Lepakshi's architectural history.",
      created_at: "2026-08-24T14:40:00Z"
    },
    {
      id: "cmt-002",
      content_id: "HP-2026-001",
      user_id: "usr-writer-1",
      user_name: "Pavitra",
      user_role: "Writer",
      user_avatar: "P",
      tag: "Verify date",
      comment: "Confirmed the 16th century Vijayanagara construction timeline with ASI archives.",
      created_at: "2026-08-24T14:50:00Z"
    }
  ],

  versions: [
    {
      id: "ver-001-1",
      content_id: "HP-2026-001",
      version_number: 1,
      version_label: "Version 1 — Pavitra Initial Draft",
      author_name: "Pavitra",
      created_at: "2026-08-21T11:00:00Z",
      title: "Temple Architecture of Andhra Pradesh",
      body: "Andhra Pradesh has many ancient temples like Lepakshi and Simhachalam."
    },
    {
      id: "ver-001-2",
      content_id: "HP-2026-001",
      version_number: 2,
      version_label: "Version 2 — Dr. Tejaswini Ma'am Editorial Revision",
      author_name: "Dr. Tejaswini Ma'am",
      created_at: "2026-08-24T14:30:00Z",
      title: "Traditional Temple Architecture of Andhra Pradesh: The Dravidian & Chalukyan Marvels",
      body: "<h2>The Majesty of Deccan Stone</h2><p>The temple architecture of Andhra Pradesh represents a magnificent confluence of Dravidian and Vijayanagara idioms.</p>"
    }
  ],

  notifications: [
    {
      id: "notif-001",
      user_id: "usr-editor-1",
      content_id: "HP-2026-001",
      title: "Article Submitted for Review",
      message: "Pavitra submitted 'Traditional Temple Architecture of Andhra Pradesh' for editorial review.",
      type: "SUBMISSION",
      read: false,
      created_at: "2026-08-24T09:15:00Z"
    },
    {
      id: "notif-002",
      user_id: "usr-publisher-1",
      content_id: "HP-2026-002",
      title: "Article Ready for Final Signoff",
      message: "'Kuchipudi Heritage: From Sacred Bhagavata Mela' was approved by Dr. Tejaswini Ma'am.",
      type: "APPROVAL",
      read: false,
      created_at: "2026-08-24T15:10:00Z"
    }
  ]
};

// Database Access Helper Functions
class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.save(initialData);
    }
  }

  load() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.save(initialData);
        return initialData;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error loading DB, reverting to initial seed:', err);
      return initialData;
    }
  }

  save(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving DB:', err);
    }
  }

  // Getters
  getUsers() { return this.load().users; }
  getUserById(id) { return this.load().users.find(u => u.id === id); }

  getCategories() { return this.load().categories; }
  getCategoryById(id) { return this.load().categories.find(c => c.id === id); }

  getContentList(filters = {}) {
    const data = this.load();
    let items = data.content || [];

    const today = "2026-08-24";
    items = items.map(item => {
      const isOverdue = item.deadline && item.deadline < today && item.status !== 'PUBLISHED';
      return {
        ...item,
        is_overdue: isOverdue,
        writer: data.users.find(u => u.id === item.writer_id) || { name: "Unassigned", avatar: "?" },
        editor: data.users.find(u => u.id === item.editor_id) || { name: "Unassigned", avatar: "?" },
        publisher: data.users.find(u => u.id === item.publisher_id) || { name: "Unassigned", avatar: "?" },
        final_approver: data.users.find(u => u.id === (item.final_approver_id || 'usr-editor-1')) || { name: "Dr. Tejaswini Ma'am", avatar: "TM" }
      };
    });

    if (filters.writer_id) {
      items = items.filter(i => i.writer_id === filters.writer_id);
    }
    if (filters.editor_id) {
      items = items.filter(i => i.editor_id === filters.editor_id);
    }
    if (filters.category) {
      items = items.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.status) {
      if (filters.status === 'OVERDUE') {
        items = items.filter(i => i.is_overdue);
      } else if (filters.status === 'EDITOR_REVIEW' || filters.status === 'REVIEWS') {
        items = items.filter(i => i.status === 'EDITOR_REVIEW' || i.status === 'WRITER_SUBMITTED');
      } else if (filters.status === 'FINAL_REVIEW' || filters.status === 'FINAL_APPROVALS') {
        items = items.filter(i => i.status === 'FINAL_REVIEW' || i.status === 'EDITOR_APPROVED');
      } else {
        items = items.filter(i => i.status === filters.status);
      }
    }
    if (filters.priority) {
      items = items.filter(i => i.priority.toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(i => 
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.topic.toLowerCase().includes(q) ||
        (i.writer && i.writer.name.toLowerCase().includes(q)) ||
        (i.editor && i.editor.name.toLowerCase().includes(q)) ||
        i.category.toLowerCase().includes(q) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (filters.min_rating) {
      const minR = parseInt(filters.min_rating, 10);
      items = items.filter(i => (i.editor_rating || 0) >= minR || (minR >= 5 && i.editor_heart));
    }
    if (filters.timeframe) {
      if (filters.timeframe === 'today') {
        items = items.filter(i => i.deadline === '2026-08-24' || (i.updated_at && i.updated_at.startsWith('2026-08-24')));
      } else if (filters.timeframe === 'yesterday') {
        items = items.filter(i => i.deadline === '2026-08-23' || (i.updated_at && i.updated_at.startsWith('2026-08-23')));
      } else if (filters.timeframe === 'this_week') {
        items = items.filter(i => i.deadline >= '2026-08-20' && i.deadline <= '2026-08-27');
      } else if (filters.timeframe === 'this_month') {
        items = items.filter(i => i.deadline && i.deadline.startsWith('2026-08'));
      }
    }

    return items;
  }

  getContentById(id) {
    const data = this.load();
    const item = (data.content || []).find(c => c.id === id);
    if (!item) return null;

    const today = "2026-08-24";
    const isOverdue = item.deadline && item.deadline < today && item.status !== 'PUBLISHED';

    return {
      ...item,
      is_overdue: isOverdue,
      writer: data.users.find(u => u.id === item.writer_id) || { name: "Unassigned", avatar: "?" },
      editor: data.users.find(u => u.id === item.editor_id) || { name: "Unassigned", avatar: "?" },
      publisher: data.users.find(u => u.id === item.publisher_id) || { name: "Unassigned", avatar: "?" },
      final_approver: data.users.find(u => u.id === (item.final_approver_id || 'usr-editor-1')) || { name: "Dr. Tejaswini Ma'am", avatar: "TM" },
      workflow_history: (data.workflow_history || []).filter(w => w.content_id === id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)),
      comments: (data.comments || []).filter(c => c.content_id === id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)),
      versions: (data.versions || []).filter(v => v.content_id === id).sort((a,b) => b.version_number - a.version_number)
    };
  }

  createContent(itemData, userId = "usr-admin-1") {
    const data = this.load();
    const user = data.users.find(u => u.id === userId) || data.users[0];
    
    const count = (data.content || []).length + 1;
    const padded = String(count).padStart(3, '0');
    const newId = `HP-2026-${padded}`;

    const now = new Date().toISOString();
    const newItem = {
      id: newId,
      title: itemData.title || itemData.topic || "Untitled Editorial Topic",
      subtitle: itemData.subtitle || "",
      topic: itemData.topic || itemData.title || "Editorial Assignment",
      category: itemData.category || "Heritage",
      subcategory: itemData.subcategory || "General",
      content_type: itemData.content_type || "Featured Article",
      frequency: itemData.frequency || "Weekly",
      writer_id: itemData.writer_id || "usr-writer-1",
      editor_id: itemData.editor_id || "usr-editor-1",
      final_approver_id: itemData.final_approver_id || "usr-editor-1",
      publisher_id: itemData.publisher_id || "usr-publisher-1",
      created_by: user.id,
      created_by_name: itemData.created_by_name || user.name,
      created_by_role: itemData.created_by_role || user.role,
      priority: itemData.priority || "Medium",
      status: itemData.writer_id ? "ASSIGNED" : "TOPIC_CREATED",
      progress: itemData.writer_id ? 10 : 0,
      start_date: itemData.start_date || "2026-08-24",
      deadline: itemData.deadline || "2026-08-28",
      work_start_time: itemData.work_start_time || "2026-08-24T09:30",
      work_end_time: itemData.work_end_time || "2026-08-24T18:00",
      publishing_date: itemData.publishing_date || "2026-08-29",
      published_url: "",
      short_description: itemData.short_description || "",
      body: itemData.body || "",
      tags: itemData.tags || ["HeritagePulse"],
      seo_title: itemData.seo_title || `${itemData.title || itemData.topic} | Heritage Pulse`,
      seo_description: itemData.seo_description || itemData.short_description || "",
      keywords: itemData.keywords || "",
      featured_image: itemData.featured_image || "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
      video_url: itemData.video_url || "",
      reference_links: itemData.reference_links || "",
      sources: itemData.sources || (itemData.reference_links ? [{ id: 'src-1', name: 'Primary Reference Source', url: itemData.reference_links }] : []),
      notes: itemData.notes || "",
      images: itemData.images || [],
      created_at: now,
      updated_at: now,
      checklist: {
        article_checked: false,
        images_checked: false,
        featured_image_selected: false,
        category_selected: true,
        tags_added: true,
        seo_completed: false,
        mobile_preview_checked: false,
        desktop_preview_checked: false,
        website_published: false
      }
    };

    data.content.unshift(newItem);

    // Add initial workflow history
    data.workflow_history.unshift({
      id: `wf-${Date.now()}-1`,
      content_id: newId,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: itemData.writer_id ? "WRITER_ASSIGNED" : "TOPIC_CREATED",
      previous_status: "NONE",
      new_status: newItem.status,
      progress: newItem.progress,
      comment: `Topic created by ${user.name}${itemData.writer_id ? ' and assigned to writer' : ''}.`,
      created_at: now
    });

    this.save(data);
    return this.getContentById(newId);
  }

  updateContent(id, updateData, userId = "usr-admin-1") {
    const data = this.load();
    const index = data.content.findIndex(c => c.id === id);
    if (index === -1) return null;

    const current = data.content[index];
    const user = data.users.find(u => u.id === userId) || data.users[0];
    const now = new Date().toISOString();

    if (updateData.body && updateData.body !== current.body && updateData.body.length > 50) {
      const existingVersions = data.versions.filter(v => v.content_id === id);
      const nextVer = existingVersions.length + 1;
      data.versions.unshift({
        id: `ver-${id}-${nextVer}`,
        content_id: id,
        version_number: nextVer,
        version_label: `Version ${nextVer} — ${user.name} (${user.role}) Edit`,
        author_name: `${user.name} (${user.role})`,
        created_at: now,
        title: updateData.title || current.title,
        body: updateData.body
      });
    }

    const updated = {
      ...current,
      ...updateData,
      updated_at: now
    };

    data.content[index] = updated;
    this.save(data);
    return this.getContentById(id);
  }

  deleteContent(id) {
    const data = this.load();
    data.content = data.content.filter(c => c.id !== id);
    data.workflow_history = data.workflow_history.filter(w => w.content_id !== id);
    data.comments = data.comments.filter(c => c.content_id !== id);
    data.versions = data.versions.filter(v => v.content_id !== id);
    this.save(data);
    return true;
  }

  addComment(contentId, commentData, userId = "usr-editor-1") {
    const data = this.load();
    const user = data.users.find(u => u.id === userId) || data.users[0];
    const now = new Date().toISOString();

    const newComment = {
      id: `cmt-${Date.now()}`,
      content_id: contentId,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      user_avatar: user.avatar,
      tag: commentData.tag || "General Feedback",
      comment: commentData.comment,
      created_at: now
    };

    data.comments.unshift(newComment);
    this.save(data);
    return newComment;
  }

  getNotifications(userId = null) {
    const data = this.load();
    let list = data.notifications || [];
    if (userId) {
      list = list.filter(n => n.user_id === userId || n.user_id === 'all');
    }
    return list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }

  markNotificationRead(id) {
    const data = this.load();
    const notif = data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save(data);
    }
    return true;
  }

  markAllNotificationsRead(userId) {
    const data = this.load();
    data.notifications.forEach(n => {
      if (!userId || n.user_id === userId || n.user_id === 'all') {
        n.read = true;
      }
    });
    this.save(data);
    return true;
  }

  // Analytics
  getAnalytics() {
    const items = this.getContentList();
    const users = this.getUsers();
    const categories = this.getCategories();

    const totalContent = items.length;
    const todayTasks = items.filter(i => i.deadline === '2026-08-24' || (i.updated_at && i.updated_at.startsWith('2026-08-24'))).length;
    const inProgress = items.filter(i => ['WRITING', 'IMAGES_PENDING', 'IMAGES_UPLOADED'].includes(i.status)).length;
    const waitingReview = items.filter(i => ['WRITER_SUBMITTED', 'EDITOR_REVIEW'].includes(i.status)).length;
    const finalApproved = items.filter(i => ['FINAL_REVIEW', 'READY_TO_PUBLISH'].includes(i.status)).length;
    const publishedToday = items.filter(i => i.status === 'PUBLISHED' && (i.publishing_date === '2026-08-24' || (i.updated_at && i.updated_at.startsWith('2026-08-24')))).length;
    const publishedTotal = items.filter(i => i.status === 'PUBLISHED').length;
    const overdue = items.filter(i => i.is_overdue).length;
    const completedPct = totalContent > 0 ? Math.round((publishedTotal / totalContent) * 100) : 0;

    const categoryStats = categories.map(cat => {
      const count = items.filter(i => i.category.toLowerCase() === cat.name.toLowerCase()).length;
      const published = items.filter(i => i.category.toLowerCase() === cat.name.toLowerCase() && i.status === 'PUBLISHED').length;
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        count,
        published
      };
    }).sort((a,b) => b.count - a.count);

    const teamWorkload = users.map(user => {
      let assigned = 0;
      let writing = 0;
      let inReview = 0;
      let changesReq = 0;
      let completed = 0;
      let userOverdue = 0;

      if (user.role === 'Writer') {
        const userItems = items.filter(i => i.writer_id === user.id);
        assigned = userItems.length;
        writing = userItems.filter(i => ['WRITING', 'IMAGES_PENDING', 'IMAGES_UPLOADED', 'ASSIGNED'].includes(i.status)).length;
        inReview = userItems.filter(i => ['WRITER_SUBMITTED', 'EDITOR_REVIEW', 'FINAL_REVIEW'].includes(i.status)).length;
        changesReq = userItems.filter(i => i.status === 'CHANGES_REQUIRED').length;
        completed = userItems.filter(i => i.status === 'PUBLISHED').length;
        userOverdue = userItems.filter(i => i.is_overdue).length;
      } else if (user.role.includes('Editor')) {
        const userItems = items.filter(i => i.editor_id === user.id || i.final_approver_id === user.id);
        assigned = userItems.length;
        writing = userItems.filter(i => ['WRITING', 'ASSIGNED'].includes(i.status)).length;
        inReview = userItems.filter(i => ['WRITER_SUBMITTED', 'EDITOR_REVIEW'].includes(i.status)).length;
        changesReq = userItems.filter(i => i.status === 'CHANGES_REQUIRED').length;
        completed = userItems.filter(i => ['EDITOR_APPROVED', 'FINAL_REVIEW', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(i.status)).length;
        userOverdue = userItems.filter(i => i.is_overdue).length;
      } else if (user.role === 'Publisher') {
        const userItems = items;
        assigned = userItems.filter(i => ['FINAL_REVIEW', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(i.status)).length;
        inReview = userItems.filter(i => ['FINAL_REVIEW', 'READY_TO_PUBLISH'].includes(i.status)).length;
        completed = userItems.filter(i => i.status === 'PUBLISHED').length;
        userOverdue = userItems.filter(i => i.is_overdue && ['FINAL_REVIEW', 'READY_TO_PUBLISH'].includes(i.status)).length;
      }

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
        assigned,
        writing,
        inReview,
        changesReq,
        completed,
        overdue: userOverdue
      };
    });

    return {
      kpi: {
        totalContent,
        todayTasks,
        inProgress,
        waitingReview,
        finalApproved,
        publishedToday,
        publishedTotal,
        overdue,
        completedPct
      },
      categoryStats,
      teamWorkload,
      date: "August 24, 2026"
    };
  }

  // ── RECYCLE BIN / TRASH ENGINE ─────────────────────────────────────────────
  getTrash() {
    const data = this.load();
    return (data.trash || []).map(t => ({
      ...t,
      trashed_by_user: data.users.find(u => u.id === t.trashed_by) || { name: 'Admin', avatar: 'A' }
    }));
  }

  moveToTrash(id, userId = 'usr-admin-1') {
    const data = this.load();
    if (!data.trash) data.trash = [];
    const index = (data.content || []).findIndex(c => c.id === id);
    if (index === -1) return null;

    const [item] = data.content.splice(index, 1);
    const user = data.users.find(u => u.id === userId) || { name: 'Admin', role: 'Super Admin' };

    const trashEntry = {
      ...item,
      trash_id: `trash-${Date.now()}-${item.id}`,
      trashed_at: new Date().toISOString(),
      trashed_by: userId,
      original_status: item.status,
      original_category: item.category,
      original_date: item.publishing_date || item.deadline || '2026-08-24'
    };

    data.trash.unshift(trashEntry);

    // Record workflow history
    if (!data.workflow_history) data.workflow_history = [];
    data.workflow_history.unshift({
      id: `wf-${Date.now()}`,
      content_id: item.id,
      user_id: userId,
      user_name: user.name,
      user_role: user.role,
      action: 'MOVED_TO_TRASH',
      previous_status: item.status,
      new_status: 'TRASHED',
      progress: 0,
      comment: `Moved to Recycle Bin by ${user.name}`,
      created_at: new Date().toISOString()
    });

    this.save(data);
    return trashEntry;
  }

  restoreFromTrash(trashId) {
    const data = this.load();
    if (!data.trash) data.trash = [];
    const index = data.trash.findIndex(t => t.trash_id === trashId || t.id === trashId);
    if (index === -1) return null;

    const [trashedItem] = data.trash.splice(index, 1);
    const { trash_id, trashed_at, trashed_by, original_status, original_category, original_date, trashed_by_user, ...restoredItem } = trashedItem;

    restoredItem.status = original_status || 'DRAFT';
    restoredItem.updated_at = new Date().toISOString();

    if (!data.content) data.content = [];
    data.content.unshift(restoredItem);

    // Record workflow
    if (!data.workflow_history) data.workflow_history = [];
    data.workflow_history.unshift({
      id: `wf-${Date.now()}`,
      content_id: restoredItem.id,
      user_id: 'usr-admin-1',
      user_name: 'Admin',
      user_role: 'Super Admin',
      action: 'RESTORED_FROM_TRASH',
      previous_status: 'TRASHED',
      new_status: restoredItem.status,
      progress: restoredItem.progress || 50,
      comment: `Restored back to original folder ${restoredItem.category}`,
      created_at: new Date().toISOString()
    });

    this.save(data);
    return restoredItem;
  }

  deleteTrashPermanently(trashId) {
    const data = this.load();
    if (!data.trash) return false;
    const index = data.trash.findIndex(t => t.trash_id === trashId || t.id === trashId);
    if (index === -1) return false;
    data.trash.splice(index, 1);
    this.save(data);
    return true;
  }

  emptyTrash() {
    const data = this.load();
    data.trash = [];
    this.save(data);
    return true;
  }

  // ── SHARING & PERMISSIONS ──────────────────────────────────────────────────
  updateFolderPermissions(id, permissionsData) {
    const data = this.load();
    const item = (data.content || []).find(c => c.id === id);
    if (!item) return null;

    item.permissions = {
      link_access: permissionsData.link_access || 'restricted',
      share_token: item.permissions?.share_token || `hp-share-${Math.random().toString(36).substring(2, 10)}`,
      shared_users: permissionsData.shared_users || [
        { user_id: 'usr-editor-1', role: 'Editor + Admin', access: 'edit' },
        { user_id: 'usr-admin-1', role: 'Super Admin', access: 'edit' }
      ],
      updated_at: new Date().toISOString()
    };

    item.updated_at = new Date().toISOString();
    this.save(data);
    return item.permissions;
  }
}

module.exports = new Database();
