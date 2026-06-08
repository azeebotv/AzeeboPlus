(()=>{var e={};e.id=7356,e.ids=[7356],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71228:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>o.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>u,tree:()=>c}),t(8270),t(50311),t(45347);var r=t(37164),s=t(93666),i=t(94558),o=t.n(i),n=t(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);t.d(a,l);let c=["",{children:["vertical",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,8270)),"/Users/deprof/www/azeebo+/apps/web/src/app/vertical/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/vertical/page.tsx"],m="/vertical/page",p={require:t,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/vertical/page",pathname:"/vertical",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},61499:(e,a,t)=>{Promise.resolve().then(t.bind(t,22674))},22674:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>p});var r=t(48003),s=t(25249),i=t(76836),o=t(39744),n=t(83386),l=t(21692),c=t(8426);let d=[{id:"1",title:"Kingdom of Oyo",description:"An epic historical drama about the ancient Oyo Empire",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=epic%20historical%20drama%20african%20kingdom%20palace%20royalty&image_size=landscape_16_9",episodes:24,rating:4.8,isPremium:!0,genre:"Historical Drama"},{id:"2",title:"Modern Love Lagos",description:"A romantic anthology series exploring love in modern Lagos",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=romantic%20drama%20lagos%20modern%20couple%20city%20night&image_size=landscape_16_9",episodes:12,rating:4.6,isPremium:!1,genre:"Romance"},{id:"3",title:"Tech Bros",description:"A comedy about young entrepreneurs building startups in Lagos",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=tech%20startup%20comedy%20young%20entrepreneurs%20modern%20office&image_size=landscape_16_9",episodes:18,rating:4.5,isPremium:!1,genre:"Comedy"}],m=[{id:"1",name:"King Alaafin",series:"Kingdom of Oyo",description:"The powerful ruler of the Oyo Empire",avatar:"KA",lore:"King Alaafin is the 45th ruler of the ancient Oyo Empire, known for his wisdom and military strategy."},{id:"2",name:"Amara",series:"Modern Love Lagos",description:"A successful lawyer navigating love and career",avatar:"A",lore:"Amara is a brilliant corporate lawyer who has to balance her demanding career with her search for true love in Lagos."},{id:"3",name:"Chidi",series:"Tech Bros",description:"A brilliant but quirky software engineer",avatar:"C",lore:"Chidi is a coding prodigy who dropped out of MIT to pursue his startup dream in Lagos tech scene."}];function p(){let{user:e,isAuthenticated:a}=(0,i.useAuth)(),{isUniverseEnabled:t}=(0,c.Bp)(),{getSetting:p}=(0,c.rV)(),u=p("site_name","Azeebo+");t("vertical");let[x,f]=(0,s.useState)(d),[h,g]=(0,s.useState)(m),[b,y]=(0,s.useState)(!0);return(0,r.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[r.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:n.universeColors.vertical.primary},children:r.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),r.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:u})]}),r.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Vertical"].map(e=>r.jsx(l.default,{href:"Home"===e?"/":"Vertical"===e?"/vertical":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Vertical"===e?n.universeColors.vertical.primary:n.colors.text.secondary},children:e},e))}),r.jsx("div",{className:"flex items-center gap-4",children:a?r.jsx("div",{className:"flex items-center gap-4",children:(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(o.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),r.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(l.default,{href:"/auth/login",children:r.jsx(o.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),r.jsx(l.default,{href:"/auth/register",children:r.jsx(o.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),r.jsx("section",{className:"relative",children:b?r.jsx(o.Skeleton,{height:"500px",className:"w-full"}):(0,r.jsxs)("div",{className:"relative h-[500px]",children:[r.jsx("img",{src:x[0].thumbnail,alt:x[0].title,className:"w-full h-full object-cover"}),r.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"}),(0,r.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2 mb-4",children:[x[0].isPremium&&r.jsx(o.Badge,{variant:"success",children:"Premium"}),r.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4",style:{backgroundColor:`${n.universeColors.vertical.primary}30`,color:n.universeColors.vertical.primary},children:x[0].genre})]}),r.jsx("h2",{className:"text-4xl font-bold text-white mb-2",children:x[0].title}),r.jsx("p",{className:"text-gray-300 text-lg mb-6 max-w-2xl",children:x[0].description}),(0,r.jsxs)("div",{className:"flex items-center gap-4",children:[(0,r.jsxs)(o.Button,{size:"lg",style:{backgroundColor:n.universeColors.vertical.primary},children:[r.jsx("span",{children:"▶️"})," Start Watching"]}),(0,r.jsxs)(o.Button,{size:"lg",variant:"secondary",children:[r.jsx("span",{children:"\uD83D\uDCDA"})," Character Lore"]})]})]})]})}),(0,r.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[r.jsx("div",{className:"flex items-center justify-between mb-8",children:(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Vertical Series"}),r.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Premium African storytelling"})]})}),r.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:x.map(e=>(0,r.jsxs)(o.Card,{padding:"none",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,r.jsxs)("div",{className:"relative",children:[r.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-48 object-cover"}),e.isPremium&&r.jsx(o.Badge,{variant:"success",className:"absolute top-2 right-2",children:"Premium"}),r.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"}),(0,r.jsxs)("div",{className:"absolute bottom-4 left-4 right-4",children:[r.jsx(o.Badge,{variant:"outline",className:"mb-2",children:e.genre}),r.jsx("h3",{className:"text-xl font-bold text-white",children:e.title})]})]}),(0,r.jsxs)("div",{className:"p-4",children:[r.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),(0,r.jsxs)("div",{className:"flex items-center justify-between text-sm text-gray-400 mb-4",children:[(0,r.jsxs)("span",{children:["\uD83C\uDFAC ",e.episodes," episodes"]}),(0,r.jsxs)("span",{children:["⭐ ",e.rating]})]}),r.jsx(o.Button,{variant:"primary",className:"w-full",style:{backgroundColor:n.universeColors.vertical.primary},children:"Watch Now"})]})]},e.id))})]}),r.jsx("section",{className:"py-12",style:{backgroundColor:n.colors.bg.secondary},children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Character Lore"}),r.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Dive deeper into your favorite characters"})]}),r.jsx(o.Button,{variant:"ghost",children:"View All"})]}),r.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:h.map(e=>(0,r.jsxs)(o.Card,{padding:"md",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,r.jsxs)("div",{className:"flex items-center gap-4 mb-4",children:[r.jsx(o.Avatar,{size:"lg",fallback:e.avatar}),(0,r.jsxs)("div",{children:[r.jsx("h3",{className:"text-lg font-bold",style:{color:n.colors.text.primary},children:e.name}),r.jsx(o.Badge,{variant:"outline",children:e.series})]})]}),r.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),r.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.lore}),r.jsx(o.Button,{variant:"outline",className:"w-full mt-4",children:"Read Full Lore"})]},e.id))})]})}),r.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:u}),r.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),r.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),r.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),r.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),r.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:(0,r.jsxs)("p",{children:["\xa9 2026 ",u,". All rights reserved."]})})]})})]})}},8426:(e,a,t)=>{"use strict";a.Bp=function(){let[e,a]=(0,r.useState)([]),[t,o]=(0,r.useState)(!0),[n,l]=(0,r.useState)(null);(0,r.useEffect)(()=>{(async()=>{try{o(!0);let e=await s.api.request("/v1/public/universes");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch universes")}catch(e){i.webLogger.error("Failed to fetch universes",e),l(e.message||"Failed to fetch universes")}finally{o(!1)}})()},[]);let c=a=>e.find(e=>e.name===a);return{universes:e,isLoading:t,error:n,getUniverse:c,isUniverseEnabled:a=>e.some(e=>e.name===a),hasFeature:(e,a)=>{let t=c(e);return!!t&&t.featureFlags.some(e=>e.key===a)}}},a.rV=function(){let[e,a]=(0,r.useState)({}),[t,o]=(0,r.useState)(!0),[n,l]=(0,r.useState)(null);return(0,r.useEffect)(()=>{(async()=>{try{o(!0);let e=await s.api.request("/v1/public/settings");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch settings")}catch(e){i.webLogger.error("Failed to fetch settings",e),l(e.message||"Failed to fetch settings")}finally{o(!1)}})()},[]),{settings:e,isLoading:t,error:n,getSetting:(a,t)=>a in e?e[a]:t}};let r=t(25249),s=t(55785),i=t(7538)},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var t in e)"default"===t||Object.prototype.hasOwnProperty.call(a,t)||r(a,e,t)}(t(34210),a)},8270:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>r});let r=(0,t(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/vertical/page.tsx#default`)}};var a=require("../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[3672,4236,1692,4992,4518,9744],()=>t(71228));module.exports=r})();