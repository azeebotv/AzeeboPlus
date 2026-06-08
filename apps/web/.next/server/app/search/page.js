(()=>{var e={};e.id=2797,e.ids=[2797],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},90067:(e,a,r)=>{"use strict";r.r(a),r.d(a,{GlobalError:()=>i.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),r(80213),r(50311),r(45347);var s=r(37164),t=r(93666),o=r(94558),i=r.n(o),n=r(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(a,l);let c=["",{children:["search",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,80213)),"/Users/deprof/www/azeebo+/apps/web/src/app/search/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/search/page.tsx"],m="/search/page",p={require:r,loadChunk:()=>Promise.resolve()},x=new s.AppPageRouteModule({definition:{kind:t.x.APP_PAGE,page:"/search/page",pathname:"/search",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},94555:(e,a,r)=>{Promise.resolve().then(r.bind(r,8492))},8492:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>x});var s=r(48003),t=r(25249),o=r(76836),i=r(39744),n=r(83386),l=r(21692);let c={movies:[{id:"1",title:"The African Queen",description:"An epic adventure",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=movie%20poster%20african%20queen&image_size=square",rating:4.9},{id:"2",title:"Lagos Streets",description:"A gritty drama",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=lagos%20streets%20movie%20poster&image_size=square",rating:4.7}],series:[{id:"1",title:"Kingdom of Oyo",description:"Historical drama",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=kingdom%20of%20oyo%20series%20poster&image_size=square",episodes:24}],creators:[{id:"1",name:"Amara Jay",followers:"125K",avatar:"AJ",bio:"Nollywood actress & producer"},{id:"2",name:"Kofi Mensah",followers:"89K",avatar:"KM",bio:"Comedian & content creator"}]},d=["Nollywood","comedy","football","games"],m=["The African Queen","Super Eagles","Amara Jay","African Quest"],p=["All","Movies","Series","Creators","Games","Sports"];function x(){let{user:e,isAuthenticated:a}=(0,o.useAuth)(),[r,x]=(0,t.useState)(""),[u,f]=(0,t.useState)(c),[h,g]=(0,t.useState)("All"),[b,y]=(0,t.useState)(!1),[v,j]=(0,t.useState)(!1);return(0,s.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[s.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{background:n.gradients.primary},children:s.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),s.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:"Azeebo+"})]}),s.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Search"].map(e=>s.jsx(l.default,{href:"Home"===e?"/":"Search"===e?"/search":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Search"===e?n.colors.primary[500]:n.colors.text.secondary},children:e},e))}),s.jsx("div",{className:"flex items-center gap-4",children:a?s.jsx("div",{className:"flex items-center gap-4",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(i.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),s.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(l.default,{href:"/auth/login",children:s.jsx(i.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),s.jsx(l.default,{href:"/auth/register",children:s.jsx(i.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),(0,s.jsxs)("section",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[s.jsx("form",{onSubmit:e=>{e.preventDefault(),r.trim()&&(y(!0),j(!0),setTimeout(()=>{y(!1)},500))},className:"mb-8",children:(0,s.jsxs)("div",{className:"relative",children:[s.jsx("input",{type:"text",value:r,onChange:e=>x(e.target.value),placeholder:"Search for movies, series, creators, games...",className:"w-full px-6 py-4 text-lg rounded-full border-2 focus:outline-none transition-colors",style:{backgroundColor:n.colors.bg.secondary,borderColor:n.colors.border.light,color:n.colors.text.primary}}),s.jsx("button",{type:"submit",className:"absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-full font-semibold transition-colors",style:{backgroundColor:n.colors.primary[500],color:"white"},children:"\uD83D\uDD0D Search"})]})}),s.jsx("div",{className:"flex items-center gap-3 overflow-x-auto pb-4 mb-8",children:p.map(e=>s.jsx("button",{onClick:()=>g(e),className:"px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all",style:{backgroundColor:h===e?n.colors.primary[500]:n.colors.bg.tertiary,color:h===e?"white":n.colors.text.secondary},children:e},e))}),v?s.jsx("div",{className:"space-y-8",children:b?s.jsx("div",{className:"space-y-6",children:[1,2,3].map(e=>(0,s.jsxs)("div",{children:[s.jsx(i.Skeleton,{height:"24px",width:"150px",className:"mb-4"}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",children:[1,2,3].map(e=>s.jsx(i.Skeleton,{height:"200px",className:"rounded-lg"},e))})]},e))}):(0,s.jsxs)(s.Fragment,{children:[("All"===h||"Movies"===h)&&u.movies.length>0&&(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-4",style:{color:n.colors.text.primary},children:"Movies"}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",children:u.movies.map(e=>(0,s.jsxs)(i.Card,{padding:"none",className:"overflow-hidden cursor-pointer",children:[s.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-40 object-cover"}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("h4",{className:"font-bold",style:{color:n.colors.text.primary},children:e.title}),s.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.description}),(0,s.jsxs)("div",{className:"flex items-center gap-1 mt-2",children:[s.jsx("span",{children:"⭐"}),s.jsx("span",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.rating})]})]})]},e.id))})]}),("All"===h||"Series"===h)&&u.series.length>0&&(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-4",style:{color:n.colors.text.primary},children:"Series"}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",children:u.series.map(e=>(0,s.jsxs)(i.Card,{padding:"none",className:"overflow-hidden cursor-pointer",children:[s.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-40 object-cover"}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("h4",{className:"font-bold",style:{color:n.colors.text.primary},children:e.title}),s.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.description}),(0,s.jsxs)("div",{className:"flex items-center gap-1 mt-2",children:[s.jsx("span",{children:"\uD83C\uDFAC"}),(0,s.jsxs)("span",{className:"text-sm",style:{color:n.colors.text.secondary},children:[e.episodes," episodes"]})]})]})]},e.id))})]}),("All"===h||"Creators"===h)&&u.creators.length>0&&(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-4",style:{color:n.colors.text.primary},children:"Creators"}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",children:u.creators.map(e=>(0,s.jsxs)(i.Card,{padding:"md",className:"text-center cursor-pointer",children:[s.jsx(i.Avatar,{size:"lg",fallback:e.avatar,className:"mx-auto mb-3"}),s.jsx("h4",{className:"font-bold",style:{color:n.colors.text.primary},children:e.name}),s.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.bio}),(0,s.jsxs)("p",{className:"text-xs mt-2",style:{color:n.colors.text.tertiary},children:["\uD83D\uDC65 ",e.followers," followers"]})]},e.id))})]})]})}):(0,s.jsxs)("div",{className:"space-y-8",children:[(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-4",style:{color:n.colors.text.primary},children:"Recent Searches"}),s.jsx("div",{className:"flex flex-wrap gap-3",children:d.map((e,a)=>(0,s.jsxs)("button",{onClick:()=>{x(e),j(!0)},className:"px-4 py-2 rounded-full flex items-center gap-2",style:{backgroundColor:n.colors.bg.tertiary,color:n.colors.text.secondary},children:[s.jsx("span",{children:"⏰"})," ",e]},a))})]}),(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-4",style:{color:n.colors.text.primary},children:"Trending Now"}),s.jsx("div",{className:"flex flex-wrap gap-3",children:m.map((e,a)=>(0,s.jsxs)("button",{onClick:()=>{x(e),j(!0)},className:"px-4 py-2 rounded-full flex items-center gap-2",style:{backgroundColor:`${n.colors.primary[500]}20`,color:n.colors.primary[400]},children:[s.jsx("span",{children:"\uD83D\uDD25"})," ",e]},a))})]})]})]}),s.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Azeebo+"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),s.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:s.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
`},83386:(e,a,r)=>{"use strict";var s=Object.create?function(e,a,r,s){void 0===s&&(s=r);var t=Object.getOwnPropertyDescriptor(a,r);(!t||("get"in t?!a.__esModule:t.writable||t.configurable))&&(t={enumerable:!0,get:function(){return a[r]}}),Object.defineProperty(e,s,t)}:function(e,a,r,s){void 0===s&&(s=r),e[s]=a[r]};Object.defineProperty(a,"__esModule",{value:!0}),a.mediaQueries=a.breakpoints=a.gradients=a.themes=a.zIndex=a.transitions=a.shadows=a.borderRadius=a.fontWeightNative=a.fontSizeNative=a.typography=a.spacingNative=a.spacing=a.colors=a.universeColors=void 0,a.generateCSSVariables=function(){let e=[];return Object.entries(a.colors).forEach(([a,r])=>{"object"==typeof r?Object.entries(r).forEach(([r,s])=>{e.push(`  --color-${a}-${r}: ${s};`)}):e.push(`  --color-${a}: ${r};`)}),Object.entries(a.spacing).forEach(([a,r])=>{e.push(`  --spacing-${a}: ${r}px;`)}),Object.entries(a.typography.fontSizes).forEach(([a,r])=>{e.push(`  --font-size-${a}: ${r}px;`)}),Object.entries(a.typography.fontWeights).forEach(([a,r])=>{e.push(`  --font-weight-${a}: ${r};`)}),Object.entries(a.typography.lineHeights).forEach(([a,r])=>{e.push(`  --line-height-${a}: ${r};`)}),Object.entries(a.borderRadius).forEach(([a,r])=>{e.push(`  --radius-${a}: ${9999===r?"9999px":`${r}px`};`)}),Object.entries(a.shadows).forEach(([a,r])=>{e.push(`  --shadow-${a}: ${r};`)}),Object.entries(a.transitions).forEach(([a,r])=>{e.push(`  --transition-${a}: ${r};`)}),Object.entries(a.zIndex).forEach(([a,r])=>{e.push(`  --z-${a}: ${r};`)}),`:root {
${e.join("\n")}
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(a,r)||s(a,e,r)}(r(34210),a)},80213:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>s});let s=(0,r(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/search/page.tsx#default`)}};var a=require("../../webpack-runtime.js");a.C(e);var r=e=>a(a.s=e),s=a.X(0,[3672,4236,1692,4992,4518,9744],()=>r(90067));module.exports=s})();