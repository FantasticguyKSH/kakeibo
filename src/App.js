import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DEF_EXP_CATS = [
  {id:"food",name:"식비",emoji:"🍜"},{id:"transport",name:"교통/차량",emoji:"🚕"},
  {id:"culture",name:"문화생활",emoji:"🖼️"},{id:"mart",name:"마트/편의점",emoji:"🛒"},
  {id:"fashion",name:"패션/미용",emoji:"🧥"},{id:"living",name:"생활용품",emoji:"🪑"},
  {id:"housing",name:"주거/통신",emoji:"🏠"},{id:"health",name:"건강",emoji:"🧘"},
  {id:"edu",name:"교육",emoji:"📖"},{id:"gift",name:"경조사/회비",emoji:"🎁"},
  {id:"parents",name:"부모님",emoji:"👵"},{id:"etc",name:"기타",emoji:"📦"},
];
const DEF_INC_CATS = [
  {id:"salary",name:"급여",emoji:"💼"},{id:"side",name:"부업",emoji:"💻"},
  {id:"invest",name:"투자수익",emoji:"📈"},{id:"gift2",name:"용돈",emoji:"🎀"},
  {id:"etc2",name:"기타",emoji:"📦"},
];
const DEF_ASSETS = [
  {id:"cash",name:"현금",emoji:"💵"},{id:"bank",name:"은행",emoji:"🏦"},{id:"card",name:"카드",emoji:"💳"},
];
const PIE_COLORS = ["#FF6B6B","#FF8E53","#FFC300","#4ECDC4","#45B7D1","#96CEB4","#DDA0DD","#85C1E9","#F0E68C","#98D8C8","#FFB6C1","#B0C4DE"];
const DAYS = ["일","월","화","수","목","금","토"];
const fmt = n => Math.abs(n).toLocaleString("ko-KR");

