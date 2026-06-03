import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  FileText,
  KanbanSquare,
  Layers3,
  LineChart,
  Mail,
  MapPin,
  MessageCircle,
  MonitorCog,
  Phone,
  ReceiptText,
  Rocket,
  Send,
  Sparkles,
  Workflow,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Layers,
  Cpu
} from 'lucide-react';

const capabilities = [
  { title: 'Company Website', text: 'เว็บไซต์บริษัท หน้าโปรไฟล์บริการ และ landing page ที่พร้อมต่อยอดเป็นระบบจริง', icon: MonitorCog },
  { title: 'Ecommerce', text: 'ร้านค้าออนไลน์ ตะกร้า คำสั่งซื้อ payment และหลังบ้านจัดการสินค้า', icon: ReceiptText },
  { title: 'Booking System', text: 'ระบบจองคิว ตารางเวลา แจ้งเตือน และหน้าจัดการสำหรับทีมงาน', icon: CalendarClock },
  { title: 'Admin Dashboard', text: 'dashboard, report, permission, workflow และข้อมูลที่ใช้ตัดสินใจได้จริง', icon: BarChart3 },
  { title: 'Automation', text: 'ลดงานซ้ำด้วย integration, notification, import/export และ process automation', icon: Workflow },
  { title: 'Custom Web App', text: 'ระบบเฉพาะทางสำหรับธุรกิจที่ template ทั่วไปตอบไม่ได้', icon: Layers3 },
];

const works = [
  {
    name: 'Quotation Workspace',
    type: 'Business Ops',
    industry: 'Enterprise',
    stack: 'React · Prisma · PostgreSQL · Tailwind',
    tags: ['React', 'Prisma', 'PostgreSQL'],
    text: 'ระบบออกใบเสนอราคาอัจฉริยะ จัดการข้อมูลลูกค้า ติดตามสถานะงาน และแปลงเป็นโครงการและงานย่อยได้ทันทีหลังอนุมัติ',
    featured: true
  },
  {
    name: 'Team Task Timer',
    type: 'Productivity',
    industry: 'SaaS',
    stack: 'React · Node.js · Express · Socket.IO',
    tags: ['React', 'Node.js', 'Socket.IO'],
    text: 'แดชบอร์ดจัดการงานแบบบอร์ดคัมบัง จับเวลาการทำงานของทีมแบบเรียลไทม์ วิเคราะห์คอขวดของงานและคำนวณต้นทุนเวลา',
    featured: true
  },
  {
    name: 'Smart Retail POS',
    type: 'Retail & POS',
    industry: 'Commerce',
    stack: 'React · Express · PostgreSQL · WebSockets',
    tags: ['React', 'Express', 'PostgreSQL'],
    text: 'ระบบหน้าร้านและจัดการคลังสินค้าแบบเรียลไทม์ รองรับสแกนบาร์โค้ด ออกใบเสร็จด่วน และเชื่อมต่อการตัดคลังออนไลน์',
    featured: true
  },
  {
    name: 'Homestay Booking Engine',
    type: 'Booking System',
    industry: 'Tourism',
    stack: 'Next.js · Tailwind · MongoDB · Stripe',
    tags: ['Next.js', 'MongoDB', 'Stripe'],
    text: 'ระบบจองที่พักและจัดการห้องพัก (PMS) สำหรับโฮมสเตย์และรีสอร์ต พร้อมระบบปฏิทินอัจฉริยะและชำระเงินออนไลน์',
    featured: false
  },
  {
    name: 'Line OA Queue Booking',
    type: 'Customer Flow',
    industry: 'LINE Integration',
    stack: 'React · Fastify · PostgreSQL · LINE LIFF',
    tags: ['React', 'LINE LIFF', 'Fastify'],
    text: 'ระบบลงทะเบียนและจองคิวออนไลน์ผ่าน LINE OA เชื่อมต่อระบบแจ้งเตือนแบบเรียลไทม์เมื่อใกล้ถึงคิวของผู้ใช้งาน',
    featured: false
  },
  {
    name: 'AI-Powered Health Twin',
    type: 'Healthcare AI',
    industry: 'Medical',
    stack: 'Flutter · Python · FastAPI · TensorFlow',
    tags: ['Flutter', 'Python', 'FastAPI'],
    text: 'แพลตฟอร์มวิเคราะห์และบันทึกสุขภาพรายวัน แสดงผลแบบ Digital Twin พร้อมระบบประมวลผลคำแนะนำด้วย AI',
    featured: false
  }
];

