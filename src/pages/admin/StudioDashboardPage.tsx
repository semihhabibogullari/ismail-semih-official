import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Plus, Pencil, Trash2, Save, Send, Eye, LogOut,
  Layers, SlidersHorizontal, CalendarDays, Sparkles, Instagram, Mic2,
  BrainCircuit, GraduationCap, Newspaper, Mail, Settings2, Menu, Search,
  ChevronUp, ChevronDown, Image as ImageIcon, Type, Palette, LayoutGrid,
  Globe2, CheckCircle2, AlertCircle, Loader2, Copy, RotateCcw, Monitor,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import type { SiteData, DetailFields } from '../../types';
import { StudioMediaField } from '../../components/admin/StudioMediaField';
import { DetailSettingsEditor } from '../../components/admin/DetailSettingsEditor';

type CollectionKey = 'heroSlides' | 'events' | 'highlights' | 'instagramPosts' | 'podcasts' | 'articles' | 'trainings' | 'press';
type Panel = CollectionKey | 'general' | 'sections' | 'menu' | 'newsletter' | 'support';
type Generic = Record<string, unknown>;
type FieldKind = 'text' | 'textarea' | 'date' | 'time' | 'number' | 'toggle' | 'image' | 'video' | 'select' | 'url' | 'tags';
type Field = { key: string; label: string; kind?: FieldKind; choices?: string[] };
type Group = { key: CollectionKey; name: string; icon: React.ComponentType<{ size?: number; className?: string }>; fields: Field[]; defaults: Generic; image?: string; countLabel?: string };

const input = 'w-full min-w-0 rounded-xl border border-white/15 bg-[#0b0b0f] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]';
const field = (key: string, label: string, kind: FieldKind = 'text', choices?: string[]): Field => ({ key, label, kind, choices });
const today = () => new Date().toISOString().slice(0, 10);

