(()=>{var e={};e.id=2979,e.ids=[2979],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},62514:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),a(48437),a(50311),a(45347);var r=a(37164),s=a(93666),o=a(94558),n=a.n(o),i=a(78838),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);a.d(t,l);let c=["",{children:["creators",{children:["dashboard",{children:["content",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,48437)),"/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/content/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/content/page.tsx"],m="/creators/dashboard/content/page",p={require:a,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/creators/dashboard/content/page",pathname:"/creators/dashboard/content",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},86629:(e,t,a)=>{Promise.resolve().then(a.bind(a,78589))},78589:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>p});var r=a(48003),s=a(25249),o=a(76836),n=a(39744),i=a(83386),l=a(7538),c=a(55785),d=a(21692);let m=["Overview","Content","Analytics","Earnings","Settings"];function p(){let{user:e,isAuthenticated:t}=(0,o.useAuth)(),[a,p]=(0,s.useState)([]),[x,u]=(0,s.useState)([]),[f,h]=(0,s.useState)(!0),[b,g]=(0,s.useState)(null),[y,v]=(0,s.useState)("all"),[j,w]=(0,s.useState)(""),[k,N]=(0,s.useState)(new Set),[C,z]=(0,s.useState)("list"),S=(0,s.useCallback)(async()=>{try{if(h(!0),g(null),!e?.id)return;let t=await c.api.creator.getCreatorContent(e.id,1,50);t.success&&t.data&&p(t.data.items)}catch(t){let e=t instanceof Error?t.message:"Failed to load content";l.webLogger.error("Creator content fetch failed",{error:e}),g(e)}finally{h(!1)}},[e?.id]),E=e=>{N(t=>{let a=new Set(t);return a.has(e)?a.delete(e):a.add(e),a})},$=e=>r.jsx(n.Badge,{variant:{published:"success",draft:"warning",processing:"outline",archived:"primary"}[e]||"primary",children:e});return(0,r.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:i.colors.bg.primary},children:[r.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:i.universeColors.creators.primary},children:r.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),r.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:i.colors.text.primary},children:"Creator Dashboard"})]}),r.jsx("nav",{className:"hidden md:flex items-center gap-8",children:m.map(e=>r.jsx(d.default,{href:`/creators/dashboard/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Content"===e?i.colors.primary[500]:i.colors.text.secondary},children:e},e))}),r.jsx("div",{className:"flex items-center gap-4",children:t?(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(n.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),r.jsx("span",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:e?.name})]}):r.jsx(d.default,{href:"/auth/login",children:r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Sign In"})})})]})}),(0,r.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[(0,r.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8",children:[(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-3xl font-bold mb-2",style:{color:i.colors.text.primary},children:"Content"}),r.jsx("p",{style:{color:i.colors.text.secondary},children:"Manage all your uploaded content"})]}),(0,r.jsxs)(n.Button,{variant:"primary",children:[r.jsx("span",{className:"mr-2",children:"➕"})," Upload New"]})]}),b&&(0,r.jsxs)("div",{className:"mb-8 p-4 rounded-lg border flex items-center justify-between",style:{backgroundColor:`${i.colors.warning[500]}10`,borderColor:i.colors.warning[500]},children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("span",{className:"text-xl",children:"⚠️"}),r.jsx("p",{style:{color:i.colors.text.primary},children:b})]}),r.jsx(n.Button,{variant:"outline",size:"sm",onClick:S,children:"Retry"})]}),r.jsx(n.Card,{padding:"md",className:"mb-6",children:(0,r.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center gap-4",children:[r.jsx("div",{className:"flex-1",children:r.jsx("input",{type:"text",placeholder:"Search content...",value:j,onChange:e=>w(e.target.value),className:"w-full px-4 py-2 rounded-lg border text-sm",style:{backgroundColor:i.colors.bg.tertiary,borderColor:i.colors.border.default,color:i.colors.text.primary}})}),r.jsx("div",{className:"flex items-center gap-2",children:[{key:"all",label:"All"},{key:"published",label:"Published"},{key:"drafts",label:"Drafts"},{key:"scheduled",label:"Scheduled"}].map(e=>r.jsx("button",{onClick:()=>v(e.key),className:"px-4 py-2 rounded-lg text-sm font-medium transition-colors",style:{backgroundColor:y===e.key?i.colors.primary[500]:i.colors.bg.tertiary,color:y===e.key?"#ffffff":i.colors.text.secondary},children:e.label},e.key))}),(0,r.jsxs)("div",{className:"flex items-center gap-1",children:[r.jsx("button",{onClick:()=>z("list"),className:"p-2 rounded-lg transition-colors",style:{backgroundColor:"list"===C?i.colors.bg.tertiary:"transparent",color:"list"===C?i.colors.text.primary:i.colors.text.secondary},children:"☰"}),r.jsx("button",{onClick:()=>z("grid"),className:"p-2 rounded-lg transition-colors",style:{backgroundColor:"grid"===C?i.colors.bg.tertiary:"transparent",color:"grid"===C?i.colors.text.primary:i.colors.text.secondary},children:"⊞"})]})]})}),k.size>0&&(0,r.jsxs)("div",{className:"mb-4 p-3 rounded-lg flex items-center justify-between",style:{backgroundColor:`${i.colors.primary[500]}15`},children:[(0,r.jsxs)("span",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:[k.size," item",k.size>1?"s":""," selected"]}),(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(n.Button,{variant:"outline",size:"sm",children:"Publish"}),r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Archive"}),r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Delete"})]})]}),f?r.jsx("div",{className:"space-y-4",children:Array.from({length:5}).map((e,t)=>r.jsx(n.Skeleton,{height:"100px",className:"rounded-lg"},t))}):0===x.length?r.jsx(n.Card,{padding:"md",children:(0,r.jsxs)("div",{className:"text-center py-12",children:[r.jsx("span",{className:"text-5xl mb-4 block",children:"\uD83D\uDCED"}),r.jsx("p",{className:"text-lg font-medium mb-2",style:{color:i.colors.text.primary},children:"No content found"}),r.jsx("p",{style:{color:i.colors.text.secondary},children:j?"Try adjusting your search or filters":"Upload your first piece of content to get started"})]})}):"list"===C?(0,r.jsxs)(n.Card,{padding:"md",children:[(0,r.jsxs)("div",{className:"flex items-center gap-4 pb-3 mb-3 border-b",style:{borderColor:i.colors.border.light},children:[r.jsx("input",{type:"checkbox",checked:k.size===x.length&&x.length>0,onChange:()=>{k.size===x.length?N(new Set):N(new Set(x.map(e=>e.id)))},className:"w-4 h-4 rounded"}),r.jsx("span",{className:"text-xs font-medium uppercase tracking-wider flex-1",style:{color:i.colors.text.tertiary},children:"Title"}),r.jsx("span",{className:"text-xs font-medium uppercase tracking-wider w-20 text-center hidden sm:block",style:{color:i.colors.text.tertiary},children:"Status"}),r.jsx("span",{className:"text-xs font-medium uppercase tracking-wider w-20 text-center hidden md:block",style:{color:i.colors.text.tertiary},children:"Views"}),r.jsx("span",{className:"text-xs font-medium uppercase tracking-wider w-28 text-center hidden lg:block",style:{color:i.colors.text.tertiary},children:"Date"}),r.jsx("span",{className:"w-20"})]}),x.map(e=>(0,r.jsxs)("div",{className:"flex items-center gap-4 py-4 border-b last:border-0",style:{borderColor:i.colors.border.light},children:[r.jsx("input",{type:"checkbox",checked:k.has(e.id),onChange:()=>E(e.id),className:"w-4 h-4 rounded"}),(0,r.jsxs)("div",{className:"flex items-center gap-3 flex-1 min-w-0",children:[r.jsx("img",{src:e.thumbnail||"/placeholder-thumbnail.png",alt:e.title,className:"w-16 h-10 object-cover rounded flex-shrink-0"}),(0,r.jsxs)("div",{className:"min-w-0",children:[r.jsx("p",{className:"font-medium truncate",style:{color:i.colors.text.primary},children:e.title}),r.jsx("p",{className:"text-xs truncate",style:{color:i.colors.text.tertiary},children:e.universe?.name||"Uncategorized"})]})]}),r.jsx("div",{className:"w-20 text-center hidden sm:block",children:$(e.status)}),r.jsx("div",{className:"w-20 text-center hidden md:block",children:r.jsx("span",{className:"text-sm",style:{color:i.colors.text.secondary},children:e.views?.toLocaleString()||"0"})}),r.jsx("div",{className:"w-28 text-center hidden lg:block",children:r.jsx("span",{className:"text-xs",style:{color:i.colors.text.tertiary},children:new Date(e.createdAt).toLocaleDateString()})}),r.jsx("div",{className:"w-20 flex items-center gap-1 justify-end",children:r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Edit"})})]},e.id))]}):r.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:x.map(e=>(0,r.jsxs)(n.Card,{padding:"md",className:"overflow-hidden",children:[r.jsx("img",{src:e.thumbnail||"/placeholder-thumbnail.png",alt:e.title,className:"w-full h-40 object-cover rounded-lg mb-4"}),(0,r.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[r.jsx("h4",{className:"font-bold truncate flex-1",style:{color:i.colors.text.primary},children:e.title}),$(e.status)]}),(0,r.jsxs)("p",{className:"text-sm mb-3",style:{color:i.colors.text.secondary},children:[e.views?.toLocaleString()||"0"," views •"," ",new Date(e.createdAt).toLocaleDateString()]}),(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(n.Button,{variant:"outline",size:"sm",className:"flex-1",children:"Edit"}),r.jsx(n.Button,{variant:"ghost",size:"sm",className:"flex-1",children:"Analytics"})]})]},e.id))})]}),r.jsx("footer",{className:"border-t py-12 mt-12",style:{borderColor:i.colors.border.light,backgroundColor:i.colors.bg.secondary},children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:i.colors.border.light,color:i.colors.text.tertiary},children:r.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})})})]})}},34210:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.generateAnimationsCSS=t.animation=t.duration=t.easing=void 0,t.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},t.duration={instant:75,fast:150,normal:200,slow:300,slower:500},t.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},t.generateAnimationsCSS=()=>`
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
`},83386:(e,t,a)=>{"use strict";var r=Object.create?function(e,t,a,r){void 0===r&&(r=a);var s=Object.getOwnPropertyDescriptor(t,a);(!s||("get"in s?!t.__esModule:s.writable||s.configurable))&&(s={enumerable:!0,get:function(){return t[a]}}),Object.defineProperty(e,r,s)}:function(e,t,a,r){void 0===r&&(r=a),e[r]=t[a]};Object.defineProperty(t,"__esModule",{value:!0}),t.mediaQueries=t.breakpoints=t.gradients=t.themes=t.zIndex=t.transitions=t.shadows=t.borderRadius=t.fontWeightNative=t.fontSizeNative=t.typography=t.spacingNative=t.spacing=t.colors=t.universeColors=void 0,t.generateCSSVariables=function(){let e=[];return Object.entries(t.colors).forEach(([t,a])=>{"object"==typeof a?Object.entries(a).forEach(([a,r])=>{e.push(`  --color-${t}-${a}: ${r};`)}):e.push(`  --color-${t}: ${a};`)}),Object.entries(t.spacing).forEach(([t,a])=>{e.push(`  --spacing-${t}: ${a}px;`)}),Object.entries(t.typography.fontSizes).forEach(([t,a])=>{e.push(`  --font-size-${t}: ${a}px;`)}),Object.entries(t.typography.fontWeights).forEach(([t,a])=>{e.push(`  --font-weight-${t}: ${a};`)}),Object.entries(t.typography.lineHeights).forEach(([t,a])=>{e.push(`  --line-height-${t}: ${a};`)}),Object.entries(t.borderRadius).forEach(([t,a])=>{e.push(`  --radius-${t}: ${9999===a?"9999px":`${a}px`};`)}),Object.entries(t.shadows).forEach(([t,a])=>{e.push(`  --shadow-${t}: ${a};`)}),Object.entries(t.transitions).forEach(([t,a])=>{e.push(`  --transition-${t}: ${a};`)}),Object.entries(t.zIndex).forEach(([t,a])=>{e.push(`  --z-${t}: ${a};`)}),`:root {
${e.join("\n")}
}`},t.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},t.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},t.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},t.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},t.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},t.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},t.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},t.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},t.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},t.themes={dark:{background:t.colors.dark[900],surface:t.colors.dark[800],card:t.colors.dark[700],border:t.colors.dark[600],text:t.colors.light[50],textSecondary:t.colors.light[100],textMuted:t.colors.light[300]},light:{background:t.colors.light[50],surface:t.colors.light[100],card:t.colors.light[50],border:t.colors.light[400],text:t.colors.dark[900],textSecondary:t.colors.dark[700],textMuted:t.colors.dark[400]}},t.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},t.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},t.mediaQueries={sm:`@media (min-width: ${t.breakpoints.sm}px)`,md:`@media (min-width: ${t.breakpoints.md}px)`,lg:`@media (min-width: ${t.breakpoints.lg}px)`,xl:`@media (min-width: ${t.breakpoints.xl}px)`,"2xl":`@media (min-width: ${t.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,t){for(var a in e)"default"===a||Object.prototype.hasOwnProperty.call(t,a)||r(t,e,a)}(a(34210),t)},48437:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/content/page.tsx#default`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[3672,4236,1692,4992,4518,9744],()=>a(62514));module.exports=r})();