const faqItems = [
  {
    question: 'ราคาเริ่มต้นและขอบเขตงานเป็นอย่างไร?',
    answer: 'ราคาเริ่มต้นขึ้นอยู่กับความซับซ้อนของระบบ โดยเราจะประเมินราคาตาม Scope งานจริงผ่านระบบ Quote Builder เพื่อให้คุณทราบราคาประเมินเบื้องต้นได้ทันที และสามารถปรับเพิ่ม/ลดตามงบประมาณที่เหมาะสมได้ครับ'
  },
  {
    question: 'ใช้เวลาพัฒนานานแค่ไหน?',
    answer: 'แลนดิ้งเพจ/เว็บไซต์บริการปกติใช้เวลาประมาณ 1-2 สัปดาห์ ส่วนระบบจัดการธุรกิจ (Admin Dashboard) หรือระบบจองคิว/สั่งซื้อระดับกลางจะใช้เวลาประมาณ 3-6 สัปดาห์ ขึ้นอยู่กับความละเอียดของฟีเจอร์และความพร้อมของข้อมูลครับ'
  },
  {
    question: 'มีบริการดูแลหลังส่งมอบงานไหม?',
    answer: 'มีดูแลระบบให้ฟรี 1-3 เดือนหลังติดตั้งและนำขึ้นระบบจริง ครอบคลุมการแก้ไขบั๊ก ความเสถียรของเซิร์ฟเวอร์ และมีเอกสารคู่มือสอนสิทธิ์การจัดการระบบแอดมินให้อย่างครบถ้วน'
  },
  {
    question: 'รองรับการเชื่อมต่อ LINE OA, ระบบจ่ายเงิน หรือแดชบอร์ดรายงานไหม?',
    answer: 'รองรับครบถ้วนครับ ทีมงานมีประสบการณ์พัฒนา LINE LIFF/แชตบอต, ระบบชำระเงิน GB Prime Pay, Stripe, และระบบแสดงผลสถิติในรูปแบบกราฟแบบเรียลไทม์ตามความต้องการทางธุรกิจของคุณ'
  }
];

interface PublicWork {
  name: string;
  type: string;
  industry: string;
  stack: string;
  tags: string[];
  text: string;
  featured: boolean;
  githubUrl?: string;
}

