(()=>{var e={};e.id=4695,e.ids=[4695],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},14195:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>x,tree:()=>c}),t(11443),t(50311),t(45347);var r=t(37164),s=t(93666),o=t(94558),n=t.n(o),i=t(78838),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);t.d(a,l);let c=["",{children:["creators",{children:["dashboard",{children:["analytics",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,11443)),"/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/analytics/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/analytics/page.tsx"],m="/creators/dashboard/analytics/page",p={require:t,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/creators/dashboard/analytics/page",pathname:"/creators/dashboard/analytics",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},91736:(e,a,t)=>{Promise.resolve().then(t.bind(t,3725))},3725:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>p});var r=t(48003),s=t(25249),o=t(76836),n=t(39744),i=t(83386),l=t(7538),c=t(55785),d=t(21692);let m=["Overview","Content","Analytics","Earnings","Settings"];function p(){let{user:e,isAuthenticated:a}=(0,o.useAuth)(),[t,p]=(0,s.useState)(null),[x,u]=(0,s.useState)(!0),[f,g]=(0,s.useState)(null),[h,b]=(0,s.useState)("30d"),y=(0,s.useCallback)(async()=>{try{let e;u(!0),g(null);let a=new Date;switch(h){case"7d":e=new Date(a.getTime()-6048e5);break;case"30d":e=new Date(a.getTime()-2592e6);break;case"90d":e=new Date(a.getTime()-7776e6)}let t=await c.api.admin.getAnalytics(e.toISOString(),a.toISOString());if(t.success&&t.data){let e=t.data,a=e.content.map(e=>({label:e.title.substring(0,10),value:e.views})),r=e.revenue.map(e=>({label:e.date.substring(5,10),value:e.amount}));p({views:a.length>0?a:v(h,"views"),engagement:r.length>0?r:v(h,"engagement"),followerGrowth:v(h,"followers"),totalViews:e.content.reduce((e,a)=>e+a.views,0),totalEngagement:e.content.reduce((e,a)=>e+a.likes+a.shares,0),totalFollowers:e.users.length,avgWatchTime:"4m 32s",topContent:e.content.slice(0,5).map(e=>({id:e.id,title:e.title,views:e.views,engagement:e.likes+e.shares}))})}}catch(a){let e=a instanceof Error?a.message:"Failed to load analytics";l.webLogger.error("Creator analytics fetch failed",{error:e,period:h}),g(e)}finally{u(!1)}},[h]),v=(e,a)=>{let t="7d"===e?7:"30d"===e?30:90,r="7d"===e?1:"30d"===e?3:9,s=[];for(let e=0;e<t;e+=r){let a=new Date;a.setDate(a.getDate()-(t-e)),s.push({label:`${a.getMonth()+1}/${a.getDate()}`,value:Math.floor(1e3*Math.random())+100})}return s},w=e=>Math.max(...e.map(e=>e.value),1),j=(e,a,t)=>{let s=w(e);return(0,r.jsxs)(n.Card,{padding:"md",children:[r.jsx("h4",{className:"font-bold mb-4",style:{color:i.colors.text.primary},children:t}),r.jsx("div",{className:"flex items-end gap-1 h-40",children:e.map((e,t)=>r.jsx("div",{className:"flex-1 flex flex-col items-center gap-1",children:r.jsx("div",{className:"w-full rounded-t transition-all duration-300",style:{height:`${e.value/s*100}%`,backgroundColor:a,minHeight:"4px"}})},t))}),r.jsx("div",{className:"flex items-center gap-1 mt-2",children:e.map((e,a)=>r.jsx("span",{className:"flex-1 text-center text-[10px] truncate",style:{color:i.colors.text.tertiary},children:e.label},a))})]})};return(0,r.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:i.colors.bg.primary},children:[r.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{backgroundColor:i.universeColors.creators.primary},children:r.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),r.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:i.colors.text.primary},children:"Creator Dashboard"})]}),r.jsx("nav",{className:"hidden md:flex items-center gap-8",children:m.map(e=>r.jsx(d.default,{href:`/creators/dashboard/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Analytics"===e?i.colors.primary[500]:i.colors.text.secondary},children:e},e))}),r.jsx("div",{className:"flex items-center gap-4",children:a?(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(n.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),r.jsx("span",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:e?.name})]}):r.jsx(d.default,{href:"/auth/login",children:r.jsx(n.Button,{variant:"ghost",size:"sm",children:"Sign In"})})})]})}),(0,r.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[(0,r.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8",children:[(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-3xl font-bold mb-2",style:{color:i.colors.text.primary},children:"Analytics"}),r.jsx("p",{style:{color:i.colors.text.secondary},children:"Track your content performance and audience growth"})]}),r.jsx("div",{className:"flex items-center gap-2",children:[{key:"7d",label:"7 Days"},{key:"30d",label:"30 Days"},{key:"90d",label:"90 Days"}].map(e=>r.jsx("button",{onClick:()=>b(e.key),className:"px-4 py-2 rounded-lg text-sm font-medium transition-colors",style:{backgroundColor:h===e.key?i.colors.primary[500]:i.colors.bg.tertiary,color:h===e.key?"#ffffff":i.colors.text.secondary},children:e.label},e.key))})]}),f&&(0,r.jsxs)("div",{className:"mb-8 p-4 rounded-lg border flex items-center justify-between",style:{backgroundColor:`${i.colors.warning[500]}10`,borderColor:i.colors.warning[500]},children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("span",{className:"text-xl",children:"⚠️"}),r.jsx("p",{style:{color:i.colors.text.primary},children:f})]}),r.jsx(n.Button,{variant:"outline",size:"sm",onClick:y,children:"Retry"})]}),r.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10",children:x?Array.from({length:4}).map((e,a)=>r.jsx(n.Skeleton,{height:"120px",className:"rounded-lg"},a)):[{label:"Total Views",value:t?.totalViews.toLocaleString()||"0",icon:"\uD83D\uDC41️"},{label:"Total Engagement",value:t?.totalEngagement.toLocaleString()||"0",icon:"\uD83D\uDCAC"},{label:"Followers",value:t?.totalFollowers.toLocaleString()||"0",icon:"\uD83D\uDC65"},{label:"Avg Watch Time",value:t?.avgWatchTime||"0m",icon:"⏱️"}].map((e,a)=>(0,r.jsxs)(n.Card,{padding:"md",children:[r.jsx("span",{className:"text-2xl mb-2 block",children:e.icon}),r.jsx("p",{className:"text-2xl font-bold mb-1",style:{color:i.colors.text.primary},children:e.value}),r.jsx("p",{className:"text-sm",style:{color:i.colors.text.secondary},children:e.label})]},a))}),x?r.jsx("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10",children:Array.from({length:3}).map((e,a)=>r.jsx(n.Skeleton,{height:"240px",className:"rounded-lg"},a))}):t?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10",children:[j(t.views,i.universeColors.creators.primary,"Views"),j(t.engagement,i.colors.primary[500],"Engagement")]}),r.jsx("div",{className:"mb-10",children:j(t.followerGrowth,i.colors.success[400],"Follower Growth")})]}):null,(0,r.jsxs)("div",{children:[r.jsx("h3",{className:"text-xl font-bold mb-6",style:{color:i.colors.text.primary},children:"Top Performing Content"}),x?r.jsx("div",{className:"space-y-4",children:Array.from({length:5}).map((e,a)=>r.jsx(n.Skeleton,{height:"64px",className:"rounded-lg"},a))}):t&&t.topContent.length>0?r.jsx(n.Card,{padding:"md",children:t.topContent.map((e,a)=>(0,r.jsxs)("div",{className:"flex items-center gap-4 py-4 border-b last:border-0",style:{borderColor:i.colors.border.light},children:[r.jsx("span",{className:"text-lg font-bold w-8 text-center",style:{color:i.colors.text.tertiary},children:a+1}),r.jsx("div",{className:"flex-1 min-w-0",children:r.jsx("p",{className:"font-medium truncate",style:{color:i.colors.text.primary},children:e.title})}),(0,r.jsxs)("div",{className:"text-right",children:[(0,r.jsxs)("p",{className:"text-sm font-medium",style:{color:i.colors.text.primary},children:[e.views.toLocaleString()," views"]}),(0,r.jsxs)("p",{className:"text-xs",style:{color:i.colors.text.tertiary},children:[e.engagement.toLocaleString()," engagements"]})]})]},e.id))}):r.jsx(n.Card,{padding:"md",children:(0,r.jsxs)("div",{className:"text-center py-8",children:[r.jsx("span",{className:"text-4xl mb-4 block",children:"\uD83D\uDCCA"}),r.jsx("p",{style:{color:i.colors.text.secondary},children:"No analytics data available yet. Upload content to start tracking."})]})})]})]}),r.jsx("footer",{className:"border-t py-12 mt-12",style:{borderColor:i.colors.border.light,backgroundColor:i.colors.bg.secondary},children:r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:r.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:i.colors.border.light,color:i.colors.text.tertiary},children:r.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})})})]})}},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var t in e)"default"===t||Object.prototype.hasOwnProperty.call(a,t)||r(a,e,t)}(t(34210),a)},11443:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>r});let r=(0,t(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/creators/dashboard/analytics/page.tsx#default`)}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[3672,4236,1692,4992,4518,9744],()=>t(14195));module.exports=r})();