function useStorage(key, def) {
  const [val, setVal] = useState(()=>{
    try { const s=localStorage.getItem(key); return s?JSON.parse(s):def; } catch{ return def; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch{}
  }, [val, key]);
  return [val, setVal];
}

export default function App() {
  const [tab, setTab] = useState("calendar");
  const [cur, setCur] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
  const [txs, setTxs] = useStorage("kk_txs", []);
  const [expCats, setExpCats] = useStorage("kk_excats", DEF_EXP_CATS);
  const [incCats, setIncCats] = useStorage("kk_incats", DEF_INC_CATS);
  const [assets, setAssets] = useStorage("kk_assets", DEF_ASSETS);
  const [modal, setModal] = useState(null);
  const [dayModal, setDayModal] = useState(null);

  const {y,m} = cur;
  const today = new Date();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const firstDow = new Date(y,m,1).getDay();

  const monthTxs = useMemo(()=>txs.filter(t=>{const d=new Date(t.date);return d.getFullYear()===y&&d.getMonth()===m;}),[txs,y,m]);
  const totalInc = useMemo(()=>monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),[monthTxs]);
  const totalExp = useMemo(()=>monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),[monthTxs]);
  const dayMap = useMemo(()=>{
    const mp={};
    monthTxs.forEach(t=>{const d=new Date(t.date).getDate();if(!mp[d])mp[d]={inc:0,exp:0};if(t.type==="income")mp[d].inc+=t.amount;if(t.type==="expense")mp[d].exp+=t.amount;});
    return mp;
  },[monthTxs]);

  const expByCat = useMemo(()=>{
    const mp={};
    monthTxs.filter(t=>t.type==="expense").forEach(t=>{mp[t.category]=(mp[t.category]||0)+t.amount;});
    return Object.entries(mp).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[monthTxs]);

  const prev = ()=>setCur(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1});
  const next = ()=>setCur(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1});

  const addTx = tx => setTxs(p=>[...p,tx]);
  const delTx = id => setTxs(p=>p.filter(t=>t.id!==id));

  const bal = totalInc - totalExp;
  const isToday = d => d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();

  const s = {
    wrap:{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:480,margin:"0 auto",background:"#fff",minHeight:"100vh",paddingBottom:64,position:"relative"},
    navRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:16,padding:"16px 16px 10px"},
    navBtn:{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#555",padding:"4px 8px"},
    navTitle:{fontSize:18,fontWeight:"bold",color:"#222"},
    summaryRow:{display:"flex",justifyContent:"space-around",padding:"0 16px 14px",borderBottom:"1px solid #f0f0f0"},
    summaryItem:{textAlign:"center"},
    summaryLabel:{fontSize:11,color:"#999",marginBottom:3},
    summaryInc:{fontSize:16,fontWeight:"bold",color:"#3d8fe0"},
    summaryExp:{fontSize:16,fontWeight:"bold",color:"#e05555"},
    summaryBal:{fontSize:16,fontWeight:"bold",color:"#333"},
    dowRow:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#fafafa",borderBottom:"1px solid #f0f0f0"},
    dowCell:{textAlign:"center",padding:"8px 0",fontSize:12,fontWeight:"500"},
    grid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)"},
    cell:{minHeight:68,padding:"4px 3px",borderBottom:"1px solid #f5f5f5",borderRight:"1px solid #f5f5f5",cursor:"pointer",boxSizing:"border-box"},
    dayNum:{fontSize:12,fontWeight:"normal",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",marginBottom:1},
    amtInc:{fontSize:10,color:"#3d8fe0",textAlign:"right",lineHeight:1.5},
    amtExp:{fontSize:10,color:"#e05555",textAlign:"right",lineHeight:1.5},
    fab:{position:"fixed",bottom:80,right:20,width:52,height:52,borderRadius:"50%",background:"#e05555",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 14px rgba(224,85,85,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50},
    bottomNav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #f0f0f0",display:"flex",zIndex:100},
    navTabBtn:{flex:1,background:"none",border:"none",cursor:"pointer",padding:"8px 0 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:11},
  };

  return (
    <div style={s.wrap}>
      {tab==="calendar" && <>
        <div style={s.navRow}>
          <button style={s.navBtn} onClick={prev}>‹</button>
          <span style={s.navTitle}>{y}년 {m+1}월</span>
          <button style={s.navBtn} onClick={next}>›</button>
        </div>
        <div style={s.summaryRow}>
          <div style={s.summaryItem}><div style={s.summaryLabel}>수입</div><div style={s.summaryInc}>{fmt(totalInc)}</div></div>
          <div style={s.summaryItem}><div style={s.summaryLabel}>지출</div><div style={s.summaryExp}>{fmt(totalExp)}</div></div>
          <div style={s.summaryItem}><div style={s.summaryLabel}>합계</div><div style={{...s.summaryBal,color:bal<0?"#e05555":"#333"}}>{bal<0?"-":""}{fmt(bal)}</div></div>
        </div>
        <div style={s.dowRow}>
          {DAYS.map((d,i)=><div key={d} style={{...s.dowCell,color:i===0?"#e05555":i===6?"#3d8fe0":"#666"}}>{d}</div>)}
        </div>
        <div style={s.grid}>
          {Array(firstDow).fill(null).map((_,i)=><div key={"e"+i} style={{...s.cell,cursor:"default",background:"#fafafa"}} />)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
            const dow=(firstDow+d-1)%7;
            const dm=dayMap[d];
            const isTd=isToday(d);
            return (
              <div key={d} style={{...s.cell,background:isTd?"#fff8f8":"#fff"}} onClick={()=>setDayModal(d)}>
                <div style={{...s.dayNum,background:isTd?"#e05555":"transparent",color:isTd?"#fff":dow===0?"#e05555":dow===6?"#3d8fe0":"#333",fontWeight:isTd?"bold":"normal"}}>{d}</div>
                {dm?.inc>0&&<div style={s.amtInc}>{fmt(dm.inc)}</div>}
                {dm?.exp>0&&<div style={s.amtExp}>{fmt(dm.exp)}</div>}
              </div>
            );
          })}
        </div>
      </>}

      {tab==="stats" && <StatsTab y={y} m={m} prev={prev} next={next} totalInc={totalInc} totalExp={totalExp} expByCat={expByCat} monthTxs={monthTxs} allCats={[...expCats,...incCats]} s={s} />}
      {tab==="assets" && <AssetsTab assets={assets} setAssets={setAssets} txs={txs} />}
      {tab==="more" && <MoreTab expCats={expCats} setExpCats={setExpCats} incCats={incCats} setIncCats={setIncCats} assets={assets} setAssets={setAssets} />}

      <button style={s.fab} onClick={()=>setModal({day:null})}>+</button>

      <div style={s.bottomNav}>
        {[{id:"calendar",label:"가계부",icon:"📋"},{id:"stats",label:"통계",icon:"📊"},{id:"assets",label:"자산",icon:"💰"},{id:"more",label:"더보기",icon:"···"}].map(t=>(
          <button key={t.id} style={{...s.navTabBtn,color:tab===t.id?"#e05555":"#aaa"}} onClick={()=>setTab(t.id)}>
            <span style={{fontSize:18}}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {modal && <TxModal onClose={()=>setModal(null)} onSave={tx=>{addTx(tx);setModal(null);}} onContinue={tx=>{addTx(tx);}} expCats={expCats} incCats={incCats} assets={assets} initDate={modal.day?new Date(y,m,modal.day):new Date()} />}
      {dayModal && <DayModal day={dayModal} y={y} m={m} txs={txs.filter(t=>{const d=new Date(t.date);return d.getFullYear()===y&&d.getMonth()===m&&d.getDate()===dayModal;})} onClose={()=>setDayModal(null)} onDel={delTx} allCats={[...expCats,...incCats]} onAdd={()=>{setModal({day:dayModal});setDayModal(null);}} />}
    </div>
  );
}

function StatsTab({y,m,prev,next,totalInc,totalExp,expByCat,monthTxs,allCats,s}) {
  const [view,setView]=useState("expense");
  const incByCat=useMemo(()=>{
    const mp={};
    monthTxs.filter(t=>t.type==="income").forEach(t=>{mp[t.category]=(mp[t.category]||0)+t.amount;});
    return Object.entries(mp).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[monthTxs]);

  const isExp=view==="expense";
  const data=isExp?expByCat:incByCat;
  const total=isExp?totalExp:totalInc;
  const empty=isExp?"이번 달 지출 내역이 없어요":"이번 달 수입 내역이 없어요";

  return (
    <div style={{padding:"0 0 16px"}}>
      <div style={s.navRow}>
        <button style={s.navBtn} onClick={prev}>‹</button>
        <span style={s.navTitle}>{y}년 {m+1}월</span>
        <button style={s.navBtn} onClick={next}>›</button>
      </div>
      <div style={{display:"flex",gap:0,margin:"0 16px 16px",borderRadius:12,overflow:"hidden",border:"1px solid #f0f0f0"}}>
        <button onClick={()=>setView("income")} style={{flex:1,padding:"14px 0",border:"none",cursor:"pointer",background:!isExp?"#3d8fe0":"#f9f9f9",transition:"background .18s"}}>
          <div style={{fontSize:12,color:!isExp?"rgba(255,255,255,.75)":"#999",marginBottom:4}}>수입</div>
          <div style={{fontSize:17,fontWeight:"bold",color:!isExp?"#fff":"#3d8fe0"}}>{fmt(totalInc)}원</div>
        </button>
        <div style={{width:1,background:"#f0f0f0"}} />
        <button onClick={()=>setView("expense")} style={{flex:1,padding:"14px 0",border:"none",cursor:"pointer",background:isExp?"#e05555":"#f9f9f9",transition:"background .18s"}}>
          <div style={{fontSize:12,color:isExp?"rgba(255,255,255,.75)":"#999",marginBottom:4}}>지출</div>
          <div style={{fontSize:17,fontWeight:"bold",color:isExp?"#fff":"#e05555"}}>{fmt(totalExp)}원</div>
        </button>
      </div>
      {data.length===0
        ? <div style={{textAlign:"center",color:"#ccc",padding:"40px 0",fontSize:14}}>{empty}</div>
        : <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} paddingAngle={2} label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>
                {data.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v=>fmt(v)+"원"} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{padding:"0 16px"}}>
            {data.map((item,i)=>{
              const pct=Math.round((item.value/total)*100);
              return (
                <div key={i} style={{display:"flex",alignItems:"center",padding:"11px 0",borderBottom:"1px solid #f5f5f5"}}>
                  <div style={{width:38,height:22,background:PIE_COLORS[i%PIE_COLORS.length],borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:"bold",marginRight:12,flexShrink:0}}>{pct}%</div>
                  <div style={{flex:1,fontSize:14,color:"#333"}}>{item.name||"미분류"}</div>
                  <div style={{fontSize:14,fontWeight:"bold",color:"#333"}}>{fmt(item.value)}원</div>
                </div>
              );
            })}
          </div>
        </>
      }
    </div>
  );
}

function AssetsTab({assets,txs}) {
  return (
    <div style={{padding:16}}>
      <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:"500",color:"#333"}}>자산 현황</h3>
      {assets.map(a=>{
        const bal=txs.filter(t=>t.asset===a.name).reduce((s,t)=>t.type==="income"?s+t.amount:s-t.amount,0);
        return (
          <div key={a.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",background:"#f9f9f9",borderRadius:12,marginBottom:10}}>
            <span style={{fontSize:22,marginRight:12}}>{a.emoji}</span>
            <span style={{flex:1,fontSize:15,color:"#333"}}>{a.name}</span>
            <span style={{fontSize:15,fontWeight:"bold",color:bal>=0?"#3d8fe0":"#e05555"}}>{bal>=0?"+":"-"}{fmt(bal)}원</span>
          </div>
        );
      })}
    </div>
  );
}

