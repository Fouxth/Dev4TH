import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Github,
  ExternalLink,
  Code,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface PublicWork {
  id: string;
  name: string;
  type: string;
  industry: string;
  stack: string;
  tags: string[];
  text: string;
  featured: boolean;
  githubUrl?: string;
}

const generateProjectDescription = (repoName: string, analysis: { language: string; frameworks: string[]; databases: string[] } | null) => {
  if (!analysis) return '';
  const name = repoName || '';
  const lang = analysis.language || 'TypeScript';
  const fws = analysis.frameworks || [];
  const dbs = analysis.databases || [];
  
  // Try to determine project category from name
  let category = 'ระบบเว็บแอปพลิเคชันและซอฟต์แวร์';
  const lowerName = name.toLowerCase();
  if (lowerName.includes('pos') || lowerName.includes('retail') || lowerName.includes('shop') || lowerName.includes('store') || lowerName.includes('market') || lowerName.includes('commerce') || lowerName.includes('sales')) {
    category = 'ระบบจัดการหน้าร้านและคลังสินค้า (POS / Retail Management)';
  } else if (lowerName.includes('booking') || lowerName.includes('queue') || lowerName.includes('reserve') || lowerName.includes('calendar') || lowerName.includes('appointment')) {
    category = 'ระบบจองคิวและลงทะเบียนออนไลน์ (Booking & Reservation)';
  } else if (lowerName.includes('dashboard') || lowerName.includes('admin') || lowerName.includes('portal') || lowerName.includes('workspace') || lowerName.includes('crm') || lowerName.includes('erp') || lowerName.includes('todo') || lowerName.includes('task')) {
    category = 'ระบบบริหารจัดการหลังบ้านและแดชบอร์ดควบคุม (Admin Dashboard Workspace)';
  } else if (lowerName.includes('chat') || lowerName.includes('line') || lowerName.includes('bot') || lowerName.includes('oa') || lowerName.includes('messenger')) {
    category = 'ระบบบูรณาการ LINE OA / LINE LIFF และแอปพลิเคชันแชตอัจฉริยะ';
  } else if (lowerName.includes('auth') || lowerName.includes('jwt') || lowerName.includes('security') || lowerName.includes('login')) {
    category = 'ระบบล็อกอิน จัดการสิทธิ์การใช้งาน (Authentication & Authorization Guard)';
  } else if (lowerName.includes('invoice') || lowerName.includes('bill') || lowerName.includes('finance') || lowerName.includes('pay') || lowerName.includes('money')) {
    category = 'ระบบจัดการใบเสร็จ ใบเสนอราคา และติดตามสถานะการชำระเงิน';
  }

  // Categorize frameworks into frontend vs backend
  const frontends = fws.filter(f => ['React.js', 'Next.js', 'Vue.js', 'Vite', 'Nuxt.js', 'Flutter', 'Tailwind'].includes(f));
  const backends = fws.filter(f => ['Express.js', 'NestJS', 'Fastify', 'Koa.js', 'Go', 'Python', 'FastAPI', 'Django', 'Flask', 'Spring Boot'].includes(f));
  
  let stackDetails = `พัฒนาขึ้นโดยใช้ภาษาหลักคือ ${lang}`;
  
  if (frontends.length > 0) {
    stackDetails += ` ร่วมกับเฟรมเวิร์กส่วนติดต่อผู้ใช้งานอย่าง ${frontends.join(' และ ')}`;
  }
  if (backends.length > 0) {
    stackDetails += ` เสริมด้วยสถาปัตยกรรม API หลังบ้านที่พัฒนาด้วย ${backends.join(', ')}`;
  }
  
  let dbDetails = '';
  if (dbs.length > 0) {
    dbDetails = `สำหรับการเก็บข้อมูลและจัดการข้อมูลแบบมีโครงสร้าง ระบบได้เชื่อมโยงกับฐานข้อมูล ${dbs.join(', ')} ในการทำงาน`;
  } else {
    dbDetails = `เน้นโครงสร้างสถาปัตยกรรมที่ยืดหยุ่น ปรับแต่งง่าย และรองรับการสเกลใช้งานในอนาคต`;
  }
  
  return `${category} ที่ออกแบบมาอย่างครบครัน ${stackDetails} ${dbDetails}`;
};