const groups: Group[] = [
  { key: 'heroSlides', name: 'Ana Slider', icon: SlidersHorizontal, image: 'imageUrl', defaults: {
    title: 'Yeni slider', title_en: '', subtitle: '', subtitle_en: '', category: 'Tiyatro', imageUrl: '', mediaType: 'image', videoUrl:'',
    badge: '', buttonText: 'Detayları Gör', buttonText_en: 'View Details', buttonLink: '',
    active: true, order: 1,
  }, fields: [field('title','Başlık'), field('title_en','Başlık · İngilizce'), field('subtitle','Kısa açıklama','textarea'),
    field('subtitle_en','Kısa açıklama · İngilizce','textarea'), field('category','Kategori'),
    field('badge','Etiket'), field('mediaType','Slider medya türü','select',['image','video']),
    field('imageUrl','Afiş / Kapak','image'), field('videoUrl','Video Yükle veya Link Göm','video'),
    field('buttonText','Slider üstü buton yazısı'), field('buttonLink','Eski bağlantı (detay penceresi açılır)','url'),
    field('active','Görünür','toggle')] },
  { key: 'events', name: 'Etkinlik Takvimi', icon: CalendarDays, image: 'imageUrl', defaults: {
    title:'Yeni Etkinlik',title_en:'',category:'Tiyatro',date:today(),time:'20:00',venue:'',address:'',
    description:'',description_en:'',imageUrl:'',ticketUrl:'',ticketStatus:'soon',price:'',published:true,
  },fields:[field('title','Etkinlik / oyun adı'),field('title_en','Ad · İngilizce'),field('category','Kategori','select',['Tiyatro','Performans','Atölye','Panel','Diğer']),
    field('date','Tarih','date'),field('time','Başlangıç saati','time'),field('venue','Mekân'),field('address','Adres'),
    field('description','Açıklama','textarea'),field('description_en','Açıklama · İngilizce','textarea'),
    field('imageUrl','Etkinlik görseli','image'),field('ticketStatus','Bilet durumu','select',['available','sold_out','free','soon']),
    field('ticketUrl','Bilet bağlantısı (popup butonundan bağımsız)','url'),field('price','Fiyat'),
    field('published','Yayında','toggle')] },
  { key:'highlights',name:'Öne Çıkanlar',icon:Sparkles,image:'imageUrl',defaults:{
    title:'Yeni Öne Çıkan',title_en:'',category:'Performans',description:'',description_en:'',mediaType:'image',
    imageUrl:'',videoUrl:'',embedUrl:'',linkUrl:'',linkText:'Detayları Gör',published:true,order:1,
  },fields:[field('title','Başlık'),field('title_en','Başlık · İngilizce'),field('category','Kategori'),
    field('description','Açıklama','textarea'),field('description_en','Açıklama · İngilizce','textarea'),
    field('mediaType','Medya türü','select',['image','video']),field('imageUrl','Afiş / Kapak','image'),
    field('videoUrl','Video bağlantısı','video'),field('linkUrl','Ek bağlantı','url'),field('published','Yayında','toggle')] },
  {key:'instagramPosts',name:'Instagram Paylaşımları',icon:Instagram,image:'mediaUrl',defaults:{
    caption:'Yeni Instagram Paylaşımı',caption_en:'',mediaUrl:'',mediaType:'IMAGE',permalink:'',
    timestamp:new Date().toISOString(),likesCount:0,commentsCount:0,order:1,published:true,
  },fields:[field('caption','Paylaşım açıklaması','textarea'),field('caption_en','Açıklama · İngilizce','textarea'),
    field('mediaType','Medya tipi','select',['IMAGE','VIDEO','CAROUSEL_ALBUM']),
    field('mediaUrl','Görsel / Önizleme','image'),field('permalink','Instagram paylaşım linki','url'),
    field('likesCount','Beğeni sayısı','number'),field('published','Yayında','toggle')]},
  {key:'podcasts',name:'Podcast',icon:Mic2,image:'imageUrl',defaults:{
    episodeNumber:1,title:'Yeni Podcast Bölümü',title_en:'',description:'',description_en:'',
    guest:'',duration:'',publishDate:today(),imageUrl:'',audioUrl:'',spotifyUrl:'',youtubeUrl:'',
    appleUrl:'',featured:false,published:true,
  },fields:[field('episodeNumber','Bölüm numarası','number'),field('title','Bölüm başlığı'),field('title_en','Başlık · İngilizce'),
    field('guest','Konuk'),field('duration','Süre'),field('publishDate','Yayın tarihi','date'),
    field('description','Bölüm açıklaması','textarea'),field('description_en','Açıklama · İngilizce','textarea'),
    field('imageUrl','Kapak görseli','image'),field('audioUrl','Ses dosyası / adresi','url'),
    field('spotifyUrl','Spotify bağlantısı','url'),field('youtubeUrl','YouTube bağlantısı','video'),
    field('featured','Öne çıkar','toggle'),field('published','Yayında','toggle')]},
  {key:'articles',name:'Yapay Zekâ / Yazılar',icon:BrainCircuit,image:'imageUrl',defaults:{
    title:'Yeni Yazı',title_en:'',slug:'yeni-yazi',category:'Yapay Zekâ',tags:[],readTime:'5 dk',
    publishDate:today(),excerpt:'',excerpt_en:'',content:'',content_en:'',imageUrl:'',featured:false,published:true,
  },fields:[field('title','Başlık'),field('title_en','Başlık · İngilizce'),field('slug','Adres kısa adı (slug)'),
    field('category','Kategori'),field('tags','Etiketler · virgülle ayır','tags'),field('readTime','Okuma süresi'),
    field('publishDate','Yayın tarihi','date'),field('excerpt','Özet','textarea'),field('excerpt_en','Özet · İngilizce','textarea'),
    field('content','Yazı içeriği','textarea'),field('content_en','Yazı · İngilizce','textarea'),
    field('imageUrl','Kapak','image'),field('featured','Öne çıkar','toggle'),field('published','Yayında','toggle')]},
  {key:'trainings',name:'Eğitimler',icon:GraduationCap,image:'imageUrl',defaults:{
    title:'Yeni Eğitim',title_en:'',instructor:'İsmail Semih Habiboğulları',startDate:today(),
    duration:'',quota:'',price:'',location:'',description:'',description_en:'',imageUrl:'',applyUrl:'',status:'soon',published:true,
  },fields:[field('title','Eğitim adı'),field('title_en','Ad · İngilizce'),field('instructor','Eğitmen'),
    field('startDate','Başlangıç tarihi','date'),field('duration','Süre'),field('quota','Kontenjan'),
    field('price','Ücret'),field('location','Konum'),field('description','Açıklama','textarea'),
    field('description_en','Açıklama · İngilizce','textarea'),field('imageUrl','Kapak','image'),
    field('applyUrl','Başvuru adresi','url'),field('status','Durum','select',['active','soon','completed']),
    field('published','Yayında','toggle')]},
  {key:'press',name:'Basın / Haberler',icon:Newspaper,image:'imageUrl',defaults:{
    title:'Yeni Haber',title_en:'',outlet:'',publishDate:today(),quote:'',quote_en:'',
    imageUrl:'',articleUrl:'',order:1,published:true,
  },fields:[field('title','Haber başlığı'),field('title_en','Başlık · İngilizce'),field('outlet','Yayın organı'),
    field('publishDate','Yayın tarihi','date'),field('quote','Alıntı / Özet','textarea'),
    field('quote_en','Özet · İngilizce','textarea'),field('imageUrl','Haber görseli','image'),
    field('articleUrl','Haber bağlantısı','url'),field('published','Yayında','toggle')]},
];

const cardClass = 'rounded-2xl border border-white/10 bg-[#15151c] shadow-lg shadow-black/10';
const PANEL_META = [
  {key:'general' as Panel,name:'Genel Ayarlar',detail:'Logo, renk, yazı tipi, ölçüler, SEO, iletişim',icon:Settings2},
  {key:'sections' as Panel,name:'Blok Yerleşimi',detail:'Sıralama, görünürlük ve blok boyutları',icon:Layers},
  ...groups.map(g=>({key:g.key as Panel,name:g.name,detail:'İçerikleri ekle, düzenle ve önizle',icon:g.icon})),
  {key:'menu' as Panel,name:'Menü Yönetimi',detail:'Üst menü başlıkları ve bağlantıları',icon:Menu},
  {key:'newsletter' as Panel,name:'Bülten / İletişim',detail:'Abonelik metinleri ve iletişim bilgileri',icon:Mail},
  {key:'support' as Panel,name:'Gelişmiş İşlemler',detail:'Eski stüdyo, yedek, dışa aktarma',icon:Monitor},
];

function titleOf(item: Generic): string {
  return String(item.title || item.caption || item.name || 'Başlıksız içerik');
}
function patchAt<T extends object>(o: T, key: string, value: unknown): T {
  return { ...o, [key]: value };
}
function TextControl({ label, value, onChange, multiline, type='text' }: {
  label:string; value?:string|number; onChange:(v:string)=>void; multiline?:boolean; type?:string;
}) {
  return <label className="block min-w-0 space-y-1.5">
    <span className="text-xs font-semibold text-gray-300">{label}</span>
    {multiline ?
      <textarea className={input + ' min-h-[95px] resize-y'} rows={4} value={value??''} onChange={e=>onChange(e.target.value)} /> :
      <input className={input} type={type} value={value??''} onChange={e=>onChange(e.target.value)} />}
  </label>;
}

