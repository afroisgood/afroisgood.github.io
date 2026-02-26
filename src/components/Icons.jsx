// src/components/Icons.jsx

export const IconChevronLeft = ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
export const IconChevronRight = ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
export const IconQuote = ({ size=40, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 21c3 0 7-1 7-8V5H3v8h5c0 2-2 3-5 4v4zm11 0c3 0 7-1 7-8V5h-7v8h5c0 2-2 3-5 4v4z"/></svg>;
export const IconArrowRight = ({ size=16, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
export const IconMaximize = ({ size=20, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>;
export const IconX = ({ size=24, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6L6 18M6 6l12 12"/></svg>;
export const IconPlay = ({ size=16, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
export const IconPause = ({ size=16, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;

export const IconDisc = ({ className, size=24, isPureBlack=false }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="48" fill={isPureBlack ? "#111" : "none"} stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="45" fill="currentColor" fillOpacity={isPureBlack ? "1" : "0.15"} />
        <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
        <circle cx="50" cy="50" r="14" fill="#222" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="3" fill="white" />
    </svg>
);

export const StoneEditorIcon = () => (
    <svg width="28" height="24" viewBox="0 0 100 80" className="text-stone-600">
        <path d="M10,70 C10,30 40,10 70,10 C95,10 95,40 90,70 C85,85 15,85 10,70 Z" fill="currentColor" />
        <circle cx="45" cy="45" r="6" fill="white" />
        <circle cx="45" cy="45" r="2.5" fill="black" />
        <circle cx="70" cy="45" r="6" fill="white" />
        <circle cx="70" cy="45" r="2.5" fill="black" />
        <path d="M50,60 Q57,65 65,60" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);

export const StoneVinylIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
        <path d="M20,80 C20,40 40,20 60,20 C85,20 85,50 80,80" fill="currentColor" />
        <circle cx="45" cy="45" r="5" fill="white" />
        <circle cx="45" cy="45" r="2" fill="black" />
        <circle cx="65" cy="45" r="5" fill="white" />
        <circle cx="65" cy="45" r="2" fill="black" />
        <circle cx="75" cy="60" r="18" fill="black" stroke="white" strokeWidth="2" />
        <circle cx="75" cy="60" r="6" fill="#333" />
        <circle cx="75" cy="60" r="2" fill="white" />
    </svg>
);

export const IconShare = ({ size=16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);

export const IconCheck = ({ size=16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

// 請確保有加上 export 這個關鍵字
export const IconStar = ({ size=16, className, fill="none" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);