function MoreTab({expCats,setExpCats,incCats,setIncCats,assets,setAssets}) {
  const [sec,setSec]=useState(null);
  const [nm,setNm]=useState(""); const [em,setEm]=useState("");
  const items=sec==="exp"?expCats:sec==="inc"?incCats:assets;
  const setItems=sec==="exp"?setExpCats:sec==="inc"?setIncCats:setAssets;
  const label=sec==="exp"?"지출 카테고리":sec==="inc"?"수입 카테고리":"자산";

  const add=()=>{if(!nm.trim())return;setItems(p=>[...p,{id:Date.now().toString(),name:nm.trim(),emoji:em}]);setNm("");setEm("");};
  const del=id=>setItems(p=>p.filter(c=>c.id!==id));

  if(sec) return (
    <div style={{padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={()=>setSec(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#555"}}>←</button>
        <h3 style={{margin:0,fontSize:16,fontWeight:"500"}}>{label} 관리</h3>
      </div>
      {items.map(it=>(
        <div key={it.id} style={{display:"flex",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{fontSize:18,marginRight:10,minWidth:28}}>{it.emoji}</span>
          <span style={{flex:1,fontSize:14,color:"#333"}}>{it.name}</span>
          <button onClick={()=>del(it.id)} style={{background:"none",border:"none",color:"#e05555",cursor:"pointer",fontSize:16,padding:4}}>✕</button>
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <input value={em} onChange={e=>setEm(e.target.value)} placeholder="이모지" style={{width:48,border:"1px solid #e5e5e5",borderRadius:8,padding:10,fontSize:16,textAlign:"center",outline:"none"}} />
        <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="이름 입력" onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:1,border:"1px solid #e5e5e5",borderRadius:8,padding:10,fontSize:14,outline:"none"}} />
        <button onClick={add} style={{background:"#e05555",color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",fontSize:14,cursor:"pointer",fontWeight:"bold"}}>추가</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:16}}>
      <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:"500",color:"#333"}}>설정</h3>
      {[{id:"exp",l:"지출 카테고리 관리",ic:"📋"},{id:"inc",l:"수입 카테고리 관리",ic:"💰"},{id:"asset",l:"자산 관리",ic:"🏦"}].map(s=>(
        <button key={s.id} onClick={()=>setSec(s.id)} style={{display:"flex",alignItems:"center",width:"100%",padding:"15px 14px",background:"#f9f9f9",border:"none",borderRadius:12,marginBottom:10,cursor:"pointer",gap:12,fontSize:14,color:"#333"}}>
          <span style={{fontSize:18}}>{s.ic}</span><span style={{flex:1,textAlign:"left"}}>{s.l}</span><span style={{color:"#ccc",fontSize:18}}>›</span>
        </button>
      ))}
    </div>
  );
}

function TxModal({onClose,onSave,onContinue,expCats,incCats,assets,initDate}) {
  const [type,setType]=useState("expense");
  const [date]=useState(initDate||new Date());
  const [amtStr,setAmtStr]=useState("");
  const [cat,setCat]=useState("");
  const [asset,setAsset]=useState("");
  const [memo,setMemo]=useState("");
  const [showCat,setShowCat]=useState(false);
  const cats=type==="expense"?expCats:incCats;
  const amt=parseInt(amtStr||"0",10);
  const ds=`${String(date.getFullYear()).slice(2)}/${String(date.getMonth()+1).padStart(2,"0")}/${String(date.getDate()).padStart(2,"0")} (${DAYS[date.getDay()]})`;

  const numKey=k=>{
    if(k==="del")setAmtStr(p=>p.slice(0,-1));
    else if(k==="00")setAmtStr(p=>p?p+"00":"");
    else setAmtStr(p=>p+k);
  };

  const build=()=>({id:Date.now().toString()+Math.random(),type,date:date.toISOString(),amount:amt,category:cat,asset,memo});
  const save=()=>{if(!amt)return;onSave(build());};
  const cont=()=>{if(!amt)return;onContinue(build());setAmtStr("");setCat("");setMemo("");};

  const ms={
    overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"},
    sheet:{background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"92vh",overflowY:"auto"},
    tabRow:{display:"flex",borderBottom:"1px solid #f0f0f0"},
    tabBtn:(t)=>({flex:1,padding:"14px 0",border:"none",background:"none",cursor:"pointer",fontSize:15,fontWeight:type===t?"bold":"normal",color:type===t?(t==="income"?"#3d8fe0":t==="expense"?"#e05555":"#888"):"#ccc",borderBottom:type===t?`2px solid ${t==="income"?"#3d8fe0":t==="expense"?"#e05555":"#888"}`:"2px solid transparent"}),
    row:{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f5f5f5"},
    lbl:{color:"#999",fontSize:14,width:44,flexShrink:0},
    numpad:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"10px 16px 6px"},
    numBtn:(k)=>({padding:"13px 0",border:"none",borderRadius:10,background:k==="del"?"#f0f0f0":"#f8f8f8",fontSize:k==="del"?20:18,cursor:"pointer",fontWeight:"500",color:"#333"}),
  };

  return (
    <div style={ms.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={ms.sheet}>
        <div style={{display:"flex",justifyContent:"flex-end",padding:"10px 16px 0"}}><button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#aaa"}}>✕</button></div>
        <div style={ms.tabRow}>
          {["income","expense","transfer"].map(t=>(
            <button key={t} style={ms.tabBtn(t)} onClick={()=>{setType(t);setCat("");}}>
              {t==="income"?"수입":t==="expense"?"지출":"이체"}
            </button>
          ))}
        </div>
        <div style={ms.row}><span style={ms.lbl}>날짜</span><span style={{fontSize:14,color:"#333"}}>{ds}</span></div>
        <div style={ms.row}><span style={ms.lbl}>금액</span><span style={{fontSize:22,fontWeight:"bold",color:amt>0?(type==="income"?"#3d8fe0":"#e05555"):"#ccc"}}>{amt>0?fmt(amt)+"원":"0원"}</span></div>
        {type!=="transfer"&&(
          <div style={{...ms.row,cursor:"pointer",flexWrap:"wrap",gap:8}} onClick={()=>setShowCat(p=>!p)}>
            <span style={ms.lbl}>분류</span>
            <span style={{fontSize:14,color:cat?"#333":"#ccc"}}>{cat||"카테고리 선택"}</span>
          </div>
        )}
        {showCat&&type!=="transfer"&&(
          <div style={{background:"#f9f9f9",padding:12,margin:"0 12px 8px",borderRadius:12}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
              {cats.map(c=>(
                <button key={c.id} onClick={()=>{setCat(c.name);setShowCat(false);}} style={{background:cat===c.name?"#e05555":"#fff",color:cat===c.name?"#fff":"#333",border:`1px solid ${cat===c.name?"#e05555":"#e8e8e8"}`,borderRadius:8,padding:"8px 4px",fontSize:11,cursor:"pointer",textAlign:"center",lineHeight:1.4}}>
                  <div style={{fontSize:16}}>{c.emoji}</div>{c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{...ms.row,flexWrap:"wrap",gap:8}}>
          <span style={ms.lbl}>자산</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {assets.map(a=>(
              <button key={a.id} onClick={()=>setAsset(a.name)} style={{padding:"5px 11px",borderRadius:20,fontSize:12,cursor:"pointer",background:asset===a.name?"#e05555":"#f0f0f0",color:asset===a.name?"#fff":"#555",border:"none"}}>
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
        </div>
        <div style={ms.row}>
          <span style={ms.lbl}>메모</span>
          <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="간단한 메모" style={{border:"none",outline:"none",fontSize:14,flex:1,color:"#333",background:"transparent"}} />
        </div>
        <div style={ms.numpad}>
          {[["1","2","3"],["4","5","6"],["7","8","9"],["00","0","del"]].map((row,ri)=>(
            <div key={ri} style={{display:"contents"}}>
              {row.map(k=>(
                <button key={k} style={ms.numBtn(k)} onClick={()=>numKey(k)}>{k==="del"?"⌫":k}</button>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,padding:"6px 16px 24px"}}>
          <button onClick={save} disabled={!amt} style={{flex:2,padding:15,background:amt?"#e05555":"#f0f0f0",color:amt?"#fff":"#bbb",border:"none",borderRadius:14,fontSize:16,fontWeight:"bold",cursor:amt?"pointer":"default"}}>저장하기</button>
          <button onClick={cont} disabled={!amt} style={{flex:1,padding:15,background:"#f0f0f0",color:"#555",border:"none",borderRadius:14,fontSize:15,cursor:amt?"pointer":"default"}}>계속</button>
        </div>
      </div>
    </div>
  );
}

function DayModal({day,y,m,txs,onClose,onDel,allCats,onAdd}) {
  const totalInc=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExp=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const getCat=name=>allCats.find(c=>c.name===name);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"70vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 18px 12px",borderBottom:"1px solid #f5f5f5"}}>
          <div>
            <span style={{fontSize:16,fontWeight:"bold",color:"#333"}}>{m+1}월 {day}일</span>
            {(totalInc>0||totalExp>0)&&<span style={{fontSize:12,color:"#999",marginLeft:10}}>{totalExp>0&&`지출 ${fmt(totalExp)}원`} {totalInc>0&&`수입 ${fmt(totalInc)}원`}</span>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onAdd} style={{background:"#e05555",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer"}}>+ 추가</button>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#aaa"}}>✕</button>
          </div>
        </div>
        {txs.length===0
          ? <div style={{textAlign:"center",color:"#ccc",padding:"30px 0",fontSize:14}}>내역이 없어요</div>
          : txs.map(t=>{
            const c=getCat(t.category);
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid #f8f8f8"}}>
                <div style={{fontSize:22,marginRight:12,minWidth:30}}>{c?.emoji||"📦"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,color:"#333",fontWeight:"500"}}>{t.category||"미분류"}</div>
                  {t.memo&&<div style={{fontSize:12,color:"#aaa",marginTop:2}}>{t.memo}</div>}
                  {t.asset&&<div style={{fontSize:11,color:"#bbb"}}>{t.asset}</div>}
                </div>
                <div style={{fontSize:15,fontWeight:"bold",color:t.type==="income"?"#3d8fe0":"#e05555",marginRight:12}}>
                  {t.type==="income"?"+":"-"}{fmt(t.amount)}원
                </div>
                <button onClick={()=>onDel(t.id)} style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:18,padding:4}}>🗑</button>
              </div>
            );
          })
        }
        <div style={{height:20}} />
      </div>
    </div>
  );
}