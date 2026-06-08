(()=>{var e={};e.id=5451,e.ids=[5451],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},32174:(e,r,a)=>{"use strict";a.r(r),a.d(r,{GlobalError:()=>i.a,__next_app__:()=>p,originalPathname:()=>m,pages:()=>d,routeModule:()=>u,tree:()=>c}),a(29325),a(50311),a(45347);var t=a(37164),s=a(93666),o=a(94558),i=a.n(o),n=a(78838),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);a.d(r,l);let c=["",{children:["support",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,29325)),"/Users/deprof/www/azeebo+/apps/web/src/app/support/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,50311)),"/Users/deprof/www/azeebo+/apps/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,45347,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/deprof/www/azeebo+/apps/web/src/app/support/page.tsx"],m="/support/page",p={require:a,loadChunk:()=>Promise.resolve()},u=new t.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/support/page",pathname:"/support",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},40178:(e,r,a)=>{Promise.resolve().then(a.bind(a,10965))},10965:(e,r,a)=>{"use strict";a.r(r),a.d(r,{default:()=>m});var t=a(48003),s=a(25249),o=a(76836),i=a(39744),n=a(83386),l=a(21692);let c=[{id:"1",question:"How do I reset my password?",answer:'Go to Settings > Security > Change Password. If you forgot your password, use the "Forgot Password" option on the login screen.'},{id:"2",question:"How do I cancel my subscription?",answer:"Go to Wallet > Subscriptions and select the subscription you want to cancel. Follow the on-screen instructions."},{id:"3",question:"How do I become a creator?",answer:"Go to Creators > Sign Up and fill out the application form. Our team will review your application within 48 hours."},{id:"4",question:"How do I report a problem?",answer:'Use the "Contact Support" form below or email us at support@azeebo.com with details about the issue.'}],d=["Account","Payment","Content","Technical","Creator"];function m(){let{user:e,isAuthenticated:r}=(0,o.useAuth)(),[a,m]=(0,s.useState)(!0),[p,u]=(0,s.useState)(null),[x,f]=(0,s.useState)({subject:"",category:"",message:""}),[b,h]=(0,s.useState)(!1),y=e=>{u(p===e?null:e)},g=e=>{f({...x,[e.target.name]:e.target.value})};return(0,t.jsxs)("div",{className:"min-h-screen",style:{backgroundColor:n.colors.bg.primary},children:[t.jsx("header",{className:"sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50",children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"h-10 w-10 rounded-xl flex items-center justify-center",style:{background:n.gradients.primary},children:t.jsx("span",{className:"text-white font-bold text-xl leading-none",children:"A"})}),t.jsx("h1",{className:"text-2xl font-bold hidden sm:block",style:{color:n.colors.text.primary},children:"Azeebo+"})]}),t.jsx("nav",{className:"hidden md:flex items-center gap-8",children:["Home","Browse","Library","Creators","Support"].map(e=>t.jsx(l.default,{href:"Home"===e?"/":"Support"===e?"/support":`/${e.toLowerCase()}`,className:"text-base font-medium transition-colors",style:{color:"Support"===e?n.colors.primary[500]:n.colors.text.secondary},children:e},e))}),t.jsx("div",{className:"flex items-center gap-4",children:r?t.jsx("div",{className:"flex items-center gap-4",children:(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[t.jsx(i.Avatar,{size:"md",fallback:e?.name?.charAt(0)||"U"}),t.jsx("span",{className:"text-sm font-medium",style:{color:n.colors.text.primary},children:e?.name})]})}):(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[t.jsx(l.default,{href:"/auth/login",children:t.jsx(i.Button,{variant:"ghost",size:"sm",children:"Sign In"})}),t.jsx(l.default,{href:"/auth/register",children:t.jsx(i.Button,{variant:"primary",size:"sm",children:"Get Started"})})]})})]})}),(0,t.jsxs)("section",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[(0,t.jsxs)("div",{className:"text-center mb-12",children:[t.jsx("h2",{className:"text-3xl font-bold mb-4",style:{color:n.colors.text.primary},children:"How can we help you? \uD83D\uDC4B"}),t.jsx("p",{style:{color:n.colors.text.secondary},children:"Find answers to common questions or contact our support team."})]}),t.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12",children:[{icon:"\uD83D\uDCDA",label:"Help Center",description:"Browse our knowledge base"},{icon:"\uD83D\uDCDE",label:"Contact Us",description:"Get in touch with support"},{icon:"\uD83D\uDCCB",label:"Submit Ticket",description:"Report an issue"},{icon:"\uD83D\uDCAC",label:"Live Chat",description:"Chat with us now"}].map((e,r)=>(0,t.jsxs)(i.Card,{padding:"md",className:"text-center cursor-pointer hover:shadow-lg transition-shadow",children:[t.jsx("span",{className:"text-4xl mb-3 block",children:e.icon}),t.jsx("h4",{className:"font-bold mb-1",style:{color:n.colors.text.primary},children:e.label}),t.jsx("p",{className:"text-sm",style:{color:n.colors.text.secondary},children:e.description})]},r))}),(0,t.jsxs)("div",{className:"mb-12",children:[t.jsx("h3",{className:"text-2xl font-bold mb-6",style:{color:n.colors.text.primary},children:"Frequently Asked Questions"}),a?t.jsx("div",{className:"space-y-4",children:[1,2,3,4].map(e=>t.jsx(i.Skeleton,{height:"80px",className:"rounded-lg"},e))}):t.jsx("div",{className:"space-y-4",children:c.map(e=>(0,t.jsxs)(i.Card,{padding:"md",className:"cursor-pointer",children:[(0,t.jsxs)("div",{onClick:()=>y(e.id),className:"flex items-center justify-between",children:[t.jsx("h4",{className:"font-bold",style:{color:n.colors.text.primary},children:e.question}),t.jsx("span",{className:"text-2xl",style:{color:n.colors.text.secondary},children:p===e.id?"−":"+"})]}),p===e.id&&t.jsx("p",{className:"mt-4 pt-4 border-t",style:{borderColor:n.colors.border.light,color:n.colors.text.secondary},children:e.answer})]},e.id))})]}),(0,t.jsxs)("div",{children:[t.jsx("h3",{className:"text-2xl font-bold mb-6",style:{color:n.colors.text.primary},children:"Contact Support"}),b?(0,t.jsxs)(i.Card,{padding:"md",className:"text-center py-12",children:[t.jsx("span",{className:"text-6xl mb-4 block",children:"✅"}),t.jsx("h4",{className:"text-xl font-bold mb-2",style:{color:n.colors.text.primary},children:"Ticket Submitted!"}),t.jsx("p",{className:"mb-6",style:{color:n.colors.text.secondary},children:"We\\'ll get back to you within 24 hours."}),t.jsx(i.Button,{variant:"primary",onClick:()=>h(!1),children:"Submit Another Ticket"})]}):t.jsx(i.Card,{padding:"md",children:t.jsx("form",{onSubmit:e=>{e.preventDefault(),h(!0)},children:(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{children:[t.jsx("label",{className:"block font-medium mb-2",style:{color:n.colors.text.primary},children:"Subject"}),t.jsx("input",{type:"text",name:"subject",value:x.subject,onChange:g,placeholder:"Brief description of your issue",className:"w-full px-4 py-3 rounded-lg border-2 focus:outline-none",style:{backgroundColor:n.colors.bg.secondary,borderColor:n.colors.border.light,color:n.colors.text.primary},required:!0})]}),(0,t.jsxs)("div",{children:[t.jsx("label",{className:"block font-medium mb-2",style:{color:n.colors.text.primary},children:"Category"}),(0,t.jsxs)("select",{name:"category",value:x.category,onChange:g,className:"w-full px-4 py-3 rounded-lg border-2 focus:outline-none",style:{backgroundColor:n.colors.bg.secondary,borderColor:n.colors.border.light,color:n.colors.text.primary},required:!0,children:[t.jsx("option",{value:"",children:"Select a category"}),d.map(e=>t.jsx("option",{value:e,children:e},e))]})]}),(0,t.jsxs)("div",{children:[t.jsx("label",{className:"block font-medium mb-2",style:{color:n.colors.text.primary},children:"Message"}),t.jsx("textarea",{name:"message",value:x.message,onChange:g,placeholder:"Tell us more about your issue...",rows:6,className:"w-full px-4 py-3 rounded-lg border-2 focus:outline-none",style:{backgroundColor:n.colors.bg.secondary,borderColor:n.colors.border.light,color:n.colors.text.primary},required:!0})]}),(0,t.jsxs)(i.Button,{variant:"primary",className:"w-full",size:"lg",children:[t.jsx("span",{children:"\uD83D\uDCE4"})," Submit Ticket"]})]})})})]})]}),t.jsx("footer",{className:"border-t py-12",style:{borderColor:n.colors.border.light,backgroundColor:n.colors.bg.secondary},children:(0,t.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:[(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-10",children:[(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Azeebo+"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["About","Careers","Press"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Help"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Support","FAQ","Contact"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Legal"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Terms","Privacy","Cookies"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]}),(0,t.jsxs)("div",{children:[t.jsx("h4",{className:"font-bold text-lg mb-4",style:{color:n.colors.text.primary},children:"Connect"}),t.jsx("ul",{className:"space-y-2",style:{color:n.colors.text.secondary},children:["Twitter","Instagram","Facebook"].map(e=>t.jsx("li",{className:"text-sm hover:text-gray-200 transition-colors cursor-pointer",children:e},e))})]})]}),t.jsx("div",{className:"mt-12 pt-8 border-t text-center text-sm",style:{borderColor:n.colors.border.light,color:n.colors.text.tertiary},children:t.jsx("p",{children:"\xa9 2026 Azeebo+. All rights reserved."})})]})})]})}},34210:(e,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),r.generateAnimationsCSS=r.animation=r.duration=r.easing=void 0,r.easing={ease:"ease",linear:"linear","ease-in":"ease-in","ease-out":"ease-out","ease-in-out":"ease-in-out","ease-in-back":"cubic-bezier(0.6, -0.28, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.32, 1.275)","ease-in-out-back":"cubic-bezier(0.68, -0.55, 0.265, 1.55)"},r.duration={instant:75,fast:150,normal:200,slow:300,slower:500},r.animation={fadeIn:"fade-in",fadeOut:"fade-out",slideUp:"slide-up",slideDown:"slide-down",slideLeft:"slide-left",slideRight:"slide-right",scaleIn:"scale-in",scaleOut:"scale-out",bounceIn:"bounce-in",pulse:"pulse",spin:"spin",shake:"shake",wobble:"wobble"},r.generateAnimationsCSS=()=>`
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
`},83386:(e,r,a)=>{"use strict";var t=Object.create?function(e,r,a,t){void 0===t&&(t=a);var s=Object.getOwnPropertyDescriptor(r,a);(!s||("get"in s?!r.__esModule:s.writable||s.configurable))&&(s={enumerable:!0,get:function(){return r[a]}}),Object.defineProperty(e,t,s)}:function(e,r,a,t){void 0===t&&(t=a),e[t]=r[a]};Object.defineProperty(r,"__esModule",{value:!0}),r.mediaQueries=r.breakpoints=r.gradients=r.themes=r.zIndex=r.transitions=r.shadows=r.borderRadius=r.fontWeightNative=r.fontSizeNative=r.typography=r.spacingNative=r.spacing=r.colors=r.universeColors=void 0,r.generateCSSVariables=function(){let e=[];return Object.entries(r.colors).forEach(([r,a])=>{"object"==typeof a?Object.entries(a).forEach(([a,t])=>{e.push(`  --color-${r}-${a}: ${t};`)}):e.push(`  --color-${r}: ${a};`)}),Object.entries(r.spacing).forEach(([r,a])=>{e.push(`  --spacing-${r}: ${a}px;`)}),Object.entries(r.typography.fontSizes).forEach(([r,a])=>{e.push(`  --font-size-${r}: ${a}px;`)}),Object.entries(r.typography.fontWeights).forEach(([r,a])=>{e.push(`  --font-weight-${r}: ${a};`)}),Object.entries(r.typography.lineHeights).forEach(([r,a])=>{e.push(`  --line-height-${r}: ${a};`)}),Object.entries(r.borderRadius).forEach(([r,a])=>{e.push(`  --radius-${r}: ${9999===a?"9999px":`${a}px`};`)}),Object.entries(r.shadows).forEach(([r,a])=>{e.push(`  --shadow-${r}: ${a};`)}),Object.entries(r.transitions).forEach(([r,a])=>{e.push(`  --transition-${r}: ${a};`)}),Object.entries(r.zIndex).forEach(([r,a])=>{e.push(`  --z-${r}: ${a};`)}),`:root {
${e.join("\n")}
}`},r.universeColors={reality:{primary:"#FF6B6B",secondary:"#FF8E8E"},creators:{primary:"#4ECDC4",secondary:"#7DD9D3"},lifestyle:{primary:"#45B7D1",secondary:"#6EC6D8"},vertical:{primary:"#96CEB4",secondary:"#B5DCC7"},movies:{primary:"#FFEAA7",secondary:"#FFF3C2"},games:{primary:"#DDA0DD",secondary:"#E6BCE6"},comedy:{primary:"#F39C12",secondary:"#F5B041"},sports:{primary:"#E74C3C",secondary:"#EC7063"}},r.colors={primary:{50:"#f5f3ff",100:"#ede9fe",200:"#ddd6fe",300:"#c4b5fd",400:"#a78bfa",500:"#8b5cf6",600:"#7c3aed",700:"#6d28d9",800:"#5b21b6",900:"#4c1d95"},secondary:{50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a"},accent:{gold:"#fbbf24",bronze:"#cd7f32",silver:"#c0c0c0"},success:{50:"#f0fdf4",100:"#dcfce7",200:"#bbf7d0",300:"#86efac",400:"#4ade80",500:"#22c55e",600:"#16a34a",700:"#15803d",800:"#166534",900:"#14532d"},warning:{50:"#fffbeb",100:"#fef3c7",200:"#fde68a",300:"#fcd34d",400:"#fbbf24",500:"#f59e0b",600:"#d97706",700:"#b45309",800:"#92400e",900:"#78350f"},error:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d"},dark:{900:"#0a0a0a",800:"#111111",700:"#1a1a1a",600:"#222222",500:"#2a2a2a",400:"#333333",300:"#444444",200:"#666666",100:"#888888"},light:{50:"#ffffff",100:"#fafafa",200:"#f5f5f5",300:"#f0f0f0",400:"#e5e5e5",500:"#d4d4d4",600:"#a3a3a3",700:"#737373",800:"#525252",900:"#262626"},text:{primary:"#F3F4F6",secondary:"#9CA3AF",tertiary:"#6B7280",inverse:"#111827"},bg:{primary:"#111827",secondary:"#1F2937",tertiary:"#374151",hover:"#4B5563"},border:{default:"#4B5563",light:"#374151",focus:"#6366F1"}},r.spacing={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},r.spacingNative={xs:4,sm:8,md:12,lg:16,xl:24,"2xl":32,"3xl":48,"4xl":64},r.typography={fontSizes:{xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32,"5xl":40,"6xl":48},fontWeights:{thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700",extrabold:"800"},lineHeights:{tight:1.25,normal:1.5,relaxed:1.75}},r.fontSizeNative={xs:10,sm:12,base:14,md:16,lg:18,xl:20,"2xl":24,"3xl":28,"4xl":32},r.fontWeightNative={thin:"300",normal:"400",medium:"500",semibold:"600",bold:"700"},r.borderRadius={none:0,sm:4,md:8,lg:12,xl:16,"2xl":20,"3xl":24,full:9999},r.shadows={none:"none",sm:"0 1px 2px 0 rgba(0, 0, 0, 0.05)",md:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",lg:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",xl:"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)","2xl":"0 25px 50px -12px rgba(0, 0, 0, 0.25)",glow:"0 0 20px rgba(139, 92, 246, 0.4)",goldGlow:"0 0 20px rgba(251, 191, 36, 0.4)"},r.transitions={fast:"150ms ease",normal:"300ms ease",slow:"500ms ease"},r.zIndex={hide:-1,auto:"auto",base:0,dropdown:100,sticky:200,banner:300,overlay:400,modal:500,popover:600,toast:700,tooltip:800},r.themes={dark:{background:r.colors.dark[900],surface:r.colors.dark[800],card:r.colors.dark[700],border:r.colors.dark[600],text:r.colors.light[50],textSecondary:r.colors.light[100],textMuted:r.colors.light[300]},light:{background:r.colors.light[50],surface:r.colors.light[100],card:r.colors.light[50],border:r.colors.light[400],text:r.colors.dark[900],textSecondary:r.colors.dark[700],textMuted:r.colors.dark[400]}},r.gradients={primary:"linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",brand:"linear-gradient(135deg, #6366F1 0%, #EC4899 100%)",gold:"linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",success:"linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",dark:"linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)"},r.breakpoints={sm:640,md:768,lg:1024,xl:1280,"2xl":1536},r.mediaQueries={sm:`@media (min-width: ${r.breakpoints.sm}px)`,md:`@media (min-width: ${r.breakpoints.md}px)`,lg:`@media (min-width: ${r.breakpoints.lg}px)`,xl:`@media (min-width: ${r.breakpoints.xl}px)`,"2xl":`@media (min-width: ${r.breakpoints["2xl"]}px)`,dark:"@media (prefers-color-scheme: dark)",light:"@media (prefers-color-scheme: light)",reducedMotion:"@media (prefers-reduced-motion: reduce)",highContrast:"@media (prefers-contrast: high)"},function(e,r){for(var a in e)"default"===a||Object.prototype.hasOwnProperty.call(r,a)||t(r,e,a)}(a(34210),r)},29325:(e,r,a)=>{"use strict";a.r(r),a.d(r,{default:()=>t});let t=(0,a(36863).createProxy)(String.raw`/Users/deprof/www/azeebo+/apps/web/src/app/support/page.tsx#default`)}};var r=require("../../webpack-runtime.js");r.C(e);var a=e=>r(r.s=e),t=r.X(0,[3672,4236,1692,4992,4518,9744],()=>a(32174));module.exports=t})();