import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';
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
}

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
  const [submitting, setSubmitting] = useState(false);

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

  const openAddModal = () => {
    setEditingWork(null);
    setName('');
    setType('Business Ops');
    setIndustry('Enterprise');
    setStack('React · Prisma · PostgreSQL · Tailwind');
    setTagsInput('React, Prisma, PostgreSQL');
    setText('');
    setFeatured(false);
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