export function PublicHomePage() {
  const [portfolioWorks, setPortfolioWorks] = useState<PublicWork[]>(works);
  const [settings, setSettings] = useState({
    email: 'support@dev4th.com',
    phone: '085-829-4254',
    lineId: '@482zdyfi',
    lineQrUrl: '',
    serviceArea: 'Remote — ทั่วประเทศไทย',
    responseSla: 'ภายใน 24 ชม.'
  });

  useEffect(() => {
    const fetchPublicData = async () => {
      const socketUrl = import.meta.env.VITE_SOCKET_URL ? import.meta.env.VITE_SOCKET_URL.replace('/socket.io', '') : 'https://dev4th.duckdns.org';
      
      // Fetch works
      try {
        const res = await fetch(`${socketUrl}/api/public/works`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPortfolioWorks(data);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic portfolio works:', err);
      }

      // Fetch settings
      try {
        const res = await fetch(`${socketUrl}/api/public/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setSettings({
              email: data.email || 'support@dev4th.com',
              phone: data.phone || '085-829-4254',
              lineId: data.lineId || '@482zdyfi',
              lineQrUrl: data.lineQrUrl || '',
              serviceArea: data.serviceArea || 'Remote — ทั่วประเทศไทย',
              responseSla: data.responseSla || 'ภายใน 24 ชม.'
            });
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic settings:', err);
      }
    };
    fetchPublicData();
  }, []);

  const [currentTab, setCurrentTab] = useState<'home' | 'works' | 'contact'>(() => {
    const path = window.location.pathname;
    if (path === '/works' || path === '/portfolio') return 'works';
    if (path === '/quote' || path === '/contact') return 'contact';
    return 'home';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state when URL pathname changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/works' || path === '/portfolio') {
        setCurrentTab('works');
      } else if (path === '/quote' || path === '/contact') {
        setCurrentTab('contact');
      } else if (path === '/') {
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToTab = (tab: 'home' | 'works' | 'contact') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    const path = tab === 'home' ? '/' : tab === 'works' ? '/works' : '/quote';
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Quote builder states ---
  const [quotationForm, setQuotationForm] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    systemType: 'Custom — ปรึกษากับทีม',
    budgetRange: '',
    scopeNotes: '',
    pdpaConsent: false,
    marketingConsent: false,
  });

  const [quotationStatus, setQuotationStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [quotationMessage, setQuotationMessage] = useState('');

  const updateQuotationField = (field: keyof typeof quotationForm, value: string | boolean) => {
    setQuotationForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectSystemForQuote = (systemName: string) => {
    setQuotationForm(prev => ({
      ...prev,
      systemType: systemName
    }));
    navigateToTab('contact');
  };

  const submitQuotationRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quotationForm.fullName || !quotationForm.email || !quotationForm.phone) {
      setQuotationStatus('error');
      setQuotationMessage('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }
    if (!quotationForm.pdpaConsent) {
      setQuotationStatus('error');
      setQuotationMessage('กรุณากดยอมรับเงื่อนไขข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    setQuotationStatus('submitting');
    setQuotationMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SOCKET_URL ? import.meta.env.VITE_SOCKET_URL.replace('/socket.io', '') : 'https://dev4th.duckdns.org'}/api/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }

      setQuotationStatus('success');
      setQuotationMessage('ส่งคำขอใบเสนอราคาสำเร็จ! ทีมงานจะติดต่อกลับโดยเร็วที่สุด');
      setQuotationForm({
        fullName: '',
        company: '',
        email: '',
        phone: '',
        systemType: 'Custom — ปรึกษากับทีม',
        budgetRange: '',
        scopeNotes: '',
        pdpaConsent: false,
        marketingConsent: false,
      });
    } catch (error) {
      setQuotationStatus('error');
      setQuotationMessage(error instanceof Error ? error.message : 'ไม่สามารถส่งคำขอใบเสนอราคาได้');
    }
  };

  // --- Works Filtering States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');

  const filteredWorks = portfolioWorks.filter((work) => {
    const matchesSearch =
      work.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.stack.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'All' || work.industry === selectedIndustry;
    
    const matchesTech = selectedTech === 'All' || work.tags.includes(selectedTech);

    return matchesSearch && matchesIndustry && matchesTech;
  });



  // --- FAQ Accordion State ---
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  // --- Sub-renderers ---

  const renderHome = () => (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,107,53,0.15),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(0,212,255,0.14),transparent_30%),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:auto,auto,44px_44px,44px_44px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/40 bg-[#ff6b35]/10 px-3 py-1 text-sm text-[#ffb199]">
              <Sparkles className="h-4 w-4" />
              Unified Workflow & Business Solutions
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7.5xl">
              ออกแบบระบบธุรกิจ แล้วต่อเป็นงานจริงได้ในที่เดียว
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              Dxv4TH ช่วยประเมิน scope ออกแบบใบเสนอราคา และให้ทีมแปลงงานที่อนุมัติเป็นโครงการ (Project), แผนงาน (Task), ระบบจับเวลา (Timer) และระบบออกบิลส่งมอบงานได้ครบวงจร
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigateToTab('contact')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(255,107,53,0.30)] transition duration-300 hover:bg-[#ff7d4f] hover:translate-y-[-1px]"
              >
                เริ่มประเมินใบเสนอราคา
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateToTab('works')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/[0.04] px-5 text-sm font-bold text-white transition duration-300 hover:border-white/28 hover:bg-white/[0.08]"
              >
                ดูผลงานทั้งหมด
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
              {[
                ['ครบวงจร', 'ในเว็บเดียว'],
                ['ยืดหยุ่น', 'ตามความต้องการ'],
                ['รวดเร็ว', 'ติดต่อกลับใน 24 ชม.'],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#0b0d0f]/92 p-4 text-center">
                  <p className="text-xl sm:text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/54">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Highlight Dashboard Mockup */}
          <div className="rounded-lg border border-white/12 bg-[#11161a]/92 p-6 shadow-2xl shadow-black/50 backdrop-blur relative overflow-hidden group">
            <div className="absolute -inset-px bg-gradient-to-r from-[#ff6b35]/20 to-[#00d4ff]/20 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none -z-10" />
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-white/46">Unified Workflow</p>
                <h2 className="mt-1 text-xl font-bold">จากใบเสนอราคาถึงงานที่ส่งมอบ</h2>
              </div>
              <Workflow className="h-6 w-6 text-[#ff8c42]" />
            </div>

            <div className="mt-6 grid gap-3">
              {[
                ['01', 'Quotation', 'เลือก scope และส่งคำขอใบเสนอราคาอัจฉริยะ'],
                ['02', 'Project', 'อนุมัติแล้วแปลงเป็น project และสร้างงานให้ทีมอัตโนมัติ'],
                ['03', 'Time & Costs', 'จับเวลาเข้างานของทีมคำนวณราคาและต้นทุนตรงตัว'],
                ['04', 'Invoice', 'ออกเอกสารใบเสร็จ/ใบแจ้งหนี้แบบดิจิทัลต่อยอดได้ทันที'],
              ].map(([step, title, text]) => (
                <div key={step} className="grid grid-cols-[40px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 transition duration-300 hover:bg-white/[0.04]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35]/14 font-black text-[#ffb199]">{step}</div>
                  <div>
                    <p className="font-bold text-sm">{title}</p>
                    <p className="mt-0.5 text-xs text-white/54 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services / Capabilities Section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[#ff8c42]">Our Expertise</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">รับทำตั้งแต่หน้าเว็บแนะนำบริการ ไปจนถึงระบบจัดการหลังบ้านครบวงจร</h2>
          <p className="mt-4 text-base text-white/60">เรานำความเชี่ยวชาญด้านสถาปัตยกรรมซอฟต์แวร์และการออกแบบมาแก้ปัญหาที่ตรงจุดสำหรับอุตสาหกรรมต่าง ๆ</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-white/10 bg-white/[0.02] p-6 transition duration-300 hover:border-[#ff6b35]/45 hover:bg-white/[0.04] hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4ff]/10 text-[#00d4ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="border-y border-white/10 bg-[#101316]/50">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#00d4ff]">Why Dxv4TH</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">สร้างรากฐานซอฟต์แวร์ที่เติบโตและปรับขนาดได้จริง</h2>
            <p className="mt-4 text-sm leading-6 text-white/58">
              เราไม่เพียงแต่เขียนโค้ด แต่เราออกแบบสถาปัตยกรรม ข้อมูล และเส้นทางการไหลของงานให้สอดคล้องกัน ปราศจากการเขียนโค้ดที่ซับซ้อนโดยไม่จำเป็น (Clean Architecture)
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ['Custom Scope & Budget', 'วางโครงร่างใบเสนอราคาตามฟีเจอร์ใช้งานจริง ไม่โดนชาร์จค่าบริการเกินตัว', FileText],
              ['Unified Management Platform', 'หลังอนุมัติสร้างโครงการ (Project) และตารางงาน (Task) ทันที ติดตามคืบหน้าตรงจุด', KanbanSquare],
              ['Precision Tracking', 'แดชบอร์ดรายงานเวลาทำงานและสถิติการดำเนินการรายวันของทีม', Clock3],
              ['Smart Billing', 'ระบบออก Invoice และจัดการใบเสร็จรับเงินต่อเนื่องจากฐานข้อมูลเดียว ไม่ต้องกรอกซ้ำซ้อน', LineChart],
            ].map(([title, text, Icon]) => (
              <div key={title as string} className="grid grid-cols-[40px_1fr] gap-4 rounded-lg border border-white/10 bg-black/30 p-4 transition duration-300 hover:border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35]/14 text-[#ff8c42]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">{title as string}</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">{text as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Works Showcase */}
      <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff8c42]">Featured Work</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">ตัวอย่างระบบที่เราออกแบบและพัฒนา</h2>
          </div>
          <button
            onClick={() => navigateToTab('works')}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ffb199] hover:text-white transition duration-200"
          >
            ดูผลงานทั้งหมด
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {portfolioWorks.filter(w => w.featured).map((work) => (
            <article key={work.name} className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#11161a]/60 p-6 relative overflow-hidden group">
              <div className="absolute -inset-px bg-gradient-to-b from-[#ff6b35]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none -z-10" />
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-md bg-[#00d4ff]/10 px-2.5 py-1 text-xs font-bold text-[#86eaff]">{work.type}</span>
                  <BriefcaseBusiness className="h-4 w-4 text-white/30" />
                </div>
                <h3 className="mt-6 text-lg font-bold">{work.name}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{work.text}</p>
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-mono text-[10px] text-white/40 tracking-wider mb-4">{work.stack}</p>
                <button
                  onClick={() => selectSystemForQuote(work.name)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6b35] hover:text-[#ff7d4f] transition duration-200"
                >
                  สนใจประเมินราคาตามระบบนี้
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-[#101316] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00d4ff]/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#00d4ff]">FAQ</p>
              <h2 className="mt-3 text-3xl font-black leading-tight">คำถามที่พบบ่อยก่อนเริ่มพัฒนาโปรเจกต์</h2>
              <p className="mt-4 text-sm text-white/50 leading-relaxed">
                เราต้องการให้การร่วมงานมีความโปร่งใส เข้าใจตรงกันทุกขั้นตอน หากมีข้อสงสัยเพิ่มเติมสามารถติดต่อสอบถามทีมงานได้ตลอดครับ
              </p>
            </div>
            <div className="grid gap-3">
              {faqItems.map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <div
                    key={faq.question}
                    className={`rounded-lg border transition-all duration-300 ${
                      isExpanded ? 'border-[#ff6b35]/60 bg-white/[0.03]' : 'border-white/10 bg-black/10'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-sm sm:text-base text-white/90 hover:text-white"
                    >
                      <span>{faq.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#ff6b35] shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/40 shrink-0 ml-4" />
                      )}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-5 pb-5 pt-1 text-sm text-white/60 leading-relaxed border-t border-white/5">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner CTA */}
      <section className="border-t border-white/10 bg-[#ff6b35] text-[#11161a]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-black/60">Ready to build your system?</p>
            <h2 className="mt-1 text-3xl font-black">มาเริ่มต้นวิเคราะห์ขอบเขตระบบงานแรกของคุณกัน</h2>
          </div>
          <button
            onClick={() => navigateToTab('contact')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#11161a] px-6 text-sm font-black text-white transition duration-300 hover:bg-black hover:translate-x-1"
          >
            เริ่มประเมินใบเสนอราคา
            <Rocket className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );

  const renderWorks = () => (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4ff]/40 bg-[#00d4ff]/10 px-3 py-1 text-xs text-[#86eaff] font-bold">
          <Cpu className="h-3.5 w-3.5" />
          Portfolio Gallery
        </div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl font-sans">
          ผลงานออกแบบและพัฒนาซอฟต์แวร์
        </h1>
        <p className="mt-3 text-base text-white/60 font-sans">
          เลือกดูคลังผลงานระบบแนะนำเพื่อประกอบการตัดสินใจของท่าน และศึกษาเทคโนโลยีที่นำมาใช้จริงในแต่ละโปรเจกต์
        </p>
      </div>

      {/* Search & Layout */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          
          {/* Industry Category Filter */}
          <div className="rounded-lg border border-white/10 bg-[#11161a]/60 p-5 backdrop-blur">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
              <Filter className="h-3 w-3 text-[#ff6b35]" />
              ประเภทธุรกิจ / อุตสาหกรรม
            </h3>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
              {[
                ['All', 'ทั้งหมด'],
                ['Enterprise', 'ระบบองค์กร'],
                ['SaaS', 'SaaS / Productivity'],
                ['Commerce', 'ค้าปลีก & อีคอมเมิร์ซ'],
                ['LINE Integration', 'ระบบ LINE OA & LIFF'],
                ['Tourism', 'ระบบท่องเที่ยว & ทุนจอง'],
                ['Medical', 'ระบบด้านการแพทย์'],
              ].map(([key, label]) => {
                const isActive = selectedIndustry === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedIndustry(key)}
                    className={`px-3 py-1.5 text-xs text-left rounded-lg transition duration-200 ${
                      isActive
                        ? 'bg-[#ff6b35]/20 text-[#ffb199] border border-[#ff6b35]/40 font-bold'
                        : 'bg-white/[0.02] text-white/60 border border-transparent hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tech Stack Filter */}
          <div className="rounded-lg border border-white/10 bg-[#11161a]/60 p-5 backdrop-blur">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
              <Layers className="h-3 w-3 text-[#00d4ff]" />
              เทคโนโลยี / Stack
            </h3>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
              {[
                ['All', 'ทั้งหมด'],
                ['React', 'React.js'],
                ['Next.js', 'Next.js'],
                ['Node.js', 'Node.js'],
                ['PostgreSQL', 'PostgreSQL'],
                ['MongoDB', 'MongoDB'],
                ['LINE LIFF', 'LINE LIFF'],
                ['Flutter', 'Flutter (Mobile)'],
                ['Python', 'Python AI'],
              ].map(([key, label]) => {
                const isActive = selectedTech === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTech(key)}
                    className={`px-3 py-1.5 text-xs text-left rounded-lg transition duration-200 ${
                      isActive
                        ? 'bg-[#00d4ff]/10 text-[#86eaff] border border-[#00d4ff]/30 font-bold'
                        : 'bg-white/[0.02] text-white/60 border border-transparent hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

        </aside>

        {/* Right Content Side */}
        <div className="space-y-4">
          
          {/* Search Bar & Stats */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-white/30" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผลงาน, รายละเอียด หรือ stack..."
                className="w-full h-10 pl-10 pr-4 text-sm text-white bg-white/[0.04] border border-white/10 rounded-lg outline-none transition duration-300 focus:border-[#00d4ff] focus:bg-white/[0.07] focus:shadow-[0_0_12px_rgba(0,212,255,0.15)] placeholder:text-white/30"
              />
            </div>
            <p className="text-xs font-bold text-white/40 tracking-wider uppercase shrink-0">
              พบ {filteredWorks.length} จาก {portfolioWorks.length} ระบบ
            </p>
          </div>

          {/* Grid of Results */}
          {filteredWorks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredWorks.map((work) => (
                <article
                  key={work.name}
                  className="flex flex-col justify-between p-6 rounded-lg border border-white/10 bg-[#11161a]/60 transition duration-300 hover:border-white/20 hover:bg-[#11161a]/80 relative overflow-hidden group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md bg-white/[0.04] px-2 py-0.5 border border-white/10 text-[11px] font-bold text-white/70">
                        {work.type}
                      </span>
                      <span className="text-[10px] font-black text-[#00d4ff] uppercase tracking-wider">
                        {work.industry}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-white group-hover:text-[#ff6b35] transition duration-300">
                      {work.name}
                    </h3>
                    
                    <div className="text-[11px] text-[#86eaff] font-mono mt-1 font-bold">
                      Stack: {work.stack}
                    </div>

                    <p className="mt-3 text-sm text-white/60 leading-6">
                      {work.text}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {work.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-[#0b0d0f] rounded text-[10px] text-white/50 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => selectSystemForQuote(work.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6b35] hover:text-[#ff7d4f] transition duration-200"
                      >
                        ประเมินราคาตามรูปแบบระบบนี้
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
              <Cpu className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/50 font-bold">ไม่พบผลงานที่สอดคล้องกับคำค้นหาของคุณ</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedIndustry('All'); setSelectedTech('All'); }}
                className="mt-3 text-xs font-bold text-[#ff6b35] hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );

  const renderContact = () => (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/40 bg-[#ff6b35]/10 px-3 py-1 text-xs text-[#ffb199] font-bold">
          <FileText className="h-3.5 w-3.5" />
          Request Quotation
        </div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
          ขอใบเสนอราคา & ติดต่อทีมงาน
        </h1>
        <p className="mt-3 text-base text-white/60">
          กรอกข้อมูลเพื่อแจ้งขอบเขตฟังก์ชันและสเกลระบบที่คุณต้องการ ระบบประเมินราคาขั้นต้นจะแจ้งข้อมูลกลับภายใน 24 ชั่วโมง
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        
        {/* Form Column */}
        <div className="rounded-lg border border-white/10 bg-[#11161a]/60 p-6 backdrop-blur shadow-xl relative">
          
          <form onSubmit={submitQuotationRequest} className="space-y-6">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff6b35] flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b35]/10 text-[10px] text-[#ff8c42] font-mono">01</span>
                ข้อมูลติดต่อ
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">ชื่อ-นามสกุลผู้ติดต่อ <span className="text-[#ff8c42]">*</span></span>
                  <input
                    type="text"
                    required
                    value={quotationForm.fullName}
                    onChange={(event) => updateQuotationField('fullName', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6b35] focus:bg-white/[0.05]"
                    placeholder="เช่น คุณสมชาย ใจดี"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">ชื่อบริษัท / องค์กร</span>
                  <input
                    type="text"
                    value={quotationForm.company}
                    onChange={(event) => updateQuotationField('company', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6b35] focus:bg-white/[0.05]"
                    placeholder="เช่น บริษัท แอดวานซ์ เทค จำกัด"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">อีเมลสำหรับส่งใบเสนอราคา <span className="text-[#ff8c42]">*</span></span>
                  <input
                    type="email"
                    required
                    value={quotationForm.email}
                    onChange={(event) => updateQuotationField('email', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6b35] focus:bg-white/[0.05]"
                    placeholder="you@company.com"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">เบอร์โทรศัพท์ผู้ติดต่อ <span className="text-[#ff8c42]">*</span></span>
                  <input
                    type="text"
                    required
                    value={quotationForm.phone}
                    onChange={(event) => updateQuotationField('phone', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6b35] focus:bg-white/[0.05]"
                    placeholder="เช่น 085-829-4254"
                  />
                </label>
              </div>
            </div>

            {/* Section 2: System interest & Budget */}
            <div className="space-y-4 pt-5 border-t border-white/5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff6b35] flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b35]/10 text-[10px] text-[#ff8c42] font-mono">02</span>
                ระบุความสนใจ
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">ระบบที่สนใจพัฒนา</span>
                  <select
                    value={quotationForm.systemType}
                    onChange={(event) => updateQuotationField('systemType', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-white outline-none transition focus:border-[#ff6b35] focus:bg-white/[0.05] [&>option]:bg-[#11161a]"
                  >
                    <option>Custom — ปรึกษากับทีม</option>
                    <option>Company Website</option>
                    <option>Ecommerce</option>
                    <option>Booking System</option>
                    <option>Admin Dashboard</option>
                    <option>Automation</option>
                    {!['Custom — ปรึกษากับทีม', 'Company Website', 'Ecommerce', 'Booking System', 'Admin Dashboard', 'Automation'].includes(quotationForm.systemType) && (
                      <option>{quotationForm.systemType}</option>
                    )}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">ช่วงงบประมาณประเมิน</span>
                  <select
                    value={quotationForm.budgetRange}
                    onChange={(event) => updateQuotationField('budgetRange', event.target.value)}
                    className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-white outline-none transition focus:border-[#ff6b35] focus:bg-white/[0.05] [&>option]:bg-[#11161a]"
                  >
                    <option value="">เลือกช่วงงบที่ต้องการ</option>
                    <option>น้อยกว่า 30,000 บาท</option>
                    <option>30,000 - 80,000 บาท</option>
                    <option>80,000 - 150,000 บาท</option>
                    <option>150,000 - 300,000 บาท</option>
                    <option>300,000 - 500,000 บาท</option>
                    <option>มากกว่า 500,000 บาท</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Section 3: Scope Notes & Consent */}
            <div className="space-y-4 pt-5 border-t border-white/5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff6b35] flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b35]/10 text-[10px] text-[#ff8c42] font-mono">03</span>
                ขอบเขตข้อมูล
              </h3>
              <label className="grid gap-2">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">ความต้องการ / รายละเอียดเพิ่มเติม</span>
                <textarea
                  value={quotationForm.scopeNotes}
                  onChange={(event) => updateQuotationField('scopeNotes', event.target.value)}
                  className="min-h-[120px] resize-none rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#ff6b35] focus:bg-white/[0.05]"
                  placeholder="อธิบายสรุปไอเดียฟังก์ชัน ระบบที่จะใช้ คีย์แมนที่ต้องการ ให้ทีมช่วยประเมินขอบเขต"
                />
              </label>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 text-xs leading-5 text-white/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quotationForm.pdpaConsent}
                    onChange={(event) => updateQuotationField('pdpaConsent', event.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 rounded border-white/20 bg-white/[0.03] accent-[#ff6b35]"
                  />
                  <span>ยินยอมให้เก็บข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) เพื่อใช้ติดต่อกลับเสนอราคา <span className="text-[#ff8c42]">*</span></span>
                </label>
                <label className="flex items-start gap-3 text-xs leading-5 text-white/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quotationForm.marketingConsent}
                    onChange={(event) => updateQuotationField('marketingConsent', event.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 rounded border-white/20 bg-white/[0.03] accent-[#ff6b35]"
                  />
                  <span>ยินยอมรับข่าวสาร อัปเดตแพลตฟอร์ม และข้อเสนออื่น ๆ เพิ่มเติม</span>
                </label>

                <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  {quotationMessage ? (
                    <p className={`text-xs font-semibold ${quotationStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {quotationMessage}
                    </p>
                  ) : <span />}
                  
                  <button
                    type="submit"
                    disabled={quotationStatus === 'submitting'}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-6 text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,107,53,0.2)] transition hover:bg-[#ff7d4f] disabled:opacity-60 shrink-0 ml-auto"
                  >
                    {quotationStatus === 'submitting' ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอใบเสนอราคา'}
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Sidebar Info Column */}
        <aside className="space-y-4">
          
          {/* Contact Details Card */}
          <div className="rounded-lg border border-white/10 bg-[#11161a]/60 p-5 backdrop-blur">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#ff6b35] mb-4">
              ช่องทางการติดต่อทางการ
            </h3>
            <div className="space-y-3">
              {[
                [Mail, 'Email', settings.email],
                [MessageCircle, 'LINE OA ID', settings.lineId],
                [Phone, 'Phone', settings.phone],
                [MapPin, 'Service Area', settings.serviceArea],
              ].map(([Icon, label, value]) => (
                <div key={label as string} className="flex gap-3 items-center rounded-lg border border-white/5 bg-black/20 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ff6b35]/10 text-[#ff8c42] shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{label as string}</p>
                    <p className="text-xs font-bold text-white/95 mt-0.5 truncate">{value as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Card */}
          <div className="rounded-lg border border-[#ff6b35]/30 bg-[#ff6b35]/5 p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#ffb199]">Response SLA</h3>
            <p className="mt-2 text-3xl font-black text-white leading-none">{settings.responseSla}</p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              เมื่อส่งขอบเขตระบบแล้ว ทีมงานจะสแกนความสนใจ ข้อมูล และสรุปช่วงราคาเพื่อชี้แจงกลับโดยเร็วที่สุด
            </p>
          </div>

          {/* Customized LINE QR Mockup */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-3">Add Friend on LINE</span>
            <div className="inline-flex p-3 rounded-lg bg-white mb-2">
              {settings.lineQrUrl ? (
                <img src={settings.lineQrUrl} alt="LINE QR Code" className="w-[100px] h-[100px] object-contain rounded-md" />
              ) : (
                /* Sleek inline-SVG QR Code mock representation */
                <svg width="100" height="100" viewBox="0 0 100 100" className="text-black">
                  <rect width="100" height="100" fill="white" />
                  <path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" fill="black" />
                  <path d="M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" fill="black" />
                  <path d="M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" fill="black" />
                  {/* Random code modules to look like a clean modern QR */}
                  <rect x="35" y="10" width="5" height="15" fill="black" />
                  <rect x="45" y="15" width="10" height="5" fill="black" />
                  <rect x="35" y="30" width="20" height="5" fill="black" />
                  <rect x="60" y="30" width="5" height="10" fill="black" />
                  <rect x="10" y="35" width="15" height="5" fill="black" />
                  <rect x="15" y="45" width="30" height="5" fill="black" />
                  <rect x="50" y="45" width="15" height="5" fill="black" />
                  <rect x="35" y="60" width="5" height="20" fill="black" />
                  <rect x="45" y="70" width="15" height="15" fill="black" />
                  <rect x="70" y="40" width="20" height="5" fill="black" />
                  <rect x="80" y="55" width="10" height="25" fill="black" />
                  <rect x="65" y="75" width="10" height="5" fill="black" />
                </svg>
              )}
            </div>
            <p className="text-xs font-bold text-white/80">LINE ID: {settings.lineId}</p>
          </div>

        </aside>

      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#0b0d0f] text-white selection:bg-[#ff6b35] selection:text-white flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d0f]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigateToTab('home')} className="flex items-center gap-3 text-left focus:outline-none" aria-label="Dxv4TH home">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35] text-sm font-black text-white shadow-[0_0_24px_rgba(255,107,53,0.35)]">
              D4
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-normal">Dxv4TH</span>
              <span className="block text-xs text-white/50">Unified Workspace</span>
            </span>
          </button>

          {/* Desktop Nav Tabs with dynamic pill */}
          <nav className="hidden md:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => navigateToTab('home')}
              className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
                currentTab === 'home' ? 'text-white bg-[#ff6b35] shadow-[0_2px_10px_rgba(255,107,53,0.3)]' : 'text-white/60 hover:text-white'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => navigateToTab('works')}
              className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
                currentTab === 'works' ? 'text-white bg-[#ff6b35] shadow-[0_2px_10px_rgba(255,107,53,0.3)]' : 'text-white/60 hover:text-white'
              }`}
            >
              ผลงานทั้งหมด
            </button>
            <button
              onClick={() => navigateToTab('contact')}
              className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
                currentTab === 'contact' ? 'text-white bg-[#ff6b35] shadow-[0_2px_10px_rgba(255,107,53,0.3)]' : 'text-white/60 hover:text-white'
              }`}
            >
              ขอใบเสนอราคา
            </button>
          </nav>

          {/* Mobile hamburger menu */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu expanded */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0b0d0f]/95 backdrop-blur-xl px-4 py-4 space-y-2">
            <button
              onClick={() => navigateToTab('home')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold block transition ${
                currentTab === 'home' ? 'bg-[#ff6b35] text-white' : 'text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => navigateToTab('works')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold block transition ${
                currentTab === 'works' ? 'bg-[#ff6b35] text-white' : 'text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              ผลงานทั้งหมด
            </button>
            <button
              onClick={() => navigateToTab('contact')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold block transition ${
                currentTab === 'contact' ? 'bg-[#ff6b35] text-white' : 'text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              ขอใบเสนอราคา
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'works' && renderWorks()}
        {currentTab === 'contact' && renderContact()}
      </main>
    </div>
  );
}
