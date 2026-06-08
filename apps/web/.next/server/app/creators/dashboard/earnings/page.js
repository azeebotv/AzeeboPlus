(()=>{var e={};e.id=4620,e.ids=[4620],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},20383:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>d,routeModule:()=>p,tree:()=>c}),t(54058),t(50311),t(45347);var r=t(37164),s=t(93666),o=t(94558),n=t.n(o),i=t(78838),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);t.d(a,l);let c=["",{children:["creators",{children:["dashboard",{children:["earnings",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,54058)),"/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/earnings/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/earnings/page.tsx"],m="/creators/dashboard/earnings/page",x={require:t,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/creators/dashboard/earnings/page",pathname:"/creators/dashboard/earnings",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},97890:(e,a,t)=>{Promise.resolve().then(t.bind(t,51879))},51879:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>x});var r=t(48003),s=t(25249),o=t(76836),n=t(39744),i=t(83386),l=t(7538),c=t(55785),d=t(21692);let m=["Overview","Content","Analytics","Earnings","Settings"];function x(){let{user:e,isAuthenticated:a}=(0,o.useAuth)(),[t,x]=(0,s.useState)({totalEarnings:0,pendingPayout:0,thisMonth:0,lastMonth:0,currency:"NGN"}),[p,u]=(0,s.useState)([]),[h,f]=(0,s.useState)({nextPayoutDate:"2026-06-15",frequency:"Monthly",method:"Bank Transfer",minimumPayout:5e3}),[g,b]=(0,s.useState)(!0),[y,j]=(0,s.useState)(null),[v,w]=(0,s.useState)(!1),N=(0,s.useCallback)(async()=>{try{b(!0),j(null);let[e,a]=await Promise.all([c.api.wallet.getBalance(),c.api.wallet.getTransactions(1,20)]);if(e.success&&e.data){let a=e.data;x({totalEarnings:a.balance,pendingPayout:a.pendingBalance||0,thisMonth:Math.floor(.3*a.balance),lastMonth:Math.floor(.25*a.balance),currency:a.currency||"NGN"})}a.success&&a.data&&u(a.data.items)}catch(a){let e=a instanceof Error?a.message:"Failed to load earnings data";l.webLogger.error("Creator earnings fetch failed",{error:e}),j(e)}finally{b(!1)}},[]),k=async()=>{try{w(!0),(await c.api.wallet.fundWallet(t.pendingPayout,"bank_transfer")).success&&(l.webLogger.log("Withdrawal initiated",{amount:t.pendingPayout}),await N())}catch(a){let e=a instanceof Error?a.message:"Withdrawal failed";l.webLogger.error("Withdrawal failed",{error:e}),j(e)}finally{w(!1)}},C=e=>`₦${e.toLocaleString()}`,P=()=>{if(0===t.lastMonth)return"+0%";let e=(t.thisMonth-t.lastMonth)/t.lastMonth*100;return`${e>=0?"+":""}${e.toFixed(0)}%`};return(0,r.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:i.colors.bg.primary},children:[r.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:i.universeColors.creators.primary},children:r.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),r.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:i.colors.text.primary},children:"Creator Dashboard"})]}),r.jsx("nav",{className:"hidden md:flex items-center gap-8",children:m.map(e=>r.jsx(d.default,{href:`/creators/dashboard/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Earnings"===e?i.colors.primary[500]:i.colors.text.secondary},children:e},e))}),r.jsx("div",{className:"flex items-center gap-4",children:a?(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(n.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),r.jsx("span",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:e?.name})]}):r.jsx(d.default,{href:"/auth/login",children:r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Sign In"})})})]})}),r.jsx("section",{className:"py-12",style:{background:i.gradients.primary},children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:g?r.jsx(n.Skeleton,{height:"180px",className:"w-full"}):(0,r.jsxs)("div",{className:"text-center",children:[r.jsx("p",{className:"text-white/80 mb-2",children:"Total Earnings"}),r.jsx("h2",{className:"text-5xl sm:text-6xl font-bold text-white mb-4",children:C(t.totalEarnings)}),(0,r.jsxs)("div",{className:"flex items-center justify-center gap-6 mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"text-white/60 text-sm",children:"This Month"}),r.jsx("p",{className:"text-white font-bold text-lg",children:C(t.thisMonth)})]}),r.jsx("div",{className:"w-px h-10 bg-white/30"}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"text-white/60 text-sm",children:"Pending"}),r.jsx("p",{className:"text-white font-bold text-lg",children:C(t.pendingPayout)})]}),r.jsx("div",{className:"w-px h-10 bg-white/30"}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"text-white/60 text-sm",children:"Growth"}),r.jsx("p",{className:"text-white font-bold text-lg",children:P()})]})]}),r.jsx(n.Button,{size:"lg",style:{backgroundColor:"white",color:i.colors.primary[600]},onClick:k,disabled:v||t.pendingPayout<=0,children:v?"Processing...":"\uD83D\uDCB0 Withdraw Earnings"})]})})}),(0,r.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[y&&(0,r.jsxs)("div",{className:"mb-8 p-4 rounded-lg border flex items-center justify-between",style:{backgroundColor:`${i.colors.warning[500]}10`,borderColor:i.colors.warning[500]},children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("span",{className:"text-xl",children:"⚠️"}),r.jsx("p",{style:{color:i.colors.text.primary},children:y})]}),r.jsx(n.Button,{variant:"outline",size:"sm",onClick:N,children:"Retry"})]}),(0,r.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-8",children:[(0,r.jsxs)("div",{className:"lg:col-span-2",children:[r.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:i.colors.text.primary},children:"Transaction History"}),g?r.jsx("div",{className:"space-y-4",children:Array.from({length:5}).map((e,a)=>r.jsx(n.Skeleton,{height:"72px",className:"rounded-lg"},a))}):0===p.length?r.jsx(n.Card,{padding:"md",children:(0,r.jsxs)("div",{className:"text-center py-8",children:[r.jsx("span",{className:"text-4xl mb-4 block",children:"\uD83D\uDCB8"}),r.jsx("p",{style:{color:i.colors.text.secondary},children:"No transactions yet. Start creating content to earn!"})]})}):r.jsx(n.Card,{padding:"md",children:r.jsx("div",{className:"space-y-1",children:p.map(e=>(0,r.jsxs)("div",{className:"flex items-center justify-between py-4 border-b last:border-0",style:{borderColor:i.colors.border.light},children:[(0,r.jsxs)("div",{className:"flex items-center gap-4",children:[r.jsx("div",{className:"w-10 h-10 rounded-full flex items-center justify-center",style:{backgroundColor:"credit"===e.type?`${i.colors.success[500]}20`:`${i.colors.warning[500]}20`},children:r.jsx("span",{children:"credit"===e.type?"⬆️":"⬇️"})}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"font-medium text-sm",style:{color:i.colors.text.primary},children:e.description||("credit"===e.type?"Earnings Credit":"Payout")}),r.jsx("p",{className:"text-xs",style:{color:i.colors.text.tertiary},children:new Date(e.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})})]})]}),(0,r.jsxs)("div",{className:"text-right",children:[(0,r.jsxs)("p",{className:"font-bold",style:{color:"credit"===e.type?i.colors.success[500]:i.colors.text.primary},children:["credit"===e.type?"+":"-",C(e.amount)]}),r.jsx(n.Badge,{variant:"completed"===e.status?"success":"pending"===e.status?"warning":"outline",children:e.status})]})]},e.id))})})]}),(0,r.jsxs)("div",{children:[r.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:i.colors.text.primary},children:"Payout Schedule"}),g?r.jsx(n.Skeleton,{height:"300px",className:"rounded-lg"}):r.jsx(n.Card,{padding:"md",children:(0,r.jsxs)("div",{className:"space-y-6",children:[(0,r.jsxs)("div",{children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"Next Payout"}),r.jsx("p",{className:"font-bold text-lg",style:{color:i.colors.text.primary},children:new Date(h.nextPayoutDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})})]}),(0,r.jsxs)("div",{className:"border-t pt-4",style:{borderColor:i.colors.border.light},children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"Frequency"}),r.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:h.frequency})]}),(0,r.jsxs)("div",{className:"border-t pt-4",style:{borderColor:i.colors.border.light},children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"Payout Method"}),r.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:h.method})]}),(0,r.jsxs)("div",{className:"border-t pt-4",style:{borderColor:i.colors.border.light},children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"Minimum Payout"}),r.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:C(h.minimumPayout)})]}),r.jsx("div",{className:"border-t pt-4",style:{borderColor:i.colors.border.light},children:r.jsx(n.Button,{variant:"outline",className:"w-full",children:"⚙️ Update Payout Settings"})})]})}),r.jsx("div",{className:"mt-6 space-y-4",children:g?(0,r.jsxs)(r.Fragment,{children:[r.jsx(n.Skeleton,{height:"80px",className:"rounded-lg"}),r.jsx(n.Skeleton,{height:"80px",className:"rounded-lg"})]}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(n.Card,{padding:"md",children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"This Month"}),r.jsx("p",{className:"text-xl font-bold",style:{color:i.colors.text.primary},children:C(t.thisMonth)}),(0,r.jsxs)(n.Badge,{variant:"success",className:"mt-2",children:[P()," vs last month"]})]}),(0,r.jsxs)(n.Card,{padding:"md",children:[r.jsx("p",{className:"text-sm mb-1",style:{color:i.colors.text.tertiary},children:"Last Month"}),r.jsx("p",{className:"text-xl font-bold",style:{color:i.colors.text.primary},children:C(t.lastMonth)})]})]})})]})]})]}),r.jsx("footer",{className:"border-t py-12 mt-12",style:{borderColor:i.colors.border.light,backgroundColor:i.colors.bg.secondary},children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:i.colors.border.light,color:i.colors.text.tertiary},children:r.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-up {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slide-down {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slide-left {
  from { 
    opacity: 0; 
    transform: translateX(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slide-right {
  from { 
    opacity: 0; 
    transform: translateX(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes scale-in {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

@keyframes scale-out {
  from { 
    opacity: 1; 
    transform: scale(1); 
  }
  to { 
    opacity: 0; 
    transform: scale(0.95); 
  }
}

@keyframes bounce-in {
  0% { 
    opacity: 0; 
    transform: scale(0.3); 
  }
  50% { 
    transform: scale(1.05); 
  }
  70% { 
    transform: scale(0.9); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1); 
  }
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
  }
  50% { 
    opacity: 0.5; 
  }
}

@keyframes spin {
  from { 
    transform: rotate(0deg); 
  }
  to { 
    transform: rotate(360deg); 
  }
}

@keyframes shake {
  0%, 100% { 
    transform: translateX(0); 
  }
  10%, 30%, 50%, 70%, 90% { 
    transform: translateX(-5px); 
  }
  20%, 40%, 60%, 80% { 
    transform: translateX(5px); 
  }
}

@keyframes wobble {
  0% { 
    transform: translateX(0); 
  }
  15% { 
    transform: translateX(-25%) rotate(-5deg); 
  }
  30% { 
    transform: translateX(20%) rotate(3deg); 
  }
  45% { 
    transform: translateX(-15%) rotate(-3deg); 
  }
  60% { 
    transform: translateX(10%) rotate(2deg); 
  }
  75% { 
    transform: translateX(-5%) rotate(-1deg); 
  }
  100% { 
    transform: translateX(0); 
  }
}

.animate-fade-in {
  animation: fade-in var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.animate-fade-out {
  animation: fade-out var(--transition-duration-normal, 200ms) var(--transition-ease-in, ease-in);
}

.animate-slide-up {
  animation: slide-up var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.animate-slide-down {
  animation: slide-down var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.animate-slide-left {
  animation: slide-left var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.animate-slide-right {
  animation: slide-right var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.animate-scale-in {
  animation: scale-in var(--transition-duration-normal, 200ms) var(--transition-ease-out-back, cubic-bezier(0.175, 0.885, 0.32, 1.275));
}

.animate-scale-out {
  animation: scale-out var(--transition-duration-fast, 150ms) var(--transition-ease-in, ease-in);
}

.animate-bounce-in {
  animation: bounce-in var(--transition-duration-slow, 300ms) var(--transition-ease-out-back, cubic-bezier(0.175, 0.885, 0.32, 1.275));
}

.animate-pulse {
  animation: pulse var(--transition-duration-slow, 300ms) var(--transition-ease-in-out, ease-in-out) infinite;
}

.animate-spin {
  animation: spin var(--transition-duration-slow, 300ms) var(--transition-linear, linear) infinite;
}

.animate-shake {
  animation: shake var(--transition-duration-normal, 200ms) var(--transition-ease-in-out, ease-in-out);
}

.animate-wobble {
  animation: wobble var(--transition-duration-slow, 300ms) var(--transition-ease-in-out, ease-in-out);
}

.transition-all {
  transition: all var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.transition-colors {
  transition: color var(--transition-duration-fast, 150ms) var(--transition-ease-out, ease-out),
              background-color var(--transition-duration-fast, 150ms) var(--transition-ease-out, ease-out),
              border-color var(--transition-duration-fast, 150ms) var(--transition-ease-out, ease-out);
}

.transition-transform {
  transition: transform var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}

.transition-opacity {
  transition: opacity var(--transition-duration-fast, 150ms) var(--transition-ease-out, ease-out);
}

.transition-shadow {
  transition: box-shadow var(--transition-duration-normal, 200ms) var(--transition-ease-out, ease-out);
}
`},83386:(e,a,t)=>{"use strict";var r=Object.create?function(e,a,t,r){void 0===r&&(r=t);var s=Object.getOwnPropertyDescriptor(a,t);(!s||("get"in s?!a.__esModule:s.writable||s.configurable))&&(s={enumerable:!0,get:function(){return a[t]}}),Object.defineProperty(e,r,s)}:function(e,a,t,r){void 0===r&&(r=t),e[r]=a[t]};Object.defineProperty(a,"__esModule",{value:!0}),a.mediaQueries=a.breakpoints=a.gradients=a.themes=a.zIndex=a.transitions=a.shadows=a.borderRadius=a.fontWeightNative=a.fontSizeNative=a.typography=a.spacingNative=a.spacing=a.colors=a.universeColors=void 0,a.generateCSSVariables=function(){let e=[];return Object.entries(a.colors).forEach(([a,t])=>{"object"==typeof t?Object.entries(t).forEach(([t,r])=>{e.push(`  --color-${a}-${t}: ${r};`)}):e.push(`  --color-${a}: ${t};`)}),Object.entries(a.spacing).forEach(([a,t])=>{e.push(`  --spacing-${a}: ${t}px;`)}),Object.entries(a.typography.fontSizes).forEach(([a,t])=>{e.push(`  --font-size-${a}: ${t}px;`)}),Object.entries(a.typography.fontWeights).forEach(([a,t])=>{e.push(`  --font-weight-${a}: ${t};`)}),Object.entries(a.typography.lineHeights).forEach(([a,t])=>{e.push(`  --line-height-${a}: ${t};`)}),Object.entries(a.borderRadius).forEach(([a,t])=>{e.push(`  --radius-${a}: ${9999===t?"9999px":`${t}px`};`)}),Object.entries(a.shadows).forEach(([a,t])=>{e.push(`  --shadow-${a}: ${t};`)}),Object.entries(a.transitions).forEach(([a,t])=>{e.push(`  --transition-${a}: ${t};`)}),Object.entries(a.zIndex).forEach(([a,t])=>{e.push(`  --z-${a}: ${t};`)}),`:root {
${e.join("\n")}
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var t in e)"default"===t||Object.prototype.hasOwnProperty.call(a,t)||r(a,e,t)}(t(34210),a)},54058:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>r});let r=(0,t(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/earnings/page.tsx#default`)}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[3672,4236,1692,4992,4518,9744],()=>t(20383));module.exports=r})();