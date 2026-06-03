import { useState, useEffect } from 'react';
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
  { name: 'Quotation Workspace', type: 'Business Ops', stack: 'React · Prisma · PostgreSQL', text: 'ออกใบเสนอราคา จัดการลูกค้า และแปลงงานที่อนุมัติเป็น project ได้' },
  { name: 'Team Task Timer', type: 'Work Management', stack: 'React · Express · Socket.IO', text: 'จัดการ task, assign งาน, จับเวลา และดูความคืบหน้าของทีม' },
  { name: 'Service Portal', type: 'Customer Flow', stack: 'Quote Builder · Dashboard', text: 'หน้า public สำหรับให้ลูกค้าเลือก scope และส่งคำขอใบเสนอราคา' },
];

const faqs = [
  'ราคาเริ่มต้นเท่าไหร่?',
  'ใช้เวลาพัฒนานานแค่ไหน?',
  'มีดูแลหลังส่งมอบไหม?',
  'รองรับ LINE OA, payment หรือ dashboard ไหม?',
];

export function PublicHomePage() {
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
    setQuotationForm((current) => ({ ...current, [field]: value }));
  };

  const submitQuotationRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuotationStatus('submitting');
    setQuotationMessage('');

    try {
      const response = await fetch('/api/public/quotation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'ไม่สามารถส่งคำขอใบเสนอราคาได้');
      }

      setQuotationStatus('success');
      setQuotationMessage(payload.message || 'ส่งคำขอใบเสนอราคาเรียบร้อยแล้ว');
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
  useEffect(() => {
    // If there is no specific hash, automatically scroll to `#work` on mount
    if (!window.location.hash) {
      setTimeout(() => {
        const element = document.getElementById('work');
        if (element) {
          element.scrollIntoView({ behavior: 'auto' });
        }
      }, 80);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d0f] text-white selection:bg-[#ff6b35] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d0f]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Dxv4TH home">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35] text-sm font-black text-white shadow-[0_0_28px_rgba(255,107,53,0.35)]">
              D4
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-normal">Dxv4TH</span>
              <span className="block text-xs text-white/52">Unified Workspace</span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/62 md:flex">
            <a className="transition hover:text-white" href="#capabilities">บริการ</a>
            <a className="transition hover:text-white" href="#quote">ใบเสนอราคา</a>
            <a className="transition hover:text-white" href="#work">ผลงาน</a>
            <a className="transition hover:text-white" href="#faq">FAQ</a>
          </nav>

          <div className="w-[102px] md:block hidden"></div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,107,53,0.20),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(0,212,255,0.18),transparent_30%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,auto,44px_44px,44px_44px]" />
          <div className="relative mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/40 bg-[#ff6b35]/10 px-3 py-1 text-sm text-[#ffb199]">
                <Sparkles className="h-4 w-4" />
                Portfolio + Quote Builder + Work Tracking
              </div>

              <h1 className="text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
                ออกแบบระบบธุรกิจ แล้วต่อเป็นงานจริงได้ในที่เดียว
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                Dxv4TH ช่วยลูกค้าเลือก scope ขอใบเสนอราคา และให้ทีมแปลงงานที่อนุมัติเป็น project, task, timer และ invoice ใน workflow เดียว
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#quote"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-5 text-sm font-bold text-white shadow-[0_18px_42px_rgba(255,107,53,0.30)] transition hover:bg-[#ff7d4f]"
                >
                  ขอใบเสนอราคา
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#work"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/[0.04] px-5 text-sm font-bold text-white transition hover:border-white/28 hover:bg-white/[0.08]"
                >
                  ดูผลงาน
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
                {[
                  ['1', 'เว็บเดียว'],
                  ['1', 'Database'],
                  ['ครบ', 'Quote to Paid'],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#101316]/92 p-4">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="mt-1 text-xs text-white/54">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/12 bg-[#11161a]/92 p-5 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase text-white/46">Unified Workflow</p>
                  <h2 className="mt-1 text-xl font-bold">จากใบเสนอราคาถึงงานที่ส่งมอบ</h2>
                </div>
                <Workflow className="h-6 w-6 text-[#ff8c42]" />
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ['01', 'Quotation', 'เลือก scope และส่งคำขอใบเสนอราคา'],
                  ['02', 'Project', 'อนุมัติแล้วแปลงเป็น project และ task'],
                  ['03', 'Time', 'จับเวลาทำงานและดูต้นทุนจริง'],
                  ['04', 'Invoice', 'ออก invoice จากข้อมูลเดิม'],
                ].map(([step, title, text]) => (
                  <div key={step} className="grid grid-cols-[42px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35]/14 font-black text-[#ffb199]">{step}</div>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="mt-1 text-sm text-white/54">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="quote" className="relative overflow-hidden border-b border-white/10 bg-[#0b0d0f] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(120deg,rgba(255,107,53,0.14),transparent_36%,rgba(0,212,255,0.10)_72%,transparent)] bg-[length:44px_44px,44px_44px,auto]" />

          <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-9 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/35 bg-[#ff6b35]/10 px-3 py-1 text-sm font-semibold text-[#ffb199]">
                  <FileText className="h-4 w-4" />
                  Quotation Request
                </div>
                <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
                  เล่า scope ที่อยากได้ แล้วให้ Dxv4TH ประเมินทางออกที่เหมาะกับงาน
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
                  คำขอจะถูกบันทึกเป็น Quotation Request ก่อน ทีมจะติดต่อกลับเพื่อสรุป scope ราคา และ timeline ให้ชัดเจน
                </p>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur">
                {[
                  ['01', 'Request'],
                  ['02', 'Scope'],
                  ['03', 'Quotation'],
                ].map(([step, label]) => (
                  <div key={step} className="border-r border-white/10 px-4 py-4 last:border-r-0">
                    <p className="font-mono text-xs text-[#ff8c42]">{step}</p>
                    <p className="mt-1 text-sm font-bold text-white">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <form onSubmit={submitQuotationRequest} className="rounded-lg border border-white/12 bg-[#11161a]/92 p-4 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">ชื่อ-นามสกุล <span className="text-[#ff8c42]">*</span></span>
                    <input value={quotationForm.fullName} onChange={(event) => updateQuotationField('fullName', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#ff6b35] focus:bg-white/[0.08]" placeholder="เช่น สมชาย ใจดี" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">บริษัท</span>
                    <input value={quotationForm.company} onChange={(event) => updateQuotationField('company', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#ff6b35] focus:bg-white/[0.08]" placeholder="ชื่อบริษัท / องค์กร" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">อีเมล <span className="text-[#ff8c42]">*</span></span>
                    <input type="email" value={quotationForm.email} onChange={(event) => updateQuotationField('email', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#ff6b35] focus:bg-white/[0.08]" placeholder="you@company.com" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">เบอร์โทร <span className="text-[#ff8c42]">*</span></span>
                    <input value={quotationForm.phone} onChange={(event) => updateQuotationField('phone', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#ff6b35] focus:bg-white/[0.08]" placeholder="085-829-4254" />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">ระบบที่สนใจ</span>
                    <select value={quotationForm.systemType} onChange={(event) => updateQuotationField('systemType', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white outline-none transition focus:border-[#00d4ff] [&>option]:bg-[#11161a]">
                      <option>Custom — ปรึกษากับทีม</option>
                      <option>Company Website</option>
                      <option>Ecommerce</option>
                      <option>Booking System</option>
                      <option>Admin Dashboard</option>
                      <option>Automation</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-white/76">งบประมาณโดยประมาณ</span>
                    <select value={quotationForm.budgetRange} onChange={(event) => updateQuotationField('budgetRange', event.target.value)} className="h-12 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white outline-none transition focus:border-[#00d4ff] [&>option]:bg-[#11161a]">
                      <option value="">เลือกช่วงงบ</option>
                      <option>น้อยกว่า 30,000 บาท</option>
                      <option>30,000 - 80,000 บาท</option>
                      <option>80,000 - 150,000 บาท</option>
                      <option>150,000 - 300,000 บาท</option>
                      <option>300,000 - 500,000 บาท</option>
                      <option>มากกว่า 500,000 บาท</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-bold text-white/76">รายละเอียดเพิ่มเติม</span>
                  <textarea value={quotationForm.scopeNotes} onChange={(event) => updateQuotationField('scopeNotes', event.target.value)} className="min-h-36 resize-none rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-[#00d4ff] focus:bg-white/[0.08]" placeholder="บอกเล่าความต้องการ ระบบที่อยากได้ ฟีเจอร์หลัก หรือคำถามที่อยากถาม" />
                </label>

                <div className="mt-5 grid gap-3 border-t border-white/10 pt-5">
                  <label className="flex items-start gap-3 text-sm leading-6 text-white/54">
                    <input type="checkbox" checked={quotationForm.pdpaConsent} onChange={(event) => updateQuotationField('pdpaConsent', event.target.checked)} className="mt-1 h-5 w-5 rounded border-white/20 bg-white/[0.05] accent-[#ff6b35]" />
                    <span>ยินยอมให้เก็บข้อมูลส่วนบุคคลตาม PDPA เพื่อการติดต่อกลับและเสนอราคาเท่านั้น</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-white/54">
                    <input type="checkbox" checked={quotationForm.marketingConsent} onChange={(event) => updateQuotationField('marketingConsent', event.target.checked)} className="mt-1 h-5 w-5 rounded border-white/20 bg-white/[0.05] accent-[#00d4ff]" />
                    <span>ยินยอมรับข่าวสาร โปรโมชัน และข้อมูลบริการเพิ่มเติมจาก Dxv4TH</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    {quotationMessage ? (
                      <p className={`text-sm font-semibold ${quotationStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {quotationMessage}
                      </p>
                    ) : <span />}
                    <button type="submit" disabled={quotationStatus === 'submitting'} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff6b35] px-5 text-sm font-black text-white shadow-[0_18px_42px_rgba(255,107,53,0.24)] transition hover:bg-[#ff7d4f] disabled:cursor-not-allowed disabled:opacity-60">
                      {quotationStatus === 'submitting' ? 'กำลังส่ง...' : 'ส่งคำขอใบเสนอราคา'}
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              <aside className="grid gap-4">
                <div className="rounded-lg border border-white/12 bg-white/[0.04] p-5 backdrop-blur">
                  <p className="text-sm font-bold uppercase text-[#00d4ff]">Contact Channels</p>
                  <div className="mt-5 grid gap-3">
                    {[
                      [Mail, 'Email', 'support@dev4th.com'],
                      [MessageCircle, 'LINE', '@482zdyfi'],
                      [Phone, 'Phone', '085-829-4254'],
                      [MapPin, 'Remote', 'ทั่วประเทศไทย'],
                    ].map(([Icon, label, value]) => (
                      <div key={label as string} className="grid grid-cols-[38px_1fr] items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ff6b35]/14 text-[#ff8c42]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/36">{label as string}</p>
                          <p className="mt-0.5 break-words text-sm font-bold text-white">{value as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[#ff6b35]/35 bg-[#ff6b35]/10 p-5">
                  <p className="text-sm font-bold uppercase text-[#ffb199]">Response SLA</p>
                  <p className="mt-3 text-5xl font-black leading-none text-white">24h</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">ตอบกลับทางอีเมล โทรศัพท์ หรือ LINE เพื่อสรุป scope ก่อนออกใบเสนอราคา</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="capabilities" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-[#ff8c42]">Capability Areas</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">รับทำตั้งแต่หน้าเว็บจนถึงระบบหลังบ้าน</h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#ff6b35]/45 hover:bg-white/[0.055]">
                  <Icon className="h-6 w-6 text-[#00d4ff]" />
                  <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#101316]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase text-[#00d4ff]">Why Dxv4TH</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">ไม่จบแค่ส่งฟอร์ม แต่ไปต่อถึงงานและการจ่ายเงิน</h2>
            </div>
            <div className="grid gap-3">
              {[
                ['Quotation', 'ลูกค้าเลือก scope และได้ quotation preview ก่อนส่งข้อมูลติดต่อ', FileText],
                ['Project', 'เมื่ออนุมัติ ระบบสร้าง project และ task template ให้ทีมเริ่มงาน', KanbanSquare],
                ['Time Tracking', 'ทีมจับเวลาและดูต้นทุนเวลาของงานจริงได้', Clock3],
                ['Invoice', 'ออก invoice จากข้อมูลลูกค้าและ project เดิม ไม่ต้องกรอกซ้ำ', LineChart],
              ].map(([title, text, Icon]) => (
                <div key={title as string} className="grid grid-cols-[44px_1fr] gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ff6b35]/14 text-[#ff8c42]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{title as string}</p>
                    <p className="mt-1 text-sm leading-6 text-white/58">{text as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="work" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#ff8c42]">Featured Work</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">ตัวอย่างระบบที่กำลังรวมเป็น workspace เดียว</h2>
            </div>
            <a href="#quote" className="inline-flex items-center gap-2 text-sm font-bold text-[#ffb199] hover:text-white">
              ขอใบเสนอราคาแบบนี้
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {works.map((work) => (
              <article key={work.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-md bg-[#00d4ff]/12 px-2 py-1 text-xs font-bold text-[#86eaff]">{work.type}</span>
                  <BriefcaseBusiness className="h-5 w-5 text-white/40" />
                </div>
                <h3 className="mt-6 text-xl font-black">{work.name}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{work.text}</p>
                <p className="mt-5 border-t border-white/10 pt-4 font-mono text-xs text-white/42">{work.stack}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/10 bg-[#101316] p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-sm font-bold uppercase text-[#00d4ff]">FAQ</p>
                <h2 className="mt-3 text-3xl font-black">คำถามก่อนเริ่มงาน</h2>
              </div>
              <div className="grid gap-2">
                {faqs.map((faq) => (
                  <div key={faq} className="rounded-lg border border-white/10 bg-black/18 px-4 py-4 text-sm font-semibold text-white/76">
                    {faq}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#ff6b35] text-[#11161a]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-black uppercase">Ready for scope</p>
              <h2 className="mt-1 text-3xl font-black">เริ่มประเมินใบเสนอราคาแรกของคุณ</h2>
            </div>
            <a href="#quote" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#11161a] px-5 text-sm font-black text-white transition hover:bg-black">
              เริ่ม Quote Builder
              <Rocket className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
