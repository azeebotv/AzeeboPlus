(()=>{var e={};e.id=1931,e.ids=[1931],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},72285:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>m,pages:()=>c,routeModule:()=>x,tree:()=>d}),a(50995),a(50311),a(45347);var r=a(37164),s=a(93666),i=a(94558),o=a.n(i),n=a(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);a.d(t,l);let d=["",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,50995)),"/Users/deprof/www/azeebo+/apps/web/src/app/page.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,45347,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/deprof/www/azeebo+/apps/web/src/app/page.tsx"],m="/page",u={require:a,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/page",pathname:"/",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},85182:(e,t,a)=>{Promise.resolve().then(a.bind(a,20757))},20757:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>x});var r=a(48003),s=a(25249),i=a(76836),o=a(63433),n=a(47276);a(55785);var l=a(39744),d=a(83386),c=a(21692),m=a(74247),u=a(8426);function x(){let{user:e,isAuthenticated:t,logout:a}=(0,i.useAuth)(),{resolvedTheme:x}=(0,o.useTheme)(),{isOnline:p,isInstalled:f,install:h}=(0,n.u)(),{getSetting:g}=(0,u.rV)(),b=g("site_name","Azeebo+"),[y,v]=(0,s.useState)([]),[j,w]=(0,s.useState)([]),[k,N]=(0,s.useState)(!0),[C,E]=(0,s.useState)(!1),S=async()=>{await h()&&E(!1)};return(0,r.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:d.colors.bg.primary},children:[!p&&r.jsx("div",{className:"bg-yellow-500 text-black text-center py-2 px-4 text-sm font-medium sticky top-0 z-50",children:"⚠️ You are offline. Some features may not be available."}),C&&!f&&r.jsx("div",{className:"fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-card border border-border rounded-xl shadow-xl p-4 z-50",children:(0,r.jsxs)("div",{className:"flex items-center justify-between",children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("p",{className:"font-semibold text-foreground",children:["Install ",b]}),r.jsx("p",{className:"text-sm text-muted-foreground",children:"Get the app experience on your device"})]}),(0,r.jsxs)("div",{className:"flex gap-2",children:[r.jsx(l.Button,{variant:"ghost",size:"sm",onClick:()=>E(!1),children:"Later"}),r.jsx(l.Button,{variant:"primary",size:"sm",onClick:S,children:"Install"})]})]})}),r.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{background:d.gradients.brand},children:r.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),r.jsx("h1",{className:"text-2xl font-bold hidden sm:block",children:b})]}),r.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators"].map(e=>r.jsx(c.default,{href:"Home"===e?"/":`/${e.toLowerCase()}`,className:"text-base font-medium hover:text-gray-200 transition-colors",style:{color:d.colors.text.secondary},children:e},e))}),(0,r.jsxs)("div",{className:"flex items-center gap-4",children:[r.jsx(m.T,{}),t?(0,r.jsxs)("div",{className:"flex items-center gap-4",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(l.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),r.jsx("span",{className:"text-sm font-medium",style:{color:d.colors.text.primary},children:e?.name})]}),r.jsx(l.Button,{variant:"ghost",size:"sm",onClick:a,children:"Sign Out"})]}):(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx(c.default,{href:"/auth/login",children:r.jsx(l.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),r.jsx(c.default,{href:"/auth/register",children:r.jsx(l.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})]})]})}),(0,r.jsxs)("main",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16",children:[r.jsx("section",{children:k?r.jsx(l.Skeleton,{height:"400px",borderRadius:"24px"}):y.length>0?r.jsx(l.HeroCard,{title:y[0].title,subtitle:`${y[0].universe.name.charAt(0).toUpperCase()}${y[0].universe.name.slice(1)} Original`,description:y[0].description,thumbnail:y[0].thumbnail,universe:y[0].universe.name,isLive:!1,isPremium:!0,onPlay:()=>{}}):r.jsx(l.Skeleton,{height:"400px",borderRadius:"24px"})}),(0,r.jsxs)("section",{children:[(0,r.jsxs)("div",{className:"flex items-center justify-between mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:d.colors.text.primary},children:"Featured Content"}),r.jsx("p",{className:"text-base mt-1",style:{color:d.colors.text.secondary},children:"Handpicked for you to discover."})]}),r.jsx(l.Button,{variant:"ghost",size:"sm",children:"View All"})]}),r.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:k?Array.from({length:6}).map((e,t)=>(0,r.jsxs)(l.Card,{padding:"none",children:[r.jsx(l.Skeleton,{height:"200px",borderRadius:"0px"}),(0,r.jsxs)("div",{className:"p-5 space-y-3",children:[r.jsx(l.Skeleton,{width:"80%",height:"20px"}),r.jsx(l.Skeleton,{width:"60%",height:"16px"})]})]},t)):y.map(e=>r.jsx(l.ContentCard,{title:e.title,description:e.description,thumbnail:e.thumbnail,universe:e.universe.name,isPremium:!0,onClick:()=>{}},e.id))})]}),r.jsx(l.Divider,{}),(0,r.jsxs)("section",{children:[r.jsx("div",{className:"flex items-center justify-between mb-6",children:(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:d.colors.text.primary},children:"Trending Now"}),r.jsx("p",{className:"text-base mt-1",style:{color:d.colors.text.secondary},children:"What everyone is watching right now."})]})}),r.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:k?Array.from({length:4}).map((e,t)=>(0,r.jsxs)(l.Card,{padding:"none",children:[r.jsx(l.Skeleton,{height:"140px",borderRadius:"0px"}),r.jsx("div",{className:"p-4 space-y-2",children:r.jsx(l.Skeleton,{width:"75%",height:"18px"})})]},t)):j.map(e=>r.jsx(l.ContentCard,{title:e.title,thumbnail:e.thumbnail,universe:e.universe.name,isPremium:!0,onClick:()=>{}},e.id))})]}),r.jsx("section",{className:"py-12 rounded-3xl",style:{background:d.gradients.brand,boxShadow:"0 20px 50px rgba(99,102,241,0.3)"},children:(0,r.jsxs)("div",{className:"max-w-3xl mx-auto text-center px-6",children:[r.jsx(l.Badge,{variant:"success",children:"Earn While Watching"}),r.jsx("h3",{className:"text-3xl sm:text-4xl font-bold mt-4 text-white mb-4",children:"Unlock Exclusive Rewards"}),(0,r.jsxs)("p",{className:"text-lg text-white/90 mb-8 max-w-xl mx-auto",children:["Join ",b," today and get rewarded for every show you watch, every vote you cast, and every share you make."]}),(0,r.jsxs)("div",{className:"flex flex-col sm:flex-row items-center justify-center gap-4",children:[r.jsx(l.Button,{size:"lg",variant:"secondary",leftIcon:r.jsx("span",{children:"\uD83D\uDD25"}),children:"Start Earning Now"}),r.jsx(l.Button,{size:"lg",variant:"ghost",style:{color:"white",borderColor:"rgba(255,255,255,0.3)",borderWidth:"1px"},children:"Explore Rewards"})]})]})})]}),r.jsx("footer",{className:"border-t py-12",style:{borderColor:d.colors.border.light,backgroundColor:d.colors.bg.secondary},children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:d.colors.text.primary},children:b}),r.jsx("ul",{className:"space-y-2",style:{color:d.colors.text.secondary},children:["About","Careers","Press"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:d.colors.text.primary},children:"Help"}),r.jsx("ul",{className:"space-y-2",style:{color:d.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:d.colors.text.primary},children:"Legal"}),r.jsx("ul",{className:"space-y-2",style:{color:d.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,r.jsxs)("div",{children:[r.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:d.colors.text.primary},children:"Connect"}),r.jsx("ul",{className:"space-y-2",style:{color:d.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>r.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),r.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:d.colors.border.light,color:d.colors.text.tertiary},children:(0,r.jsxs)("p",{children:["\xa9 2026 ",b,". All rights reserved."]})})]})})]})}},74247:(e,t,a)=>{"use strict";t.T=function(){let{theme:e,resolvedTheme:t,toggleTheme:a}=(0,s.useTheme)();return r.default.createElement("button",{onClick:a,className:"p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary","aria-label":`Switch to ${"dark"===t?"light":"dark"} mode`,title:`Current: ${t} mode. Click to toggle.`},"dark"===t?r.default.createElement("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},r.default.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"})):r.default.createElement("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},r.default.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"})))};let r=function(e){return e&&e.__esModule?e:{default:e}}(a(25249)),s=a(63433)},8426:(e,t,a)=>{"use strict";t.Bp=function(){let[e,t]=(0,r.useState)([]),[a,o]=(0,r.useState)(!0),[n,l]=(0,r.useState)(null);(0,r.useEffect)(()=>{(async()=>{try{o(!0);let e=await s.api.request("/v1/public/universes");e.success&&e.data?t(e.data):l(e.message||"Failed to fetch universes")}catch(e){i.webLogger.error("Failed to fetch universes",e),l(e.message||"Failed to fetch universes")}finally{o(!1)}})()},[]);let d=t=>e.find(e=>e.name===t);return{universes:e,isLoading:a,error:n,getUniverse:d,isUniverseEnabled:t=>e.some(e=>e.name===t),hasFeature:(e,t)=>{let a=d(e);return!!a&&a.featureFlags.some(e=>e.key===t)}}},t.rV=function(){let[e,t]=(0,r.useState)({}),[a,o]=(0,r.useState)(!0),[n,l]=(0,r.useState)(null);return(0,r.useEffect)(()=>{(async()=>{try{o(!0);let e=await s.api.request("/v1/public/settings");e.success&&e.data?t(e.data):l(e.message||"Failed to fetch settings")}catch(e){i.webLogger.error("Failed to fetch settings",e),l(e.message||"Failed to fetch settings")}finally{o(!1)}})()},[]),{settings:e,isLoading:a,error:n,getSetting:(t,a)=>t in e?e[t]:a}};let r=a(25249),s=a(55785),i=a(7538)},47276:(e,t,a)=>{"use strict";t.u=function(){let[e,t]=(0,r.useState)({isInstalled:!1,isOnline:"undefined"==typeof navigator||navigator.onLine,deferredPrompt:null});(0,r.useEffect)(()=>{"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(e=>{s.webLogger.log("SW registered",e.scope)}).catch(e=>{s.webLogger.log("SW registration failed",e)})});let e=()=>t(e=>({...e,isOnline:!0})),a=()=>t(e=>({...e,isOnline:!1}));return window.addEventListener("online",e),window.addEventListener("offline",a),window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),t(t=>({...t,deferredPrompt:e}))}),window.matchMedia("(display-mode: standalone)").matches&&t(e=>({...e,isInstalled:!0})),()=>{window.removeEventListener("online",e),window.removeEventListener("offline",a)}},[]);let a=async()=>{if(!e.deferredPrompt)return!1;e.deferredPrompt.prompt();let{outcome:a}=await e.deferredPrompt.userChoice;return"accepted"===a&&t(e=>({...e,isInstalled:!0,deferredPrompt:null})),"accepted"===a};return{...e,install:a,isPWAEnabled:"serviceWorker"in navigator}};let r=a(25249),s=a(7538)},34210:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.generateAnimationsCSS=t.animation=t.duration=t.easing=void 0,t.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},t.duration={instant:75,fast:150,normal:200,slow:300,slower:500},t.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},t.generateAnimationsCSS=()=>`
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
}`},t.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},t.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},t.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},t.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},t.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},t.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},t.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},t.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},t.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},t.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},t.themes={dark:{background:t.colors.dark[900],surface:t.colors.dark[800],card:t.colors.dark[700],border:t.colors.dark[600],text:t.colors.light[50],textSecondary:t.colors.light[100],textMuted:t.colors.light[300]},light:{background:t.colors.light[50],surface:t.colors.light[100],card:t.colors.light[50],border:t.colors.light[400],text:t.colors.dark[900],textSecondary:t.colors.dark[700],textMuted:t.colors.dark[400]}},t.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},t.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},t.mediaQueries={sm:`@media (min-width: ${t.breakpoints.sm}px)`,md:`@media (min-width: ${t.breakpoints.md}px)`,lg:`@media (min-width: ${t.breakpoints.lg}px)`,xl:`@media (min-width: ${t.breakpoints.xl}px)`,"2xl":`@media (min-width: ${t.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,t){for(var a in e)"default"===a||Object.prototype.hasOwnProperty.call(t,a)||r(t,e,a)}(a(34210),t)},50995:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/page.tsx#default`)}};var t=require("../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[3672,4236,1692,4992,4518,9744],()=>a(72285));module.exports=r})();