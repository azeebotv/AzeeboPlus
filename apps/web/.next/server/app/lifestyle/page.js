(()=>{var e={};e.id=8486,e.ids=[8486],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},38611:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),t(32259),t(50311),t(45347);var s=t(37164),r=t(93666),i=t(94558),o=t.n(i),n=t(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);t.d(a,l);let c=["",{children:["lifestyle",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,32259)),"/Users/deprof/www/azeebo+/apps/web/src/app/lifestyle/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/lifestyle/page.tsx"],m="/lifestyle/page",p={require:t,loadChunk:()=>Promise.resolve()},x=new s.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/lifestyle/page",pathname:"/lifestyle",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},65308:(e,a,t)=>{Promise.resolve().then(t.bind(t,73491))},73491:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>m});var s=t(48003),r=t(25249),i=t(76836),o=t(39744),n=t(83386),l=t(21692);let c=[{id:"1",title:"Lagos Fashion Week",description:"Experience the vibrant fashion scene of Lagos with top African designers",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20runway%20show%20with%20african%20designers%20colorful%20outfits&image_size=landscape_16_9",date:"Dec 15-20, 2026",location:"Lagos, Nigeria",attendees:5e3,category:"Fashion"},{id:"2",title:"Abuja Food Festival",description:"Taste the best culinary creations from across Africa",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=food%20festival%20with%20variety%20of%20african%20dishes%20colorful&image_size=landscape_16_9",date:"Jan 5-8, 2027",location:"Abuja, Nigeria",attendees:3200,category:"Food"},{id:"3",title:"Nairobi Music Festival",description:"Live performances from top African artists",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=music%20concert%20festival%20with%20crowd%20and%20stage%20lights&image_size=landscape_16_9",date:"Feb 10-14, 2027",location:"Nairobi, Kenya",attendees:8e3,category:"Music"}],d=[{id:"1",city:"Lagos",country:"Nigeria",description:"The commercial capital of Nigeria",attractions:45,thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=lagos%20nigeria%20skyline%20modern%20cityscape%20vibrant&image_size=landscape_16_9"},{id:"2",city:"Johannesburg",country:"South Africa",description:"The city of gold",attractions:38,thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=johannesburg%20south%20africa%20city%20skyline%20modern%20buildings&image_size=landscape_16_9"},{id:"3",city:"Accra",country:"Ghana",description:"The capital city of Ghana",attractions:28,thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=accra%20ghana%20cityscape%20coastal%20modern%20buildings&image_size=landscape_16_9"}];function m(){let{user:e,isAuthenticated:a}=(0,i.useAuth)(),[t,m]=(0,r.useState)(c),[p,x]=(0,r.useState)(d),[f,u]=(0,r.useState)(!0);return(0,s.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[s.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:n.universeColors.lifestyle.primary},children:s.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),s.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:"Azeebo+"})]}),s.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Lifestyle"].map(e=>s.jsx(l.default,{href:"Home"===e?"/":"Lifestyle"===e?"/lifestyle":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Lifestyle"===e?n.universeColors.lifestyle.primary:n.colors.text.secondary},children:e},e))}),s.jsx("div",{className:"flex items-center gap-4",children:a?s.jsx("div",{className:"flex items-center gap-4",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(o.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),s.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(l.default,{href:"/auth/login",children:s.jsx(o.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),s.jsx(l.default,{href:"/auth/register",children:s.jsx(o.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),s.jsx("section",{className:"relative",children:f?s.jsx(o.Skeleton,{height:"500px",className:"w-full"}):(0,s.jsxs)("div",{className:"relative h-[500px]",children:[s.jsx("img",{src:t[0].thumbnail,alt:t[0].title,className:"w-full h-full object-cover"}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"}),(0,s.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto",children:[s.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4",style:{backgroundColor:`${n.universeColors.lifestyle.primary}30`,color:n.universeColors.lifestyle.primary},children:"Lifestyle"}),s.jsx("h2",{className:"text-4xl font-bold text-white mb-2",children:t[0].title}),s.jsx("p",{className:"text-gray-300 text-lg mb-6 max-w-2xl",children:t[0].description}),(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsxs)(o.Button,{size:"lg",style:{backgroundColor:n.universeColors.lifestyle.primary},children:[s.jsx("span",{children:"\uD83C\uDF9F️"})," Get Tickets"]}),(0,s.jsxs)(o.Button,{size:"lg",variant:"secondary",children:[s.jsx("span",{children:"\uD83D\uDCCD"})," View Details"]})]})]})]})}),(0,s.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[s.jsx("div",{className:"flex items-center justify-between mb-8",children:(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Upcoming Events"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Discover exciting lifestyle events across Africa"})]})}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:t.map(e=>(0,s.jsxs)(o.Card,{padding:"none",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,s.jsxs)("div",{className:"relative",children:[s.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-48 object-cover"}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"}),(0,s.jsxs)("div",{className:"absolute bottom-4 left-4 right-4",children:[s.jsx(o.Badge,{variant:"outline",className:"mb-2",children:e.category}),s.jsx("h3",{className:"text-xl font-bold text-white",children:e.title})]})]}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),(0,s.jsxs)("div",{className:"space-y-2 mb-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-400",children:[s.jsx("span",{children:"\uD83D\uDCC5"}),s.jsx("span",{children:e.date})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-400",children:[s.jsx("span",{children:"\uD83D\uDCCD"}),s.jsx("span",{children:e.location})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-400",children:[s.jsx("span",{children:"\uD83D\uDC65"}),(0,s.jsxs)("span",{children:[e.attendees.toLocaleString()," attending"]})]})]}),s.jsx(o.Button,{variant:"primary",className:"w-full",style:{backgroundColor:n.universeColors.lifestyle.primary},children:"Get Tickets"})]})]},e.id))})]}),s.jsx("section",{className:"py-12",style:{backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"City Guides"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Explore the best of African cities"})]}),s.jsx(o.Button,{variant:"ghost",children:"View All"})]}),s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:p.map(e=>(0,s.jsxs)(o.Card,{padding:"none",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,s.jsxs)("div",{className:"relative",children:[s.jsx("img",{src:e.thumbnail,alt:e.city,className:"w-full h-40 object-cover"}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"}),(0,s.jsxs)("div",{className:"absolute bottom-4 left-4 right-4",children:[s.jsx("h3",{className:"text-xl font-bold text-white",children:e.city}),s.jsx("p",{className:"text-sm text-gray-300",children:e.country})]})]}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),(0,s.jsxs)("div",{className:"flex items-center gap-2 text-sm text-gray-400 mb-4",children:[s.jsx("span",{children:"\uD83C\uDFDB️"}),(0,s.jsxs)("span",{children:[e.attractions," attractions"]})]}),s.jsx(o.Button,{variant:"outline",className:"w-full",children:"Explore City"})]})]},e.id))})]})}),s.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Azeebo+"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),s.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:s.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
`},83386:(e,a,t)=>{"use strict";var s=Object.create?function(e,a,t,s){void 0===s&&(s=t);var r=Object.getOwnPropertyDescriptor(a,t);(!r||("get"in r?!a.__esModule:r.writable||r.configurable))&&(r={enumerable:!0,get:function(){return a[t]}}),Object.defineProperty(e,s,r)}:function(e,a,t,s){void 0===s&&(s=t),e[s]=a[t]};Object.defineProperty(a,"__esModule",{value:!0}),a.mediaQueries=a.breakpoints=a.gradients=a.themes=a.zIndex=a.transitions=a.shadows=a.borderRadius=a.fontWeightNative=a.fontSizeNative=a.typography=a.spacingNative=a.spacing=a.colors=a.universeColors=void 0,a.generateCSSVariables=function(){let e=[];return Object.entries(a.colors).forEach(([a,t])=>{"object"==typeof t?Object.entries(t).forEach(([t,s])=>{e.push(`  --color-${a}-${t}: ${s};`)}):e.push(`  --color-${a}: ${t};`)}),Object.entries(a.spacing).forEach(([a,t])=>{e.push(`  --spacing-${a}: ${t}px;`)}),Object.entries(a.typography.fontSizes).forEach(([a,t])=>{e.push(`  --font-size-${a}: ${t}px;`)}),Object.entries(a.typography.fontWeights).forEach(([a,t])=>{e.push(`  --font-weight-${a}: ${t};`)}),Object.entries(a.typography.lineHeights).forEach(([a,t])=>{e.push(`  --line-height-${a}: ${t};`)}),Object.entries(a.borderRadius).forEach(([a,t])=>{e.push(`  --radius-${a}: ${9999===t?"9999px":`${t}px`};`)}),Object.entries(a.shadows).forEach(([a,t])=>{e.push(`  --shadow-${a}: ${t};`)}),Object.entries(a.transitions).forEach(([a,t])=>{e.push(`  --transition-${a}: ${t};`)}),Object.entries(a.zIndex).forEach(([a,t])=>{e.push(`  --z-${a}: ${t};`)}),`:root {
${e.join("\n")}
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var t in e)"default"===t||Object.prototype.hasOwnProperty.call(a,t)||s(a,e,t)}(t(34210),a)},32259:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>s});let s=(0,t(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/lifestyle/page.tsx#default`)}};var a=require("../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),s=a.X(0,[3672,4236,1692,4992,4518,9744],()=>t(38611));module.exports=s})();