export const StudioDashboardPage: React.FC = () => {
  const { data, isAuthenticated, isLoading, isDraftMode, setIsDraftMode, saveDraft,
    publishToLive, refreshData, logout } = useSite();
  const nav = useNavigate();
  const [local,setLocal] = useState<SiteData>(data);
  const [panel,setPanel] = useState<Panel|null>(null);
  const [editing,setEditing] = useState<string|null>(null);
  const [search,setSearch] = useState('');
  const [isDirty,setDirty] = useState(false);
  const [busy,setBusy] = useState(false);
  const [feedback,setFeedback] = useState<{ok:boolean;text:string}|null>(null);
  const [confirmDelete,setConfirmDelete] = useState<string|null>(null);
  const [showPreview,setShowPreview] = useState(false);
  const [settingsTab,setSettingsTab] = useState<'brand'|'colors'|'fonts'|'sizing'|'seo'|'social'>('brand');
  const [advancedJson,setAdvancedJson] = useState('');
  const [importProblem,setImportProblem] = useState('');

  useEffect(()=>{if(!isLoading && !isAuthenticated) nav('/admin/login',{replace:true});},[isLoading,isAuthenticated,nav]);
  useEffect(()=>{if(!isDirty){setLocal(data);}},[data,isDirty]);
  // Draft preview is loaded from the authenticated endpoint so unpublished data remains editable.
  useEffect(()=>{
    if(!isAuthenticated||isDirty)return;
    let alive=true;
    fetch('/api/site/draft',{credentials:'same-origin'}).then(r=>r.ok?r.json():null)
      .then(j=>{if(alive&&j?.data){setLocal(j.data);setIsDraftMode(true);}})
      .catch(()=>{});
    return()=>{alive=false};
  },[isAuthenticated,isDirty,setIsDraftMode]);

  const mutate = (fn:(site:SiteData)=>SiteData) => {setLocal(prev=>fn(prev));setDirty(true);setFeedback(null)};
  const group = groups.find(g=>g.key===panel);
  const items = group ? (local[group.key] as unknown as Generic[]) : [];
  const visibleItems = useMemo(()=>items.filter(i=>titleOf(i).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))),[items,search]);
  const editItem = items.find(i=>String(i.id)===editing);

  const updateItem = (id:string, patch:Generic) => {
    if(!group) return;
    const key = group.key;
    mutate(site=>({...site,[key]:(site[key] as unknown as Generic[]).map(row=>String(row.id)===id?{...row,...patch}:row)}));
  };
  const insertItem = () => {
    if(!group)return;
    const key=group.key;
    const id=key.slice(0,4)+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
    const entry:Generic={...group.defaults,id};
    if('order' in entry)entry.order=items.length+1;
    if('episodeNumber' in entry)entry.episodeNumber=items.length+1;
    if('slug' in entry)entry.slug='yeni-yazi-'+id;
    mutate(site=>({...site,[key]:[...site[key] as unknown as Generic[],entry]}));
    setEditing(id);
  };
  const deleteItem = (id:string) => {
    if(!group)return;
    const key=group.key;
    mutate(site=>({...site,[key]:(site[key] as unknown as Generic[]).filter(x=>String(x.id)!==id)}));
    setConfirmDelete(null);setEditing(null);
  };
  const duplicate = (id:string) => {
    if(!group)return;
    const key=group.key;
    const original=items.find(x=>String(x.id)===id);
    if(!original)return;
    const newId=key.slice(0,4)+'_'+Date.now().toString(36);
    mutate(site=>({...site,[key]:[...site[key] as unknown as Generic[],{...original,id:newId,title:titleOf(original)+' (Kopya)',order:items.length+1}]}));
    setEditing(newId);
  };
  const moveItem = (id:string,direction:-1|1) => {
    if(!group)return;
    const key=group.key;
    const array=[...(local[key] as unknown as Generic[])];
    const index=array.findIndex(i=>String(i.id)===id),target=index+direction;
    if(target<0||target>=array.length)return;
    [array[index],array[target]]=[array[target],array[index]];
    mutate(site=>({...site,[key]:array.map((i,idx)=>'order' in i?{...i,order:idx+1}:i)}));
  };
  const save = async () => {
    setBusy(true);setFeedback(null);
    const r=await saveDraft(local);
    if(r.success){setDirty(false);setFeedback({ok:true,text:'Taslak kaydedildi. Ziyaretçilere henüz yayınlanmadı.'});}
    else setFeedback({ok:false,text:r.message||'Taslak kaydedilemedi.'});
    setBusy(false);
    return r.success;
  };
  const publish=async()=>{
    setBusy(true);setFeedback(null);
    const before=await saveDraft(local);
    if(!before.success){setBusy(false);setFeedback({ok:false,text:before.message||'Önce taslak kaydedilemedi.'});return;}
    const done=await publishToLive('Yeni Site Stüdyosu üzerinden yayınlandı');
    setDirty(false);setBusy(false);
    setFeedback({ok:done.success,text:done.success?'Site yayınlandı. Değişiklikler ziyaretçilere açık.':done.message||'Yayınlama başarısız.'});
    await refreshData();
  };
  const openPanel=(p:Panel)=>{
    setPanel(p);setEditing(null);setSearch('');setFeedback(null);window.scrollTo({top:0,behavior:'smooth'});
  };
  const settingsPatch=(patch:Generic)=>mutate(s=>({...s,settings:{...s.settings,...patch}}));
  const seoPatch=(patch:Generic)=>mutate(s=>({...s,seo:{...s.seo,...patch}}));
  const currentMeta=PANEL_META.find(p=>p.key===panel);

  if(isLoading || !isAuthenticated) return <div className="min-h-screen grid place-items-center text-gray-300"><Loader2 className="animate-spin" /></div>;

  const makeField = (item:Generic, schema:Field) => {
    const value=item[schema.key];
    const modify=(v:unknown)=>updateItem(String(item.id),{[schema.key]:v});
    if(schema.kind==='image'||schema.kind==='video')return <StudioMediaField key={schema.key}
      label={schema.label} accept={schema.kind} value={String(value||'')} onChange={modify}
      onCover={schema.kind==='video'&&'imageUrl' in item ? url=>modifyMediaCover(item,url) : undefined} />;
    if(schema.kind==='toggle')return <label key={schema.key} className="inline-flex items-center gap-3 rounded-xl bg-[#0b0b0f] border border-white/10 p-3 text-sm text-gray-200">
      <input type="checkbox" className="accent-[#ff5a1f] w-5 h-5" checked={value===true} onChange={e=>modify(e.target.checked)} />{schema.label}</label>;
    if(schema.kind==='select')return <label key={schema.key} className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-300">{schema.label}</span>
      <select className={input} value={String(value??'')} onChange={e=>modify(e.target.value)}>
        {(schema.choices||[]).map(o=><option key={o} value={o}>{o}</option>)}
      </select></label>;
    if(schema.kind==='tags')return <TextControl key={schema.key} label={schema.label} value={Array.isArray(value)?value.join(', '):String(value||'')}
      onChange={v=>modify(v.split(',').map(x=>x.trim()).filter(Boolean))} />;
    if(schema.kind==='number')return <label key={schema.key} className="block space-y-1.5"><span className="text-xs font-semibold text-gray-300">{schema.label}</span>
      <input type="number" value={Number(value??0)} className={input} onChange={e=>modify(Number(e.target.value))} /></label>;
    return <TextControl key={schema.key} label={schema.label} value={String(value??'')} onChange={modify}
      type={schema.kind==='date'?'date':schema.kind==='time'?'time':schema.kind==='url'?'text':'text'} multiline={schema.kind==='textarea'} />;
  };
  function modifyMediaCover(item:Generic,url:string){updateItem(String(item.id),{imageUrl:url})}

  const simpleSettings=(specs:Array<[string,string]>, target:Generic, change:(patch:Generic)=>void) =>
    <div className="grid sm:grid-cols-2 gap-4">{specs.map(([key,label])=><TextControl key={key} label={label} value={String(target[key]??'')}
      onChange={v=>change({[key]:v})} />)}</div>;

  return <div className="min-h-screen w-full bg-[#0b0b0f] text-[#f1f1f4] pb-24">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111116]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 items-center">
          {panel&&<button type="button" onClick={()=>{setPanel(null);setEditing(null)}} className="p-2 rounded-xl bg-white/5 hover:bg-white/10" title="Tüm bloklar"><ArrowLeft size={19} /></button>}
          <div className="w-10 h-10 rounded-xl bg-[#ff5a1f] grid place-items-center text-white"><LayoutGrid size={20} /></div>
          <div><p className="text-xs uppercase text-[#ff8c42] tracking-[.18em] font-semibold">İsmail Semih Studio</p>
            <h1 className="text-base sm:text-xl font-bold">{currentMeta?.name||'Site Yönetim Merkezi'}</h1></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={()=>setShowPreview(!showPreview)}
            className="inline-flex gap-2 items-center text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15"><Eye size={16}/>Önizleme</button>
          <button type="button" onClick={()=>{void save()}} disabled={busy}
            className="inline-flex gap-2 items-center text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#23232b] hover:bg-[#30303b] disabled:opacity-50"><Save size={16}/>Taslağı Kaydet</button>
          <button type="button" disabled={busy} onClick={()=>{if(window.confirm('Taslağı ziyaretçilere canlı olarak yayınlamak istiyor musunuz?'))void publish()}}
            className="inline-flex gap-2 items-center text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white disabled:opacity-50"><Send size={16}/>Yayınla</button>
          <button type="button" onClick={()=>void logout().then(()=>nav('/admin/login'))} title="Çıkış"
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10"><LogOut size={17}/></button>
        </div>
      </div>
    </header>
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {feedback&&<p role="status" className={`flex gap-2 items-center p-3 rounded-xl text-sm border ${feedback.ok?'bg-emerald-950/20 border-emerald-600/30 text-emerald-300':'bg-red-950/20 border-red-600/30 text-red-300'}`}>
        {feedback.ok?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>} {feedback.text}</p>}
      {isDirty&&<p className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-300 text-xs">
        Kaydedilmemiş düzenlemeler var. Sayfayı kapatmadan önce <b>Taslağı Kaydet</b> seçin.
      </p>}
      {showPreview&&<div className={cardClass+' overflow-hidden'}>
        <div className="flex justify-between px-4 py-2 items-center border-b border-white/10"><span className="text-sm font-semibold">Canlı Sitenin Önizlemesi</span>
          <Link to="/" target="_blank" rel="noopener noreferrer" className="text-[#ff8c42] text-sm inline-flex gap-1 items-center">Yeni sekmede aç <ArrowRight size={15}/></Link></div>
        <iframe title="Canlı web sitesi" src="/" className="h-[540px] w-full border-0 bg-white" /></div>}
      {!panel?<>
        <section className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
          <div><p className="text-xs uppercase tracking-widest font-bold text-[#ff5a1f]">Kontrol Merkezi</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">Hangi bölümü düzenlemek istersiniz?</h2>
            <p className="text-gray-400 text-sm mt-2">Kutucuğa girin; içerik ekleyin, görsel veya video yükleyin, butonları ve ölçüleri değiştirin.</p>
          </div>
          <div className="text-xs px-3 py-2 bg-white/5 rounded-xl text-gray-400">Taslak ve canlı site ayrı tutulur</div>
        </section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PANEL_META.map(p=>{const Icon=p.icon;const g=groups.find(x=>x.key===p.key);const count=g?(local[g.key] as unknown as unknown[]).length:undefined;
            return <button type="button" key={p.key} onClick={()=>openPanel(p.key)}
              className={cardClass+' text-left p-5 min-h-[182px] flex flex-col hover:border-[#ff5a1f]/60 hover:bg-[#1d1b22] focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] transition-all group'}>
              <div className="flex justify-between items-start"><span className="w-12 h-12 rounded-2xl grid place-items-center bg-[#ff5a1f]/10 text-[#ff8c42]"><Icon size={23}/></span>
                <ArrowRight size={18} className="text-gray-600 group-hover:text-[#ff5a1f]"/></div>
              <h3 className="mt-5 font-bold text-lg">{p.name}</h3><p className="text-xs text-gray-400 mt-1">{p.detail}</p>
              {count!==undefined&&<p className="mt-3 text-[11px] text-[#ff8c42]">{count} içerik</p>}
            </button>})}
        </div>
      </>:null}

      {group&&<section className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div><h2 className="text-xl font-semibold">{group.name} Yönetimi</h2><p className="text-gray-400 text-xs mt-1">Her içerik için + ekle, kalem ile düzenle, çöp kutusuyla sil.</p></div>
          <button type="button" onClick={insertItem} className="flex gap-2 items-center justify-center px-4 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] font-semibold text-sm"><Plus size={19}/>Yeni Paylaşım Ekle</button>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#15151c] border border-white/10 px-3">
          <Search size={18} className="text-gray-500"/><input className="w-full bg-transparent py-3 outline-none text-sm" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Başlık veya içerik ara..." /></div>
        {editing && editItem ? <div className={cardClass+' p-4 sm:p-6 space-y-5'}>
          <div className="flex gap-3 justify-between items-center border-b border-white/10 pb-4">
            <div><p className="text-[#ff8c42] text-xs font-bold uppercase tracking-wider">İçerik Düzenleme</p>
              <h3 className="text-xl font-bold mt-1">{titleOf(editItem)}</h3></div>
            <button type="button" onClick={()=>setEditing(null)} className="text-xs px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">Listeye Dön</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">{group.fields.filter(f=>f.kind!=='image'&&f.kind!=='video'&&f.kind!=='textarea').map(f=>makeField(editItem,f))}</div>
          <div className="grid sm:grid-cols-2 gap-4">{group.fields.filter(f=>f.kind==='textarea').map(f=>makeField(editItem,f))}</div>
          <div className="grid lg:grid-cols-2 gap-4">{group.fields.filter(f=>f.kind==='image'||f.kind==='video').map(f=>makeField(editItem,f))}</div>
          {(['heroSlides','events','highlights'] as string[]).includes(group.key)&&
            <DetailSettingsEditor value={editItem as DetailFields} ticketUrl={String(editItem.ticketUrl||'')} onChange={patch=>updateItem(String(editItem.id),patch)} />}
          <div className="flex gap-3 flex-wrap border-t border-white/10 pt-4">
            <button type="button" onClick={()=>{void save()}} disabled={busy}
              className="px-5 py-3 bg-[#ff5a1f] rounded-xl text-white font-semibold text-sm flex items-center gap-2"><Save size={16}/>Taslağı Kaydet</button>
            <button type="button" onClick={()=>setEditing(null)} className="px-5 py-3 bg-white/10 rounded-xl text-white font-semibold text-sm">Listeye Dön</button>
          </div>
        </div>:<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item,index)=>{
            const thumb=group.image?String(item[group.image]||''):'';
            return <div key={String(item.id)} className={cardClass+' overflow-hidden'}>
              <div className="aspect-[16/8] bg-[#0c0c13] relative overflow-hidden">
                {thumb?<img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />:
                  <div className="h-full w-full grid place-items-center"><ImageIcon size={38} className="text-gray-600"/></div>}
                <span className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-lg bg-black/70 text-white">{item.published===false||item.active===false?'Gizli / Taslak':'Görünür'}</span>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-bold line-clamp-2 min-h-10">{titleOf(item)}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{String(item.subtitle||item.description||item.excerpt||item.quote||'İçeriği düzenleyerek açıklama ve medya ekleyin.')}</p>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <button type="button" onClick={()=>setEditing(String(item.id))} className="px-3 py-2.5 bg-[#ff5a1f] hover:bg-[#ff733b] rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Pencil size={15}/>Düzenle</button>
                  <button type="button" title="Kopyala" onClick={()=>duplicate(String(item.id))} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/15"><Copy size={16}/></button>
                  <button type="button" title="Sil" onClick={()=>setConfirmDelete(String(item.id))} className="p-2.5 bg-red-950/40 text-red-400 rounded-xl hover:bg-red-900/40"><Trash2 size={16}/></button>
                </div>
                {'order' in item && <div className="flex gap-2 text-gray-400 text-xs border-t border-white/10 pt-2">
                  <span className="flex-1">Sıra {index+1}</span>
                  <button type="button" title="Yukarı" onClick={()=>moveItem(String(item.id),-1)}><ChevronUp size={17}/></button>
                  <button type="button" title="Aşağı" onClick={()=>moveItem(String(item.id),1)}><ChevronDown size={17}/></button>
                </div>}
              </div>
            </div>})}
          {visibleItems.length===0&&<p className="text-gray-400 text-sm p-8">İçerik bulunamadı. Sağ üstten + ile yeni içerik ekleyin.</p>}
        </div>}
        {confirmDelete&&<div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-[80] bg-black/80 flex justify-center items-center px-4">
          <div className={cardClass+' w-full max-w-md p-6 space-y-4'}>
            <h3 id="delete-title" className="text-lg font-bold text-white">İçeriği silmek istiyor musunuz?</h3>
            <p className="text-sm text-gray-400">Silme işlemi taslak üzerinde uygulanır. Canlıya yayınlayana kadar ziyaretçilere yansımaz.</p>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setConfirmDelete(null)} className="px-4 py-2 rounded-xl bg-white/10">Vazgeç</button>
              <button type="button" onClick={()=>deleteItem(confirmDelete)} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Evet, Sil</button>
            </div>
          </div></div>}
      </section>}

      {panel==='sections'&&<section className="space-y-4">
        <h2 className="text-xl font-bold">Sayfa Blokları ve Ölçüleri</h2>
        <p className="text-gray-400 text-sm">Ana sayfadaki blokları görünür/gizli yapın, sıralayın; genişlik, yükseklik ve boşluklarını ayarlayın.</p>
        {[...local.sections].sort((a,b)=>a.order-b.order).map((sec,index,sorted)=>(
          <div key={sec.id} className={cardClass+' p-4 sm:p-5 space-y-4'}>
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div><h3 className="font-bold">{sec.title}</h3><p className="text-xs text-gray-500">{sec.type}</p></div>
              <div className="flex gap-3 items-center">
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={sec.visible} className="accent-[#ff5a1f]" onChange={e=>mutate(s=>({...s,sections:s.sections.map(x=>x.id===sec.id?{...x,visible:e.target.checked}:x)}))}/>Görünür</label>
                <button type="button" disabled={index===0} title="Yukarı" className="p-2 bg-white/10 rounded-lg disabled:opacity-30" onClick={()=>mutate(s=>({...s,sections:s.sections.map(x=>x.id===sec.id?{...x,order:sorted[index-1].order}:x.id===sorted[index-1].id?{...x,order:sec.order}:x)}))}><ChevronUp size={16}/></button>
                <button type="button" disabled={index===sorted.length-1} title="Aşağı" className="p-2 bg-white/10 rounded-lg disabled:opacity-30" onClick={()=>mutate(s=>({...s,sections:s.sections.map(x=>x.id===sec.id?{...x,order:sorted[index+1].order}:x.id===sorted[index+1].id?{...x,order:sec.order}:x)}))}><ChevronDown size={16}/></button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {simpleSettings([['title','Blok başlığı'],['title_en','Başlık · İngilizce'],['subtitle','Blok alt başlığı'],['subtitle_en','Alt başlık · İngilizce']],sec as unknown as Generic,patch=>mutate(s=>({...s,sections:s.sections.map(x=>x.id===sec.id?{...x,...patch}:x)})))}
              {([['maxWidth','En fazla genişlik (px, 600–1920)'],['minHeight','Minimum yükseklik (px, 0–1200)'],['paddingY','Üst ve alt boşluk (px, 0–160)']] as const).map(([key,label])=><label key={key} className="space-y-1 block text-xs text-gray-300">
                {label}
                <input type="number" min={key==='maxWidth'?600:0} max={key==='maxWidth'?1920:key==='minHeight'?1200:160} step="10"
                  className={input} value={(sec as unknown as Generic)[key] as number ?? ''}
                  placeholder="Varsayılan"
                  onChange={e=>mutate(s=>({...s,sections:s.sections.map(x=>x.id===sec.id?{...x,[key]:e.target.value===''?undefined:Number(e.target.value)}:x)}))}/>
              </label>)}
            </div>
          </div>))}
      </section>}

      {panel==='menu'&&<section className="space-y-4">
        <div className="flex justify-between items-center gap-4"><h2 className="text-xl font-bold">Menü Yönetimi</h2>
          <button type="button" className="px-4 py-3 rounded-xl bg-[#ff5a1f] font-bold text-sm flex gap-2 items-center" onClick={()=>mutate(s=>({...s,menu:[...s.menu,{id:'menu_'+Date.now(),label:'Yeni Menü',label_en:'New Menu',path:'/',order:s.menu.length+1,visible:true}]}))}><Plus size={17}/>Yeni Menü Ekle</button></div>
        {[...local.menu].sort((a,b)=>a.order-b.order).map(m=><div className={cardClass+' p-4 grid sm:grid-cols-4 gap-3 items-end'} key={m.id}>
          {simpleSettings([['label','Menü Adı'],['label_en','English'],['path','Hedef URL']],m as unknown as Generic,patch=>mutate(s=>({...s,menu:s.menu.map(x=>x.id===m.id?{...x,...patch}:x)})))}
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs flex items-center gap-2 text-gray-300"><input type="checkbox" checked={m.visible} className="accent-[#ff5a1f]" onChange={e=>mutate(s=>({...s,menu:s.menu.map(x=>x.id===m.id?{...x,visible:e.target.checked}:x)}))}/>Görünsün</label>
            <button type="button" onClick={()=>mutate(s=>({...s,menu:s.menu.filter(x=>x.id!==m.id)}))} className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg" title="Menüyü sil"><Trash2 size={17}/></button>
          </div>
        </div>)}
      </section>}

      {panel==='general'&&<section className="space-y-5">
        <h2 className="text-xl font-bold">Genel Site Ayarları</h2>
        <div className="flex flex-wrap gap-2">
          {([['brand','Marka / Logo',ImageIcon],['colors','Renkler',Palette],['fonts','Fontlar',Type],['sizing','Ölçüler',LayoutGrid],['seo','SEO',Globe2],['social','İletişim / Sosyal',Mail]] as const).map(([id,label,Icon])=>
            <button type="button" key={id} onClick={()=>setSettingsTab(id)} className={`px-4 py-2.5 rounded-xl inline-flex items-center gap-2 text-xs font-semibold ${settingsTab===id?'bg-[#ff5a1f] text-white':'bg-[#15151c] hover:bg-white/10 text-gray-300'}`}><Icon size={16}/>{label}</button>)}
        </div>
        <div className={cardClass+' p-4 sm:p-6 space-y-5'}>
          {settingsTab==='brand'&&<>
            {simpleSettings([['siteTitle','Site Adı'],['siteTitle_en','Site Adı · İngilizce'],
              ['siteSubtitle','Site alt başlığı'],['siteSubtitle_en','Alt başlık · İngilizce'],
              ['copyrightText','Telif metni']],local.settings as unknown as Generic,settingsPatch)}
            <div className="grid lg:grid-cols-2 gap-4">
              {(['logoUrl','lightLogoUrl','darkLogoUrl','mobileLogoUrl','faviconUrl'] as const).map(key=><StudioMediaField key={key}
                accept="image" label={{logoUrl:'Ana Logo',lightLogoUrl:'Açık tema logosu',darkLogoUrl:'Koyu tema logosu',mobileLogoUrl:'Mobil logo',faviconUrl:'Site simgesi / Favicon'}[key]}
                value={String(local.settings[key]||'')} onChange={url=>settingsPatch({[key]:url})}/>)}
            </div>
            <label className="block max-w-xs space-y-2 text-xs font-semibold text-gray-300">Logo Genişliği (px)
              <input type="number" min="80" max="700" value={local.settings.logoWidth} onChange={e=>settingsPatch({logoWidth:Number(e.target.value)})} className={input}/></label>
          </>}
          {settingsTab==='colors'&&<>
            <p className="text-xs text-gray-400">Bütün tema renkleri tek yerden yönetilir. Değişiklikleri yayınladıktan sonra sitede uygulanır.</p>
            {(['darkTheme','lightTheme'] as const).map(theme=><div key={theme} className="space-y-3">
              <h3 className="font-bold">{theme==='darkTheme'?'Koyu Tema':'Açık Tema'}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {([['bgPrimary','Ana Zemin'],['bgSecondary','İkincil Zemin'],['panelBg','Panel Rengi'],['textPrimary','Ana Yazı'],['textSecondary','İkincil Yazı'],['accentColor','Vurgu Rengi']] as const).map(([key,label])=>{
                  const val=local.settings[theme][key];
                  return <label key={key} className="rounded-xl border border-white/10 p-3 block">
                    <span className="text-xs text-gray-300 font-semibold">{label}</span>
                    <div className="flex gap-2 items-center mt-2"><input type="color" value={/^#[0-9a-f]{6}$/i.test(val)?val:'#ff5a1f'} onChange={e=>settingsPatch({[theme]:{...local.settings[theme],[key]:e.target.value}})} className="w-10 h-9 bg-transparent cursor-pointer" />
                      <input className={input} value={val} onChange={e=>settingsPatch({[theme]:{...local.settings[theme],[key]:e.target.value}})}/></div>
                  </label>;
                })}
              </div>
            </div>)}
            {simpleSettings([['primaryColor','Ana marka rengi'],['bgColor','Arka plan'],['panelColor','Panel'],['textColor','Yazı rengi']],local.settings as unknown as Generic,settingsPatch)}
          </>}
          {settingsTab==='fonts'&&<>
            <p className="text-gray-400 text-xs">Google Fonts ve temel sistem fontları kullanılabilir.</p>
            {simpleSettings([['headingFont','Başlık fontu'],['bodyFont','Gövde fontu'],['monoFont','Kod / Rakam fontu'],
              ['baseSize','Yazı boyutu (ör. 16px)'],['headingWeight','Başlık kalınlığı'],['bodyWeight','Metin kalınlığı'],
              ['letterSpacing','Harf aralığı (ör. -0.02em)']],local.settings.typography as unknown as Generic,
              patch=>settingsPatch({typography:{...local.settings.typography,...patch}}))}
          </>}
          {settingsTab==='sizing'&&<>
            <p className="text-gray-400 text-sm">Blok bazında genişlik ve yükseklik için <button type="button" className="underline text-[#ff8c42]" onClick={()=>openPanel('sections')}>Blok Yerleşimi</button> bölümünü kullanın.</p>
            <h3 className="font-bold text-sm">Slider Geçişi</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {([['autoplayDuration','Otomatik geçiş (ms)'],['transitionDuration','Animasyon süresi (ms)']] as const).map(([key,label])=><label className="text-xs text-gray-300 space-y-2" key={key}>{label}
                <input type="number" min="500" max="30000" step="100" className={input}
                  value={local.settings.sliderSettings[key]} onChange={e=>settingsPatch({sliderSettings:{...local.settings.sliderSettings,[key]:Number(e.target.value)}})} />
              </label>)}
              <label className="text-xs text-gray-300 space-y-2">Slider Efekti
                <select value={local.settings.sliderSettings.transitionType} className={input}
                  onChange={e=>settingsPatch({sliderSettings:{...local.settings.sliderSettings,transitionType:e.target.value}})}>
                  {['kenburns-crossfade','crossfade','fade-zoom','soft-slide','minimal-fade'].map(x=><option key={x}>{x}</option>)}
                </select></label>
              <label className="text-xs text-gray-300 flex gap-2 items-center pt-5">
                <input type="checkbox" checked={local.settings.sliderSettings.pauseOnHover}
                  onChange={e=>settingsPatch({sliderSettings:{...local.settings.sliderSettings,pauseOnHover:e.target.checked}})}
                  className="accent-[#ff5a1f]"/>Fare üstündeyken slider dursun
              </label>
            </div>
            <h3 className="font-bold text-sm mt-6">Köşe ve Gölge Stili</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {([['borderRadius','Köşe Yuvarlaklığı',['rounded-none','rounded-lg','rounded-xl','rounded-2xl']],
                ['cardShadow','Kart Gölgesi',['none','sm','md','lg','2xl']]] as const).map(([key,label,opts])=>
                <label key={key} className="text-xs text-gray-300">{label}
                  <select className={input} value={local.settings[key]} onChange={e=>settingsPatch({[key]:e.target.value})}>
                    {opts.map(o=><option key={o}>{o}</option>)}</select>
                </label>)}
            </div>
          </>}
          {settingsTab==='seo'&&<>
            {simpleSettings([['title','Google sayfa başlığı'],['title_en','Başlık · İngilizce'],['description','SEO açıklaması'],
              ['description_en','Açıklama · İngilizce'],['keywords','Anahtar kelimeler'],['canonicalUrl','Kanonik site adresi']],
              local.seo as unknown as Generic,seoPatch)}
            <StudioMediaField accept="image" label="Sosyal paylaşım görseli / OG Image" value={local.seo.ogImage} onChange={v=>seoPatch({ogImage:v})}/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#ff5a1f]" checked={local.seo.robotsIndex}
              onChange={e=>seoPatch({robotsIndex:e.target.checked})}/>Arama motorları siteyi dizine ekleyebilsin</label>
          </>}
          {settingsTab==='social'&&<>
            {simpleSettings([['contactEmail','İletişim e-postası'],['contactPhone','Telefon'],
              ['address','Adres'],['address_en','Adres · İngilizce']],local.settings as unknown as Generic,settingsPatch)}
            <h3 className="font-bold">Sosyal Medya Hesapları</h3>
            {simpleSettings([['instagram','Instagram'],['youtube','YouTube'],['spotify','Spotify'],
              ['twitter','X / Twitter'],['linkedin','LinkedIn'],['email','E-posta']],local.settings.socialLinks as unknown as Generic,
              patch=>settingsPatch({socialLinks:{...local.settings.socialLinks,...patch}}))}
            <h3 className="font-bold">Hakkımda Özeti</h3>
            <TextControl multiline label="Kısa biyografi (TR)" value={local.settings.bioSummary} onChange={v=>settingsPatch({bioSummary:v})}/>
            <TextControl multiline label="Short bio (EN)" value={local.settings.bioSummary_en} onChange={v=>settingsPatch({bioSummary_en:v})}/>
          </>}
        </div>
      </section>}
      {panel==='newsletter'&&<section className={cardClass+' p-6 space-y-4'}>
        <h2 className="font-bold text-xl">Bülten ve İletişim</h2>
        <p className="text-sm text-gray-400">Bülten bloğunun adı ve açıklaması Blok Yerleşimi bölümünden; iletişim bilgileri ise Genel Ayarlar’dan değiştirilebilir.</p>
        <button type="button" className="rounded-xl bg-[#ff5a1f] px-4 py-3 text-sm font-bold" onClick={()=>{setSettingsTab('social');openPanel('general')}}>İletişim Ayarlarını Aç</button>
      </section>}
      {panel==='support'&&<section className={cardClass+' p-6 space-y-5'}>
        <h2 className="font-bold text-xl">Gelişmiş İşlemler</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/admin/advanced" className="flex gap-2 justify-center items-center p-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"><Monitor size={18}/>Önceki Gelişmiş Stüdyoyu Aç</Link>
          <button type="button" onClick={()=>{const blob=new Blob([JSON.stringify(local,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='ismail-semih-site-yedek.json';anchor.click();URL.revokeObjectURL(url);}}
            className="flex gap-2 justify-center items-center p-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"><Save size={18}/>JSON Yedek İndir</button>
        </div>
        <button type="button" className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          onClick={()=>{setAdvancedJson(JSON.stringify(local,null,2));setImportProblem('');}}>JSON ile Düzenle (Uzman)</button>
        {advancedJson&&<div className="space-y-3">
          <p className="text-xs text-amber-400">Uzman aracı: içeriği geçerli bir SiteData JSON olarak düzenleyin. Yanlış alanlar siteyi bozabilir.</p>
          <textarea className={input+' font-mono min-h-80'} value={advancedJson} onChange={e=>setAdvancedJson(e.target.value)} rows={12}/>
          {importProblem&&<p className="text-red-400 text-xs">{importProblem}</p>}
          <button type="button" className="bg-[#ff5a1f] rounded-xl px-4 py-2 text-sm font-bold" onClick={()=>{
            try{const payload=JSON.parse(advancedJson);if(!payload?.settings||!Array.isArray(payload.sections)||!Array.isArray(payload.heroSlides))throw new Error('settings, sections ve heroSlides zorunlu');
              setLocal(payload as SiteData);setDirty(true);setAdvancedJson('');setImportProblem('');}
            catch(e){setImportProblem(e instanceof Error?e.message:'Geçersiz JSON')}
          }}>JSON İçeriğini Taslağa Aktar</button>
        </div>}
        <button type="button" className="flex gap-2 items-center p-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
          onClick={()=>{if(isDirty&&!window.confirm('Kaydedilmeyen değişiklikler silinsin mi?'))return;setDirty(false);void refreshData();}}>
          <RotateCcw size={16}/>Son Kaydı Tekrar Yükle</button>
      </section>}
    </div>
  </div>;
};
