(()=>{var e={};e.id=6097,e.ids=[6097],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},7825:(e,a,t)=>{"use strict";t.r(a),t.d(a,{GlobalError:()=>o.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>d,routeModule:()=>p,tree:()=>c}),t(83232),t(50311),t(45347);var s=t(37164),r=t(93666),i=t(94558),o=t.n(i),n=t(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);t.d(a,l);let c=["",{children:["reality",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,83232)),"/Users/deprof/www/azeebo+/apps/web/src/app/reality/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/reality/page.tsx"],m="/reality/page",x={require:t,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/reality/page",pathname:"/reality",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},79256:(e,a,t)=>{Promise.resolve().then(t.bind(t,39405))},39405:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>d});var s=t(48003),r=t(25249),i=t(76836);t(55785),t(7538);var o=t(39744),n=t(83386),l=t(21692),c=t(8426);function d(){let{user:e,isAuthenticated:a}=(0,i.useAuth)(),{isUniverseEnabled:t,hasFeature:d,isLoading:m}=(0,c.Bp)(),{getSetting:x}=(0,c.rV)(),p=x("site_name","Azeebo+"),[u,f]=(0,r.useState)([]),[h,g]=(0,r.useState)(null),[b,y]=(0,r.useState)(!0),[v,j]=(0,r.useState)(null),[N]=(0,r.useState)([{id:"1",name:"Contestant 1",avatar:"C1",votes:12500,status:"safe"},{id:"2",name:"Contestant 2",avatar:"C2",votes:9800,status:"safe"},{id:"3",name:"Contestant 3",avatar:"C3",votes:7200,status:"danger"},{id:"4",name:"Contestant 4",avatar:"C4",votes:3100,status:"eliminated"}]);return t("reality"),(0,s.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[s.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{background:n.gradients.brand},children:s.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),s.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:p})]}),s.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Reality"].map(e=>s.jsx(l.default,{href:"Home"===e?"/":"Reality"===e?"/reality":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Reality"===e?n.colors.primary[500]:n.colors.text.secondary},children:e},e))}),s.jsx("div",{className:"flex items-center gap-4",children:a?s.jsx("div",{className:"flex items-center gap-4",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(o.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),s.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[s.jsx(l.default,{href:"/auth/login",children:s.jsx(o.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),s.jsx(l.default,{href:"/auth/register",children:s.jsx(o.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),s.jsx("section",{className:"relative",children:b?s.jsx(o.Skeleton,{height:"500px",className:"w-full"}):h?(0,s.jsxs)("div",{className:"relative h-[500px]",children:[s.jsx("img",{src:h.thumbnail,alt:h.title,className:"w-full h-full object-cover"}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"}),(0,s.jsxs)("div",{className:"absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto",children:[s.jsx("h2",{className:"text-4xl font-bold text-white mb-2",children:h.title}),s.jsx("p",{className:"text-gray-300 text-lg mb-6 max-w-2xl",children:h.description}),(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsxs)(o.Button,{size:"lg",variant:"primary",children:[s.jsx("span",{children:"\uD83C\uDFAC"})," Watch Live"]}),(0,s.jsxs)(o.Button,{size:"lg",variant:"secondary",children:[s.jsx("span",{children:"\uD83D\uDCCA"})," Vote Now"]})]})]})]}):null}),(0,s.jsxs)("section",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[s.jsx("div",{className:"flex items-center justify-between mb-8",children:(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Reality Shows"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"Watch and vote for your favorite contestants"})]})}),s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",children:u.map(e=>(0,s.jsxs)(o.Card,{padding:"none",className:"overflow-hidden cursor-pointer hover:shadow-xl transition-shadow",children:[(0,s.jsxs)("div",{className:"relative",children:[s.jsx("img",{src:e.thumbnail,alt:e.title,className:"w-full h-48 object-cover"}),s.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"}),(0,s.jsxs)("div",{className:"absolute bottom-4 left-4 right-4",children:[s.jsx(o.Badge,{className:"mb-2",children:e.contentType||"Reality"}),s.jsx("h3",{className:"text-xl font-bold text-white",children:e.title})]})]}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("p",{className:"text-sm text-gray-400 mb-3",children:e.description}),(0,s.jsxs)("div",{className:"flex items-center justify-between text-sm",children:[(0,s.jsxs)("span",{className:"text-gray-400",children:["\uD83C\uDFAC ",e.duration||0," min"]}),(0,s.jsxs)("span",{className:"text-gray-400",children:["\uD83D\uDCC5 ",new Date(e.createdAt).toLocaleDateString()]})]}),s.jsx(o.Button,{variant:"primary",className:"w-full mt-4",children:"Watch Now"})]})]},e.id))})]}),s.jsx("section",{className:"py-12",style:{backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"text-2xl sm:text-3xl font-bold",style:{color:n.colors.text.primary},children:"Vote Leaderboard"}),s.jsx("p",{className:"text-base mt-1",style:{color:n.colors.text.secondary},children:"See who's leading the competition"})]}),s.jsx(o.Button,{variant:"ghost",children:"View All"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-8",children:[(0,s.jsxs)("div",{className:"bg-card rounded-xl p-6",children:[(0,s.jsxs)("h3",{className:"text-lg font-bold mb-4",style:{color:n.colors.text.primary},children:[h?.title||"Show"," - Current Vote Count"]}),s.jsx("div",{className:"space-y-4",children:N.map((e,a)=>(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3",children:[s.jsx("span",{className:"w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold",style:{color:n.colors.text.primary},children:a+1}),s.jsx(o.Avatar,{size:"md",fallback:e.avatar})]}),(0,s.jsxs)("div",{className:"flex-1",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[s.jsx("span",{className:"font-medium",style:{color:n.colors.text.primary},children:e.name}),(0,s.jsxs)("span",{className:"text-sm",style:{color:n.colors.text.secondary},children:[e.votes.toLocaleString()," votes"]})]}),s.jsx("div",{className:"h-2 bg-gray-700 rounded-full overflow-hidden",children:s.jsx("div",{className:"h-full rounded-full transition-all",style:{width:`${e.votes/45e3*100}%`,backgroundColor:"safe"===e.status?n.colors.success[500]:"danger"===e.status?n.colors.error[500]:n.colors.text.tertiary}})})]}),"danger"===e.status&&s.jsx(o.Badge,{variant:"error",children:"Danger"}),"eliminated"===e.status&&s.jsx(o.Badge,{variant:"secondary",children:"Eliminated"})]},e.id))}),s.jsx(o.Button,{variant:"primary",className:"w-full mt-6",children:"Vote Now"})]}),(0,s.jsxs)("div",{className:"space-y-6",children:[(0,s.jsxs)("div",{className:"bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white",children:[s.jsx("h3",{className:"text-xl font-bold mb-2",children:"Vote & Win Rewards!"}),s.jsx("p",{className:"text-white/80 mb-4",children:"Every vote you cast earns you reward points that can be redeemed for exclusive content and prizes."}),(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("p",{className:"text-3xl font-bold",children:"500"}),s.jsx("p",{className:"text-sm text-white/70",children:"Points Earned"})]}),s.jsx("div",{className:"w-px h-12 bg-white/30"}),(0,s.jsxs)("div",{className:"text-center",children:[s.jsx("p",{className:"text-3xl font-bold",children:"25"}),s.jsx("p",{className:"text-sm text-white/70",children:"Votes Today"})]})]})]}),(0,s.jsxs)(o.Card,{padding:"none",children:[s.jsx("div",{className:"p-4 border-b border-gray-700",children:s.jsx("h3",{className:"font-bold",style:{color:n.colors.text.primary},children:"Vote Tips"})}),(0,s.jsxs)("div",{className:"p-4 space-y-3",children:[(0,s.jsxs)("div",{className:"flex items-start gap-3",children:[s.jsx("span",{className:"text-lg",children:"\uD83D\uDCA1"}),(0,s.jsxs)("div",{children:[s.jsx("p",{className:"font-medium text-sm",style:{color:n.colors.text.primary},children:"Supervote Power"}),s.jsx("p",{className:"text-xs",style:{color:n.colors.text.secondary},children:"Use supervotes to multiply your impact"})]})]}),(0,s.jsxs)("div",{className:"flex items-start gap-3",children:[s.jsx("span",{className:"text-lg",children:"\uD83C\uDF81"}),(0,s.jsxs)("div",{children:[s.jsx("p",{className:"font-medium text-sm",style:{color:n.colors.text.primary},children:"Daily Rewards"}),s.jsx("p",{className:"text-xs",style:{color:n.colors.text.secondary},children:"Vote daily to earn bonus points"})]})]}),(0,s.jsxs)("div",{className:"flex items-start gap-3",children:[s.jsx("span",{className:"text-lg",children:"\uD83C\uDFC6"}),(0,s.jsxs)("div",{children:[s.jsx("p",{className:"font-medium text-sm",style:{color:n.colors.text.primary},children:"Leaderboard Bonus"}),s.jsx("p",{className:"text-xs",style:{color:n.colors.text.secondary},children:"Top voters get exclusive perks"})]})]})]})]})]})]})]})}),s.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,s.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,s.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:p}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,s.jsxs)("div",{children:[s.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),s.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>s.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),s.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:(0,s.jsxs)("p",{children:["\xa9 2026 ",p,". All rights reserved."]})})]})})]})}},8426:(e,a,t)=>{"use strict";a.Bp=function(){let[e,a]=(0,s.useState)([]),[t,o]=(0,s.useState)(!0),[n,l]=(0,s.useState)(null);(0,s.useEffect)(()=>{(async()=>{try{o(!0);let e=await r.api.request("/v1/public/universes");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch universes")}catch(e){i.webLogger.error("Failed to fetch universes",e),l(e.message||"Failed to fetch universes")}finally{o(!1)}})()},[]);let c=a=>e.find(e=>e.name===a);return{universes:e,isLoading:t,error:n,getUniverse:c,isUniverseEnabled:a=>e.some(e=>e.name===a),hasFeature:(e,a)=>{let t=c(e);return!!t&&t.featureFlags.some(e=>e.key===a)}}},a.rV=function(){let[e,a]=(0,s.useState)({}),[t,o]=(0,s.useState)(!0),[n,l]=(0,s.useState)(null);return(0,s.useEffect)(()=>{(async()=>{try{o(!0);let e=await r.api.request("/v1/public/settings");e.success&&e.data?a(e.data):l(e.message||"Failed to fetch settings")}catch(e){i.webLogger.error("Failed to fetch settings",e),l(e.message||"Failed to fetch settings")}finally{o(!1)}})()},[]),{settings:e,isLoading:t,error:n,getSetting:(a,t)=>a in e?e[a]:t}};let s=t(25249),r=t(55785),i=t(7538)},34210:(e,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.generateAnimationsCSS=a.animation=a.duration=a.easing=void 0,a.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},a.duration={instant:75,fast:150,normal:200,slow:300,slower:500},a.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},a.generateAnimationsCSS=()=>`
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
}`},a.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},a.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},a.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},a.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},a.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},a.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},a.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},a.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},a.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},a.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},a.themes={dark:{background:a.colors.dark[900],surface:a.colors.dark[800],card:a.colors.dark[700],border:a.colors.dark[600],text:a.colors.light[50],textSecondary:a.colors.light[100],textMuted:a.colors.light[300]},light:{background:a.colors.light[50],surface:a.colors.light[100],card:a.colors.light[50],border:a.colors.light[400],text:a.colors.dark[900],textSecondary:a.colors.dark[700],textMuted:a.colors.dark[400]}},a.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},a.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},a.mediaQueries={sm:`@media (min-width: ${a.breakpoints.sm}px)`,md:`@media (min-width: ${a.breakpoints.md}px)`,lg:`@media (min-width: ${a.breakpoints.lg}px)`,xl:`@media (min-width: ${a.breakpoints.xl}px)`,"2xl":`@media (min-width: ${a.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,a){for(var t in e)"default"===t||Object.prototype.hasOwnProperty.call(a,t)||s(a,e,t)}(t(34210),a)},83232:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>s});let s=(0,t(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/reality/page.tsx#default`)}};var a=require("../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),s=a.X(0,[3672,4236,1692,4992,4518,9744],()=>t(7825));module.exports=s})();