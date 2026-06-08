(()=>{var e={};e.id=9423,e.ids=[9423],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},49815:(e,a,s)=>{"use strict";s.r(a),s.d(a,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),s(71217),s(50311),s(45347);var t=s(37164),r=s(93666),i=s(94558),o=s.n(i),n=s(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(a,l);let c=["",{children:["games",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,71217)),"/Users/deprof/www/azeebo+/apps/web/src/app/games/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/games/page.tsx"],m="/games/page",p={require:s,loadChunk:()=>Promise.resolve()},x=new t.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/games/page",pathname:"/games",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},18750:(e,a,s)=>{Promise.resolve().then(s.bind(s,94974))},94974:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>p});var t=s(48003),r=s(25249),i=s(76836),o=s(39744),n=s(83386),l=s(21692),c=s(8426);let d=[{id:"1",title:"African Quest",description:"An adventure puzzle game exploring African landmarks",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=adventure%20puzzle%20game%20african%20landmarks%20colorful&image_size=landscape_16_9",players:"1-4",rating:4.8,isPremium:!0,genre:"Puzzle"},{id:"2",title:"Naija Street Race",description:"High-speed racing through the streets of Lagos",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=street%20racing%20game%20lagos%20nigeria%20high%20speed&image_size=landscape_16_9",players:"1-8",rating:4.6,isPremium:!1,genre:"Racing"},{id:"3",title:"Savanna Safari",description:"A wildlife simulation game set in the African savanna",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=safari%20wildlife%20simulation%20game%20african%20savanna%20animals&image_size=landscape_16_9",players:"1",rating:4.7,isPremium:!1,genre:"Simulation"}],m=[{id:"1",name:"GameMaster",score:245800,level:45,avatar:"GM"},{id:"2",name:"ProPlayer",score:218500,level:42,avatar:"PP"},{id:"3",name:"NaijaGamer",score:198200,level:38,avatar:"NG"},{id:"4",name:"LagosKing",score:187400,level:36,avatar:"LK"},{id:"5",name:"ZaraPlays",score:176300,level:35,avatar:"ZP"}];function p(){let{user:e,isAuthenticated:a}=(0,i.useAuth)(),{isUniverseEnabled:s,hasFeature:p}=(0,c.Bp)(),{getSetting:x}=(0,c.rV)(),u=x("site_name","Azeebo+");s("games"),p("games","streaming_enabled"),p("games","tournaments_enabled");let[f,g]=(0,r.useState)(d),[h,b]=(0,r.useState)(m),[y,v]=(0,r.useState)(!0);return(0,t.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[t.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:n.universeColors.games.primary},children:t.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),t.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:u})]}),t.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Games"].map(e=>t.jsx(l.default,{href:"Home"===e?"/":"Games"===e?"/games":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Games"===e?n.universeColors.games.primary:n.colors.text.secondary},children:e},e))}),t.jsx("div",{className:"flex items-center gap-4",children:a?t.jsx("div",{className:"flex items-center gap-4",children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[t.jsx(o.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),t.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[t.jsx(l.default,{href:"/auth/login",children:t.jsx(o.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),t.jsx(l.default,{href:"/auth/register",children:t.jsx(o.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),t.jsx("section",{className:"relative",children:y?t.jsx(o.Skeleton,{height:"500px",className:"w-full"}):(0,t.jsxs)("div",{className:"relative h-[500px]",children:[t.jsx("img",{src:f[0].thumbnail,alt:f[0].title,className:"w-full h-full object-cover"}),t.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"}),(0,t.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto",children:[(0,t.jsxs)("div",{className:"flex items-center gap-2 mb-4",children:[f[0].isPremium&&t.jsx(o.Badge,{variant:"success",children:"Premium"}),t.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4",style:{backgroundColor:`${n.universeColors.games.primary}30`,color:n.universeColors.games.primary},children:f[0].genre})]}),t.jsx("h2",{className:"text-4xl font-bold text-white mb-2",children:f[0].title}),t.jsx("p",{className:"text-gray-300 text-lg mb-6 max-w-2xl",children:f[0].description}),(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[(0,t.jsxs)(o.Button,{size:"lg",style:{backgroundColor:n.universeColors.games.primary},children:[t.jsx("span",{children:"\uD83C\uDFAE"})," Play Now"]}),(0,t.jsxs)(o.Button,{size:"lg",variant:"secondary",children:[t.jsx("span",{children:"\uD83D\uDCCA"})," Leaderboard"]})]})]})]})}),(0,t.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[t.jsx("div",{className:"flex items-center justify-between mb-8",children:(0,t.jsxs)("div",{children:[t.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Featured Games"}),t.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Play and earn rewards"})]})}),t.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:f.map(e=>(0,t.jsxs)(o.Card,{padding:"none",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,t.jsxs)("div",{className:"relative",children:[t.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-48 object-cover"}),e.isPremium&&t.jsx(o.Badge,{variant:"success",className:"absolute top-2 right-2",children:"Premium"}),t.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"}),(0,t.jsxs)("div",{className:"absolute bottom-4 left-4 right-4",children:[t.jsx(o.Badge,{variant:"outline",className:"mb-2",children:e.genre}),t.jsx("h3",{className:"text-xl font-bold text-white",children:e.title})]})]}),(0,t.jsxs)("div",{className:"p-4",children:[t.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),(0,t.jsxs)("div",{className:"flex items-center justify-between text-sm text-gray-400 mb-4",children:[(0,t.jsxs)("span",{children:["\uD83D\uDC65 ",e.players," players"]}),(0,t.jsxs)("span",{children:["⭐ ",e.rating]})]}),t.jsx(o.Button,{variant:"primary",className:"w-full",style:{backgroundColor:n.universeColors.games.primary},children:"Play Now"})]})]},e.id))})]}),t.jsx("section",{className:"py-12",style:{backgroundColor:n.colors.bg.secondary},children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,t.jsxs)("div",{children:[t.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Top Players"}),t.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Compete and climb the ranks"})]}),t.jsx(o.Button,{variant:"ghost",children:"View All"})]}),t.jsx(o.Card,{padding:"md",children:t.jsx("div",{className:"space-y-4",children:h.map((e,a)=>(0,t.jsxs)("div",{className:"flex items-center gap-4 p-4 rounded-lg",style:{backgroundColor:a<3?`${n.universeColors.games.primary}20`:"transparent"},children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[t.jsx("span",{className:"w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",style:{backgroundColor:0===a?"#FFD700":1===a?"#C0C0C0":2===a?"#CD7F32":n.colors.bg.tertiary,color:a<3?"#000":n.colors.text.primary},children:a+1}),t.jsx(o.Avatar,{size:"md",fallback:e.avatar})]}),(0,t.jsxs)("div",{className:"flex-1",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-1",children:[t.jsx("span",{className:"font-medium",style:{color:n.colors.text.primary},children:e.name}),(0,t.jsxs)("span",{className:"text-sm",style:{color:n.colors.text.secondary},children:["Lvl ",e.level]})]}),(0,t.jsxs)("span",{className:"text-sm font-bold",style:{color:n.universeColors.games.primary},children:[e.score.toLocaleString()," points"]})]})]},e.id))})})]})}),t.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:u}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),t.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:(0,t.jsxs)("p",{children:["\xa9 2026 ",u,". All rights reserved."]})})]})})]})}},8426:(e,a,s)=>{"use strict";a.Bp=function(){let[e,a]=(0,t.useState)([]),[s,o]=(0,t.useState)(!0),[n,l]=(0,t.useState)(null);(0,t.useEffect)(()=>{(async()=>{try{o(!0);let e=await r.api.request("/v1/public/universes");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch universes")}catch(e){i.webLogger.error("Failed to fetch universes",e),l(e.message||"Failed to fetch universes")}finally{o(!1)}})()},[]);let c=a=>e.find(e=>e.name===a);return{universes:e,isLoading:s,error:n,getUniverse:c,isUniverseEnabled:a=>e.some(e=>e.name===a),hasFeature:(e,a)=>{let s=c(e);return!!s&&s.featureFlags.some(e=>e.key===a)}}},a.rV=function(){let[e,a]=(0,t.useState)({}),[s,o]=(0,t.useState)(!0),[n,l]=(0,t.useState)(null);return(0,t.useEffect)(()=>{(async()=>{try{o(!0);let e=await r.api.request("/v1/public/settings");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch settings")}catch(e){i.webLogger.error("Failed to fetch settings",e),l(e.message||"Failed to fetch settings")}finally{o(!1)}})()},[]),{settings:e,isLoading:s,error:n,getSetting:(a,s)=>a in e?e[a]:s}};let t=s(25249),r=s(55785),i=s(7538)},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
`},83386:(e,a,s)=>{"use strict";var t=Object.create?function(e,a,s,t){void 0===t&&(t=s);var r=Object.getOwnPropertyDescriptor(a,s);(!r||("get"in r?!a.__esModule:r.writable||r.configurable))&&(r={enumerable:!0,get:function(){return a[s]}}),Object.defineProperty(e,t,r)}:function(e,a,s,t){void 0===t&&(t=s),e[t]=a[s]};Object.defineProperty(a,"__esModule",{value:!0}),a.mediaQueries=a.breakpoints=a.gradients=a.themes=a.zIndex=a.transitions=a.shadows=a.borderRadius=a.fontWeightNative=a.fontSizeNative=a.typography=a.spacingNative=a.spacing=a.colors=a.universeColors=void 0,a.generateCSSVariables=function(){let e=[];return Object.entries(a.colors).forEach(([a,s])=>{"object"==typeof s?Object.entries(s).forEach(([s,t])=>{e.push(`  --color-${a}-${s}: ${t};`)}):e.push(`  --color-${a}: ${s};`)}),Object.entries(a.spacing).forEach(([a,s])=>{e.push(`  --spacing-${a}: ${s}px;`)}),Object.entries(a.typography.fontSizes).forEach(([a,s])=>{e.push(`  --font-size-${a}: ${s}px;`)}),Object.entries(a.typography.fontWeights).forEach(([a,s])=>{e.push(`  --font-weight-${a}: ${s};`)}),Object.entries(a.typography.lineHeights).forEach(([a,s])=>{e.push(`  --line-height-${a}: ${s};`)}),Object.entries(a.borderRadius).forEach(([a,s])=>{e.push(`  --radius-${a}: ${9999===s?"9999px":`${s}px`};`)}),Object.entries(a.shadows).forEach(([a,s])=>{e.push(`  --shadow-${a}: ${s};`)}),Object.entries(a.transitions).forEach(([a,s])=>{e.push(`  --transition-${a}: ${s};`)}),Object.entries(a.zIndex).forEach(([a,s])=>{e.push(`  --z-${a}: ${s};`)}),`:root {
${e.join("\n")}
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var s in e)"default"===s||Object.prototype.hasOwnProperty.call(a,s)||t(a,e,s)}(s(34210),a)},71217:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>t});let t=(0,s(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/games/page.tsx#default`)}};var a=require("../../webpack-runtime.js");a.C(e);var s=e=>a(a.s=e),t=a.X(0,[3672,4236,1692,4992,4518,9744],()=>s(49815));module.exports=t})();