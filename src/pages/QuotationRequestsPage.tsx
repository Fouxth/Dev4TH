import { useEffect, useMemo, useState, useRef } from 'react';
import { 
  CalendarClock, Mail, MessageCircle, Phone, RefreshCw, Search, 
  FileText, Coins, Settings2, Plus, Edit3, Trash2, ArrowLeft, 
  Download, Printer, Send, CheckCircle, AlertCircle, ZoomIn, ZoomOut
} from 'lucide-react';
import type { QuotationRequest } from '@/types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

// Types definitions
interface DocItem {
  id: string;
  desc: string;
  qty: number;
  rate: number;
}

interface Quotation {
  id: string;
  number: string;
  client: string;
  email: string;
  phone?: string;
  addr?: string;
  project?: string;
  issue: string;
  validUntil: string;
  items: DocItem[];
  discount: number;
  taxOn: boolean;
  vat: number;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total: number;
  requestId?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  number: string;
  client: string;
  email: string;
  phone?: string;
  addr?: string;
  project?: string;
  issue: string;
  dueDate: string;
  items: DocItem[];
  discount: number;
  taxOn: boolean;
  vat: number;
  notes?: string;
  status: 'unpaid' | 'paid' | 'overdue';
  total: number;
  quoteId?: string;
  createdAt: string;
}

interface SystemSetting {
  name: string;
  tagline: string;
  website: string;
  email: string;
  phone: string;
  addr: string;
  bank: string;
  accNum: string;
  accName: string;
  currency: string;
  vat: number;
  validity: number;
  dueDays: number;
  terms: string;
  lineId?: string;
  lineQrUrl?: string;
  serviceArea?: string;
  responseSla?: string;
}

const statusLabels: Record<QuotationRequest['status'], string> = {
  new: 'ใหม่',
  reviewing: 'กำลังดูรายละเอียด',
  quoted: 'ออกใบเสนอราคาแล้ว',
  closed: 'ปิดรายการ',
};

const statusClasses: Record<QuotationRequest['status'], string> = {
  new: 'border-[#ff6b35]/40 bg-[#ff6b35]/12 text-[#ffb199]',
  reviewing: 'border-[#00d4ff]/40 bg-[#00d4ff]/12 text-[#86eaff]',
  quoted: 'border-green-500/40 bg-green-500/12 text-green-300',
  closed: 'border-white/15 bg-white/[0.04] text-white/50',
};

