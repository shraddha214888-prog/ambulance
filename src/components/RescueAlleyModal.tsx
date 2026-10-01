import React from 'react';
import { Language } from '../locales/translations';
import { X, ShieldCheck, AlertTriangle, ArrowRight, HeartPulse, Info } from 'lucide-react';

interface RescueAlleyModalProps {
  isOpen: boolean;
  lang?: Language;
  onClose: () => void;
}

export const RescueAlleyModal: React.FC<RescueAlleyModalProps> = ({ isOpen, lang = 'en', onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-white tracking-wide">
              {lang === 'gu' ? 'ઇમરજન્સી કોરિડોર પ્રોટોકોલ અને ગોલ્ડન અવર' : 'Emergency Corridor Protocol & The Golden Hour'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Key Insight Box */}
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-white block mb-0.5">
                {lang === 'gu' ? 'સાયરન અવાજનો બ્લાઇન્ડસ્પોટ:' : 'The Acoustic Siren Blindspot:'}
              </span>
              {lang === 'gu'
                ? 'આજના આધુનિક સાઉન્ડપ્રૂફ વાહનોમાં એસી અને મ્યુઝિકના કારણે એમ્બ્યુલન્સની સાયરન ફક્ત ૫૦ મીટર નજીક હોય ત્યારે જ સંભળાય છે (જે અચાનક બ્રેકિંગ અને અકસ્માત સર્જે છે). ઓરાપલ્સ V2X પ્રી-એલર્ટ ૭૫૦+ મીટર અગાઉથી ચેતવણી આપીને શાંતિપૂર્ણ રીતે ૩૦-૪૫ સેકન્ડ અગાઉ રસ્તો ખાલી કરાવે છે.'
                : 'Modern sound-insulated vehicles with cabin entertainment reduce acoustic siren detection range to under 50 meters (less than 3 seconds before intercept). AuraPulse V2X Pre-Alert extends awareness to 750+ meters, providing 30 to 45 seconds of calm, coordinated clearance.'}
            </div>
          </div>

          {/* Lane Rules Diagram */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'gu' ? 'રસ્તા પર જગ્યા આપવાના આંતરરાષ્ટ્રીય નિયમો (Rescue Alley):' : 'Standard Rescue Alley ("Rettungsgasse") Allocation:'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  {lang === 'gu' ? '૨-લેન રસ્તાઓ પર' : '2-Lane Roads'}
                </span>
                <p className="text-slate-400 leading-normal">
                  {lang === 'gu'
                    ? 'ડાબી લેન વાળા ડાબી બાજુ અને જમણી લેન વાળા છેક જમણી બાજુ ખસે છે, જેથી વચ્ચે એક સીધો ખુલ્લો ઇમરજન્સી માર્ગ બને છે.'
                    : 'Left lane moves as far left as possible onto the verge. Right lane moves as far right as possible onto the shoulder, creating a clear central alleyway.'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block mb-1">
                  {lang === 'gu' ? '૩ કે તેથી વધુ લેન વાળા હાઇવે' : '3+ Lane Arterials / Highways'}
                </span>
                <p className="text-slate-400 leading-normal">
                  {lang === 'gu'
                    ? 'સૌથી ડાબી બાજુની લેન ડાબી તરફ રહે છે, જ્યારે વચ્ચેની અને જમણી બધી લેન જમણી તરફ ખસે છે, જેથી દર્દી માટે ગ્રીન કોરિડોર રચાય છે.'
                    : 'The leftmost lane moves left. All other lanes (center, right, and slow lanes) shift to their right. The emergency alley is always formed between the leftmost lane and the adjacent lane.'}
                </p>
              </div>
            </div>
          </div>

          {/* What to do & what not to do */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/50">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'gu' ? 'શું કરવું (યોગ્ય પદ્ધતિ)' : 'DO: Best Practices'}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>{lang === 'gu' ? '• ચેતવણી અવાજ સંભળાતા જ તરત જમણી સાઈડ લાઈટ (ઇન્ડિકેટર) આપો.' : '• Signal your turn indicator immediately when alert sounds.'}</li>
                <li>{lang === 'gu' ? '• પાછળ આવી રહેલા બાઇક કે અન્ય વાહનો માટે સાઇડ મિરર જુઓ.' : '• Check mirrors for trailing emergency escorts.'}</li>
                <li>{lang === 'gu' ? '• અચાનક બ્રેક મારવાને બદલે ધીમેથી વાહન ધીમું કરો.' : '• Slow down progressively without locking brakes.'}</li>
                <li>{lang === 'gu' ? '• એમ્બ્યુલન્સ પસાર ન થઈ જાય ત્યાં સુધી જમણી બાજુ જ ઊભા રહો.' : '• Remain stopped on shoulder until all emergency vehicles pass.'}</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/50">
              <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{lang === 'gu' ? 'શું ન કરવું (ખતરનાક ભૂલો)' : "DON'T: Critical Hazards"}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>{lang === 'gu' ? '• ચાલુ રસ્તાની વચ્ચોવચ અચાનક ગાડી ન રોકો.' : '• Never slam on brakes in the middle of a live lane.'}</li>
                <li>{lang === 'gu' ? '• ટ્રાફિક સિગ્નલ કે ચાર રસ્તાની વચ્ચે વાહન ઊભું ન રાખો.' : '• Do not pull into cross-traffic or block intersections.'}</li>
                <li>{lang === 'gu' ? '• એમ્બ્યુલન્સની પાછળ પાછળ દોડીને ટ્રાફિક કાપવાનો પ્રયત્ન ન કરો.' : '• Never tailgate behind an ambulance to skip traffic.'}</li>
                <li>{lang === 'gu' ? '• એક વાહન નીકળી ગયા પછી તરત જ રસ્તા પર પાછા ન આવો.' : '• Do not merge back onto the road immediately after one unit passes.'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {lang === 'gu' ? 'સમજાઈ ગયું' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};
