(()=>{var e={};e.id=1112,e.ids=[1112],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},83502:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>d,routeModule:()=>p,tree:()=>c}),a(20667),a(50311),a(45347);var s=a(37164),r=a(93666),o=a(94558),i=a.n(o),n=a(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);a.d(t,l);let c=["",{children:["sports",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,20667)),"/Users/deprof/www/azeebo+/apps/web/src/app/sports/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/sports/page.tsx"],m="/sports/page",x={require:a,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/sports/page",pathname:"/sports",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},11037:(e,t,a)=>{Promise.resolve().then(a.bind(a,35850))},35850:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>m});var s=a(48003),r=a(25249),o=a(76836),i=a(39744),n=a(83386),l=a(21692);let c=[{id:"1",team1:"Super Eagles",team2:"Black Stars",date:"Today, 7:00 PM",venue:"Lagos National Stadium",team1Logo:"SE",team2Logo:"BS",isLive:!0,score1:1,score2:0},{id:"2",team1:"Bafana Bafana",team2:"Indomitable Lions",date:"Tomorrow, 5:00 PM",venue:"Johannesburg Stadium",team1Logo:"BB",team2Logo:"IL",isLive:!1,score1:null,score2:null},{id:"3",team1:"Atlas Lions",team2:"Desert Foxes",date:"Dec 20, 8:00 PM",venue:"Casablanca Stadium",team1Logo:"AL",team2Logo:"DF",isLive:!1,score1:null,score2:null}],d=[{id:"1",question:"Who will win Super Eagles vs Black Stars?",options:["Super Eagles","Black Stars","Draw"],endTime:"2h 30m left"},{id:"2",question:"How many goals will be scored in total?",options:["0-1","2-3","4-5","6+"],endTime:"2h 30m left"}];function m(){let{user:e,isAuthenticated:t}=(0,o.useAuth)(),[a,m]=(0,r.useState)(c),[x,p]=(0,r.useState)(d),[u,f]=(0,r.useState)(!0);return(0,s.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[s.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:n.universeColors.sports.primary},children:s.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),s.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:"Azeebo+"})]}),s.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Sports"].map(e=>s.jsx(l.default,{href:"Home"===e?"/":"Sports"===e?"/sports":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Sports"===e?n.universeColors.sports.primary:n.colors.text.secondary},children:e},e))}),s.jsx("div",{className:"flex items-center gap-4",children:t?s.jsx("div",{className:"flex items-center gap-4",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(i.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),s.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(l.default,{href:"/auth/login",children:s.jsx(i.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),s.jsx(l.default,{href:"/auth/register",children:s.jsx(i.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),s.jsx("section",{className:"relative",children:u?s.jsx(i.Skeleton,{height:"500px",className:"w-full"}):s.jsx("div",{className:"relative h-[500px]",style:{background:`linear-gradient(135deg, ${n.universeColors.sports.primary}, ${n.universeColors.sports.secondary})`},children:s.jsx("div",{className:"absolute inset-0 flex items-center justify-center",children:(0,s.jsxs)("div",{className:"text-center px-4",children:[a[0].isLive&&(0,s.jsxs)(i.Badge,{variant:"error",className:"mb-6",children:[s.jsx("span",{className:"w-2 h-2 bg-white rounded-full animate-pulse mr-2"}),"LIVE NOW"]}),(0,s.jsxs)("div",{className:"flex items-center justify-center gap-8 mb-6",children:[(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4",children:s.jsx("span",{className:"text-white text-3xl font-bold",children:a[0].team1Logo})}),s.jsx("h3",{className:"text-xl font-bold text-white",children:a[0].team1})]}),s.jsx("div",{className:"text-center",children:a[0].isLive?(0,s.jsxs)("div",{className:"text-6xl font-bold text-white",children:[a[0].score1," - ",a[0].score2]}):s.jsx("div",{className:"text-4xl font-bold text-white/70",children:"VS"})}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4",children:s.jsx("span",{className:"text-white text-3xl font-bold",children:a[0].team2Logo})}),s.jsx("h3",{className:"text-xl font-bold text-white",children:a[0].team2})]})]}),s.jsx("p",{className:"text-white/80 text-lg mb-6",children:a[0].venue}),(0,s.jsxs)("div",{className:"flex items-center justify-center gap-4",children:[(0,s.jsxs)(i.Button,{size:"lg",variant:"secondary",children:[s.jsx("span",{children:"▶️"})," Watch Live"]}),(0,s.jsxs)(i.Button,{size:"lg",style:{backgroundColor:"white",color:n.universeColors.sports.primary},children:[s.jsx("span",{children:"\uD83C\uDFAF"})," Make Prediction"]})]})]})})})}),(0,s.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[s.jsx("div",{className:"flex items-center justify-between mb-8",children:(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Upcoming Matches"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Don\\'t miss the action"})]})}),s.jsx("div",{className:"space-y-4",children:a.slice(1).map(e=>(0,s.jsxs)(i.Card,{padding:"md",className:"flex items-center justify-between",children:[(0,s.jsxs)("div",{className:"flex items-center gap-6",children:[(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2",children:s.jsx("span",{className:"text-white text-xl font-bold",children:e.team1Logo})}),s.jsx("span",{className:"text-sm",style:{color:n.colors.text.primary},children:e.team1})]}),s.jsx("div",{className:"text-center",children:s.jsx("span",{className:"text-2xl font-bold",style:{color:n.colors.text.secondary},children:"VS"})}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("div",{className:"w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2",children:s.jsx("span",{className:"text-white text-xl font-bold",children:e.team2Logo})}),s.jsx("span",{className:"text-sm",style:{color:n.colors.text.primary},children:e.team2})]})]}),(0,s.jsxs)("div",{className:"text-right",children:[s.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.date}),s.jsx("p",{className:"text-xs text-gray-500",children:e.venue}),s.jsx(i.Button,{variant:"outline",className:"mt-2",children:"Predict"})]})]},e.id))})]}),s.jsx("section",{className:"py-12",style:{backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Prediction Market"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Predict and win rewards"})]}),s.jsx(i.Button,{variant:"ghost",children:"View All"})]}),s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:x.map(e=>(0,s.jsxs)(i.Card,{padding:"md",children:[s.jsx("h3",{className:"text-lg font-bold mb-4",style:{color:n.colors.text.primary},children:e.question}),(0,s.jsxs)("p",{className:"text-sm mb-4",style:{color:n.colors.text.tertiary},children:["⏰ ",e.endTime]}),s.jsx("div",{className:"grid grid-cols-2 gap-3",children:e.options.map((e,t)=>s.jsx(i.Button,{variant:"outline",className:"justify-start",children:e},t))})]},e.id))})]})}),s.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Azeebo+"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),s.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:s.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.generateAnimationsCSS=t.animation=t.duration=t.easing=void 0,t.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},t.duration={instant:75,fast:150,normal:200,slow:300,slower:500},t.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},t.generateAnimationsCSS=()=>`
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
`},83386:(e,t,a)=>{"use strict";var s=Object.create?function(e,t,a,s){void 0===s&&(s=a);var r=Object.getOwnPropertyDescriptor(t,a);(!r||("get"in r?!t.__esModule:r.writable||r.configurable))&&(r={enumerable:!0,get:function(){return t[a]}}),Object.defineProperty(e,s,r)}:function(e,t,a,s){void 0===s&&(s=a),e[s]=t[a]};Object.defineProperty(t,"__esModule",{value:!0}),t.mediaQueries=t.breakpoints=t.gradients=t.themes=t.zIndex=t.transitions=t.shadows=t.borderRadius=t.fontWeightNative=t.fontSizeNative=t.typography=t.spacingNative=t.spacing=t.colors=t.universeColors=void 0,t.generateCSSVariables=function(){let e=[];return Object.entries(t.colors).forEach(([t,a])=>{"object"==typeof a?Object.entries(a).forEach(([a,s])=>{e.push(`  --color-${t}-${a}: ${s};`)}):e.push(`  --color-${t}: ${a};`)}),Object.entries(t.spacing).forEach(([t,a])=>{e.push(`  --spacing-${t}: ${a}px;`)}),Object.entries(t.typography.fontSizes).forEach(([t,a])=>{e.push(`  --font-size-${t}: ${a}px;`)}),Object.entries(t.typography.fontWeights).forEach(([t,a])=>{e.push(`  --font-weight-${t}: ${a};`)}),Object.entries(t.typography.lineHeights).forEach(([t,a])=>{e.push(`  --line-height-${t}: ${a};`)}),Object.entries(t.borderRadius).forEach(([t,a])=>{e.push(`  --radius-${t}: ${9999===a?"9999px":`${a}px`};`)}),Object.entries(t.shadows).forEach(([t,a])=>{e.push(`  --shadow-${t}: ${a};`)}),Object.entries(t.transitions).forEach(([t,a])=>{e.push(`  --transition-${t}: ${a};`)}),Object.entries(t.zIndex).forEach(([t,a])=>{e.push(`  --z-${t}: ${a};`)}),`:root {
${e.join("\n")}
}`},t.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},t.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},t.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},t.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},t.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},t.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},t.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},t.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},t.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},t.themes={dark:{background:t.colors.dark[900],surface:t.colors.dark[800],card:t.colors.dark[700],border:t.colors.dark[600],text:t.colors.light[50],textSecondary:t.colors.light[100],textMuted:t.colors.light[300]},light:{background:t.colors.light[50],surface:t.colors.light[100],card:t.colors.light[50],border:t.colors.light[400],text:t.colors.dark[900],textSecondary:t.colors.dark[700],textMuted:t.colors.dark[400]}},t.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},t.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},t.mediaQueries={sm:`@media (min-width: ${t.breakpoints.sm}px)`,md:`@media (min-width: ${t.breakpoints.md}px)`,lg:`@media (min-width: ${t.breakpoints.lg}px)`,xl:`@media (min-width: ${t.breakpoints.xl}px)`,"2xl":`@media (min-width: ${t.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,t){for(var a in e)"default"===a||Object.prototype.hasOwnProperty.call(t,a)||s(t,e,a)}(a(34210),t)},20667:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>s});let s=(0,a(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/sports/page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[3672,4236,1692,4992,4518,9744],()=>a(83502));module.exports=s})();