function formatDate(value: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function QuotationRequestsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'quotations' | 'invoices' | 'settings'>('requests');
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SystemSetting>({
    name: 'Dev4TH ดีไซน์ สตูดิโอ',
    tagline: 'บริการออกแบบมืออาชีพ',
    website: 'https://devath.io',
    email: 'hello@devath.io',
    phone: '02-xxx-xxxx',
    addr: 'กรุงเทพมหานคร',
    bank: 'ธนาคารกสิกรไทย',
    accNum: '',
    accName: '',
    currency: 'THB',
    vat: 7,
    validity: 30,
    dueDays: 14,
    terms: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  
  // Zoom scaling for PDF Preview pane
  const [previewScale, setPreviewScale] = useState(0.85);

  // Custom alert/confirm popup state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  const showAlert = (message: string, title = 'แจ้งเตือน') => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        type: 'alert',
        title,
        message,
        resolve,
      });
    });
  };

  const showConfirm = (message: string, title = 'ยืนยันการทำรายการ') => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        resolve,
      });
    });
  };

  // Editor states
  const [editingDoc, setEditingDoc] = useState<{
    mode: 'quote' | 'invoice';
    id?: string;
    client: string;
    email: string;
    phone: string;
    addr: string;
    project: string;
    issue: string;
    date2: string; // validUntil for quote, dueDate for invoice
    items: DocItem[];
    discount: number;
    taxOn: boolean;
    vat: number;
    notes: string;
    number: string;
    requestId?: string;
    quoteId?: string;
  } | null>(null);

  const token = localStorage.getItem('auth_token');
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch Requests
  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/quotation-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'โหลดคำขอใบเสนอราคาไม่สำเร็จ');
      setRequests(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดคำขอใบเสนอราคาไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Quotations
  const loadQuotations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/quotations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'โหลดใบเสนอราคาไม่สำเร็จ');
      setQuotations(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดใบเสนอราคาไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Invoices
  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/invoices', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'โหลดใบแจ้งหนี้ไม่สำเร็จ');
      setInvoices(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดใบแจ้งหนี้ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Settings
  const loadSettings = async () => {
    setError('');
    try {
      const response = await fetch('/api/system-settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'โหลดการตั้งค่าเอกสารไม่สำเร็จ');
      setSettings(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดการตั้งค่าเอกสารไม่สำเร็จ');
    }
  };

  // Auto-scale the A4 preview on window resizing to fit mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        const padding = window.innerWidth < 640 ? 40 : 80;
        const optimalScale = Math.max(0.35, Math.min(1.2, (window.innerWidth - padding) / 794));
        setPreviewScale(optimalScale);
      } else {
        setPreviewScale(0.8);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Load
  useEffect(() => {
    loadRequests();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch next document number if editor is open and number is empty
  useEffect(() => {
    if (editingDoc && !editingDoc.number) {
      fetchNextNumber(editingDoc.mode).then(num => {
        if (num) {
          setEditingDoc(prev => {
            if (prev && !prev.number && prev.mode === editingDoc.mode) {
              return { ...prev, number: num };
            }
            return prev;
          });
        }
      });
    }
  }, [editingDoc?.id, editingDoc?.mode, editingDoc?.number]);

  // Handle tab switching
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearch('');
    setError('');
    setSuccessMsg('');
    setEditingDoc(null);

    if (tab === 'requests') loadRequests();
    if (tab === 'quotations') loadQuotations();
    if (tab === 'invoices') loadInvoices();
    if (tab === 'settings') loadSettings();
  };

  // Filter requests based on search
  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => [
      r.fullName, r.company, r.email, r.phone, r.systemType, r.scopeNotes
    ].some((v) => v?.toLowerCase().includes(q)));
  }, [requests, search]);

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter((doc) => [
      doc.number, doc.client, doc.project, doc.email
    ].some((v) => v?.toLowerCase().includes(q)));
  }, [quotations, search]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((doc) => [
      doc.number, doc.client, doc.project, doc.email
    ].some((v) => v?.toLowerCase().includes(q)));
  }, [invoices, search]);

  // Update Quotation Request Status
  const updateRequestStatus = async (id: string, status: QuotationRequest['status']) => {
    try {
      const response = await fetch(`/api/quotation-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'อัปเดตสถานะไม่สำเร็จ');
      setRequests((current) => current.map((item) => item.id === id ? payload : item));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id: string) => {
    const confirmed = await showConfirm('ยืนยันที่จะลบใบเสนอราคานี้?', 'ยืนยันลบเอกสาร');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'ไม่สามารถลบใบเสนอราคาได้');
      }
      setQuotations((current) => current.filter((item) => item.id !== id));
      showSuccess('ลบใบเสนอราคาเรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    const confirmed = await showConfirm('ยืนยันที่จะลบใบแจ้งหนี้นี้?', 'ยืนยันลบเอกสาร');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'ไม่สามารถลบใบแจ้งหนี้ได้');
      }
      setInvoices((current) => current.filter((item) => item.id !== id));
      showSuccess('ลบใบแจ้งหนี้เรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helper messages helper
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
      setSettings(payload);
      showSuccess('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick helper to calculate document values
  const calculations = useMemo(() => {
    if (!editingDoc) return { subtotal: 0, discountVal: 0, vatVal: 0, total: 0 };
    const subtotal = editingDoc.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const discountVal = Number(editingDoc.discount) || 0;
    const baseAmount = Math.max(0, subtotal - discountVal);
    const vatVal = editingDoc.taxOn ? (baseAmount * (editingDoc.vat / 100)) : 0;
    const total = baseAmount + vatVal;
    return { subtotal, discountVal, vatVal, total };
  }, [editingDoc]);

  // Helper to fetch the next sequential document number
  const fetchNextNumber = async (mode: 'quote' | 'invoice'): Promise<string> => {
    try {
      const endpoint = mode === 'quote' ? 'quotations' : 'invoices';
      const response = await fetch(`/api/${endpoint}/next-number`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      return data.number || '';
    } catch (err) {
      console.error('Failed to fetch next document number:', err);
      return '';
    }
  };

  // Convert Quotation Request into editor
  const handleConvertRequest = (req: QuotationRequest) => {
    const today = new Date().toISOString().split('T')[0];
    const validityDate = new Date(Date.now() + settings.validity * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setEditingDoc({
      mode: 'quote',
      client: req.fullName,
      email: req.email,
      phone: req.phone,
      addr: req.company || '',
      project: req.systemType,
      issue: today,
      date2: validityDate,
      items: [{ id: '1', desc: `พัฒนาระบบ ${req.systemType}`, qty: 1, rate: 0 }],
      discount: 0,
      taxOn: false,
      vat: settings.vat,
      notes: settings.terms || '',
      number: '',
      requestId: req.id,
    });
  };

  // Open empty editor
  const handleCreateNew = (mode: 'quote' | 'invoice') => {
    const today = new Date().toISOString().split('T')[0];
    const daysOffset = mode === 'quote' ? settings.validity : settings.dueDays;
    const date2Value = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setEditingDoc({
      mode,
      client: '',
      email: '',
      phone: '',
      addr: '',
      project: '',
      issue: today,
      date2: date2Value,
      items: [{ id: '1', desc: '', qty: 1, rate: 0 }],
      discount: 0,
      taxOn: false,
      vat: settings.vat,
      notes: settings.terms || '',
      number: '',
    });
  };

  // Convert Quote directly to Invoice
  const handleConvertQuoteToInvoice = (quote: Quotation) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDateValue = new Date(Date.now() + settings.dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setEditingDoc({
      mode: 'invoice',
      client: quote.client,
      email: quote.email,
      phone: quote.phone || '',
      addr: quote.addr || '',
      project: quote.project || '',
      issue: today,
      date2: dueDateValue,
      items: quote.items.map((it, idx) => ({ ...it, id: String(idx + 1) })),
      discount: quote.discount,
      taxOn: quote.taxOn,
      vat: quote.vat,
      notes: quote.notes || '',
      number: '',
      quoteId: quote.id,
    });
  };

  // Edit existing Quote
  const handleEditQuotation = (quote: Quotation) => {
    setEditingDoc({
      mode: 'quote',
      id: quote.id,
      client: quote.client,
      email: quote.email,
      phone: quote.phone || '',
      addr: quote.addr || '',
      project: quote.project || '',
      issue: new Date(quote.issue).toISOString().split('T')[0],
      date2: new Date(quote.validUntil).toISOString().split('T')[0],
      items: quote.items.map((it, idx) => ({ ...it, id: String(idx + 1) })),
      discount: quote.discount,
      taxOn: quote.taxOn,
      vat: quote.vat,
      notes: quote.notes || '',
      number: quote.number,
      requestId: quote.requestId || undefined,
    });
  };

  // Edit existing Invoice
  const handleEditInvoice = (inv: Invoice) => {
    setEditingDoc({
      mode: 'invoice',
      id: inv.id,
      client: inv.client,
      email: inv.email,
      phone: inv.phone || '',
      addr: inv.addr || '',
      project: inv.project || '',
      issue: new Date(inv.issue).toISOString().split('T')[0],
      date2: new Date(inv.dueDate).toISOString().split('T')[0],
      items: inv.items.map((it, idx) => ({ ...it, id: String(idx + 1) })),
      discount: inv.discount,
      taxOn: inv.taxOn,
      vat: inv.vat,
      notes: inv.notes || '',
      number: inv.number,
      quoteId: inv.quoteId || undefined,
    });
  };

  // Save changes from editor
  const handleSaveDoc = async (silentIdReturn = false) => {
    if (!editingDoc) return null;
    if (!editingDoc.client || !editingDoc.email || editingDoc.items.length === 0) {
      await showAlert('กรุณากรอกข้อมูลลูกค้าและเพิ่มรายการอย่างน้อย 1 รายการ', 'ข้อมูลไม่ครบถ้วน');
      return null;
    }

    setSubmitting(true);
    setError('');

    const isQuote = editingDoc.mode === 'quote';
    const endpoint = isQuote ? '/api/quotations' : '/api/invoices';
    const isEdit = !!editingDoc.id;
    const url = isEdit ? `${endpoint}/${editingDoc.id}` : endpoint;
    const method = isEdit ? 'PATCH' : 'POST';

    const bodyData = {
      number: editingDoc.number || undefined,
      client: editingDoc.client,
      email: editingDoc.email,
      phone: editingDoc.phone,
      addr: editingDoc.addr,
      project: editingDoc.project,
      issue: editingDoc.issue,
      [isQuote ? 'validUntil' : 'dueDate']: editingDoc.date2,
      items: editingDoc.items,
      discount: editingDoc.discount,
      taxOn: editingDoc.taxOn,
      vat: editingDoc.vat,
      notes: editingDoc.notes,
      total: calculations.total,
      requestId: editingDoc.requestId,
      quoteId: editingDoc.quoteId,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'บันทึกเอกสารไม่สำเร็จ');

      if (!silentIdReturn) {
        showSuccess(isEdit ? 'อัปเดตเอกสารเรียบร้อยแล้ว' : 'สร้างเอกสารใหม่เรียบร้อยแล้ว');
        // Switch back to appropriate list
        handleTabChange(isQuote ? 'quotations' : 'invoices');
      }
      return payload; // Return the saved document object
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to generate PDF as DataURI
  const generatePDFObject = async (): Promise<jsPDF | null> => {
    if (!previewRef.current) return null;
    try {
      // Ensure all web fonts are fully loaded before capture
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Small delay to ensure fonts are applied to layout calculations
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const page = previewRef.current;
      const scaleWrapper = page.parentElement;
      
      // Temporarily reset parent scale transform for clean capture
      // (transform creates a containing block that distorts html2canvas output)
      const origTransform = scaleWrapper?.style.transform || '';
      const origWidth = scaleWrapper?.style.width || '';
      const origHeight = scaleWrapper?.style.height || '';
      if (scaleWrapper) {
        scaleWrapper.style.transform = 'none';
        scaleWrapper.style.width = '794px';
        scaleWrapper.style.height = '1123px';
      }

      const canvas = await html2canvas(page, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });
      
      // Restore parent transform after capture
      if (scaleWrapper) {
        scaleWrapper.style.transform = origTransform;
        scaleWrapper.style.width = origWidth;
        scaleWrapper.style.height = origHeight;
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      // Force exactly 1 page: fill full A4 (210×297mm)
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      return pdf;
    } catch (err) {
      console.error('PDF Generation error:', err);
      return null;
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!editingDoc) return;
    setSubmitting(true);
    try {
      const pdf = await generatePDFObject();
      if (pdf) {
        const filename = `${editingDoc.number || 'document'}.pdf`;
        pdf.save(filename);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PDF Print — generates PDF and opens in new tab for clean printing
  const handlePrint = async () => {
    if (!editingDoc) return;
    setSubmitting(true);
    try {
      const pdf = await generatePDFObject();
      if (pdf) {
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl.toString(), '_blank');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!editingDoc) return;

    // 1. If document is new, save it first
    let savedDoc = null;
    if (!editingDoc.id) {
      const confirmed = await showConfirm('ระบบจะเซฟเอกสารร่างนี้ก่อนเริ่มส่งอีเมล ยืนยันเซฟและส่งเลยไหม?', 'บันทึกและส่งอีเมล');
      if (confirmed) {
        savedDoc = await handleSaveDoc(true);
        if (!savedDoc) return; // Save failed
      } else {
        return;
      }
    }

    const docId = editingDoc.id || savedDoc?.id;
    if (!docId) return;

    setSubmitting(true);
    setError('');
    try {
      // 2. Generate PDF Base64 string client side
      const pdf = await generatePDFObject();
      if (!pdf) throw new Error('ไม่สามารถสร้างเอกสาร PDF สำหรับส่งอีเมลได้');
      const base64Data = pdf.output('datauristring');

      // 3. Send email to backend API
      const isQuote = editingDoc.mode === 'quote';
      const response = await fetch(`/api/${isQuote ? 'quotations' : 'invoices'}/${docId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pdf: base64Data }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ส่งอีเมลล้มเหลว');

      showSuccess(`ส่งอีเมลหาลูกค้า (${editingDoc.email}) สำเร็จแล้ว!`);
      handleTabChange(isQuote ? 'quotations' : 'invoices');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add Item in Editor
  const handleAddItem = () => {
    if (!editingDoc) return;
    setEditingDoc({
      ...editingDoc,
      items: [...editingDoc.items, { id: String(Date.now()), desc: '', qty: 1, rate: 0 }],
    });
  };

  // Update Item in Editor
  const handleUpdateItem = (id: string, field: keyof DocItem, value: any) => {
    if (!editingDoc) return;
    setEditingDoc({
      ...editingDoc,
      items: editingDoc.items.map((item) => {
        if (item.id !== id) return item;
        const updatedVal = (field === 'qty' || field === 'rate') ? Number(value) : value;
        return { ...item, [field]: updatedVal };
      }),
    });
  };

  // Remove Item in Editor
  const handleRemoveItem = (id: string) => {
    if (!editingDoc) return;
    setEditingDoc({
      ...editingDoc,
      items: editingDoc.items.filter((item) => item.id !== id),
    });
  };

  // Quick update quote/invoice status in list view
  const updateDocStatus = async (mode: 'quote' | 'invoice', id: string, status: string) => {
    try {
      const response = await fetch(`/api/${mode === 'quote' ? 'quotations' : 'invoices'}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'อัปเดตสถานะไม่สำเร็จ');
      
      if (mode === 'quote') {
        setQuotations(current => current.map(item => item.id === id ? payload : item));
      } else {
        setInvoices(current => current.map(item => item.id === id ? payload : item));
      }
      showSuccess('อัปเดตสถานะเอกสารสำเร็จ');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Print CSS Injector for PDF Preview rendering
  const renderInjectCSS = () => {
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face {
          font-family: 'Sarabun';
          font-weight: 300;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-Light.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-Regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-weight: 500;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-Medium.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-weight: 600;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-SemiBold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-weight: 700;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-Bold.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Sarabun';
          font-weight: 800;
          font-style: normal;
          font-display: swap;
          src: url('/fonts/Sarabun-ExtraBold.ttf') format('truetype');
        }
        
        .pdf-a4-page {
          width: 794px;
          height: 1123px;
          background: #ffffff;
          padding: 50px 50px 45px;
          display: flex;
          flex-direction: column;
          font-family: 'Sarabun', sans-serif;
          color: #1f2937;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 30px rgba(0,0,0,0.15);
          box-sizing: border-box;
          text-align: left;
          line-height: 1.5;
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .pdf-a4-page::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(90deg, #ff6b35, #00d4ff);
        }
        
        .pdf-a4-page * {
          box-sizing: border-box;
          font-family: 'Sarabun', sans-serif;
        }
        
        .pdf-a4-page table {
          border-spacing: 0;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #a4Page, #a4Page * {
            visibility: visible !important;
          }
          #a4Page {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            box-shadow: none !important;
            padding: 13.2mm !important;
            margin: 0 !important;
            background: #fff !important;
            box-sizing: border-box !important;
            z-index: 999999 !important;
            transform: none !important;
          }
        }
      `}} />
    );
  };

  return (
    <div className="space-y-6">
      {renderInjectCSS()}

      {/* SUCCESS / ERROR NOTIFICATION */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          {successMsg}
        </div>
      )}

      {/* EDITOR MODE OVERLAY */}
      {editingDoc ? (
        <div className="rounded-xl border border-white/10 bg-[#11161a]/95 p-3 sm:p-6 shadow-2xl">
          {/* Editor Headerbar */}
          <div className="flex flex-col gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
            <button
              onClick={() => handleTabChange(editingDoc.mode === 'quote' ? 'quotations' : 'invoices')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าหลัก
            </button>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 sm:px-3 text-xs font-bold text-white hover:bg-white/10"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">พิมพ์</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">ดาวน์โหลด PDF</span><span className="sm:hidden">PDF</span>
              </button>
              <button
                onClick={handleSendEmail}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#ff6b35]/20 bg-[#ff6b35]/10 px-3 text-xs font-bold text-[#ff6b35] hover:bg-[#ff6b35]/20 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">ส่งอีเมลหาลูกค้า</span><span className="sm:hidden">ส่ง</span>
              </button>
              <button
                onClick={() => handleSaveDoc(false)}
                disabled={submitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#ff6b35] px-4 text-xs font-black text-white hover:bg-[#ff7d4f] disabled:opacity-50"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_690px]">
            {/* LEFT SIDE: CONTROLS FORM */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  แก้ไขข้อมูล {editingDoc.mode === 'quote' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-white/50">
                    เลขที่เอกสาร (ระบบรันเลขอัตโนมัติ)
                    <input
                      type="text"
                      readOnly
                      placeholder="ระบบจะรันหมายเลขให้อัตโนมัติ"
                      value={editingDoc.number}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white/60 cursor-not-allowed outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/50">
                    ชื่อโครงการ
                    <input
                      type="text"
                      placeholder="เช่น พัฒนาเว็บไซต์ หรือ แอปพลิเคชัน"
                      value={editingDoc.project}
                      onChange={(e) => setEditingDoc({ ...editingDoc, project: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-white/50">
                    ชื่อลูกค้า
                    <input
                      type="text"
                      placeholder="บริษัท หรือ ชื่อบุคคล"
                      value={editingDoc.client}
                      onChange={(e) => setEditingDoc({ ...editingDoc, client: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/50">
                    อีเมลลูกค้า
                    <input
                      type="email"
                      placeholder="client@email.com"
                      value={editingDoc.email}
                      onChange={(e) => setEditingDoc({ ...editingDoc, email: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-white/50">
                    เบอร์โทรลูกค้า
                    <input
                      type="text"
                      placeholder="08X-XXX-XXXX"
                      value={editingDoc.phone}
                      onChange={(e) => setEditingDoc({ ...editingDoc, phone: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/50">
                    ที่อยู่ลูกค้า
                    <input
                      type="text"
                      placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด"
                      value={editingDoc.addr}
                      onChange={(e) => setEditingDoc({ ...editingDoc, addr: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-white/50">
                    วันที่ออกเอกสาร
                    <input
                      type="date"
                      value={editingDoc.issue}
                      onChange={(e) => setEditingDoc({ ...editingDoc, issue: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/50">
                    {editingDoc.mode === 'quote' ? 'ยืนยันราคาถึงวันที่' : 'กำหนดชำระเงินภายในวันที่'}
                    <input
                      type="date"
                      value={editingDoc.date2}
                      onChange={(e) => setEditingDoc({ ...editingDoc, date2: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </label>
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">รายการสิ่งของ / ค่าบริการ</h4>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ff6b35] hover:text-[#ff7d4f]"
                  >
                    <Plus className="h-3 w-3" />
                    เพิ่มรายการ
                  </button>
                </div>

                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {editingDoc.items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-start rounded-lg border border-white/5 bg-white/3 p-3">
                      <span className="mt-2.5 text-xs text-white/30 font-bold w-5">{index + 1}.</span>
                      <div className="grid flex-1 gap-2 grid-cols-12">
                        <input
                          type="text"
                          placeholder="รายละเอียดของสินค้า หรือ บริการ"
                          value={item.desc}
                          onChange={(e) => handleUpdateItem(item.id, 'desc', e.target.value)}
                          className="h-9 rounded border border-white/5 bg-white/[0.03] px-2 text-sm text-white outline-none focus:border-[#ff6b35] col-span-12 sm:col-span-6"
                        />
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                          className="h-9 rounded border border-white/5 bg-white/[0.03] px-2 text-sm text-white outline-none focus:border-[#ff6b35] col-span-4 sm:col-span-2"
                        />
                        <input
                          type="number"
                          placeholder="ราคาต่อหน่วย"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                          className="h-9 rounded border border-white/5 bg-white/[0.03] px-2 text-sm text-white outline-none focus:border-[#ff6b35] col-span-8 sm:col-span-4"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={editingDoc.items.length === 1}
                        className="mt-1.5 rounded p-1 text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal, Discount & Tax setup */}
              <div className="rounded-lg border border-white/5 bg-white/3 p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs text-white/50">
                    ส่วนลดเงินสด (฿)
                    <input
                      type="number"
                      value={editingDoc.discount}
                      onChange={(e) => setEditingDoc({ ...editingDoc, discount: Number(e.target.value) })}
                      className="h-10 rounded border border-white/5 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-white/50">
                    อัตราภาษีมูลค่าเพิ่ม (%)
                    <input
                      type="number"
                      value={editingDoc.vat}
                      onChange={(e) => setEditingDoc({ ...editingDoc, vat: Number(e.target.value) })}
                      disabled={!editingDoc.taxOn}
                      className="h-10 rounded border border-white/5 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-[#ff6b35] disabled:opacity-40"
                    />
                  </label>
                  <div className="flex items-center gap-2 pt-5">
                    <button
                      onClick={() => setEditingDoc({ ...editingDoc, taxOn: !editingDoc.taxOn })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editingDoc.taxOn ? 'bg-[#ff6b35]' : 'bg-white/10'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        editingDoc.taxOn ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="text-sm font-semibold text-white">คิดภาษี VAT 7%</span>
                  </div>
                </div>

                <label className="grid gap-1 text-xs text-white/50">
                  หมายเหตุ (ท้ายเอกสาร)
                  <textarea
                    rows={2}
                    value={editingDoc.notes}
                    onChange={(e) => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                    className="rounded border border-white/5 bg-white/[0.03] p-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                  />
                </label>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE A4 PREVIEW */}
            <div className="flex flex-col items-center">
              {/* Zoom controls for Preview */}
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.05))}
                  className="rounded bg-white/5 p-2 text-white/60 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="flex items-center text-xs font-bold text-white/70">
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  onClick={() => setPreviewScale(Math.min(1.2, previewScale + 0.05))}
                  className="rounded bg-white/5 p-2 text-white/60 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Preview Box Container */}
              <div className="w-full overflow-auto rounded-lg border border-white/10 bg-[#080d11] p-2 sm:p-4 flex justify-center max-h-[850px] custom-scrollbar">
                <div 
                  style={{ 
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    height: `${1123 * previewScale}px`,
                    width: `${794 * previewScale}px`
                  }} 
                  className="transition-transform duration-200"
                >
                  <div id="a4Page" ref={previewRef} className="pdf-a4-page shadow-2xl relative">
                    {/* Header info */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-6 text-left">
                        <div className="flex flex-col gap-0.5">
                          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight m-0">{settings.name}</h1>
                          <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase m-0 leading-tight">{settings.tagline}</p>
                        </div>
                        
                        <table className="mt-4 text-[9.5px] text-gray-500 font-medium border-collapse leading-normal border-none">
                          <tbody>
                            <tr>
                              <td className="pr-2 py-0.5 font-bold text-gray-750 align-top w-[45px]">ที่อยู่:</td>
                              <td className="py-0.5 text-gray-600 align-top">{settings.addr || '—'}</td>
                            </tr>
                            <tr>
                              <td className="pr-2 py-0.5 font-bold text-gray-750 align-top">ติดต่อ:</td>
                              <td className="py-0.5 text-gray-600 align-top">
                                {settings.phone && <span className="mr-3">โทร: {settings.phone}</span>}
                                {settings.email && <span>อีเมล: {settings.email}</span>}
                              </td>
                            </tr>
                            {settings.website && (
                              <tr>
                                <td className="pr-2 py-0.5 font-bold text-gray-750 align-top">เว็บไซต์:</td>
                                <td className="py-0.5 text-gray-600 align-top">{settings.website}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-[#ff6b35] tracking-widest uppercase leading-normal">
                          {editingDoc.mode === 'quote' ? 'QUOTATION' : 'INVOICE'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          {editingDoc.mode === 'quote' ? 'ใบเสนอราคา' : 'ใบแจ้งหนี้'}
                        </div>
                        
                        <table className="mt-4 border-collapse text-[9.5px] font-medium ml-auto">
                          <tbody>
                            <tr>
                              <td className="border border-gray-200 px-3 py-1.5 text-gray-500 text-left bg-gray-50 font-bold">เลขที่เอกสาร:</td>
                              <td className="border border-gray-200 px-3 py-1.5 text-gray-900 font-bold text-right">{editingDoc.number || 'รอสร้างหมายเลข...'}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-3 py-1.5 text-gray-500 text-left bg-gray-50 font-bold">วันที่ออก:</td>
                              <td className="border border-gray-200 px-3 py-1.5 text-gray-900 text-right">{formatDate(editingDoc.issue)}</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-200 px-3 py-1.5 text-gray-500 text-left bg-gray-50 font-bold">
                                {editingDoc.mode === 'quote' ? 'ยืนยันราคาถึง:' : 'กำหนดชำระเงิน:'}
                              </td>
                              <td className="border border-gray-200 px-3 py-1.5 text-red-500 font-bold text-right">{formatDate(editingDoc.date2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="h-[2px] bg-gradient-to-r from-gray-200 to-gray-100 my-4 rounded-full" />

                    {/* Customer Info row */}
                    <div className="flex justify-between items-stretch text-[9.5px] gap-6">
                      <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-left">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">ข้อมูลลูกค้า (CLIENT)</div>
                        <div className="font-extrabold text-gray-800 text-xs mb-1.5">{editingDoc.client || '— ไม่ระบุชื่อลูกค้า —'}</div>
                        
                        <table className="text-[9.5px] text-gray-600 font-medium border-collapse leading-normal border-none">
                          <tbody>
                            {editingDoc.addr && (
                              <tr>
                                <td className="pr-1.5 py-0.5 text-gray-450 font-normal align-top w-[35px]">ที่อยู่:</td>
                                <td className="py-0.5 text-gray-700 align-top">{editingDoc.addr}</td>
                              </tr>
                            )}
                            {editingDoc.phone && (
                              <tr>
                                <td className="pr-1.5 py-0.5 text-gray-455 font-normal align-top">โทร:</td>
                                <td className="py-0.5 text-gray-700 align-top">{editingDoc.phone}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="pr-1.5 py-0.5 text-gray-455 font-normal align-top">อีเมล:</td>
                              <td className="py-0.5 text-gray-700 align-top">
                                <span className="text-[#ff6b35] font-semibold">{editingDoc.email || '—'}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="w-[220px] border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-left flex flex-col justify-between">
                        <div>
                          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">ชื่อโครงการ / วัตถุประสงค์</div>
                          <div className="font-bold text-gray-900 text-xs leading-normal">
                            {editingDoc.project || '— ไม่ระบุชื่อโครงการ —'}
                          </div>
                        </div>
                        {editingDoc.number && (
                          <div className="text-[8px] text-gray-400 mt-2">
                            ID: {editingDoc.number}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="mt-6 flex-1 flex flex-col justify-between">
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="w-full text-left text-[10px] border-collapse" style={{ tableLayout: 'fixed' }}>
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                              <th className="px-3 py-2.5 text-gray-600 font-bold uppercase tracking-wider text-[8px] text-center border-r border-gray-200" style={{ width: '45px' }}>ลำดับ</th>
                              <th className="px-3 py-2.5 text-gray-600 font-bold uppercase tracking-wider text-[8px] border-r border-gray-200">รายละเอียดสินค้า / บริการ</th>
                              <th className="px-3 py-2.5 text-gray-600 font-bold uppercase tracking-wider text-[8px] text-center border-r border-gray-200" style={{ width: '65px' }}>จำนวน</th>
                              <th className="px-3 py-2.5 text-gray-600 font-bold uppercase tracking-wider text-[8px] text-right border-r border-gray-200" style={{ width: '110px' }}>ราคาต่อหน่วย</th>
                              <th className="px-3 py-2.5 text-gray-600 font-bold uppercase tracking-wider text-[8px] text-right" style={{ width: '135px' }}>ยอดรวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editingDoc.items.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-200 last:border-0 odd:bg-white even:bg-gray-50/50">
                                <td className="px-3 py-2 text-center text-gray-500 font-medium border-r border-gray-200">{idx + 1}</td>
                                <td className="px-3 py-2 text-gray-900 font-semibold border-r border-gray-200 break-words">{item.desc || '— รายละเอียดบริการ —'}</td>
                                <td className="px-3 py-2 text-center text-gray-700 font-medium border-r border-gray-200">{item.qty}</td>
                                <td className="px-3 py-2 text-right text-gray-700 font-medium border-r border-gray-200">฿{item.rate.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                <td className="px-3 py-2 text-right text-gray-900 font-bold">฿{(item.qty * item.rate).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {/* Empty rows to make table look formal and filled */}
                            {editingDoc.items.length < 5 && Array.from({ length: 5 - editingDoc.items.length }).map((_, i) => (
                              <tr key={`empty-${i}`} className="border-b border-gray-200 last:border-0 odd:bg-white even:bg-gray-50/50 h-[28px]">
                                <td className="border-r border-gray-200"></td>
                                <td className="border-r border-gray-200"></td>
                                <td className="border-r border-gray-200"></td>
                                <td className="border-r border-gray-200"></td>
                                <td></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Block */}
                      <div className="mt-6 flex justify-between items-start gap-6 text-left">
                        {/* Payments / Note info */}
                        <div className="flex-1 space-y-3">
                          {editingDoc.mode === 'invoice' && settings.bank && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ช่องทางการชำระเงิน (PAYMENT DETAILS)</div>
                              <table className="text-[9px] text-gray-750 font-semibold border-collapse leading-normal border-none">
                                <tbody>
                                  <tr>
                                    <td className="pr-1.5 py-0.5 text-gray-400 font-normal w-[70px]">สถาบันการเงิน:</td>
                                    <td className="py-0.5 text-gray-900 font-bold">{settings.bank}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-1.5 py-0.5 text-gray-400 font-normal">เลขที่บัญชี:</td>
                                    <td className="py-0.5 text-gray-900 font-bold">{settings.accNum}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-1.5 py-0.5 text-gray-400 font-normal">ชื่อบัญชี:</td>
                                    <td className="py-0.5 text-gray-900 font-bold">{settings.accName}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {editingDoc.notes && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">หมายเหตุ (NOTES)</div>
                              <p className="text-[8.5px] text-gray-600 leading-relaxed whitespace-pre-wrap font-medium m-0">{editingDoc.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Calculation grid */}
                        <div className="w-[230px] shrink-0 bg-gray-50/50 p-3 border border-gray-200 rounded-lg">
                          <table className="w-full text-[10px] text-gray-500 font-semibold border-none">
                            <tbody>
                              <tr>
                                <td className="text-left py-1 text-gray-500">รวมเป็นเงิน (Subtotal):</td>
                                <td className="text-right py-1 font-bold text-gray-900">
                                  ฿{calculations.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                              {calculations.discountVal > 0 && (
                                <tr>
                                  <td className="text-left py-1 text-red-500">หักส่วนลด (Discount):</td>
                                  <td className="text-right py-1 font-bold text-red-500">
                                    -฿{calculations.discountVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )}
                              {editingDoc.taxOn && (
                                <tr>
                                  <td className="text-left py-1 text-gray-500">ภาษีมูลค่าเพิ่ม (VAT {editingDoc.vat}%):</td>
                                  <td className="text-right py-1 font-bold text-gray-900">
                                    ฿{calculations.vatVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          <div className="mt-2.5 bg-[#1a1e2e] p-2.5 rounded-lg border border-[#1a1e2e]">
                            <table className="w-full text-xs font-bold text-white border-none">
                              <tbody>
                                <tr>
                                  <td className="text-left text-white/90">ยอดเงินสุทธิ (Net Total):</td>
                                  <td className="text-right text-sm font-extrabold text-[#ff6b35]">
                                    ฿{calculations.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signature block */}
                    <div className="mt-8 grid grid-cols-3 gap-4 text-[9.5px]">
                      {/* Stamp section */}
                      <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/30 text-center">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-2">ตราประทับบริษัท (COMPANY STAMP)</div>
                        <div className="my-3 flex items-center justify-center">
                          <div className="w-[100px] h-[45px] border border-dashed border-gray-300 rounded flex items-center justify-center text-[7px] text-gray-300 font-bold bg-white">
                            STAMP HERE
                          </div>
                        </div>
                        <div className="text-[7px] text-gray-400 font-medium leading-none">ใช้เพื่อประทับตราสำคัญของบริษัท</div>
                      </div>

                      {/* Authorized Issuer signature */}
                      <div className="border border-gray-200 rounded-lg p-3.5 bg-white text-center">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-8">ในนาม {settings.name}</div>
                        <div className="w-[130px] border-b border-gray-300 mx-auto" />
                        <div className="font-bold text-gray-800 text-[9px] mt-2 mb-1">ผู้มีอำนาจลงนาม / Authorized Signature</div>
                        <div className="text-[8px] text-gray-400">วันที่ / Date: ...../...../..........</div>
                      </div>

                      {/* Customer acceptance signature */}
                      <div className="border border-gray-200 rounded-lg p-3.5 bg-white text-center">
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-8">ผู้อนุมัติสั่งซื้อ / CLIENT ACCEPTANCE</div>
                        <div className="w-[130px] border-b border-gray-300 mx-auto" />
                        <div className="font-bold text-gray-800 text-[9px] mt-2 mb-1">ผู้อนุมัติสั่งซื้อ / Authorized Buyer</div>
                        <div className="text-[8px] text-gray-400">วันที่ / Date: ...../...../..........</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* TABS SELECTOR */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-white/5 pb-2">
            {[
              { id: 'requests', label: 'คำขอรับบริการ', count: requests.length },
              { id: 'quotations', label: 'ใบเสนอราคา', count: quotations.length },
              { id: 'invoices', label: 'ใบแจ้งหนี้', count: invoices.length },
              { id: 'settings', label: 'ตั้งค่าระบบเอกสาร', icon: Settings2 },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-[rgba(255,107,53,0.15)] text-[#ff6b35] border border-[#ff6b35]/25' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-[#ff6b35] text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* LIST TOOLBAR */}
          {activeTab !== 'settings' && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-[#ff6b35]"
                  placeholder={
                    activeTab === 'requests' 
                      ? 'ค้นหาชื่อ บริษัท อีเมล ระบบที่สนใจ หรือรายละเอียด...' 
                      : 'ค้นหาเลขที่เอกสาร ชื่อลูกค้า ชื่อโครงการ...'
                  }
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (activeTab === 'requests') loadRequests();
                    if (activeTab === 'quotations') loadQuotations();
                    if (activeTab === 'invoices') loadInvoices();
                  }}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  รีเฟรช
                </button>

                {activeTab !== 'requests' && (
                  <button
                    onClick={() => handleCreateNew(activeTab === 'quotations' ? 'quote' : 'invoice')}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ff6b35] px-4 text-sm font-black text-white hover:bg-[#ff7d4f]"
                  >
                    <Plus className="h-4 w-4" />
                    {activeTab === 'quotations' ? 'สร้างใบเสนอราคา' : 'สร้างใบแจ้งหนี้'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: REQUESTS LIST */}
          {activeTab === 'requests' && (
            loading ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                กำลังโหลดคำขอใบเสนอราคา...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                ยังไม่มีรายการคำขอใบเสนอราคาเข้ามาใหม่
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <article key={request.id} className="rounded-xl border border-white/10 bg-[#11161a]/92 p-5 shadow-xl transition hover:border-[#ff6b35]/20">
                    <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-white">{request.fullName}</h3>
                          <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusClasses[request.status]}`}>
                            {statusLabels[request.status]}
                          </span>
                          {request.marketingConsent && (
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-bold text-cyan-300">
                              รับข่าวสารได้
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-white/44">{request.company || 'ไม่ระบุชื่อบริษัท'}</p>

                        <div className="mt-4 grid gap-2 text-sm text-white/60 sm:grid-cols-3">
                          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-[#ff8c42]" />{request.email}</span>
                          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#ff8c42]" />{request.phone}</span>
                          <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#ff8c42]" />{formatDate(request.createdAt)}</span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                            <p className="text-xs font-bold uppercase text-white/30">ระบบงานที่ต้องการพัฒนา</p>
                            <p className="mt-1 font-semibold text-white">{request.systemType}</p>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                            <p className="text-xs font-bold uppercase text-white/30">งบประมาณการจัดสร้าง</p>
                            <p className="mt-1 font-semibold text-white">{request.budgetRange || 'ไม่ระบุ'}</p>
                          </div>
                        </div>

                        {request.scopeNotes && (
                          <p className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3 text-sm leading-relaxed text-white/70">
                            {request.scopeNotes}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="grid gap-1">
                          <span className="text-xs font-bold uppercase text-white/30">ปรับเปลี่ยนสถานะ</span>
                          <select
                            value={request.status}
                            onChange={(e) => updateRequestStatus(request.id, e.target.value as QuotationRequest['status'])}
                            className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white outline-none focus:border-[#ff6b35] [&>option]:bg-[#11161a]"
                          >
                            <option value="new">ใหม่</option>
                            <option value="reviewing">กำลังดูรายละเอียด</option>
                            <option value="quoted">ออกใบเสนอราคาแล้ว</option>
                            <option value="closed">ปิดรายการ</option>
                          </select>
                        </label>
                        
                        <button
                          onClick={() => handleConvertRequest(request)}
                          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] px-4 text-xs font-black text-white hover:opacity-90"
                        >
                          <FileText className="h-4 w-4" />
                          สร้างใบเสนอราคา
                        </button>

                        <a
                          href={`mailto:${request.email}`}
                          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-white hover:bg-white/10"
                        >
                          <MessageCircle className="h-4 w-4" />
                          ตอบกลับลูกค้า
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}

          {/* TAB CONTENT: QUOTATIONS LIST */}
          {activeTab === 'quotations' && (
            loading ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                กำลังโหลดใบเสนอราคา...
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                ยังไม่มีใบเสนอราคาในระบบ
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-[#11161a]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3 font-bold text-white">เลขที่เอกสาร</th>
                        <th className="px-4 py-3 font-bold text-white">ลูกค้า / บริษัท</th>
                        <th className="px-4 py-3 font-bold text-white">ชื่อโครงการ</th>
                        <th className="px-4 py-3 font-bold text-white">ยอดสุทธิ</th>
                        <th className="px-4 py-3 font-bold text-white">วันที่ออก</th>
                        <th className="px-4 py-3 font-bold text-white text-center">สถานะ</th>
                        <th className="px-4 py-3 font-bold text-white text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotations.map((quote) => (
                        <tr key={quote.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-bold text-white">{quote.number}</td>
                          <td className="px-4 py-3 text-white/80">{quote.client}</td>
                          <td className="px-4 py-3 text-white/70 max-w-[200px] truncate">{quote.project || '—'}</td>
                          <td className="px-4 py-3 font-extrabold text-[#ff6b35]">฿{quote.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-white/60">{formatDate(quote.issue)}</td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={quote.status}
                              onChange={(e) => updateDocStatus('quote', quote.id, e.target.value)}
                              className={`rounded-full border px-3 py-1 text-xs font-bold outline-none cursor-pointer [&>option]:bg-[#11161a] ${
                                quote.status === 'accepted' ? 'border-green-500/40 bg-green-500/12 text-green-300' :
                                quote.status === 'rejected' ? 'border-red-500/40 bg-red-500/12 text-red-300' :
                                quote.status === 'sent' ? 'border-blue-500/40 bg-blue-500/12 text-blue-300' :
                                'border-white/15 bg-white/[0.04] text-white/60'
                              }`}
                            >
                              <option value="draft">ร่าง</option>
                              <option value="sent">ส่งแล้ว</option>
                              <option value="accepted">อนุมัติแล้ว</option>
                              <option value="rejected">ปฏิเสธ</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditQuotation(quote)}
                                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                                title="แก้ไขเอกสาร"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleConvertQuoteToInvoice(quote)}
                                className="rounded-lg p-1.5 text-[#00d4ff] hover:bg-[#00d4ff]/10"
                                title="แปลงเป็นใบแจ้งหนี้"
                              >
                                <Coins className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuotation(quote.id)}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                                title="ลบเอกสาร"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                  {filteredQuotations.map((quote) => (
                    <div key={quote.id} className="rounded-xl border border-white/10 bg-[#11161a]/92 p-4 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{quote.number}</span>
                        <select
                          value={quote.status}
                          onChange={(e) => updateDocStatus('quote', quote.id, e.target.value)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold outline-none cursor-pointer [&>option]:bg-[#11161a] ${
                            quote.status === 'accepted' ? 'border-green-500/40 bg-green-500/12 text-green-300' :
                            quote.status === 'rejected' ? 'border-red-500/40 bg-red-500/12 text-red-300' :
                            quote.status === 'sent' ? 'border-blue-500/40 bg-blue-500/12 text-blue-300' :
                            'border-white/15 bg-white/[0.04] text-white/60'
                          }`}
                        >
                          <option value="draft">ร่าง</option>
                          <option value="sent">ส่งแล้ว</option>
                          <option value="accepted">อนุมัติแล้ว</option>
                          <option value="rejected">ปฏิเสธ</option>
                        </select>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white/90 text-sm">{quote.client}</h4>
                        <p className="text-xs text-white/60 truncate mt-0.5">{quote.project || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[10px] text-white/30 font-bold block uppercase">ยอดสุทธิ</span>
                          <span className="font-extrabold text-[#ff6b35] text-base">
                            ฿{quote.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/30 font-bold block uppercase">วันที่ออก</span>
                          <span className="text-xs text-white/60">{formatDate(quote.issue)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleEditQuotation(quote)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
                        >
                          <Edit3 className="h-4 w-4" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleConvertQuoteToInvoice(quote)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#00d4ff]/20 bg-[#00d4ff]/10 px-3 text-xs font-bold text-[#00d4ff] hover:bg-[#00d4ff]/20"
                        >
                          <Coins className="h-4 w-4" />
                          สร้างใบแจ้งหนี้
                        </button>
                        <button
                          onClick={() => handleDeleteQuotation(quote.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {/* TAB CONTENT: INVOICES LIST */}
          {activeTab === 'invoices' && (
            loading ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                กำลังโหลดใบแจ้งหนี้...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-12 text-center text-white/54">
                ยังไม่มีใบแจ้งหนี้ในระบบ
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-[#11161a]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3 font-bold text-white">เลขที่เอกสาร</th>
                        <th className="px-4 py-3 font-bold text-white">ลูกค้า / บริษัท</th>
                        <th className="px-4 py-3 font-bold text-white">ชื่อโครงการ</th>
                        <th className="px-4 py-3 font-bold text-white">ยอดสุทธิ</th>
                        <th className="px-4 py-3 font-bold text-white">ครบกำหนดชำระ</th>
                        <th className="px-4 py-3 font-bold text-white text-center">สถานะ</th>
                        <th className="px-4 py-3 font-bold text-white text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-bold text-white">{inv.number}</td>
                          <td className="px-4 py-3 text-white/80">{inv.client}</td>
                          <td className="px-4 py-3 text-white/70 max-w-[200px] truncate">{inv.project || '—'}</td>
                          <td className="px-4 py-3 font-extrabold text-[#ff6b35]">฿{inv.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-white/60">{formatDate(inv.dueDate)}</td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={inv.status}
                              onChange={(e) => updateDocStatus('invoice', inv.id, e.target.value)}
                              className={`rounded-full border px-3 py-1 text-xs font-bold outline-none cursor-pointer [&>option]:bg-[#11161a] ${
                                inv.status === 'paid' ? 'border-green-500/40 bg-green-500/12 text-green-300' :
                                inv.status === 'overdue' ? 'border-red-500/40 bg-red-500/12 text-red-300' :
                                'border-orange-500/40 bg-orange-500/12 text-orange-300'
                              }`}
                            >
                              <option value="unpaid">ค้างชำระ</option>
                              <option value="paid">ชำระเงินแล้ว</option>
                              <option value="overdue">เกินกำหนด</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditInvoice(inv)}
                                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                                title="แก้ไขเอกสาร"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                                title="ลบเอกสาร"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                  {filteredInvoices.map((inv) => (
                    <div key={inv.id} className="rounded-xl border border-white/10 bg-[#11161a]/92 p-4 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{inv.number}</span>
                        <select
                          value={inv.status}
                          onChange={(e) => updateDocStatus('invoice', inv.id, e.target.value)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold outline-none cursor-pointer [&>option]:bg-[#11161a] ${
                            inv.status === 'paid' ? 'border-green-500/40 bg-green-500/12 text-green-300' :
                            inv.status === 'overdue' ? 'border-red-500/40 bg-red-500/12 text-red-300' :
                            'border-orange-500/40 bg-orange-500/12 text-orange-300'
                          }`}
                        >
                          <option value="unpaid">ค้างชำระ</option>
                          <option value="paid">ชำระเงินแล้ว</option>
                          <option value="overdue">เกินกำหนด</option>
                        </select>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white/90 text-sm">{inv.client}</h4>
                        <p className="text-xs text-white/60 truncate mt-0.5">{inv.project || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[10px] text-white/30 font-bold block uppercase">ยอดสุทธิ</span>
                          <span className="font-extrabold text-[#ff6b35] text-base">
                            ฿{inv.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/30 font-bold block uppercase">ครบกำหนดชำระ</span>
                          <span className="text-xs text-white/60">{formatDate(inv.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleEditInvoice(inv)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"
                        >
                          <Edit3 className="h-4 w-4" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {/* TAB CONTENT: DOCUMENT SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="rounded-xl border border-white/10 bg-[#11161a]/92 p-3 sm:p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">⚙️ ตั้งค่าโปรไฟล์และข้อมูลในการออกเอกสาร</h3>
                <p className="text-sm text-white/50">กรอกข้อมูลบริษัทและเลขบัญชีรับเงิน เพื่อนำไปใช้เป็นค่าเริ่มต้นในระบบใบเสนอราคาและใบแจ้งหนี้</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Brand profile */}
                <div className="space-y-4">
                  <h4 className="font-bold text-[#ff6b35] text-sm border-b border-white/5 pb-2">ข้อมูลผู้ให้บริการ (ผู้เสนอราคา)</h4>
                  
                  <label className="grid gap-1 text-xs text-white/50">
                    ชื่อผู้ออกเอกสาร (ชื่อบริษัท/ร้านค้า)
                    <input
                      type="text"
                      required
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>

                  <label className="grid gap-1 text-xs text-white/50">
                    สโลแกน (Tagline)
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>

                  <label className="grid gap-1 text-xs text-white/50">
                    ที่อยู่ติดต่อ (ติดต่อผู้ขาย)
                    <textarea
                      rows={3}
                      required
                      value={settings.addr}
                      onChange={(e) => setSettings({ ...settings, addr: e.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.05] p-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs text-white/50">
                      เบอร์โทรติดต่อ
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/50">
                      อีเมลติดต่อ
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-xs text-white/50">
                    ลิงก์เว็บไซต์บริษัท
                    <input
                      type="text"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                </div>

                {/* Bank / Payments / Terms defaults */}
                <div className="space-y-4">
                  <h4 className="font-bold text-[#ff6b35] text-sm border-b border-white/5 pb-2">ข้อมูลรับชำระเงิน & ระยะเวลาสัญญาเริ่มต้น</h4>
                  
                  <label className="grid gap-1 text-xs text-white/50">
                    ธนาคารรับเงิน (เช่น ธนาคารกสิกรไทย)
                    <input
                      type="text"
                      value={settings.bank}
                      onChange={(e) => setSettings({ ...settings, bank: e.target.value })}
                      className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs text-white/50">
                      เลขที่บัญชี
                      <input
                        type="text"
                        value={settings.accNum}
                        onChange={(e) => setSettings({ ...settings, accNum: e.target.value })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/50">
                      ชื่อบัญชีธนาคาร
                      <input
                        type="text"
                        value={settings.accName}
                        onChange={(e) => setSettings({ ...settings, accName: e.target.value })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs text-white/50">
                      ยืนยันราคาใน (วัน)
                      <input
                        type="number"
                        value={settings.validity}
                        onChange={(e) => setSettings({ ...settings, validity: Number(e.target.value) })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-white/50">
                      กำหนดชำระเงินภายใน (วัน)
                      <input
                        type="number"
                        value={settings.dueDays}
                        onChange={(e) => setSettings({ ...settings, dueDays: Number(e.target.value) })}
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-xs text-white/50">
                    ข้อตกลงและเงื่อนไขเริ่มต้น (Terms & Conditions)
                    <textarea
                      rows={3}
                      value={settings.terms}
                      onChange={(e) => setSettings({ ...settings, terms: e.target.value })}
                      className="rounded-lg border border-white/10 bg-white/[0.05] p-3 text-sm text-white outline-none focus:border-[#ff6b35]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#ff6b35] px-6 text-sm font-black text-white hover:bg-[#ff7d4f] disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Custom Popup Modal for Alert/Confirm */}
      <AlertDialog open={modal.isOpen} onOpenChange={(open) => {
        if (!open && modal.resolve) {
          modal.resolve(false);
          setModal(prev => ({ ...prev, isOpen: false }));
        }
      }}>
        <AlertDialogContent className="bg-[#18181b] border-white/10 text-white rounded-xl shadow-2xl p-6 max-w-md w-full">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              {modal.type === 'alert' ? (
                <AlertCircle className="w-5 h-5 text-[#ff6b35] animate-pulse" />
              ) : (
                <CalendarClock className="w-5 h-5 text-[#ff6b35]" />
              )}
              {modal.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {modal.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3 justify-end">
            {modal.type === 'confirm' && (
              <AlertDialogCancel 
                onClick={() => {
                  modal.resolve?.(false);
                  setModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="h-10 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white px-5 text-sm font-semibold transition"
              >
                ยกเลิก
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => {
                modal.resolve?.(true);
                setModal(prev => ({ ...prev, isOpen: false }));
              }}
              className="h-10 rounded-lg bg-[#ff6b35] hover:bg-[#ff7d4f] text-white px-5 text-sm font-bold transition shadow-md shadow-[#ff6b35]/20"
            >
              {modal.type === 'confirm' ? 'ตกลง' : 'รับทราบ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
