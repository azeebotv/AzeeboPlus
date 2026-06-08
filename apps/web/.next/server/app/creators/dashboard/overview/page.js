(()=>{var e={};e.id=985,e.ids=[985],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},57594:(e,a,r)=>{"use strict";r.r(a),r.d(a,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>d,routeModule:()=>p,tree:()=>c}),r(38764),r(50311),r(45347);var s=r(37164),t=r(93666),o=r(94558),n=r.n(o),i=r(78838),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);r.d(a,l);let c=["",{children:["creators",{children:["dashboard",{children:["overview",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,38764)),"/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/overview/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/overview/page.tsx"],m="/creators/dashboard/overview/page",x={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:t.x.APP_PAGE,page:"/creators/dashboard/overview/page",pathname:"/creators/dashboard/overview",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},96581:(e,a,r)=>{Promise.resolve().then(r.bind(r,14896))},14896:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>p});var s=r(48003),t=r(25249),o=r(76836),n=r(39744),i=r(83386),l=r(7538),c=r(55785),d=r(21692);let m={totalViews:"0",followers:"0",earnings:"0",contentCount:"0",viewsTrend:"+0%",followersTrend:"+0%",earningsTrend:"+0%",contentTrend:"+0%"},x=["Overview","Content","Analytics","Earnings","Settings"];function p(){let{user:e,isAuthenticated:a}=(0,o.useAuth)(),[r,p]=(0,t.useState)(m),[u,f]=(0,t.useState)([]),[h,b]=(0,t.useState)(!0),[g,y]=(0,t.useState)(null),v=(0,t.useCallback)(async()=>{try{b(!0),y(null);let e=await c.api.admin.getDashboard();if(e.success&&e.data){let a=e.data;if(p({totalViews:j(a.totalViews),followers:j(a.totalUsers),earnings:`₦${j(a.totalRevenue)}`,contentCount:j(a.totalContent),viewsTrend:"+12%",followersTrend:"+8%",earningsTrend:"+15%",contentTrend:"+3%"}),a.recentActivity){let e=a.recentActivity.map(e=>({id:e.id,type:"like",message:`${e.user} - ${e.action}`,timestamp:e.time,icon:w(e.action)}));f(e)}}}catch(a){let e=a instanceof Error?a.message:"Failed to load dashboard data";l.webLogger.error("Creator overview fetch failed",{error:e}),y(e)}finally{b(!1)}},[]),j=e=>e>=1e6?`${(e/1e6).toFixed(1)}M`:e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString(),w=e=>{let a=e.toLowerCase();return a.includes("comment")?"\uD83D\uDCAC":a.includes("like")?"❤️":a.includes("follow")?"\uD83D\uDC65":a.includes("milestone")?"\uD83C\uDFC6":a.includes("earning")||a.includes("revenue")?"\uD83D\uDCB0":"\uD83D\uDCCC"},N=[{label:"Total Views",value:r.totalViews,icon:"\uD83D\uDC41️",trend:r.viewsTrend},{label:"Followers",value:r.followers,icon:"\uD83D\uDC65",trend:r.followersTrend},{label:"Earnings",value:r.earnings,icon:"\uD83D\uDCB0",trend:r.earningsTrend},{label:"Content",value:r.contentCount,icon:"\uD83C\uDFAC",trend:r.contentTrend}];return(0,s.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:i.colors.bg.primary},children:[s.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:i.universeColors.creators.primary},children:s.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),s.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:i.colors.text.primary},children:"Creator Dashboard"})]}),s.jsx("nav",{className:"hidden md:flex items-center gap-8",children:x.map(e=>s.jsx(d.default,{href:`/creators/dashboard/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Overview"===e?i.colors.primary[500]:i.colors.text.secondary},children:e},e))}),s.jsx("div",{className:"flex items-center gap-4",children:a?s.jsx("div",{className:"flex items-center gap-4",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(n.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),s.jsx("span",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:e?.name})]})}):s.jsx("div",{className:"flex items-center gap-2",children:s.jsx(d.default,{href:"/auth/login",children:s.jsx(n.Button,{variant:"ghost",size:"sm",children:"Sign In"})})})})]})}),(0,s.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[(0,s.jsxs)("div",{className:"mb-8",children:[s.jsx("h2",{className:"text-3xl font-bold mb-2",style:{color:i.colors.text.primary},children:"Overview"}),(0,s.jsxs)("p",{style:{color:i.colors.text.secondary},children:["Welcome back, ",e?.name||"Creator","! Here is a summary of your performance."]})]}),g&&(0,s.jsxs)("div",{className:"mb-8 p-4 rounded-lg border flex items-center justify-between",style:{backgroundColor:`${i.colors.warning[500]}10`,borderColor:i.colors.warning[500]},children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("span",{className:"text-xl",children:"⚠️"}),s.jsx("p",{style:{color:i.colors.text.primary},children:g})]}),s.jsx(n.Button,{variant:"outline",size:"sm",onClick:v,children:"Retry"})]}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10",children:h?Array.from({length:4}).map((e,a)=>s.jsx(n.Skeleton,{height:"140px",className:"rounded-lg"},a)):N.map((e,a)=>(0,s.jsxs)(n.Card,{padding:"md",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[s.jsx("span",{className:"text-3xl",children:e.icon}),s.jsx(n.Badge,{variant:"outline",children:e.trend})]}),s.jsx("p",{className:"text-2xl font-bold mb-1",style:{color:i.colors.text.primary},children:e.value}),s.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:e.label})]},a))}),(0,s.jsxs)("div",{children:[s.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:i.colors.text.primary},children:"Recent Activity"}),h?s.jsx("div",{className:"space-y-4",children:Array.from({length:5}).map((e,a)=>s.jsx(n.Skeleton,{height:"72px",className:"rounded-lg"},a))}):0===u.length?s.jsx(n.Card,{padding:"md",children:(0,s.jsxs)("div",{className:"text-center py-8",children:[s.jsx("span",{className:"text-4xl mb-4 block",children:"\uD83D\uDCED"}),s.jsx("p",{style:{color:i.colors.text.secondary},children:"No recent activity to display."})]})}):s.jsx(n.Card,{padding:"md",children:s.jsx("div",{className:"space-y-4",children:u.map(e=>(0,s.jsxs)("div",{className:"flex items-center gap-4 py-3 border-b last:border-0",style:{borderColor:i.colors.border.light},children:[s.jsx("div",{className:"w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",style:{backgroundColor:i.colors.bg.tertiary},children:s.jsx("span",{className:"text-lg",children:e.icon})}),(0,s.jsxs)("div",{className:"flex-1 min-w-0",children:[s.jsx("p",{className:"text-sm font-medium truncate",style:{color:i.colors.text.primary},children:e.message}),s.jsx("p",{className:"text-xs",style:{color:i.colors.text.tertiary},children:e.timestamp})]})]},e.id))})})]}),(0,s.jsxs)("div",{className:"mt-10",children:[s.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:i.colors.text.primary},children:"Quick Actions"}),(0,s.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[s.jsx(d.default,{href:"/creators/dashboard/content",children:(0,s.jsxs)(n.Card,{padding:"md",className:"cursor-pointer hover:scale-[1.02] transition-transform",children:[s.jsx("span",{className:"text-2xl mb-2 block",children:"\uD83D\uDCF9"}),s.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:"Manage Content"}),s.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:"Upload and manage your videos"})]})}),s.jsx(d.default,{href:"/creators/dashboard/analytics",children:(0,s.jsxs)(n.Card,{padding:"md",className:"cursor-pointer hover:scale-[1.02] transition-transform",children:[s.jsx("span",{className:"text-2xl mb-2 block",children:"\uD83D\uDCCA"}),s.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:"View Analytics"}),s.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:"Track your performance metrics"})]})}),s.jsx(d.default,{href:"/creators/dashboard/earnings",children:(0,s.jsxs)(n.Card,{padding:"md",className:"cursor-pointer hover:scale-[1.02] transition-transform",children:[s.jsx("span",{className:"text-2xl mb-2 block",children:"\uD83D\uDCB0"}),s.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:"Check Earnings"}),s.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:"View earnings and payouts"})]})}),s.jsx(d.default,{href:"/creators/dashboard/settings",children:(0,s.jsxs)(n.Card,{padding:"md",className:"cursor-pointer hover:scale-[1.02] transition-transform",children:[s.jsx("span",{className:"text-2xl mb-2 block",children:"⚙️"}),s.jsx("p",{className:"font-medium",style:{color:i.colors.text.primary},children:"Settings"}),s.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:"Manage your creator profile"})]})})]})]})]}),s.jsx("footer",{className:"border-t py-12 mt-12",style:{borderColor:i.colors.border.light,backgroundColor:i.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:i.colors.text.primary},children:"Azeebo+"}),s.jsx("ul",{className:"space-y-2",style:{color:i.colors.text.secondary},children:["About","Careers","Press"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:i.colors.text.primary},children:"Help"}),s.jsx("ul",{className:"space-y-2",style:{color:i.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:i.colors.text.primary},children:"Legal"}),s.jsx("ul",{className:"space-y-2",style:{color:i.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:i.colors.text.primary},children:"Connect"}),s.jsx("ul",{className:"space-y-2",style:{color:i.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),s.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:i.colors.border.light,color:i.colors.text.tertiary},children:s.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(a,r)||s(a,e,r)}(r(34210),a)},38764:(e,a,r)=>{"use strict";r.r(a),r.d(a,{default:()=>s});let s=(0,r(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/overview/page.tsx#default`)}};var a=require("../../../../webpack-runtime.js");a.C(e);var r=e=>a(a.s=e),s=a.X(0,[3672,4236,1692,4992,4518,9744],()=>r(57594));module.exports=s})();