import{g as ve,s as xe,q as Te,p as be,a as we,b as _e,_ as c,c as lt,d as pt,e as De,ax as G,l as it,k as Se,j as Me,y as Ce,u as Ee}from"./chunk-mermaid.core-DQzHWE0m.js";import{g as Et}from"./app-20261106-workspace.js";import{t as Ie,m as Ye,a as Ae,l as Fe,h as $e,c as Ut,d as Zt,e as Le,g as We,i as Oe,j as Pe,k as Ve,n as ze,p as Ne,q as Qt,r as Kt,s as Jt,u as te,v as ee}from"./chunk-d3-scale-4DPf7zan.js";function Re(t){return t}var xt=1,Yt=2,Ft=3,vt=4,re=1e-6;function He(t){return"translate("+t+",0)"}function Be(t){return"translate(0,"+t+")"}function qe(t){return n=>+t(n)}function je(t,n){return n=Math.max(0,t.bandwidth()-n*2)/2,t.round()&&(n=Math.round(n)),i=>+t(i)+n}function Ge(){return!this.__axis}function ue(t,n){var i=[],s=null,a=null,m=6,h=6,b=3,C=typeof window<"u"&&window.devicePixelRatio>1?0:.5,A=t===xt||t===vt?-1:1,T=t===vt||t===Yt?"x":"y",L=t===xt||t===Ft?He:Be;function M(D){var N=s??(n.ticks?n.ticks.apply(n,i):n.domain()),I=a??(n.tickFormat?n.tickFormat.apply(n,i):Re),S=Math.max(m,0)+b,E=n.range(),O=+E[0]+C,$=+E[E.length-1]+C,R=(n.bandwidth?je:qe)(n.copy(),C),H=D.selection?D.selection():D,Y=H.selectAll(".domain").data([null]),p=H.selectAll(".tick").data(N,n).order(),d=p.exit(),u=p.enter().append("g").attr("class","tick"),x=p.select("line"),v=p.select("text");Y=Y.merge(Y.enter().insert("path",".tick").attr("class","domain").attr("stroke","currentColor")),p=p.merge(u),x=x.merge(u.append("line").attr("stroke","currentColor").attr(T+"2",A*m)),v=v.merge(u.append("text").attr("fill","currentColor").attr(T,A*S).attr("dy",t===xt?"0em":t===Ft?"0.71em":"0.32em")),D!==H&&(Y=Y.transition(D),p=p.transition(D),x=x.transition(D),v=v.transition(D),d=d.transition(D).attr("opacity",re).attr("transform",function(k){return isFinite(k=R(k))?L(k+C):this.getAttribute("transform")}),u.attr("opacity",re).attr("transform",function(k){var f=this.parentNode.__axis;return L((f&&isFinite(f=f(k))?f:R(k))+C)})),d.remove(),Y.attr("d",t===vt||t===Yt?h?"M"+A*h+","+O+"H"+C+"V"+$+"H"+A*h:"M"+C+","+O+"V"+$:h?"M"+O+","+A*h+"V"+C+"H"+$+"V"+A*h:"M"+O+","+C+"H"+$),p.attr("opacity",1).attr("transform",function(k){return L(R(k)+C)}),x.attr(T+"2",A*m),v.attr(T,A*S).text(I),H.filter(Ge).attr("fill","none").attr("font-size",10).attr("font-family","sans-serif").attr("text-anchor",t===Yt?"start":t===vt?"end":"middle"),H.each(function(){this.__axis=R})}return M.scale=function(D){return arguments.length?(n=D,M):n},M.ticks=function(){return i=Array.from(arguments),M},M.tickArguments=function(D){return arguments.length?(i=D==null?[]:Array.from(D),M):i.slice()},M.tickValues=function(D){return arguments.length?(s=D==null?null:Array.from(D),M):s&&s.slice()},M.tickFormat=function(D){return arguments.length?(a=D,M):a},M.tickSize=function(D){return arguments.length?(m=h=+D,M):m},M.tickSizeInner=function(D){return arguments.length?(m=+D,M):m},M.tickSizeOuter=function(D){return arguments.length?(h=+D,M):h},M.tickPadding=function(D){return arguments.length?(b=+D,M):b},M.offset=function(D){return arguments.length?(C=+D,M):C},M}function Xe(t){return ue(xt,t)}function Ue(t){return ue(Ft,t)}var Tt={exports:{}},Ze=Tt.exports,ne;function Qe(){return ne||(ne=1,(function(t,n){(function(i,s){t.exports=s()})(Ze,(function(){var i="day";return function(s,a,m){var h=function(A){return A.add(4-A.isoWeekday(),i)},b=a.prototype;b.isoWeekYear=function(){return h(this).year()},b.isoWeek=function(A){if(!this.$utils().u(A))return this.add(7*(A-this.isoWeek()),i);var T,L,M,D,N=h(this),I=(T=this.isoWeekYear(),L=this.$u,M=(L?m.utc:m)().year(T).startOf("year"),D=4-M.isoWeekday(),M.isoWeekday()>4&&(D+=7),M.add(D,i));return N.diff(I,"week")+1},b.isoWeekday=function(A){return this.$utils().u(A)?this.day()||7:this.day(this.day()%7?A:A-7)};var C=b.startOf;b.startOf=function(A,T){var L=this.$utils(),M=!!L.u(T)||T;return L.p(A)==="isoweek"?M?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):C.bind(this)(A,T)}}}))})(Tt)),Tt.exports}var Ke=Qe();const Je=Et(Ke);var bt={exports:{}},tr=bt.exports,se;function er(){return se||(se=1,(function(t,n){(function(i,s){t.exports=s()})(tr,(function(){var i={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},s=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,a=/\d/,m=/\d\d/,h=/\d\d?/,b=/\d*[^-_:/,()\s\d]+/,C={},A=function(S){return(S=+S)+(S>68?1900:2e3)},T=function(S){return function(E){this[S]=+E}},L=[/[+-]\d\d:?(\d\d)?|Z/,function(S){(this.zone||(this.zone={})).offset=(function(E){if(!E||E==="Z")return 0;var O=E.match(/([+-]|\d\d)/g),$=60*O[1]+(+O[2]||0);return $===0?0:O[0]==="+"?-$:$})(S)}],M=function(S){var E=C[S];return E&&(E.indexOf?E:E.s.concat(E.f))},D=function(S,E){var O,$=C.meridiem;if($){for(var R=1;R<=24;R+=1)if(S.indexOf($(R,0,E))>-1){O=R>12;break}}else O=S===(E?"pm":"PM");return O},N={A:[b,function(S){this.afternoon=D(S,!1)}],a:[b,function(S){this.afternoon=D(S,!0)}],Q:[a,function(S){this.month=3*(S-1)+1}],S:[a,function(S){this.milliseconds=100*+S}],SS:[m,function(S){this.milliseconds=10*+S}],SSS:[/\d{3}/,function(S){this.milliseconds=+S}],s:[h,T("seconds")],ss:[h,T("seconds")],m:[h,T("minutes")],mm:[h,T("minutes")],H:[h,T("hours")],h:[h,T("hours")],HH:[h,T("hours")],hh:[h,T("hours")],D:[h,T("day")],DD:[m,T("day")],Do:[b,function(S){var E=C.ordinal,O=S.match(/\d+/);if(this.day=O[0],E)for(var $=1;$<=31;$+=1)E($).replace(/\[|\]/g,"")===S&&(this.day=$)}],w:[h,T("week")],ww:[m,T("week")],M:[h,T("month")],MM:[m,T("month")],MMM:[b,function(S){var E=M("months"),O=(M("monthsShort")||E.map((function($){return $.slice(0,3)}))).indexOf(S)+1;if(O<1)throw new Error;this.month=O%12||O}],MMMM:[b,function(S){var E=M("months").indexOf(S)+1;if(E<1)throw new Error;this.month=E%12||E}],Y:[/[+-]?\d+/,T("year")],YY:[m,function(S){this.year=A(S)}],YYYY:[/\d{4}/,T("year")],Z:L,ZZ:L};function I(S){var E,O;E=S,O=C&&C.formats;for(var $=(S=E.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(x,v,k){var f=k&&k.toUpperCase();return v||O[k]||i[k]||O[f].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(o,l,y){return l||y.slice(1)}))}))).match(s),R=$.length,H=0;H<R;H+=1){var Y=$[H],p=N[Y],d=p&&p[0],u=p&&p[1];$[H]=u?{regex:d,parser:u}:Y.replace(/^\[|\]$/g,"")}return function(x){for(var v={},k=0,f=0;k<R;k+=1){var o=$[k];if(typeof o=="string")f+=o.length;else{var l=o.regex,y=o.parser,g=x.slice(f),w=l.exec(g)[0];y.call(v,w),x=x.replace(w,"")}}return(function(r){var z=r.afternoon;if(z!==void 0){var e=r.hours;z?e<12&&(r.hours+=12):e===12&&(r.hours=0),delete r.afternoon}})(v),v}}return function(S,E,O){O.p.customParseFormat=!0,S&&S.parseTwoDigitYear&&(A=S.parseTwoDigitYear);var $=E.prototype,R=$.parse;$.parse=function(H){var Y=H.date,p=H.utc,d=H.args;this.$u=p;var u=d[1];if(typeof u=="string"){var x=d[2]===!0,v=d[3]===!0,k=x||v,f=d[2];v&&(f=d[2]),C=this.$locale(),!x&&f&&(C=O.Ls[f]),this.$d=(function(g,w,r,z){try{if(["x","X"].indexOf(w)>-1)return new Date((w==="X"?1e3:1)*g);var e=I(w)(g),_=e.year,V=e.month,P=e.day,W=e.hours,j=e.minutes,F=e.seconds,Q=e.milliseconds,rt=e.zone,ot=e.week,ft=new Date,ht=P||(_||V?1:ft.getDate()),ct=_||ft.getFullYear(),B=0;_&&!V||(B=V>0?V-1:ft.getMonth());var Z,X=W||0,st=j||0,K=F||0,nt=Q||0;return rt?new Date(Date.UTC(ct,B,ht,X,st,K,nt+60*rt.offset*1e3)):r?new Date(Date.UTC(ct,B,ht,X,st,K,nt)):(Z=new Date(ct,B,ht,X,st,K,nt),ot&&(Z=z(Z).week(ot).toDate()),Z)}catch{return new Date("")}})(Y,u,p,O),this.init(),f&&f!==!0&&(this.$L=this.locale(f).$L),k&&Y!=this.format(u)&&(this.$d=new Date("")),C={}}else if(u instanceof Array)for(var o=u.length,l=1;l<=o;l+=1){d[1]=u[l-1];var y=O.apply(this,d);if(y.isValid()){this.$d=y.$d,this.$L=y.$L,this.init();break}l===o&&(this.$d=new Date(""))}else R.call(this,H)}}}))})(bt)),bt.exports}var rr=er();const nr=Et(rr);var wt={exports:{}},sr=wt.exports,ie;function ir(){return ie||(ie=1,(function(t,n){(function(i,s){t.exports=s()})(sr,(function(){return function(i,s){var a=s.prototype,m=a.format;a.format=function(h){var b=this,C=this.$locale();if(!this.isValid())return m.bind(this)(h);var A=this.$utils(),T=(h||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,(function(L){switch(L){case"Q":return Math.ceil((b.$M+1)/3);case"Do":return C.ordinal(b.$D);case"gggg":return b.weekYear();case"GGGG":return b.isoWeekYear();case"wo":return C.ordinal(b.week(),"W");case"w":case"ww":return A.s(b.week(),L==="w"?1:2,"0");case"W":case"WW":return A.s(b.isoWeek(),L==="W"?1:2,"0");case"k":case"kk":return A.s(String(b.$H===0?24:b.$H),L==="k"?1:2,"0");case"X":return Math.floor(b.$d.getTime()/1e3);case"x":return b.$d.getTime();case"z":return"["+b.offsetName()+"]";case"zzz":return"["+b.offsetName("long")+"]";default:return L}}));return m.bind(this)(T)}}}))})(wt)),wt.exports}var ar=ir();const or=Et(ar);var _t={exports:{}},cr=_t.exports,ae;function lr(){return ae||(ae=1,(function(t,n){(function(i,s){t.exports=s()})(cr,(function(){var i,s,a=1e3,m=6e4,h=36e5,b=864e5,C=31536e6,A=2628e6,T=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,L=/\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g,M={years:C,months:A,days:b,hours:h,minutes:m,seconds:a,milliseconds:1,weeks:6048e5},D=function(Y){return Y instanceof R},N=function(Y,p,d){return new R(Y,d,p.$l)},I=function(Y){return s.p(Y)+"s"},S=function(Y){return Y<0},E=function(Y){return S(Y)?Math.ceil(Y):Math.floor(Y)},O=function(Y){return Math.abs(Y)},$=function(Y,p){return Y?S(Y)?{negative:!0,format:""+O(Y)+p}:{negative:!1,format:""+Y+p}:{negative:!1,format:""}},R=(function(){function Y(d,u,x){var v=this;if(this.$d={},this.$l=x,d===void 0&&(this.$ms=0,this.parseFromMilliseconds()),u)return N(d*M[I(u)],this);if(typeof d=="number")return this.$ms=d,this.parseFromMilliseconds(),this;if(typeof d=="object")return Object.keys(d).forEach((function(o){v.$d[I(o)]=d[o]})),this.calMilliseconds(),this;if(typeof d=="string"){var k=d.match(T);if(k){var f=k.slice(2).map((function(o){return o!=null?Number(o):0}));return this.$d.years=f[0],this.$d.months=f[1],this.$d.weeks=f[2],this.$d.days=f[3],this.$d.hours=f[4],this.$d.minutes=f[5],this.$d.seconds=f[6],this.calMilliseconds(),this}}return this}var p=Y.prototype;return p.calMilliseconds=function(){var d=this;this.$ms=Object.keys(this.$d).reduce((function(u,x){return u+(d.$d[x]||0)*M[x]}),0)},p.parseFromMilliseconds=function(){var d=this.$ms;this.$d.years=E(d/C),d%=C,this.$d.months=E(d/A),d%=A,this.$d.days=E(d/b),d%=b,this.$d.hours=E(d/h),d%=h,this.$d.minutes=E(d/m),d%=m,this.$d.seconds=E(d/a),d%=a,this.$d.milliseconds=d},p.toISOString=function(){var d=$(this.$d.years,"Y"),u=$(this.$d.months,"M"),x=+this.$d.days||0;this.$d.weeks&&(x+=7*this.$d.weeks);var v=$(x,"D"),k=$(this.$d.hours,"H"),f=$(this.$d.minutes,"M"),o=this.$d.seconds||0;this.$d.milliseconds&&(o+=this.$d.milliseconds/1e3,o=Math.round(1e3*o)/1e3);var l=$(o,"S"),y=d.negative||u.negative||v.negative||k.negative||f.negative||l.negative,g=k.format||f.format||l.format?"T":"",w=(y?"-":"")+"P"+d.format+u.format+v.format+g+k.format+f.format+l.format;return w==="P"||w==="-P"?"P0D":w},p.toJSON=function(){return this.toISOString()},p.format=function(d){var u=d||"YYYY-MM-DDTHH:mm:ss",x={Y:this.$d.years,YY:s.s(this.$d.years,2,"0"),YYYY:s.s(this.$d.years,4,"0"),M:this.$d.months,MM:s.s(this.$d.months,2,"0"),D:this.$d.days,DD:s.s(this.$d.days,2,"0"),H:this.$d.hours,HH:s.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:s.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:s.s(this.$d.seconds,2,"0"),SSS:s.s(this.$d.milliseconds,3,"0")};return u.replace(L,(function(v,k){return k||String(x[v])}))},p.as=function(d){return this.$ms/M[I(d)]},p.get=function(d){var u=this.$ms,x=I(d);return x==="milliseconds"?u%=1e3:u=x==="weeks"?E(u/M[x]):this.$d[x],u||0},p.add=function(d,u,x){var v;return v=u?d*M[I(u)]:D(d)?d.$ms:N(d,this).$ms,N(this.$ms+v*(x?-1:1),this)},p.subtract=function(d,u){return this.add(d,u,!0)},p.locale=function(d){var u=this.clone();return u.$l=d,u},p.clone=function(){return N(this.$ms,this)},p.humanize=function(d){return i().add(this.$ms,"ms").locale(this.$l).fromNow(!d)},p.valueOf=function(){return this.asMilliseconds()},p.milliseconds=function(){return this.get("milliseconds")},p.asMilliseconds=function(){return this.as("milliseconds")},p.seconds=function(){return this.get("seconds")},p.asSeconds=function(){return this.as("seconds")},p.minutes=function(){return this.get("minutes")},p.asMinutes=function(){return this.as("minutes")},p.hours=function(){return this.get("hours")},p.asHours=function(){return this.as("hours")},p.days=function(){return this.get("days")},p.asDays=function(){return this.as("days")},p.weeks=function(){return this.get("weeks")},p.asWeeks=function(){return this.as("weeks")},p.months=function(){return this.get("months")},p.asMonths=function(){return this.as("months")},p.years=function(){return this.get("years")},p.asYears=function(){return this.as("years")},Y})(),H=function(Y,p,d){return Y.add(p.years()*d,"y").add(p.months()*d,"M").add(p.days()*d,"d").add(p.hours()*d,"h").add(p.minutes()*d,"m").add(p.seconds()*d,"s").add(p.milliseconds()*d,"ms")};return function(Y,p,d){i=d,s=d().$utils(),d.duration=function(v,k){var f=d.locale();return N(v,{$l:f},k)},d.isDuration=D;var u=p.prototype.add,x=p.prototype.subtract;p.prototype.add=function(v,k){return D(v)?H(this,v,1):u.bind(this)(v,k)},p.prototype.subtract=function(v,k){return D(v)?H(this,v,-1):x.bind(this)(v,k)}}}))})(_t)),_t.exports}var ur=lr();const dr=Et(ur);var $t=(function(){var t=c(function(f,o,l,y){for(l=l||{},y=f.length;y--;l[f[y]]=o);return l},"o"),n=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],i=[1,26],s=[1,27],a=[1,28],m=[1,29],h=[1,30],b=[1,31],C=[1,32],A=[1,33],T=[1,34],L=[1,9],M=[1,10],D=[1,11],N=[1,12],I=[1,13],S=[1,14],E=[1,15],O=[1,16],$=[1,19],R=[1,20],H=[1,21],Y=[1,22],p=[1,23],d=[1,25],u=[1,35],x={trace:c(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:c(function(o,l,y,g,w,r,z){var e=r.length-1;switch(w){case 1:return r[e-1];case 2:this.$=[];break;case 3:r[e-1].push(r[e]),this.$=r[e-1];break;case 4:case 5:this.$=r[e];break;case 6:case 7:this.$=[];break;case 8:g.setWeekday("monday");break;case 9:g.setWeekday("tuesday");break;case 10:g.setWeekday("wednesday");break;case 11:g.setWeekday("thursday");break;case 12:g.setWeekday("friday");break;case 13:g.setWeekday("saturday");break;case 14:g.setWeekday("sunday");break;case 15:g.setWeekend("friday");break;case 16:g.setWeekend("saturday");break;case 17:g.setDateFormat(r[e].substr(11)),this.$=r[e].substr(11);break;case 18:g.enableInclusiveEndDates(),this.$=r[e].substr(18);break;case 19:g.TopAxis(),this.$=r[e].substr(8);break;case 20:g.setAxisFormat(r[e].substr(11)),this.$=r[e].substr(11);break;case 21:g.setTickInterval(r[e].substr(13)),this.$=r[e].substr(13);break;case 22:g.setExcludes(r[e].substr(9)),this.$=r[e].substr(9);break;case 23:g.setIncludes(r[e].substr(9)),this.$=r[e].substr(9);break;case 24:g.setTodayMarker(r[e].substr(12)),this.$=r[e].substr(12);break;case 27:g.setDiagramTitle(r[e].substr(6)),this.$=r[e].substr(6);break;case 28:this.$=r[e].trim(),g.setAccTitle(this.$);break;case 29:case 30:this.$=r[e].trim(),g.setAccDescription(this.$);break;case 31:g.addSection(r[e].substr(8)),this.$=r[e].substr(8);break;case 33:g.addTask(r[e-1],r[e]),this.$="task";break;case 34:this.$=r[e-1],g.setClickEvent(r[e-1],r[e],null);break;case 35:this.$=r[e-2],g.setClickEvent(r[e-2],r[e-1],r[e]);break;case 36:this.$=r[e-2],g.setClickEvent(r[e-2],r[e-1],null),g.setLink(r[e-2],r[e]);break;case 37:this.$=r[e-3],g.setClickEvent(r[e-3],r[e-2],r[e-1]),g.setLink(r[e-3],r[e]);break;case 38:this.$=r[e-2],g.setClickEvent(r[e-2],r[e],null),g.setLink(r[e-2],r[e-1]);break;case 39:this.$=r[e-3],g.setClickEvent(r[e-3],r[e-1],r[e]),g.setLink(r[e-3],r[e-2]);break;case 40:this.$=r[e-1],g.setLink(r[e-1],r[e]);break;case 41:case 47:this.$=r[e-1]+" "+r[e];break;case 42:case 43:case 45:this.$=r[e-2]+" "+r[e-1]+" "+r[e];break;case 44:case 46:this.$=r[e-3]+" "+r[e-2]+" "+r[e-1]+" "+r[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(n,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:i,13:s,14:a,15:m,16:h,17:b,18:C,19:18,20:A,21:T,22:L,23:M,24:D,25:N,26:I,27:S,28:E,29:O,30:$,31:R,33:H,35:Y,36:p,37:24,38:d,40:u},t(n,[2,7],{1:[2,1]}),t(n,[2,3]),{9:36,11:17,12:i,13:s,14:a,15:m,16:h,17:b,18:C,19:18,20:A,21:T,22:L,23:M,24:D,25:N,26:I,27:S,28:E,29:O,30:$,31:R,33:H,35:Y,36:p,37:24,38:d,40:u},t(n,[2,5]),t(n,[2,6]),t(n,[2,17]),t(n,[2,18]),t(n,[2,19]),t(n,[2,20]),t(n,[2,21]),t(n,[2,22]),t(n,[2,23]),t(n,[2,24]),t(n,[2,25]),t(n,[2,26]),t(n,[2,27]),{32:[1,37]},{34:[1,38]},t(n,[2,30]),t(n,[2,31]),t(n,[2,32]),{39:[1,39]},t(n,[2,8]),t(n,[2,9]),t(n,[2,10]),t(n,[2,11]),t(n,[2,12]),t(n,[2,13]),t(n,[2,14]),t(n,[2,15]),t(n,[2,16]),{41:[1,40],43:[1,41]},t(n,[2,4]),t(n,[2,28]),t(n,[2,29]),t(n,[2,33]),t(n,[2,34],{42:[1,42],43:[1,43]}),t(n,[2,40],{41:[1,44]}),t(n,[2,35],{43:[1,45]}),t(n,[2,36]),t(n,[2,38],{42:[1,46]}),t(n,[2,37]),t(n,[2,39])],defaultActions:{},parseError:c(function(o,l){if(l.recoverable)this.trace(o);else{var y=new Error(o);throw y.hash=l,y}},"parseError"),parse:c(function(o){var l=this,y=[0],g=[],w=[null],r=[],z=this.table,e="",_=0,V=0,P=2,W=1,j=r.slice.call(arguments,1),F=Object.create(this.lexer),Q={yy:{}};for(var rt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,rt)&&(Q.yy[rt]=this.yy[rt]);F.setInput(o,Q.yy),Q.yy.lexer=F,Q.yy.parser=this,typeof F.yylloc>"u"&&(F.yylloc={});var ot=F.yylloc;r.push(ot);var ft=F.options&&F.options.ranges;typeof Q.yy.parseError=="function"?this.parseError=Q.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function ht(U){y.length=y.length-2*U,w.length=w.length-U,r.length=r.length-U}c(ht,"popStack");function ct(){var U;return U=g.pop()||F.lex()||W,typeof U!="number"&&(U instanceof Array&&(g=U,U=g.pop()),U=l.symbols_[U]||U),U}c(ct,"lex");for(var B,Z,X,st,K={},nt,J,Xt,gt;;){if(Z=y[y.length-1],this.defaultActions[Z]?X=this.defaultActions[Z]:((B===null||typeof B>"u")&&(B=ct()),X=z[Z]&&z[Z][B]),typeof X>"u"||!X.length||!X[0]){var It="";gt=[];for(nt in z[Z])this.terminals_[nt]&&nt>P&&gt.push("'"+this.terminals_[nt]+"'");F.showPosition?It="Parse error on line "+(_+1)+`:
`+F.showPosition()+`
Expecting `+gt.join(", ")+", got '"+(this.terminals_[B]||B)+"'":It="Parse error on line "+(_+1)+": Unexpected "+(B==W?"end of input":"'"+(this.terminals_[B]||B)+"'"),this.parseError(It,{text:F.match,token:this.terminals_[B]||B,line:F.yylineno,loc:ot,expected:gt})}if(X[0]instanceof Array&&X.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Z+", token: "+B);switch(X[0]){case 1:y.push(B),w.push(F.yytext),r.push(F.yylloc),y.push(X[1]),B=null,V=F.yyleng,e=F.yytext,_=F.yylineno,ot=F.yylloc;break;case 2:if(J=this.productions_[X[1]][1],K.$=w[w.length-J],K._$={first_line:r[r.length-(J||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(J||1)].first_column,last_column:r[r.length-1].last_column},ft&&(K._$.range=[r[r.length-(J||1)].range[0],r[r.length-1].range[1]]),st=this.performAction.apply(K,[e,V,_,Q.yy,X[1],w,r].concat(j)),typeof st<"u")return st;J&&(y=y.slice(0,-1*J*2),w=w.slice(0,-1*J),r=r.slice(0,-1*J)),y.push(this.productions_[X[1]][0]),w.push(K.$),r.push(K._$),Xt=z[y[y.length-2]][y[y.length-1]],y.push(Xt);break;case 3:return!0}}return!0},"parse")},v=(function(){var f={EOF:1,parseError:c(function(l,y){if(this.yy.parser)this.yy.parser.parseError(l,y);else throw new Error(l)},"parseError"),setInput:c(function(o,l){return this.yy=l||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:c(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var l=o.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:c(function(o){var l=o.length,y=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var g=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var w=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===g.length?this.yylloc.first_column:0)+g[g.length-y.length].length-y[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[w[0],w[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:c(function(){return this._more=!0,this},"more"),reject:c(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:c(function(o){this.unput(this.match.slice(o))},"less"),pastInput:c(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:c(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:c(function(){var o=this.pastInput(),l=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:c(function(o,l){var y,g,w;if(this.options.backtrack_lexer&&(w={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(w.yylloc.range=this.yylloc.range.slice(0))),g=o[0].match(/(?:\r\n?|\n).*/g),g&&(this.yylineno+=g.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:g?g[g.length-1].length-g[g.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],y=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var r in w)this[r]=w[r];return!1}return!1},"test_match"),next:c(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,l,y,g;this._more||(this.yytext="",this.match="");for(var w=this._currentRules(),r=0;r<w.length;r++)if(y=this._input.match(this.rules[w[r]]),y&&(!l||y[0].length>l[0].length)){if(l=y,g=r,this.options.backtrack_lexer){if(o=this.test_match(y,w[r]),o!==!1)return o;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(o=this.test_match(l,w[g]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:c(function(){var l=this.next();return l||this.lex()},"lex"),begin:c(function(l){this.conditionStack.push(l)},"begin"),popState:c(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:c(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:c(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:c(function(l){this.begin(l)},"pushState"),stateStackSize:c(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:c(function(l,y,g,w){switch(g){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return f})();x.lexer=v;function k(){this.yy={}}return c(k,"Parser"),k.prototype=x,x.Parser=k,new k})();$t.parser=$t;var fr=$t;G.extend(Je);G.extend(nr);G.extend(or);var oe={friday:5,saturday:6},tt="",Pt="",Vt=void 0,zt="",mt=[],kt=[],Nt=new Map,Rt=[],Mt=[],dt="",Ht="",de=["active","done","crit","milestone","vert"],Bt=[],yt=!1,qt=!1,jt="sunday",Ct="saturday",Lt=0,hr=c(function(){Rt=[],Mt=[],dt="",Bt=[],Dt=0,Ot=void 0,St=void 0,q=[],tt="",Pt="",Ht="",Vt=void 0,zt="",mt=[],kt=[],yt=!1,qt=!1,Lt=0,Nt=new Map,Ce(),jt="sunday",Ct="saturday"},"clear"),mr=c(function(t){Pt=t},"setAxisFormat"),kr=c(function(){return Pt},"getAxisFormat"),yr=c(function(t){Vt=t},"setTickInterval"),gr=c(function(){return Vt},"getTickInterval"),pr=c(function(t){zt=t},"setTodayMarker"),vr=c(function(){return zt},"getTodayMarker"),xr=c(function(t){tt=t},"setDateFormat"),Tr=c(function(){yt=!0},"enableInclusiveEndDates"),br=c(function(){return yt},"endDatesAreInclusive"),wr=c(function(){qt=!0},"enableTopAxis"),_r=c(function(){return qt},"topAxisEnabled"),Dr=c(function(t){Ht=t},"setDisplayMode"),Sr=c(function(){return Ht},"getDisplayMode"),Mr=c(function(){return tt},"getDateFormat"),Cr=c(function(t){mt=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),Er=c(function(){return mt},"getIncludes"),Ir=c(function(t){kt=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),Yr=c(function(){return kt},"getExcludes"),Ar=c(function(){return Nt},"getLinks"),Fr=c(function(t){dt=t,Rt.push(t)},"addSection"),$r=c(function(){return Rt},"getSections"),Lr=c(function(){let t=ce();const n=10;let i=0;for(;!t&&i<n;)t=ce(),i++;return Mt=q,Mt},"getTasks"),fe=c(function(t,n,i,s){const a=t.format(n.trim()),m=t.format("YYYY-MM-DD");return s.includes(a)||s.includes(m)?!1:i.includes("weekends")&&(t.isoWeekday()===oe[Ct]||t.isoWeekday()===oe[Ct]+1)||i.includes(t.format("dddd").toLowerCase())?!0:i.includes(a)||i.includes(m)},"isInvalidDate"),Wr=c(function(t){jt=t},"setWeekday"),Or=c(function(){return jt},"getWeekday"),Pr=c(function(t){Ct=t},"setWeekend"),he=c(function(t,n,i,s){if(!i.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=G(t.startTime):a=G(t.startTime,n,!0),a=a.add(1,"d");let m;t.endTime instanceof Date?m=G(t.endTime):m=G(t.endTime,n,!0);const[h,b]=Vr(a,m,n,i,s);t.endTime=h.toDate(),t.renderEndTime=b},"checkTaskDates"),Vr=c(function(t,n,i,s,a){let m=!1,h=null;for(;t<=n;)m||(h=n.toDate()),m=fe(t,i,s,a),m&&(n=n.add(1,"d")),t=t.add(1,"d");return[n,h]},"fixTaskDates"),Wt=c(function(t,n,i){if(i=i.trim(),c(b=>{const C=b.trim();return C==="x"||C==="X"},"isTimestampFormat")(n)&&/^\d+$/.test(i))return new Date(Number(i));const m=/^after\s+(?<ids>[\d\w- ]+)/.exec(i);if(m!==null){let b=null;for(const A of m.groups.ids.split(" ")){let T=at(A);T!==void 0&&(!b||T.endTime>b.endTime)&&(b=T)}if(b)return b.endTime;const C=new Date;return C.setHours(0,0,0,0),C}let h=G(i,n.trim(),!0);if(h.isValid())return h.toDate();{it.debug("Invalid date:"+i),it.debug("With date format:"+n.trim());const b=new Date(i);if(b===void 0||isNaN(b.getTime())||b.getFullYear()<-1e4||b.getFullYear()>1e4)throw new Error("Invalid date:"+i);return b}},"getStartDate"),me=c(function(t){const n=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return n!==null?[Number.parseFloat(n[1]),n[2]]:[NaN,"ms"]},"parseDuration"),ke=c(function(t,n,i,s=!1){i=i.trim();const m=/^until\s+(?<ids>[\d\w- ]+)/.exec(i);if(m!==null){let T=null;for(const M of m.groups.ids.split(" ")){let D=at(M);D!==void 0&&(!T||D.startTime<T.startTime)&&(T=D)}if(T)return T.startTime;const L=new Date;return L.setHours(0,0,0,0),L}let h=G(i,n.trim(),!0);if(h.isValid())return s&&(h=h.add(1,"d")),h.toDate();let b=G(t);const[C,A]=me(i);if(!Number.isNaN(C)){const T=b.add(C,A);T.isValid()&&(b=T)}return b.toDate()},"getEndDate"),Dt=0,ut=c(function(t){return t===void 0?(Dt=Dt+1,"task"+Dt):t},"parseId"),zr=c(function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const s=i.split(","),a={};Gt(s,a,de);for(let h=0;h<s.length;h++)s[h]=s[h].trim();let m="";switch(s.length){case 1:a.id=ut(),a.startTime=t.endTime,m=s[0];break;case 2:a.id=ut(),a.startTime=Wt(void 0,tt,s[0]),m=s[1];break;case 3:a.id=ut(s[0]),a.startTime=Wt(void 0,tt,s[1]),m=s[2];break}return m&&(a.endTime=ke(a.startTime,tt,m,yt),a.manualEndTime=G(m,"YYYY-MM-DD",!0).isValid(),he(a,tt,kt,mt)),a},"compileData"),Nr=c(function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const s=i.split(","),a={};Gt(s,a,de);for(let m=0;m<s.length;m++)s[m]=s[m].trim();switch(s.length){case 1:a.id=ut(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:s[0]};break;case 2:a.id=ut(),a.startTime={type:"getStartDate",startData:s[0]},a.endTime={data:s[1]};break;case 3:a.id=ut(s[0]),a.startTime={type:"getStartDate",startData:s[1]},a.endTime={data:s[2]};break}return a},"parseData"),Ot,St,q=[],ye={},Rr=c(function(t,n){const i={section:dt,type:dt,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:n},task:t,classes:[]},s=Nr(St,n);i.raw.startTime=s.startTime,i.raw.endTime=s.endTime,i.id=s.id,i.prevTaskId=St,i.active=s.active,i.done=s.done,i.crit=s.crit,i.milestone=s.milestone,i.vert=s.vert,i.order=Lt,Lt++;const a=q.push(i);St=i.id,ye[i.id]=a-1},"addTask"),at=c(function(t){const n=ye[t];return q[n]},"findTaskById"),Hr=c(function(t,n){const i={section:dt,type:dt,description:t,task:t,classes:[]},s=zr(Ot,n);i.startTime=s.startTime,i.endTime=s.endTime,i.id=s.id,i.active=s.active,i.done=s.done,i.crit=s.crit,i.milestone=s.milestone,i.vert=s.vert,Ot=i,Mt.push(i)},"addTaskOrg"),ce=c(function(){const t=c(function(i){const s=q[i];let a="";switch(q[i].raw.startTime.type){case"prevTaskEnd":{const m=at(s.prevTaskId);s.startTime=m.endTime;break}case"getStartDate":a=Wt(void 0,tt,q[i].raw.startTime.startData),a&&(q[i].startTime=a);break}return q[i].startTime&&(q[i].endTime=ke(q[i].startTime,tt,q[i].raw.endTime.data,yt),q[i].endTime&&(q[i].processed=!0,q[i].manualEndTime=G(q[i].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),he(q[i],tt,kt,mt))),q[i].processed},"compileTask");let n=!0;for(const[i,s]of q.entries())t(i),n=n&&s.processed;return n},"compileTasks"),Br=c(function(t,n){let i=n;lt().securityLevel!=="loose"&&(i=Me.sanitizeUrl(n)),t.split(",").forEach(function(s){at(s)!==void 0&&(pe(s,()=>{window.open(i,"_self")}),Nt.set(s,i))}),ge(t,"clickable")},"setLink"),ge=c(function(t,n){t.split(",").forEach(function(i){let s=at(i);s!==void 0&&s.classes.push(n)})},"setClass"),qr=c(function(t,n,i){if(lt().securityLevel!=="loose"||n===void 0)return;let s=[];if(typeof i=="string"){s=i.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let m=0;m<s.length;m++){let h=s[m].trim();h.startsWith('"')&&h.endsWith('"')&&(h=h.substr(1,h.length-2)),s[m]=h}}s.length===0&&s.push(t),at(t)!==void 0&&pe(t,()=>{Ee.runFunc(n,...s)})},"setClickFun"),pe=c(function(t,n){Bt.push(function(){const i=document.querySelector(`[id="${t}"]`);i!==null&&i.addEventListener("click",function(){n()})},function(){const i=document.querySelector(`[id="${t}-text"]`);i!==null&&i.addEventListener("click",function(){n()})})},"pushFun"),jr=c(function(t,n,i){t.split(",").forEach(function(s){qr(s,n,i)}),ge(t,"clickable")},"setClickEvent"),Gr=c(function(t){Bt.forEach(function(n){n(t)})},"bindFunctions"),Xr={getConfig:c(()=>lt().gantt,"getConfig"),clear:hr,setDateFormat:xr,getDateFormat:Mr,enableInclusiveEndDates:Tr,endDatesAreInclusive:br,enableTopAxis:wr,topAxisEnabled:_r,setAxisFormat:mr,getAxisFormat:kr,setTickInterval:yr,getTickInterval:gr,setTodayMarker:pr,getTodayMarker:vr,setAccTitle:_e,getAccTitle:we,setDiagramTitle:be,getDiagramTitle:Te,setDisplayMode:Dr,getDisplayMode:Sr,setAccDescription:xe,getAccDescription:ve,addSection:Fr,getSections:$r,getTasks:Lr,addTask:Rr,findTaskById:at,addTaskOrg:Hr,setIncludes:Cr,getIncludes:Er,setExcludes:Ir,getExcludes:Yr,setClickEvent:jr,setLink:Br,getLinks:Ar,bindFunctions:Gr,parseDuration:me,isInvalidDate:fe,setWeekday:Wr,getWeekday:Or,setWeekend:Pr};function Gt(t,n,i){let s=!0;for(;s;)s=!1,i.forEach(function(a){const m="^\\s*"+a+"\\s*$",h=new RegExp(m);t[0].match(h)&&(n[a]=!0,t.shift(1),s=!0)})}c(Gt,"getTaskTags");G.extend(dr);var Ur=c(function(){it.debug("Something is calling, setConf, remove the call")},"setConf"),le={monday:Ne,tuesday:ze,wednesday:Ve,thursday:Pe,friday:Oe,saturday:We,sunday:Le},Zr=c((t,n)=>{let i=[...t].map(()=>-1/0),s=[...t].sort((m,h)=>m.startTime-h.startTime||m.order-h.order),a=0;for(const m of s)for(let h=0;h<i.length;h++)if(m.startTime>=i[h]){i[h]=m.endTime,m.order=h+n,h>a&&(a=h);break}return a},"getMaxIntersections"),et,At=1e4,Qr=c(function(t,n,i,s){const a=lt().gantt,m=lt().securityLevel;let h;m==="sandbox"&&(h=pt("#i"+n));const b=m==="sandbox"?pt(h.nodes()[0].contentDocument.body):pt("body"),C=m==="sandbox"?h.nodes()[0].contentDocument:document,A=C.getElementById(n);et=A.parentElement.offsetWidth,et===void 0&&(et=1200),a.useWidth!==void 0&&(et=a.useWidth);const T=s.db.getTasks();let L=[];for(const u of T)L.push(u.type);L=d(L);const M={};let D=2*a.topPadding;if(s.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const u={};for(const v of T)u[v.section]===void 0?u[v.section]=[v]:u[v.section].push(v);let x=0;for(const v of Object.keys(u)){const k=Zr(u[v],x)+1;x+=k,D+=k*(a.barHeight+a.barGap),M[v]=k}}else{D+=T.length*(a.barHeight+a.barGap);for(const u of L)M[u]=T.filter(x=>x.type===u).length}A.setAttribute("viewBox","0 0 "+et+" "+D);const N=b.select(`[id="${n}"]`),I=Ie().domain([Ye(T,function(u){return u.startTime}),Ae(T,function(u){return u.endTime})]).rangeRound([0,et-a.leftPadding-a.rightPadding]);function S(u,x){const v=u.startTime,k=x.startTime;let f=0;return v>k?f=1:v<k&&(f=-1),f}c(S,"taskCompare"),T.sort(S),E(T,et,D),De(N,D,et,a.useMaxWidth),N.append("text").text(s.db.getDiagramTitle()).attr("x",et/2).attr("y",a.titleTopMargin).attr("class","titleText");function E(u,x,v){const k=a.barHeight,f=k+a.barGap,o=a.topPadding,l=a.leftPadding,y=Fe().domain([0,L.length]).range(["#00B9FA","#F95002"]).interpolate($e);$(f,o,l,x,v,u,s.db.getExcludes(),s.db.getIncludes()),H(l,o,x,v),O(u,f,o,l,k,y,x),Y(f,o),p(l,o,x,v)}c(E,"makeGantt");function O(u,x,v,k,f,o,l){u.sort((e,_)=>e.vert===_.vert?0:e.vert?1:-1);const g=[...new Set(u.map(e=>e.order))].map(e=>u.find(_=>_.order===e));N.append("g").selectAll("rect").data(g).enter().append("rect").attr("x",0).attr("y",function(e,_){return _=e.order,_*x+v-2}).attr("width",function(){return l-a.rightPadding/2}).attr("height",x).attr("class",function(e){for(const[_,V]of L.entries())if(e.type===V)return"section section"+_%a.numberSectionStyles;return"section section0"}).enter();const w=N.append("g").selectAll("rect").data(u).enter(),r=s.db.getLinks();if(w.append("rect").attr("id",function(e){return e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?I(e.startTime)+k+.5*(I(e.endTime)-I(e.startTime))-.5*f:I(e.startTime)+k}).attr("y",function(e,_){return _=e.order,e.vert?a.gridLineStartPadding:_*x+v}).attr("width",function(e){return e.milestone?f:e.vert?.08*f:I(e.renderEndTime||e.endTime)-I(e.startTime)}).attr("height",function(e){return e.vert?T.length*(a.barHeight+a.barGap)+a.barHeight*2:f}).attr("transform-origin",function(e,_){return _=e.order,(I(e.startTime)+k+.5*(I(e.endTime)-I(e.startTime))).toString()+"px "+(_*x+v+.5*f).toString()+"px"}).attr("class",function(e){const _="task";let V="";e.classes.length>0&&(V=e.classes.join(" "));let P=0;for(const[j,F]of L.entries())e.type===F&&(P=j%a.numberSectionStyles);let W="";return e.active?e.crit?W+=" activeCrit":W=" active":e.done?e.crit?W=" doneCrit":W=" done":e.crit&&(W+=" crit"),W.length===0&&(W=" task"),e.milestone&&(W=" milestone "+W),e.vert&&(W=" vert "+W),W+=P,W+=" "+V,_+W}),w.append("text").attr("id",function(e){return e.id+"-text"}).text(function(e){return e.task}).attr("font-size",a.fontSize).attr("x",function(e){let _=I(e.startTime),V=I(e.renderEndTime||e.endTime);if(e.milestone&&(_+=.5*(I(e.endTime)-I(e.startTime))-.5*f,V=_+f),e.vert)return I(e.startTime)+k;const P=this.getBBox().width;return P>V-_?V+P+1.5*a.leftPadding>l?_+k-5:V+k+5:(V-_)/2+_+k}).attr("y",function(e,_){return e.vert?a.gridLineStartPadding+T.length*(a.barHeight+a.barGap)+60:(_=e.order,_*x+a.barHeight/2+(a.fontSize/2-2)+v)}).attr("text-height",f).attr("class",function(e){const _=I(e.startTime);let V=I(e.endTime);e.milestone&&(V=_+f);const P=this.getBBox().width;let W="";e.classes.length>0&&(W=e.classes.join(" "));let j=0;for(const[Q,rt]of L.entries())e.type===rt&&(j=Q%a.numberSectionStyles);let F="";return e.active&&(e.crit?F="activeCritText"+j:F="activeText"+j),e.done?e.crit?F=F+" doneCritText"+j:F=F+" doneText"+j:e.crit&&(F=F+" critText"+j),e.milestone&&(F+=" milestoneText"),e.vert&&(F+=" vertText"),P>V-_?V+P+1.5*a.leftPadding>l?W+" taskTextOutsideLeft taskTextOutside"+j+" "+F:W+" taskTextOutsideRight taskTextOutside"+j+" "+F+" width-"+P:W+" taskText taskText"+j+" "+F+" width-"+P}),lt().securityLevel==="sandbox"){let e;e=pt("#i"+n);const _=e.nodes()[0].contentDocument;w.filter(function(V){return r.has(V.id)}).each(function(V){var P=_.querySelector("#"+V.id),W=_.querySelector("#"+V.id+"-text");const j=P.parentNode;var F=_.createElement("a");F.setAttribute("xlink:href",r.get(V.id)),F.setAttribute("target","_top"),j.appendChild(F),F.appendChild(P),F.appendChild(W)})}}c(O,"drawRects");function $(u,x,v,k,f,o,l,y){if(l.length===0&&y.length===0)return;let g,w;for(const{startTime:P,endTime:W}of o)(g===void 0||P<g)&&(g=P),(w===void 0||W>w)&&(w=W);if(!g||!w)return;if(G(w).diff(G(g),"year")>5){it.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const r=s.db.getDateFormat(),z=[];let e=null,_=G(g);for(;_.valueOf()<=w;)s.db.isInvalidDate(_,r,l,y)?e?e.end=_:e={start:_,end:_}:e&&(z.push(e),e=null),_=_.add(1,"d");N.append("g").selectAll("rect").data(z).enter().append("rect").attr("id",P=>"exclude-"+P.start.format("YYYY-MM-DD")).attr("x",P=>I(P.start.startOf("day"))+v).attr("y",a.gridLineStartPadding).attr("width",P=>I(P.end.endOf("day"))-I(P.start.startOf("day"))).attr("height",f-x-a.gridLineStartPadding).attr("transform-origin",function(P,W){return(I(P.start)+v+.5*(I(P.end)-I(P.start))).toString()+"px "+(W*u+.5*f).toString()+"px"}).attr("class","exclude-range")}c($,"drawExcludeDays");function R(u,x,v,k){if(v<=0||u>x)return 1/0;const f=x-u,o=G.duration({[k??"day"]:v}).asMilliseconds();return o<=0?1/0:Math.ceil(f/o)}c(R,"getEstimatedTickCount");function H(u,x,v,k){const f=s.db.getDateFormat(),o=s.db.getAxisFormat();let l;o?l=o:f==="D"?l="%d":l=a.axisFormat??"%Y-%m-%d";let y=Ue(I).tickSize(-k+x+a.gridLineStartPadding).tickFormat(Ut(l));const w=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(s.db.getTickInterval()||a.tickInterval);if(w!==null){const r=parseInt(w[1],10);if(isNaN(r)||r<=0)it.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{const z=w[2],e=s.db.getWeekday()||a.weekday,_=I.domain(),V=_[0],P=_[1],W=R(V,P,r,z);if(W>At)it.warn(`The tick interval "${r}${z}" would generate ${W} ticks, which exceeds the maximum allowed (${At}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(z){case"millisecond":y.ticks(ee.every(r));break;case"second":y.ticks(te.every(r));break;case"minute":y.ticks(Jt.every(r));break;case"hour":y.ticks(Kt.every(r));break;case"day":y.ticks(Qt.every(r));break;case"week":y.ticks(le[e].every(r));break;case"month":y.ticks(Zt.every(r));break}}}if(N.append("g").attr("class","grid").attr("transform","translate("+u+", "+(k-50)+")").call(y).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),s.db.topAxisEnabled()||a.topAxis){let r=Xe(I).tickSize(-k+x+a.gridLineStartPadding).tickFormat(Ut(l));if(w!==null){const z=parseInt(w[1],10);if(isNaN(z)||z<=0)it.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{const e=w[2],_=s.db.getWeekday()||a.weekday,V=I.domain(),P=V[0],W=V[1];if(R(P,W,z,e)<=At)switch(e){case"millisecond":r.ticks(ee.every(z));break;case"second":r.ticks(te.every(z));break;case"minute":r.ticks(Jt.every(z));break;case"hour":r.ticks(Kt.every(z));break;case"day":r.ticks(Qt.every(z));break;case"week":r.ticks(le[_].every(z));break;case"month":r.ticks(Zt.every(z));break}}}N.append("g").attr("class","grid").attr("transform","translate("+u+", "+x+")").call(r).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}c(H,"makeGrid");function Y(u,x){let v=0;const k=Object.keys(M).map(f=>[f,M[f]]);N.append("g").selectAll("text").data(k).enter().append(function(f){const o=f[0].split(Se.lineBreakRegex),l=-(o.length-1)/2,y=C.createElementNS("http://www.w3.org/2000/svg","text");y.setAttribute("dy",l+"em");for(const[g,w]of o.entries()){const r=C.createElementNS("http://www.w3.org/2000/svg","tspan");r.setAttribute("alignment-baseline","central"),r.setAttribute("x","10"),g>0&&r.setAttribute("dy","1em"),r.textContent=w,y.appendChild(r)}return y}).attr("x",10).attr("y",function(f,o){if(o>0)for(let l=0;l<o;l++)return v+=k[o-1][1],f[1]*u/2+v*u+x;else return f[1]*u/2+x}).attr("font-size",a.sectionFontSize).attr("class",function(f){for(const[o,l]of L.entries())if(f[0]===l)return"sectionTitle sectionTitle"+o%a.numberSectionStyles;return"sectionTitle"})}c(Y,"vertLabels");function p(u,x,v,k){const f=s.db.getTodayMarker();if(f==="off")return;const o=N.append("g").attr("class","today"),l=new Date,y=o.append("line");y.attr("x1",I(l)+u).attr("x2",I(l)+u).attr("y1",a.titleTopMargin).attr("y2",k-a.titleTopMargin).attr("class","today"),f!==""&&y.attr("style",f.replace(/,/g,";"))}c(p,"drawToday");function d(u){const x={},v=[];for(let k=0,f=u.length;k<f;++k)Object.prototype.hasOwnProperty.call(x,u[k])||(x[u[k]]=!0,v.push(u[k]));return v}c(d,"checkUnique")},"draw"),Kr={setConf:Ur,draw:Qr},Jr=c(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),tn=Jr,sn={parser:fr,db:Xr,renderer:Kr,styles:tn};export{sn as diagram};
