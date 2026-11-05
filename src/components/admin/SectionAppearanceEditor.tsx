import React from 'react';
import { Palette, RotateCcw, Copy, Paintbrush, Type, Layers } from 'lucide-react';
import type { SectionAppearance } from '../../types';
import { buildSectionPresentation, cleanColor } from '../../utils/sectionAppearance';

interface Props {
  title: string;
  value?: SectionAppearance;
  onChange: (next: SectionAppearance) => void;
  onApplyAll?: (value: SectionAppearance) => void;
}

const colorFields: Array<{ key: keyof SectionAppearance; label: string; hint: string }> = [
  {key:'headingColor',label:'Başlık Rengi',hint:'Bölüm başlığı ve kart başlıkları'},
  {key:'textColor',label:'Metin Rengi',hint:'Açıklama ve içerik metinleri'},
  {key:'backgroundColor',label:'Blok Arka Planı',hint:'Seçili bölümün tüm zemini'},
  {key:'accentColor',label:'Vurgu Rengi',hint:'Etiketler ve renkli detaylar'},
  {key:'cardColor',label:'Kart / Kutu Rengi',hint:'İçerik kartlarının zemini'},
  {key:'borderColor',label:'Kenarlık Rengi',hint:'Kart, kutu ve çizgiler'},
  {key:'buttonColor',label:'Buton Rengi',hint:'İşlem butonlarının zemini'},
  {key:'buttonTextColor',label:'Buton Yazı Rengi',hint:'Buton içindeki metin'},
  {key:'shadowColor',label:'Gölge Rengi',hint:'Kart ve kutuların gölgesi'},
];

const fonts=['', 'Inter','Space Grotesk','Montserrat','Poppins','Roboto','Open Sans','Lato',
  'Playfair Display','Merriweather','Oswald','DM Sans','Source Sans 3','Georgia','Arial'];

function NumericField({label,value,min,max,unit,onChange}:{label:string;value?:number;min:number;max:number;unit:string;onChange:(n?:number)=>void}) {
  return <label className="block space-y-1">
    <span className="text-xs font-semibold text-gray-300">{label}</span>
    <div className="flex items-center gap-2">
      <input type="number" min={min} max={max} value={value??''} placeholder="Varsayılan"
        className="w-full min-w-0 rounded-xl bg-[#0b0b0f] border border-white/15 px-3 py-2.5 text-white text-sm"
        onChange={e=>onChange(e.target.value===''?undefined:Math.max(min,Math.min(max,Number(e.target.value))))}/>
      <span className="text-gray-400 text-xs shrink-0">{unit}</span>
    </div>
  </label>;
}

