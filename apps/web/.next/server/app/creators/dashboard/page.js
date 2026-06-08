(()=>{var e={};e.id=6604,e.ids=[6604],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},23324:(e,a,s)=>{"use strict";s.r(a),s.d(a,{GlobalError:()=>i.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),s(40914),s(50311),s(45347);var t=s(37164),r=s(93666),o=s(94558),i=s.n(o),n=s(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(a,l);let c=["",{children:["creators",{children:["dashboard",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,40914)),"/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/page.tsx"],m="/creators/dashboard/page",p={require:s,loadChunk:()=>Promise.resolve()},x=new t.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/creators/dashboard/page",pathname:"/creators/dashboard",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},61268:(e,a,s)=>{Promise.resolve().then(s.bind(s,9833))},9833:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>p});var t=s(48003),r=s(25249),o=s(76836),i=s(39744),n=s(83386),l=s(21692);let c=[{label:"Total Views",value:"1.2M",icon:"\uD83D\uDC41️"},{label:"Followers",value:"89K",icon:"\uD83D\uDC65"},{label:"Videos",value:"24",icon:"\uD83C\uDFAC"},{label:"Revenue",value:"₦450K",icon:"\uD83D\uDCB0"}],d=[{id:"1",title:"Behind the Scenes",views:"24K",date:"2 days ago",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=behind%20the%20scenes%20video%20thumbnail&image_size=square"},{id:"2",title:"Q&A Session",views:"18K",date:"5 days ago",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=qa%20session%20video%20thumbnail&image_size=square"},{id:"3",title:"Collaboration Special",views:"42K",date:"1 week ago",thumbnail:"https://neeko-copilot.bytedance.net/api/text_to_image?prompt=collaboration%20video%20thumbnail&image_size=square"}],m=[{id:"1",user:"Fan123",comment:"Amazing content! Love your work!",date:"2h ago"},{id:"2",user:"NollywoodFan",comment:"Can't wait for the next video!",date:"5h ago"}];function p(){let{user:e,isAuthenticated:a}=(0,o.useAuth)(),[s,p]=(0,r.useState)(!0);return(0,t.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[t.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:n.universeColors.creators.primary},children:t.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),t.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:"Creator Dashboard"})]}),t.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Overview","Content","Analytics","Earnings","Settings"].map(e=>t.jsx(l.default,{href:`/creators/dashboard/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Overview"===e?n.colors.primary[500]:n.colors.text.secondary},children:e},e))}),t.jsx("div",{className:"flex items-center gap-4",children:a?t.jsx("div",{className:"flex items-center gap-4",children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[t.jsx(i.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),t.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):t.jsx("div",{className:"flex items-center gap-2",children:t.jsx(l.default,{href:"/auth/login",children:t.jsx(i.Button,{variant:"ghost",size:"sm",children:"Sign In"})})})})]})}),(0,t.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[(0,t.jsxs)("div",{className:"mb-8",children:[(0,t.jsxs)("h2",{className:"text-3xl font-bold mb-2",style:{color:n.colors.text.primary},children:["Welcome back, ",e?.name||"Creator","! \uD83D\uDC4B"]}),t.jsx("p",{style:{color:n.colors.text.secondary},children:"Here\\'s what\\'s happening with your content."})]}),t.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",children:s?c.map((e,a)=>t.jsx(i.Skeleton,{height:"120px",className:"rounded-lg"},a)):c.map((e,a)=>(0,t.jsxs)(i.Card,{padding:"md",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[t.jsx("span",{className:"text-3xl",children:e.icon}),t.jsx(i.Badge,{variant:"outline",children:"+12%"})]}),t.jsx("p",{className:"text-2xl font-bold mb-1",style:{color:n.colors.text.primary},children:e.value}),t.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.label})]},a))}),(0,t.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-8",children:[(0,t.jsxs)("div",{className:"lg:col-span-2",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-6",children:[t.jsx("h3",{className:"text-xl font-bold",style:{color:n.colors.text.primary},children:"Recent Videos"}),(0,t.jsxs)(i.Button,{variant:"outline",children:[t.jsx("span",{children:"➕"})," Upload New"]})]}),s?t.jsx("div",{className:"space-y-4",children:[1,2,3].map(e=>t.jsx(i.Skeleton,{height:"120px",className:"rounded-lg"},e))}):t.jsx("div",{className:"space-y-4",children:d.map(e=>(0,t.jsxs)(i.Card,{padding:"md",className:"flex items-center gap-4",children:[t.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-40 h-24 object-cover rounded-lg"}),(0,t.jsxs)("div",{className:"flex-1",children:[t.jsx("h4",{className:"font-bold",style:{color:n.colors.text.primary},children:e.title}),(0,t.jsxs)("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:["\uD83D\uDC41️ ",e.views," views • ",e.date]})]}),(0,t.jsxs)("div",{className:"flex gap-2",children:[t.jsx(i.Button,{variant:"outline",size:"sm",children:"Edit"}),t.jsx(i.Button,{variant:"ghost",size:"sm",children:"Analytics"})]})]},e.id))})]}),(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{children:[t.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:n.colors.text.primary},children:"Recent Comments"}),s?t.jsx("div",{className:"space-y-4",children:[1,2].map(e=>t.jsx(i.Skeleton,{height:"80px",className:"rounded-lg"},e))}):t.jsx(i.Card,{padding:"md",children:t.jsx("div",{className:"space-y-4",children:m.map(e=>(0,t.jsxs)("div",{className:"pb-4 border-b border-gray-700 last:border-0 last:pb-0",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between mb-1",children:[t.jsx("span",{className:"font-medium",style:{color:n.colors.text.primary},children:e.user}),t.jsx("span",{className:"text-xs",style:{color:n.colors.text.tertiary},children:e.date})]}),t.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.comment})]},e.id))})})]}),(0,t.jsxs)("div",{children:[t.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:n.colors.text.primary},children:"Quick Actions"}),t.jsx(i.Card,{padding:"md",children:(0,t.jsxs)("div",{className:"space-y-3",children:[(0,t.jsxs)(i.Button,{variant:"outline",className:"w-full justify-start",children:[t.jsx("span",{className:"mr-2",children:"\uD83D\uDCCA"})," View Analytics"]}),(0,t.jsxs)(i.Button,{variant:"outline",className:"w-full justify-start",children:[t.jsx("span",{className:"mr-2",children:"\uD83D\uDCB0"})," View Earnings"]}),(0,t.jsxs)(i.Button,{variant:"outline",className:"w-full justify-start",children:[t.jsx("span",{className:"mr-2",children:"⚙️"})," Manage Settings"]}),(0,t.jsxs)(i.Button,{variant:"outline",className:"w-full justify-start",children:[t.jsx("span",{className:"mr-2",children:"❓"})," Get Support"]})]})})]})]})]})]}),t.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Azeebo+"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),t.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:t.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var s in e)"default"===s||Object.prototype.hasOwnProperty.call(a,s)||t(a,e,s)}(s(34210),a)},40914:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>t});let t=(0,s(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/page.tsx#default`)}};var a=require("../../../webpack-runtime.js");a.C(e);var s=e=>a(a.s=e),t=a.X(0,[3672,4236,1692,4992,4518,9744],()=>s(23324));module.exports=t})();