(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerpolicy&&(o.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?o.credentials="include":r.crossorigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=n(r);fetch(r.href,o)}})();function h(){}const lt=t=>t;function Z(t,e){for(const n in e)t[n]=e[n];return t}function it(t){return t()}function $(){return Object.create(null)}function B(t){t.forEach(it)}function at(t){return typeof t=="function"}function I(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}function dt(t){return Object.keys(t).length===0}function mt(t,...e){if(t==null)return h;const n=t.subscribe(...e);return n.unsubscribe?()=>n.unsubscribe():n}const ot=typeof window<"u";let ht=ot?()=>window.performance.now():()=>Date.now(),st=ot?t=>requestAnimationFrame(t):h;const x=new Set;function ut(t){x.forEach(e=>{e.c(t)||(x.delete(e),e.f())}),x.size!==0&&st(ut)}function gt(t){let e;return x.size===0&&st(ut),{promise:new Promise(n=>{x.add(e={c:t,f:n})}),abort(){x.delete(e)}}}function b(t,e){t.appendChild(e)}function U(t,e,n){t.insertBefore(e,n||null)}function R(t){t.parentNode.removeChild(t)}function G(t){return document.createElement(t)}function tt(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function _t(t){return document.createTextNode(t)}function z(){return _t(" ")}function yt(t,e,n,i){return t.addEventListener(e,n,i),()=>t.removeEventListener(e,n,i)}function _(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function pt(t){return Array.from(t.childNodes)}function N(t,e,n,i){n===null?t.style.removeProperty(e):t.style.setProperty(e,n,i?"important":"")}let S;function P(t){S=t}function wt(){if(!S)throw new Error("Function called outside component initialization");return S}function bt(t){wt().$$.on_mount.push(t)}const M=[],et=[],D=[],nt=[],xt=Promise.resolve();let J=!1;function Et(){J||(J=!0,xt.then(ft))}function H(t){D.push(t)}const K=new Set;let T=0;function ft(){const t=S;do{for(;T<M.length;){const e=M[T];T++,P(e),At(e.$$)}for(P(null),M.length=0,T=0;et.length;)et.pop()();for(let e=0;e<D.length;e+=1){const n=D[e];K.has(n)||(K.add(n),n())}D.length=0}while(M.length);for(;nt.length;)nt.pop()();J=!1,K.clear(),P(t)}function At(t){if(t.fragment!==null){t.update(),B(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(H)}}const F=new Set;let kt;function O(t,e){t&&t.i&&(F.delete(t),t.i(e))}function C(t,e,n,i){if(t&&t.o){if(F.has(t))return;F.add(t),kt.c.push(()=>{F.delete(t),i&&(n&&t.d(1),i())}),t.o(e)}else i&&i()}function q(t){t&&t.c()}function j(t,e,n,i){const{fragment:r,on_mount:o,on_destroy:s,after_update:l}=t.$$;r&&r.m(e,n),i||H(()=>{const f=o.map(it).filter(at);s?s.push(...f):B(f),t.$$.on_mount=[]}),l.forEach(H)}function L(t,e){const n=t.$$;n.fragment!==null&&(B(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function Mt(t,e){t.$$.dirty[0]===-1&&(M.push(t),Et(),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function V(t,e,n,i,r,o,s,l=[-1]){const f=S;P(t);const u=t.$$={fragment:null,ctx:null,props:o,update:h,not_equal:r,bound:$(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(e.context||(f?f.$$.context:[])),callbacks:$(),dirty:l,skip_bound:!1,root:e.target||f.$$.root};s&&s(u.root);let m=!1;if(u.ctx=n?n(t,e.props||{},(c,a,...g)=>{const y=g.length?g[0]:a;return u.ctx&&r(u.ctx[c],u.ctx[c]=y)&&(!u.skip_bound&&u.bound[c]&&u.bound[c](y),m&&Mt(t,c)),a}):[],u.update(),m=!0,B(u.before_update),u.fragment=i?i(u.ctx):!1,e.target){if(e.hydrate){const c=pt(e.target);u.fragment&&u.fragment.l(c),c.forEach(R)}else u.fragment&&u.fragment.c();e.intro&&O(t.$$.fragment),j(t,e.target,e.anchor,e.customElement),ft()}P(f)}class X{$destroy(){L(this,1),this.$destroy=h}$on(e,n){const i=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return i.push(n),()=>{const r=i.indexOf(n);r!==-1&&i.splice(r,1)}}$set(e){this.$$set&&!dt(e)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}function Ot(t){let e;return{c(){e=G("div"),e.innerHTML=`<a href="https://github.com/tonydoesathing" class="svelte-11kowyo"><h2 id="first" class="svelte-11kowyo">github</h2></a> 
  <a href="http://tonydoesathing.github.io/TonyMastromarinoResume.pdf" class="svelte-11kowyo"><h2 id="second" class="svelte-11kowyo">resume</h2></a> 
  <a href="mailto:mastromarino.tony@gmail.com" class="svelte-11kowyo"><h2 id="third" class="svelte-11kowyo">email</h2></a>`,_(e,"class","menu svelte-11kowyo")},m(n,i){U(n,e,i)},p:h,i:h,o:h,d(n){n&&R(e)}}}class jt extends X{constructor(e){super(),V(this,e,null,Ot,I,{})}}const w=[];function Lt(t,e=h){let n;const i=new Set;function r(l){if(I(t,l)&&(t=l,n)){const f=!w.length;for(const u of i)u[1](),w.push(u,t);if(f){for(let u=0;u<w.length;u+=2)w[u][0](w[u+1]);w.length=0}}}function o(l){r(l(t))}function s(l,f=h){const u=[l,f];return i.add(u),i.size===1&&(n=e(r)||h),l(t),()=>{i.delete(u),i.size===0&&(n(),n=null)}}return{set:r,update:o,subscribe:s}}function rt(t){return Object.prototype.toString.call(t)==="[object Date]"}function Q(t,e){if(t===e||t!==t)return()=>t;const n=typeof t;if(n!==typeof e||Array.isArray(t)!==Array.isArray(e))throw new Error("Cannot interpolate values of different type");if(Array.isArray(t)){const i=e.map((r,o)=>Q(t[o],r));return r=>i.map(o=>o(r))}if(n==="object"){if(!t||!e)throw new Error("Object cannot be null");if(rt(t)&&rt(e)){t=t.getTime(),e=e.getTime();const o=e-t;return s=>new Date(t+s*o)}const i=Object.keys(e),r={};return i.forEach(o=>{r[o]=Q(t[o],e[o])}),o=>{const s={};return i.forEach(l=>{s[l]=r[l](o)}),s}}if(n==="number"){const i=e-t;return r=>t+r*i}throw new Error(`Cannot interpolate ${n} values`)}function Pt(t,e={}){const n=Lt(t);let i,r=t;function o(s,l){if(t==null)return n.set(t=s),Promise.resolve();r=s;let f=i,u=!1,{delay:m=0,duration:c=400,easing:a=lt,interpolate:g=Q}=Z(Z({},e),l);if(c===0)return f&&(f.abort(),f=null),n.set(t=r),Promise.resolve();const y=ht()+m;let p;return i=gt(E=>{if(E<y)return!0;u||(p=g(t,s),typeof c=="function"&&(c=c(t,s)),u=!0),f&&(f.abort(),f=null);const A=E-y;return A>c?(n.set(t=s),!1):(n.set(t=p(a(A/c))),!0)}),i.promise}return{set:o,update:(s,l)=>o(s(r,t),l),subscribe:n.subscribe}}function St(t){let e,n,i,r;return H(t[14]),{c(){e=tt("svg"),n=tt("rect"),_(n,"width",t[0]),_(n,"height",t[1]),_(e,"width",t[0]),_(e,"height",t[1]),N(e,"top",t[2]),N(e,"right",t[6])},m(o,s){U(o,e,s),b(e,n),i||(r=yt(window,"resize",t[14]),i=!0)},p(o,[s]){s&1&&_(n,"width",o[0]),s&2&&_(n,"height",o[1]),s&1&&_(e,"width",o[0]),s&2&&_(e,"height",o[1]),s&4&&N(e,"top",o[2]),s&64&&N(e,"right",o[6])},i:h,o:h,d(o){o&&R(e),i=!1,r()}}}function zt(t,e,n){let i,r,o,s=h,l=()=>(s(),s=mt(k,d=>n(6,o=d)),k);t.$$.on_destroy.push(()=>s());let{min_y:f=1/3}=e,{min_duration:u=20*1e3}=e,{max_duration:m=30*1e3}=e,{min_width:c=.5}=e,{max_width:a=1.5}=e,{min_height:g=1/24}=e,{max_height:y=1/8}=e,p=0,E=0,A,k,W;const Y=()=>{n(0,p=Math.random()*((a-c)*i)+c*i),n(1,E=Math.random()*((y-g)*r)+g*r),n(2,A=Math.random()*(r*(1-f))+f*r),W=Math.random()*(m-u)+u,l(n(3,k=Pt(-p,{duration:W}))),k.set(i),setTimeout(()=>{Y()},W)};bt(async()=>{Y()});function ct(){n(4,i=window.innerWidth),n(5,r=window.innerHeight)}return t.$$set=d=>{"min_y"in d&&n(7,f=d.min_y),"min_duration"in d&&n(8,u=d.min_duration),"max_duration"in d&&n(9,m=d.max_duration),"min_width"in d&&n(10,c=d.min_width),"max_width"in d&&n(11,a=d.max_width),"min_height"in d&&n(12,g=d.min_height),"max_height"in d&&n(13,y=d.max_height)},n(4,i=0),n(5,r=0),[p,E,A,k,i,r,o,f,u,m,c,a,g,y,ct]}class v extends X{constructor(e){super(),V(this,e,zt,St,I,{min_y:7,min_duration:8,max_duration:9,min_width:10,max_width:11,min_height:12,max_height:13})}}function Nt(t){let e,n,i,r,o,s,l,f,u,m,c;return r=new jt({}),s=new v({}),f=new v({}),m=new v({}),{c(){e=G("main"),n=G("h1"),n.textContent="Tony Mastromarino",i=z(),q(r.$$.fragment),o=z(),q(s.$$.fragment),l=z(),q(f.$$.fragment),u=z(),q(m.$$.fragment),_(n,"class","svelte-142nd1x")},m(a,g){U(a,e,g),b(e,n),b(e,i),j(r,e,null),b(e,o),j(s,e,null),b(e,l),j(f,e,null),b(e,u),j(m,e,null),c=!0},p:h,i(a){c||(O(r.$$.fragment,a),O(s.$$.fragment,a),O(f.$$.fragment,a),O(m.$$.fragment,a),c=!0)},o(a){C(r.$$.fragment,a),C(s.$$.fragment,a),C(f.$$.fragment,a),C(m.$$.fragment,a),c=!1},d(a){a&&R(e),L(r),L(s),L(f),L(m)}}}class Tt extends X{constructor(e){super(),V(this,e,null,Nt,I,{})}}new Tt({target:document.getElementById("app")});