export const SectionAppearanceEditor:React.FC<Props> = ({title,value,onChange,onApplyAll}) => {
  const appearance=value||{};
  const update=(patch:Partial<SectionAppearance>)=>onChange({...appearance,...patch});
  const demo=buildSectionPresentation(appearance);
  return <details className="rounded-2xl border border-[#ff5a1f]/30 bg-[#0b0b12]/65 group/design">
    <summary className="cursor-pointer list-none p-4 sm:p-5 flex items-center justify-between gap-3 focus-visible:outline-[#ff5a1f]">
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-xl bg-[#ff5a1f]/15 text-[#ff8c42] grid place-items-center shrink-0"><Paintbrush size={19}/></span>
        <span><span className="block text-white font-bold text-sm">Görünüm ve Tasarım</span>
          <span className="block text-gray-400 text-xs mt-1">{title} · başlık, metin, renk, font ve gölge ayarları</span>
        </span>
      </span>
      <Palette size={20} className="text-[#ff8c42] shrink-0"/>
    </summary>
    <div className="px-4 sm:px-5 pb-5 border-t border-white/10 pt-4 space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {colorFields.map(({key,label,hint})=>{
          const value=appearance[key];
          const color=typeof value==='string'?value:'';
          return <label key={key} className="block rounded-xl border border-white/10 bg-[#15151d] p-3 space-y-2">
            <span className="block text-xs font-semibold text-white">{label}</span>
            <span className="block text-[11px] text-gray-400">{hint}</span>
            <span className="flex items-center gap-2">
              <input type="color" title={label} aria-label={label+' renk seçici'}
                value={cleanColor(color)||'#ff5a1f'}
                onChange={e=>update({[key]:e.target.value})}
                className="h-10 w-11 cursor-pointer rounded-lg bg-transparent shrink-0"/>
              <input type="text" aria-label={label+' HEX değeri'} value={color}
                placeholder="Varsayılan"
                onChange={e=>update({[key]:e.target.value||undefined})}
                className="w-full min-w-0 rounded-lg bg-[#0b0b0f] border border-white/15 py-2 px-3 text-xs text-white"/>
              {color&&<button type="button" title={label+' sıfırla'}
                onClick={()=>update({[key]:undefined})}
                className="text-xs text-gray-400 hover:text-white" aria-label={label+' sıfırla'}>×</button>}
            </span>
          </label>;
        })}
      </div>
      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-sm text-white font-bold flex gap-2 items-center"><Type size={16} className="text-[#ff8c42]"/> Yazı Tipleri ve Ölçüler</h4>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {([['headingFont','Başlık fontu'],['bodyFont','Metin fontu']] as const).map(([key,label])=>
            <label key={key} className="block space-y-1"><span className="text-xs text-gray-300 font-semibold">{label}</span>
              <select value={appearance[key]||''} onChange={e=>update({[key]:e.target.value||undefined})}
                className="w-full rounded-xl bg-[#0b0b0f] border border-white/15 px-3 py-2.5 text-white text-sm">
                {fonts.map(font=><option key={font} value={font}>{font||'Site genelindeki font'}</option>)}
              </select>
            </label>)}
          <NumericField label="Bölüm Başlığı Boyutu" value={appearance.headingSize} min={18} max={64} unit="px" onChange={v=>update({headingSize:v})}/>
          <NumericField label="Kart Başlığı Boyutu" value={appearance.cardTitleSize} min={14} max={40} unit="px" onChange={v=>update({cardTitleSize:v})}/>
          <NumericField label="Metin Boyutu" value={appearance.textSize} min={11} max={24} unit="px" onChange={v=>update({textSize:v})}/>
          <NumericField label="Köşe Yuvarlaklığı" value={appearance.radius} min={0} max={36} unit="px" onChange={v=>update({radius:v})}/>
        </div>
      </div>
      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-sm text-white font-bold flex gap-2 items-center"><Layers size={16} className="text-[#ff8c42]"/> Gölge Ayarları</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <NumericField label="Gölge Yoğunluğu" value={appearance.shadowOpacity} min={0} max={100} unit="%" onChange={v=>update({shadowOpacity:v})}/>
          <NumericField label="Gölge Yumuşaklığı" value={appearance.shadowBlur} min={0} max={80} unit="px" onChange={v=>update({shadowBlur:v})}/>
        </div>
      </div>
      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-xs font-bold text-gray-300">Tasarım Önizlemesi</p>
        <div className={demo.className+" overflow-hidden rounded-xl border border-white/10 p-4"}
          style={{...demo.style,backgroundColor:cleanColor(appearance.backgroundColor)||'#151520'}}>
          <div className="studio-section-preview">
            <h2 className="studio-demo-heading mb-1 font-bold text-xl" style={{color:cleanColor(appearance.headingColor)||'#f1f1f4',fontFamily:appearance.headingFont||'inherit',fontSize:appearance.headingSize}}>Örnek Başlık</h2>
            <div className="studio-demo-card mt-3 rounded-lg border border-white/10 p-4"
              style={{backgroundColor:cleanColor(appearance.cardColor)||'#121218',
                borderColor:cleanColor(appearance.borderColor)||'rgba(255,255,255,.14)',
                borderRadius:appearance.radius,
                boxShadow:demo.style['--section-shadow']}}>
              <h3 className="font-bold mb-1" style={{color:cleanColor(appearance.headingColor)||'#fff',fontSize:appearance.cardTitleSize}}>Örnek İçerik</h3>
              <p className="text-sm" style={{color:cleanColor(appearance.textColor)||'#a1a1aa',fontSize:appearance.textSize,fontFamily:appearance.bodyFont||'inherit'}}>Yazı, gölge ve renk değişikliklerini bu kutuda görebilirsiniz.</p>
              <span className="inline-block mt-3 py-2 px-4 rounded-lg text-xs font-semibold"
                style={{backgroundColor:cleanColor(appearance.buttonColor)||cleanColor(appearance.accentColor)||'#ff5a1f',
                  color:cleanColor(appearance.buttonTextColor)||'#fff'}}>Detayları Gör</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button type="button" onClick={()=>onChange({})} className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-gray-200 text-xs font-semibold">
          <RotateCcw size={15}/> Bu Bloğu Sıfırla
        </button>
        {onApplyAll&&<button type="button" onClick={()=>{if(window.confirm('Bu bloğun görünüm ayarları diğer bütün bloklara da uygulansın mı?'))onApplyAll({...appearance})}}
          className="inline-flex items-center gap-2 rounded-xl bg-[#ff5a1f]/20 hover:bg-[#ff5a1f]/30 border border-[#ff5a1f]/30 px-4 py-2.5 text-[#ffae82] text-xs font-semibold">
          <Copy size={15}/> Tüm Bloklara Uygula
        </button>}
      </div>
      <p className="text-[11px] text-gray-500">Değişiklikler taslağa eklenir. Ziyaretçiler ancak Taslağı Kaydet ve Yayınla adımlarından sonra görür.</p>
    </div>
  </details>;
};