export function PublicWorksPage() {
  const [works, setWorks] = useState<PublicWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingWork, setEditingWork] = useState<PublicWork | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [stack, setStack] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [text, setText] = useState('');
  const [featured, setFeatured] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // GitHub integration states
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [selectedRepoName, setSelectedRepoName] = useState('');
  const [analyzingRepo, setAnalyzingRepo] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    language: string;
    frameworks: string[];
    databases: string[];
    suggestedStack: string;
    suggestedTags: string[];
  } | null>(null);

  const fetchWorks = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/public-works', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลผลงานไม่สำเร็จ');
      setWorks(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  // Fetch GitHub repos for admin configuration dropdown
  useEffect(() => {
    const fetchGithubRepos = async () => {
      try {
        const res = await fetch('https://api.github.com/users/Fouxth/repos?sort=updated&per_page=100');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setGithubRepos(data.filter(r => !r.fork));
          }
        }
      } catch (err) {
        console.error('Failed to load GitHub repos in admin:', err);
      }
    };
    fetchGithubRepos();
  }, []);

  const handleAnalyzeRepo = async (repoName: string) => {
    setSelectedRepoName(repoName);
    if (!repoName) {
      setAnalysisResult(null);
      return;
    }
    const repo = githubRepos.find(r => r.name === repoName);
    if (!repo) return;

    setAnalyzingRepo(true);
    setAnalysisResult(null);
    try {
      const defaultBranch = repo.default_branch || 'main';
      const pkgUrls = [
        `https://raw.githubusercontent.com/Fouxth/${repoName}/${defaultBranch}/package.json`,
        `https://raw.githubusercontent.com/Fouxth/${repoName}/${defaultBranch}/frontend/package.json`,
        `https://raw.githubusercontent.com/Fouxth/${repoName}/${defaultBranch}/backend/package.json`,
        `https://raw.githubusercontent.com/Fouxth/${repoName}/${defaultBranch}/webpage/package.json`
      ];

      let deps: Record<string, string> = {};

      for (const url of pkgUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const pkg = await response.json();
            deps = { ...deps, ...pkg.dependencies, ...pkg.devDependencies };
          }
        } catch (e) {
          // Ignore individual fetch/parsing failures
        }
      }
      
      let frameworks: string[] = [];
      let databases: string[] = [];
      
      if (Object.keys(deps).length > 0) {
        // Analyze Frontend
        if (deps['next']) frameworks.push('Next.js');
        else if (deps['react']) frameworks.push('React.js');
        else if (deps['vue']) frameworks.push('Vue.js');
        else if (deps['nuxt']) frameworks.push('Nuxt.js');
        else if (deps['svelte']) frameworks.push('Svelte');

        if (deps['tailwindcss'] || deps['@tailwindcss/vite']) {
          frameworks.push('Tailwind CSS');
        }

        // Analyze Backend
        if (deps['express']) frameworks.push('Express.js');
        else if (deps['@nestjs/core']) frameworks.push('NestJS');
        else if (deps['fastify']) frameworks.push('Fastify');
        else if (deps['koa']) frameworks.push('Koa.js');
        
        // Analyze DB/ORM
        if (deps['@prisma/client']) {
          databases.push('Prisma ORM');
          databases.push('PostgreSQL');
        } else if (deps['mongoose']) {
          databases.push('Mongoose');
          databases.push('MongoDB');
        } else if (deps['pg']) {
          databases.push('PostgreSQL');
        } else if (deps['mysql2'] || deps['mysql']) {
          databases.push('MySQL');
        } else if (deps['sequelize']) {
          databases.push('Sequelize');
        } else if (deps['typeorm']) {
          databases.push('TypeORM');
        } else if (deps['sqlite3']) {
          databases.push('SQLite');
        }
      }

      const primaryLang = repo.language || 'Unknown';
      const allStackList = [...frameworks, ...databases];
      if (allStackList.length === 0 && primaryLang !== 'Unknown') {
        allStackList.push(primaryLang);
      }
      
      const suggestedStack = allStackList.join(' · ');
      const suggestedTags = allStackList;

      const newAnalysis = {
        language: primaryLang,
        frameworks,
        databases,
        suggestedStack,
        suggestedTags
      };

      setAnalysisResult(newAnalysis);

      // Autofill values immediately
      setName(repoName);
      setGithubUrl(repo.html_url);
      setStack(suggestedStack);
      setTagsInput(suggestedTags.join(', '));
      
      const generatedDesc = generateProjectDescription(repoName, newAnalysis);
      const finalDesc = repo.description 
        ? `${generatedDesc}\n\n(รายละเอียดเพิ่มเติม: ${repo.description})`
        : generatedDesc;
      setText(finalDesc);

    } catch (err) {
      console.error('Analysis error:', err);
      const fallbackAnalysis = {
        language: repo.language || 'JavaScript',
        frameworks: [],
        databases: [],
        suggestedStack: repo.language || 'JavaScript',
        suggestedTags: repo.language ? [repo.language] : []
      };

      setAnalysisResult(fallbackAnalysis);

      // Autofill fallback values immediately
      setName(repoName);
      setGithubUrl(repo.html_url);
      setStack(fallbackAnalysis.suggestedStack);
      setTagsInput(fallbackAnalysis.suggestedTags.join(', '));
      
      const generatedDesc = generateProjectDescription(repoName, fallbackAnalysis);
      const finalDesc = repo.description 
        ? `${generatedDesc}\n\n(รายละเอียดเพิ่มเติม: ${repo.description})`
        : generatedDesc;
      setText(finalDesc);
    } finally {
      setAnalyzingRepo(false);
    }
  };

  const openAddModal = () => {
    setEditingWork(null);
    setName('');
    setType('Business Ops');
    setIndustry('Enterprise');
    setStack('React · Prisma · PostgreSQL · Tailwind');
    setTagsInput('React, Prisma, PostgreSQL');
    setText('');
    setFeatured(false);
    setGithubUrl('');
    setSelectedRepoName('');
    setAnalysisResult(null);
    setShowModal(true);
  };

  const openEditModal = (work: PublicWork) => {
    setEditingWork(work);
    setName(work.name);
    setType(work.type);
    setIndustry(work.industry);
    setStack(work.stack);
    setTagsInput(work.tags.join(', '));
    setText(work.text);
    setFeatured(work.featured);
    setGithubUrl(work.githubUrl || '');
    setSelectedRepoName('');
    setAnalysisResult(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !industry.trim() || !stack.trim() || !text.trim()) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        name,
        type,
        industry,
        stack,
        tags: parsedTags,
        text,
        featured,
        githubUrl: githubUrl || null
      };

      const url = editingWork ? `/api/public-works/${editingWork.id}` : '/api/public-works';
      const method = editingWork ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');

      toast.success(editingWork ? 'แก้ไขข้อมูลผลงานสำเร็จ' : 'เพิ่มผลงานสำเร็จ');
      setShowModal(false);
      fetchWorks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, workName: string) => {
    if (!confirm(`คุณต้องการลบผลงาน "${workName}" ใช่หรือไม่?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/public-works/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบข้อมูลไม่สำเร็จ');

      toast.success('ลบผลงานเรียบร้อยแล้ว');
      fetchWorks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] transition-colors";
  const labelCls = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--orange)] animate-pulse" />
            จัดการผลงานหน้าบ้าน (Portfolio)
          </h2>
          <p className="text-gray-400">จัดการข้อมูลและเทคโนโลยีของผลงานซอฟต์แวร์ที่นำเสนอในหน้าแลนดิ้งเพจหลัก</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          เพิ่มผลงานใหม่
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-[var(--orange)] animate-spin" />
          <p className="text-gray-400">กำลังโหลดรายการผลงาน...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchWorks} className="underline font-medium ml-auto">ลองใหม่</button>
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-20 bg-white/3 border border-white/5 rounded-2xl">
          <p className="text-gray-400 mb-2">ยังไม่มีข้อมูลผลงานในระบบ</p>
          <button onClick={openAddModal} className="text-[var(--orange)] hover:underline font-medium">
            สร้างผลงานชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <div
              key={work.id}
              className="glass p-5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-[var(--orange)]/30 hover:shadow-[0_0_20px_rgba(255,107,53,0.1)] transition-all group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[var(--orange)]/10 text-[var(--orange)] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border border-[var(--orange)]/25">
                    {work.industry}
                  </span>
                  {work.featured && (
                    <span className="bg-[#2196f3]/10 text-[#2196f3] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#2196f3]/20">
                      ★ แนะนำ
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white group-hover:text-[var(--orange)] transition-colors mb-1.5 font-sans">
                  {work.name}
                </h3>
                
                <div className="text-xs text-[var(--neon-cyan)] font-medium mb-3">
                  {work.type}
                </div>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4 leading-relaxed font-sans">
                  {work.text}
                </p>

                {/* Tech & Tags */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tech Stack</div>
                    <div className="text-xs text-white/80 font-mono truncate bg-white/5 px-2.5 py-1 rounded border border-white/5">
                      {work.stack}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {work.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {work.githubUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2 bg-white/5 px-2.5 py-1.5 rounded border border-white/5">
                      <Github className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span className="truncate flex-1">{work.githubUrl.replace('https://github.com/', '')}</span>
                      <a href={work.githubUrl} target="_blank" rel="noreferrer" className="text-[var(--orange)] hover:underline ml-1">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                <button
                  onClick={() => openEditModal(work)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg transition-colors border border-white/5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(work.id, work.name)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20 hover:border-red-500"
                  title="ลบผลงาน"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">
                {editingWork ? 'แก้ไขข้อมูลผลงาน' : 'เพิ่มผลงานใหม่'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              
              {/* GitHub Integration Section */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-[var(--orange)]" />
                    <span className="text-sm font-bold text-white">เชื่อมต่อกับ GitHub Repository</span>
                  </div>
                  {analyzingRepo && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin text-[var(--orange)]" />
                      กำลังวิเคราะห์โค้ด...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">เลือก Repository เพื่อดึงข้อมูลอัตโนมัติ</label>
                    <select
                      value={selectedRepoName}
                      onChange={(e) => handleAnalyzeRepo(e.target.value)}
                      className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[var(--orange)]"
                    >
                      <option value="">-- ไม่เชื่อมโยงหรือเลือกดึงข้อมูล --</option>
                      {githubRepos.map((repo) => (
                        <option key={repo.id} value={repo.name}>
                          {repo.name} {repo.language ? `(${repo.language})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">ลิงก์ GitHub Repository (githubUrl)</label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className={inputCls}
                      placeholder="เช่น https://github.com/Fouxth/my-repo"
                    />
                  </div>
                </div>

                {/* Analysis Display */}
                {analysisResult && (
                  <div className="bg-white/5 border border-[var(--orange)]/30 rounded-xl p-3 space-y-2 animate-fade-in">
                    <h4 className="text-xs font-bold text-[var(--orange)] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" />
                      ผลการวิเคราะห์ Repository อัตโนมัติ (จาก package.json)
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-300">
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <span className="block text-gray-500 font-bold uppercase tracking-wider mb-0.5">ภาษาหลัก</span>
                        <span className="font-semibold text-white">{analysisResult.language}</span>
                      </div>
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <span className="block text-gray-500 font-bold uppercase tracking-wider mb-0.5">เฟรมเวิร์ก</span>
                        <span className="font-semibold text-white">
                          {analysisResult.frameworks.length > 0 ? analysisResult.frameworks.join(', ') : 'ไม่พบเฟรมเวิร์กหลัก'}
                        </span>
                      </div>
                      <div className="bg-black/20 p-2 rounded border border-white/5">
                        <span className="block text-gray-500 font-bold uppercase tracking-wider mb-0.5">การเก็บข้อมูล (DB)</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <Database className="w-3 h-3 text-[var(--orange)]" />
                          {analysisResult.databases.length > 0 ? analysisResult.databases.join(', ') : 'ไม่พบไฟล์เชื่อมฐานข้อมูล'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-[11px] text-gray-400">
                        <span className="font-bold text-gray-300 font-sans">Stack แนะนำ:</span> <span className="font-mono text-white">{analysisResult.suggestedStack || 'ไม่มี'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const repo = githubRepos.find(r => r.name === selectedRepoName);
                          if (repo) {
                            setName(repo.name);
                            setGithubUrl(repo.html_url);
                            if (analysisResult.suggestedStack) {
                              setStack(analysisResult.suggestedStack);
                            }
                            if (analysisResult.suggestedTags) {
                              setTagsInput(analysisResult.suggestedTags.join(', '));
                            }
                            const generatedDesc = generateProjectDescription(repo.name, analysisResult);
                            const finalDesc = repo.description 
                              ? `${generatedDesc}\n\n(รายละเอียดเพิ่มเติม: ${repo.description})`
                              : generatedDesc;
                            setText(finalDesc);
                            toast.success('คัดลอกข้อมูลลงฟอร์มเรียบร้อยแล้ว!');
                          }
                        }}
                        className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white text-xs font-bold px-3 py-1 rounded transition-colors"
                      >
                        คัดลอกข้อมูลลงฟอร์มอัตโนมัติ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>ชื่อผลงาน *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="เช่น Quotation Workspace"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>หมวดหมู่หลัก (Type) *</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={inputCls}
                    placeholder="เช่น Business Ops, SaaS / Productivity"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>ประเภทธุรกิจ / อุตสาหกรรม (Industry) *</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={inputCls}
                    placeholder="เช่น Enterprise, SaaS, Commerce, Tourism"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Featured (แนะนำเป็นพิเศษ)</label>
                  <div className="flex items-center h-10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--orange)]"></div>
                      <span className="ml-3 text-sm text-gray-300">ปักหมุดแนะนำ</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>เทคโนโลยีทั้งหมด (Stack String) *</label>
                <input
                  type="text"
                  value={stack}
                  onChange={(e) => setStack(e.target.value)}
                  className={inputCls}
                  placeholder="เช่น React · Prisma · PostgreSQL · Tailwind"
                  required
                />
              </div>

              <div>
                <label className={labelCls}>แท็กคีย์เวิร์ด (Tags - แยกด้วยเครื่องหมายจุลภาค , )</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={inputCls}
                  placeholder="เช่น React, Prisma, PostgreSQL"
                />
                <p className="text-[11px] text-gray-500 mt-1 font-sans">คีย์เวิร์ดสำหรับใช้ในการพิมพ์เพื่อกรองหาผลงานของลูกค้า</p>
              </div>

              <div>
                <label className={labelCls}>คำอธิบาย / รายละเอียดผลงาน *</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="รายละเอียดสั้นๆ เกี่ยวกับฟังก์ชันเด่นของระบบ"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white font-medium shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึกข้อมูล
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
