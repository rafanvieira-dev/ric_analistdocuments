const KEY='ric_analistdocuments_v1';
const emptyState=()=>({project:'Sistema RiC',sources:[],entities:[],relations:[],notes:[]});
let state=loadState();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadState(){try{return {...emptyState(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return emptyState()}}
function saveState(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){alert('O armazenamento do navegador está cheio. Exporte um backup e remova fontes antigas ou reduza o conteúdo.');return false}}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function page(id){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('show',x.id===id));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===id));$('#pagetitle').textContent=({overview:'Visão geral',sources:'Fontes e documentos',entities:'Entidades identificadas',relations:'Rede de relações',quality:'Controle de qualidade'})[id]||'Visão geral'}
document.querySelectorAll('.nav[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('#goUpload').onclick=()=>$('#uploadPanel').scrollIntoView({behavior:'smooth'});
$('#newUpload').onclick=()=>{page('overview');$('#uploadPanel').scrollIntoView({behavior:'smooth'})};
const PEOPLE=['Rubens Barcelos','Mano Rubens','Ismael Silva','Bide','Brancura','Nilton Bastos','Edgar','Julinho','Donga','Sinhô','Caninha','Tia Ciata','Ricardo Cravo Albin','Nei Lopes','Nelson da Nóbrega Fernandes','Amaury Jório','Hiram de Araújo','José Ramos Tinhorão','Luiz Fernando Vianna','Cartola','Clementina de Jesus','Heitor dos Prazeres','Pixinguinha','João da Bahiana','Candeia','Sérgio Cabral','Mestre Ciça','Mestre Chuvisco'];
const ORGS=['União Faz a Força','Deixa Falar','Escola de Samba Estácio de Sá','GRES Estácio de Sá','Unidos de São Carlos','União do Estácio de Sá','União das Cores','Portela','Império Serrano','Mangueira','Vizinha Faladeira','Funarte','Instituto Moreira Salles','IMS','UFRJ','Pallas','Prefeitura do Rio de Janeiro','Jornal do Brasil','Biblioteca Nacional','Arquivo Nacional','LIESA'];
const PLACES=['Estácio','Pilares','Praça Onze','Largo do Estácio','Morro de São Carlos','Cidade Nova','Pequena África','Praça Quinze','Avenida Estácio de Sá','Rua do Estácio','Rua Machado Coelho','Beco D. Paulina','Oswaldo Cruz','Mangueira','Santo Cristo','Rio de Janeiro'];
const EVENTS=['primeiro desfile do Bloco Deixa Falar','criação do Bloco Deixa Falar','fundação da Deixa Falar','criação do Samba de Sambar','fim do Rancho Deixa Falar','fusão da Deixa Falar e União das Cores'];
function extractEntities(text,sid){let found=[],lex=[['Pessoa',PEOPLE],['Organização',ORGS],['Grupo',['Deixa Falar','União Faz a Força','União das Cores','Unidos de São Carlos']],['Local',PLACES],['Evento',EVENTS],['Atividade',['desfile','composição','gravação','ensaio','fundação','organização']],['Thing',['samba','partitura','fotografia','disco','gravação']],['Record',['ata','estatuto','programa','cartaz','fotografia','documento']]];
 for(const [type,terms] of lex)for(const term of terms){const re=new RegExp('(?<![\\wÀ-ÿ])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\wÀ-ÿ])','ig');let m,n=0;while((m=re.exec(text))&&n++<5){found.push({id:id(),name:term,type,source_id:sid,source_excerpt:text.slice(Math.max(0,m.index-190),Math.min(text.length,m.index+term.length+220)).replace(/\s+/g,' '),position:m.index,confidence:type==='Evento'?'Baixa':'Média',status:'Pendente',evidence:'Menção literal encontrada; validar identidade, papel e contexto.',variants:[]})}}
 const dr=/(?<!\d)(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}|década de \d{4}|final da década de \d{4}|início da década de \d{4})(?!\d)/gi;let m;while((m=dr.exec(text)))found.push({id:id(),name:m[0],type:'Data',source_id:sid,source_excerpt:text.slice(Math.max(0,m.index-180),Math.min(text.length,m.index+m[0].length+200)).replace(/\s+/g,' '),position:m.index,confidence:'Média',status:'Pendente',evidence:'Expressão temporal localizada. Classificar a natureza da data.',variants:[]});
 const seen=new Set();return found.sort((a,b)=>a.position-b.position).filter(e=>{let k=e.type+'|'+e.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})}
async function readFile(file){const ext=file.name.split('.').pop().toLowerCase();if(ext==='docx'){if(!window.mammoth)throw Error('Biblioteca DOCX não carregou. Atualize a página e tente novamente.');const r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return r.value.split(/\n+/).map(x=>x.trim()).filter(Boolean)}
 if(ext==='pdf'){if(!window.pdfjsLib)throw Error('Biblioteca PDF não carregou. Atualize a página e tente novamente.');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let blocks=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),c=await p.getTextContent(),t=c.items.map(x=>x.str).join(' ').trim();if(t)blocks.push('[Página '+i+'] '+t)}if(!blocks.length)throw Error('Este PDF parece digitalizado ou não contém texto selecionável. OCR ainda não está disponível.');return blocks}
 throw Error('Formato não suportado. Envie DOCX ou PDF.') }
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#uploadMsg').textContent='Lendo documento no navegador…';try{const blocks=await readFile(f),text=blocks.join('\n'),sid=id(),entities=extractEntities(text,sid);const source={id:sid,filename:f.name,title:f.name.replace(/\.[^.]+$/,''),kind:'Documento analisado',text,blocks,entity_count:entities.length,created_at:new Date().toLocaleString('pt-BR')};state.sources.push(source);state.entities.push(...entities);state.notes.push({id:id(),source_id:sid,text:'Revisar metadados de cada obra e vincular citações às páginas/edições disponíveis.',status:'Aberta'});if(saveState()){$('#uploadMsg').textContent='Importação concluída: '+blocks.length+' blocos e '+entities.length+' entidades candidatas. Dados salvos neste navegador.';render();page('entities')}}catch(err){$('#uploadMsg').textContent=err.message}e.target.value=''};
function render(){$('#sSources').textContent=state.sources.length;$('#sEntities').textContent=state.entities.length;$('#sRelations').textContent=state.relations.length;$('#sPending').textContent=state.entities.filter(x=>x.status==='Pendente').length+state.relations.filter(x=>x.status==='Pendente').length;
 $('#sourceList').innerHTML=state.sources.length?state.sources.map(s=>'<div class="sourceitem"><div><b>'+esc(s.title)+'</b><small>'+esc(s.filename)+' · '+esc(s.created_at)+' · '+s.entity_count+' entidades candidatas</small></div><span class="tag">Fonte importada</span></div>').join(''):'Nenhuma fonte importada ainda.';
 const q=($('#searchEntity')?.value||'').toLowerCase(),t=$('#typeFilter')?.value||'',st=$('#statusFilter')?.value||'',es=state.entities.filter(e=>(!q||e.name.toLowerCase().includes(q))&&(!t||e.type===t)&&(!st||e.status===st));
 $('#entityList').innerHTML=es.length?es.map(e=>'<div class="entityrow" data-id="'+e.id+'"><div><input class="entityname" data-field="name" value="'+esc(e.name)+'" aria-label="Nome da entidade"><small>'+esc(e.confidence)+' confiança · posição '+e.position+'</small><div class="rowactions"><button class="mini" data-action="valid">Validar</button><button class="mini" data-action="reject">Rejeitar</button></div></div><div><span class="tag">'+esc(e.type)+'</span><select data-field="type"><option '+(e.type==='Pessoa'?'selected':'')+'>Pessoa</option><option '+(e.type==='Organização'?'selected':'')+'>Organização</option><option '+(e.type==='Local'?'selected':'')+'>Local</option><option '+(e.type==='Evento'?'selected':'')+'>Evento</option><option '+(e.type==='Data'?'selected':'')+'>Data</option></select></div><div class="excerpt">“'+esc(e.source_excerpt)+'”<br><small>'+esc(e.evidence)+'</small></div><div><span class="tag '+(e.status==='Validada'?'valid':e.status==='Rejeitada'?'reject':'pending')+'">'+esc(e.status)+'</span><button class="mini" data-action="save">Salvar</button></div></div>').join(''):'Nenhuma entidade corresponde aos filtros.';
 $('#entityList').querySelectorAll('.entityrow').forEach(row=>row.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const e=state.entities.find(x=>x.id===row.dataset.id);e.name=row.querySelector('[data-field=name]').value;e.type=row.querySelector('[data-field=type]').value;if(b.dataset.action==='valid'||b.dataset.action==='save')e.status='Validada';if(b.dataset.action==='reject')e.status='Rejeitada';saveState();render()}));
 const opts=state.entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' ('+esc(e.type)+')</option>').join('');$('#relSubject').innerHTML=opts;$('#relObject').innerHTML=opts;
 $('#relationList').innerHTML=state.relations.length?state.relations.map(r=>{const a=state.entities.find(e=>e.id===r.subject),b=state.entities.find(e=>e.id===r.object);return '<div class="relrow"><b>'+esc(a?.name||r.subject)+'</b><span class="tag">'+esc(r.predicate)+'</span><b>'+esc(b?.name||r.object)+'</b><span class="tag pending">'+esc(r.status)+'</span><small>'+esc(r.evidence)+'</small></div>'}).join(''):'Nenhuma relação registrada.'}
['searchEntity','typeFilter','statusFilter'].forEach(k=>$('#'+k).addEventListener('input',render));
$('#addRelation').onclick=()=>{const subject=$('#relSubject').value,object=$('#relObject').value;if(!subject||!object)return alert('Importe e selecione entidades.');state.relations.push({id:id(),subject,predicate:$('#relPredicate').value,object,evidence:$('#relEvidence').value,source_id:state.entities.find(e=>e.id===subject)?.source_id||'',status:'Pendente'});$('#relEvidence').value='';saveState();render()};
function download(name,data,type='application/json'){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#export').onclick=()=>download('sistema-ric-backup.json',JSON.stringify(state,null,2));
const backupBtn=document.createElement('button');backupBtn.className='btn ghost';backupBtn.textContent='Importar backup';backupBtn.onclick=()=>$('#backupFile').click();$('.headright').appendChild(backupBtn);
const backupInput=document.createElement('input');backupInput.type='file';backupInput.accept='.json,application/json';backupInput.id='backupFile';backupInput.hidden=true;backupInput.onchange=async()=>{const f=backupInput.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data||!Array.isArray(data.sources)||!Array.isArray(data.entities))throw Error('Arquivo não parece ser um backup do Sistema RiC.');if(!confirm('Substituir os dados atuais por este backup?'))return;state={...emptyState(),...data};if(saveState()){render();alert('Backup restaurado.')}}catch(e){alert(e.message)}backupInput.value=''};document.body.appendChild(backupInput);
render();

// Módulos complementares: documentos, grafo, descrições e pendências.
const oldRender=render;
render=function(){oldRender();renderModules()};
function renderModules(){
 const sourceOpts=state.sources.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.title)+'</option>').join('');
 if($('#noteSource'))$('#noteSource').innerHTML='<option value="">Sem fonte específica</option>'+sourceOpts;
 if($('#descEntity'))$('#descEntity').innerHTML='<option value="">Sem entidade vinculada</option>'+state.entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' · '+esc(e.type)+'</option>').join('');
 if($('#sourceList'))$('#sourceList').innerHTML=state.sources.length?state.sources.map(s=>'<article class="sourceitem"><div><b>'+esc(s.title)+'</b><small>'+esc(s.filename)+' · '+esc(s.created_at)+' · '+(s.blocks||[]).length+' blocos</small></div><div class="rowactions"><button class="mini" data-open-source="'+esc(s.id)+'">Ler documento</button><button class="mini" data-delete-source="'+esc(s.id)+'">Excluir</button></div></article>').join(''):'Nenhuma fonte importada ainda.';
 $('#sourceList')?.querySelectorAll('[data-open-source]').forEach(b=>b.onclick=()=>{const s=state.sources.find(x=>x.id===b.dataset.openSource);let w=window.open('','_blank');if(w){w.document.write('<meta charset="utf-8"><title>'+esc(s.title)+'</title><style>body{font:16px/1.7 system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#243c50}h1{font-size:24px}</style><h1>'+esc(s.title)+'</h1><p>'+esc(s.filename)+'</p><pre style="white-space:pre-wrap;font:inherit">'+esc(s.text|| (s.blocks||[]).join('\n'))+'</pre>');w.document.close()}});
 $('#sourceList')?.querySelectorAll('[data-delete-source]').forEach(b=>b.onclick=()=>{if(!confirm('Excluir esta fonte e manter as entidades já extraídas?'))return;state.sources=state.sources.filter(s=>s.id!==b.dataset.deleteSource);saveState();render()});
 $('#descriptionList').innerHTML=(state.descriptions||[]).length?state.descriptions.map(d=>'<article class="sourceitem"><div><b>'+esc(d.title)+'</b><small>'+esc(d.level)+' · '+esc(d.date||'Data não informada')+' · '+esc(d.status)+'</small><p>'+esc(d.scope||'')+'</p><small>'+esc(d.history||'')+' '+esc(d.notes||'')+'</small></div><button class="mini" data-del-desc="'+esc(d.id)+'">Excluir</button></article>').join(''):'Nenhuma ficha cadastrada.';
 $('#descriptionList').querySelectorAll('[data-del-desc]').forEach(b=>b.onclick=()=>{state.descriptions=state.descriptions.filter(d=>d.id!==b.dataset.delDesc);saveState();render()});
 $('#noteList').innerHTML=state.notes.length?state.notes.map(n=>'<article class="sourceitem"><div><b>'+esc(n.text)+'</b><small>'+esc(state.sources.find(s=>s.id===n.source_id)?.title||'Sem fonte')+' · '+esc(n.status||'Aberta')+'</small></div><div class="rowactions"><button class="mini" data-note-done="'+esc(n.id)+'">Concluir</button><button class="mini" data-note-del="'+esc(n.id)+'">Excluir</button></div></article>').join(''):'Nenhuma nota registrada.';
 $('#noteList').querySelectorAll('[data-note-done]').forEach(b=>b.onclick=()=>{const n=state.notes.find(x=>x.id===b.dataset.noteDone);n.status=n.status==='Concluída'?'Aberta':'Concluída';saveState();render()});
 $('#noteList').querySelectorAll('[data-note-del]').forEach(b=>b.onclick=()=>{state.notes=state.notes.filter(n=>n.id!==b.dataset.noteDel);saveState();render()});
 drawGraph();
}
function drawGraph(){
 const host=$('#graphView');if(!host)return;
 const all=state.entities.map(n=>({...n})),byId=new Map(all.map(n=>[n.id,n]));
 const relations=state.relations.filter(e=>byId.has(e.subject)&&byId.has(e.object));
 const colors={'Pessoa':'#3478a5','Organização':'#287e76','Grupo':'#568b67','Família':'#9874a8','Local':'#c28b43','Evento':'#b65e62','Data':'#82909e','Atividade':'#4e8caa','Thing':'#9b8650','Record':'#596b9c','Representação digital':'#708b91'};
 if(!all.length){host.innerHTML='<div class="graph-empty"><b>Nenhuma entidade cadastrada</b><span>Importe uma fonte e registre relações para construir a rede.</span></div>';return}
 if(!window.d3){host.innerHTML='<div class="graph-empty">A biblioteca de visualização não carregou. Atualize a página.</div>';return}
 const width=Math.max(600,host.clientWidth||900),height=Math.max(520,Math.min(760,Math.round(width*.62)));
 host.innerHTML='<div class="graph-toolbar"><div class="graph-legend">'+Object.entries(colors).map(([k,v])=>'<span><i style="background:'+v+'"></i>'+esc(k)+'</span>').join('')+'</div><div class="graph-controls"><button class="mini" id="graphZoomIn">＋</button><button class="mini" id="graphZoomOut">−</button><button class="mini" id="graphReset">Visão inicial</button><button class="mini" id="graphShowAll">Mostrar tudo</button></div></div><div class="graph-stage"><svg id="relationSvg" viewBox="0 0 '+width+' '+height+'"></svg></div><div class="graph-detail" id="graphDetail">Clique em uma entidade para abrir suas conexões. Clique novamente para avançar para o próximo nível de relações.</div><p class="hint graph-count" id="graphCount"></p>';
 const svg=d3.select('#relationSvg'),root=svg.append('g'),zoom=d3.zoom().scaleExtent([.2,3]).on('zoom',ev=>root.attr('transform',ev.transform));svg.call(zoom);
 const connectedIds=new Set();relations.forEach(r=>{connectedIds.add(r.subject);connectedIds.add(r.object)});
 // Começa com um núcleo pequeno, sem despejar todas as entidades na tela.
 const initial=all.filter(n=>connectedIds.has(n.id)).slice(0,Math.min(18,connectedIds.size));
 let visible=new Set(initial.map(n=>n.id)),depth=new Map(),expanded=new Set();
 initial.forEach(n=>depth.set(n.id,0));
 if(!initial.length)all.slice(0,18).forEach(n=>{visible.add(n.id);depth.set(n.id,0)});
 const simulation=d3.forceSimulation().force('link',d3.forceLink().id(d=>d.id).distance(125).strength(.55)).force('charge',d3.forceManyBody().strength(-420).distanceMax(550)).force('center',d3.forceCenter(width/2,height/2)).force('collide',d3.forceCollide().radius(d=>Math.max(22,Math.min(38,(d.name||'').length*.9))).iterations(3));
 const linkLayer=root.append('g').attr('class','graph-links'),nodeLayer=root.append('g');
 let linkSel,nodeSel;
 function update(){
  const shown=all.filter(n=>visible.has(n.id));
  const links=relations.filter(e=>visible.has(e.subject)&&visible.has(e.object)).map(e=>({source:e.subject,target:e.object,predicate:e.predicate,status:e.status||'Pendente'}));
  linkSel=linkLayer.selectAll('line').data(links,d=>d.id||d.source.id+'|'+d.target.id+'|'+d.predicate).join('line').attr('stroke',d=>d.status==='Validada'?'#287e76':'#b7c5ce').attr('stroke-width',d=>d.status==='Validada'?2.5:1.5).attr('stroke-dasharray',d=>d.status==='Validada'?'':'5 4').attr('opacity',.85);
  nodeSel=nodeLayer.selectAll('g').data(shown,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','graph-node').style('cursor','pointer');g.append('circle').attr('r',d=>d.type==='Organização'||d.type==='Grupo'?10:7).attr('fill',d=>colors[d.type]||'#647b8b').attr('stroke','#fff').attr('stroke-width',2);g.append('text').attr('x',12).attr('y',4).attr('font-size',11).attr('fill','#2d4558').attr('paint-order','stroke').attr('stroke','#fff').attr('stroke-width',3).attr('stroke-linejoin','round').text(d=>d.name.length>32?d.name.slice(0,30)+'…':d.name);g.append('title').text(d=>d.name+' · '+d.type);return g;});
  nodeSel.classed('expanded',d=>expanded.has(d.id)).on('click',(ev,d)=>{ev.stopPropagation();expandNode(d)}).call(d3.drag().on('start',(ev,d)=>{if(!ev.active)simulation.alphaTarget(.25).restart();d.fx=d.x;d.fy=d.y}).on('drag',(ev,d)=>{d.fx=ev.x;d.fy=ev.y}).on('end',(ev,d)=>{if(!ev.active)simulation.alphaTarget(0);d.fx=null;d.fy=null}));
  simulation.nodes(shown).on('tick',()=>{linkSel.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);nodeSel.attr('transform',d=>'translate('+d.x+','+d.y+')')});
  simulation.force('link').links(links);simulation.alpha(.8).restart();
  $('#graphCount').textContent=visible.size+' de '+all.length+' entidades visíveis · '+links.length+' relações exibidas';
 }
 function expandNode(d){
  // Ao selecionar uma entidade, revela todo o componente conectado:
  // relações diretas e também as conexões alcançáveis por outras entidades.
  const queue=[d.id],visited=new Set([d.id]),componentEdges=[];
  while(queue.length){
   const current=queue.shift();
   relations.forEach(r=>{
    if(r.subject!==current&&r.object!==current)return;
    if(!componentEdges.includes(r))componentEdges.push(r);
    const other=r.subject===current?r.object:r.subject;
    if(!visited.has(other)){visited.add(other);queue.push(other)}
   });
  }
  const fresh=[...visited].filter(id=>!visible.has(id));
  visited.forEach(id=>visible.add(id));
  visited.forEach(id=>expanded.add(id));
  update();
  const direct=relations.filter(r=>r.subject===d.id||r.object===d.id);
  const lines=componentEdges.map(r=>{
   const a=byId.get(r.subject),b=byId.get(r.object);
   return '<li><b>'+esc(a?.name||'Entidade')+'</b> — '+esc(r.predicate||'relacionado a')+' — <b>'+esc(b?.name||'Entidade')+'</b> <small>('+esc(r.status||'Pendente')+')</small></li>';
  }).join('');
  $('#graphDetail').innerHTML='<b>'+esc(d.name)+'</b><span>'+esc(d.type)+' · '+esc(d.status||'Pendente')+'</span><p>'+esc(d.source_excerpt||'Sem trecho de evidência registrado.')+'</p><p><b>Conexões diretas:</b> '+direct.length+' · <b>Entidades no conjunto conectado:</b> '+visited.size+' · <b>Relações encontradas:</b> '+componentEdges.length+'</p>'+(componentEdges.length?'<details open><summary>Ver todas as correlações encontradas</summary><ul class="graph-rel-list">'+lines+'</ul></details>':'<small>Esta entidade ainda não possui relações cadastradas. Registre relações na área de relações para que apareçam no grafo.</small>')+'<small>'+fresh.length+' nova(s) entidade(s) revelada(s), incluindo conexões indiretas.</small>';
 }
 $('#graphZoomIn').onclick=()=>svg.transition().duration(250).call(zoom.scaleBy,1.25);
 $('#graphZoomOut').onclick=()=>svg.transition().duration(250).call(zoom.scaleBy,.8);
 $('#graphReset').onclick=()=>{visible=new Set(initial.map(n=>n.id));depth=new Map(initial.map(n=>[n.id,0]));expanded.clear();update();svg.transition().duration(300).call(zoom.transform,d3.zoomIdentity);$('#graphDetail').textContent='Clique em uma entidade para abrir suas conexões.'};
 $('#graphShowAll').onclick=()=>{all.forEach(n=>visible.add(n.id));update();$('#graphDetail').textContent='Todas as entidades estão visíveis. Clique em qualquer nó para consultar e expandir suas relações.'};
 update();
}
$('#saveDescription').onclick=()=>{const title=$('#descTitle').value.trim();if(!title)return alert('Informe o título da descrição.');state.descriptions=state.descriptions||[];state.descriptions.push({id:id(),entity_id:$('#descEntity').value,level:$('#descLevel').value,title,date:$('#descDate').value,scope:$('#descScope').value,history:$('#descHistory').value,notes:$('#descNotes').value,status:'Rascunho',created_at:new Date().toISOString()});['descTitle','descDate','descScope','descHistory','descNotes'].forEach(k=>$('#'+k).value='');saveState();render()};
$('#addNote').onclick=()=>{const text=$('#noteText').value.trim();if(!text)return alert('Escreva a nota.');state.notes.push({id:id(),source_id:$('#noteSource').value,text,status:'Aberta',created_at:new Date().toISOString()});$('#noteText').value='';saveState();render()};

// Renderização inicial dos módulos complementares após a extensão do render principal.
render();


/* WORKSPACE 4 MODULOS — camada integrada sobre o modelo local existente */
(function(){
 const navHost=document.querySelector('.sidebar .navlabel');
 const main=document.querySelector('main');
 if(!navHost||!main)return;
 const modules=[
  ['identify','01','Identificação','Quem, o quê, onde e quando'],
  ['labogad','02','Descrição LABOGAD','Modelos e fluxo da cartilha'],
  ['riccm','03','Descrição RiC-CM 1.0','Campos e correspondências'],
  ['graph','04','Grafo de relações','Rede de entidades']
 ];
 const nav=document.createElement('div');nav.className='module-nav';
 nav.innerHTML='<div class="navlabel">MÓDULOS PRINCIPAIS</div>'+modules.map(m=>'<button class="nav module-link" data-page="'+m[0]+'"><span class="module-num">'+m[1]+'</span><span>'+m[2]+'</span></button>').join('');
 navHost.insertAdjacentElement('afterend',nav);
 const insertBefore=document.querySelector('#overview');
 const section=(id,html)=>{const s=document.createElement('section');s.id=id;s.className='page';s.innerHTML=html;insertBefore.insertAdjacentElement('beforebegin',s)};
 section('identify',`
 <div class="toolbar"><div><h2>Identificação de entidades</h2><p>Importe livros, documentos ou imagens. O sistema localiza menções e apresenta evidências para revisão.</p></div><button class="btn primary" id="identifyUpload">＋ Adicionar fonte</button></div>
 <div class="module-note"><b>Como interpretar os resultados</b><p>São candidatos encontrados no texto, não fatos confirmados. A identificação de pessoas, organizações e eventos exige validação contextual. PDF digitalizado e fotografia dependem de OCR.</p></div>
 <div class="panel"><div class="panelhead"><div><h3>Adicionar livro, documento ou fotografia</h3><p>PDF, DOCX, JPG e PNG · processamento no navegador</p></div></div><label class="drop" for="moduleFile"><div class="uploadicon">↑</div><b>Selecione ou arraste um arquivo</b><span>DOCX, PDF pesquisável, JPG ou PNG</span><input id="moduleFile" type="file" accept=".docx,.pdf,.jpg,.jpeg,.png"></label><div id="moduleMsg" class="message"></div></div>
 <div class="stats"><div class="stat"><small>FONTES</small><strong id="idSources">0</strong><span>arquivos analisados</span></div><div class="stat"><small>MENÇÕES CANDIDATAS</small><strong id="idEntities">0</strong><span>identificações para revisar</span></div><div class="stat"><small>VALIDADAS</small><strong id="idValidated">0</strong><span>após conferência humana</span></div><div class="stat"><small>PENDENTES</small><strong id="idPending">0</strong><span>aguardando análise</span></div></div>
 <div class="panel"><div class="panelhead"><div><h3>Resultados e evidências</h3><p>Edite o nome, classifique o tipo e valide ou rejeite cada menção.</p></div><button class="btn ghost" id="openEntityList">Abrir lista completa</button></div><div id="identifyResults" class="empty">Nenhuma identificação disponível.</div></div>`);
 section('labogad',`
 <div class="toolbar"><div><h2>Descrição LABOGAD</h2><p>Fichas estruturadas conforme os tipos de recurso e orientações da cartilha.</p></div></div>
 <div class="module-note"><b>Princípio de trabalho</b><p>Descrever primeiro o que a fonte permite afirmar; registrar lacunas e incertezas; relacionar recursos e entidades; submeter a descrição à revisão antes de considerá-la pronta.</p></div>
 <div class="panel"><h3>Nova descrição LABOGAD</h3><div class="relationform">
 <label>Tipo de recurso<select id="labType"><option value="Documento">Documento</option><option>Conjunto documental</option><option>Representação digital</option><option>Pessoa</option><option>Grupo/Família</option><option>Organização</option><option>Evento</option><option>Atividade</option><option>Local</option><option>Data</option></select></label>
 <label>Entidade vinculada<select id="labEntity"><option value="">Não vinculada</option></select></label>
 <label>Identificador<input id="labIdentifier" placeholder="Código ou identificador"></label>
 <label class="wide">Título / denominação<input id="labTitle" placeholder="Título atribuído ou nome da entidade"></label>
 <label>Data / período<input id="labDate" placeholder="Data, intervalo ou período aproximado"></label>
 <label>Local<input id="labPlace" placeholder="Local associado"></label>
 <label class="wide">Descrição / âmbito e conteúdo<textarea id="labScope" rows="3" placeholder="O que é o recurso? O que documenta?"></textarea></label>
 <label class="wide">Contexto / história<input id="labContext" placeholder="Contexto de produção, trajetória ou história custodial"></label>
 <label class="wide">Relações e agentes envolvidos<input id="labRelations" placeholder="Agentes, atividades, eventos, locais e recursos relacionados"></label>
 <label class="wide">Fonte, evidência e incertezas<textarea id="labEvidence" rows="2" placeholder="Indique a fonte e o trecho que sustenta a descrição; registre dúvidas."></textarea></label>
 <button class="btn primary" id="saveLab">Salvar rascunho LABOGAD</button></div></div><div class="panel"><h3>Descrições LABOGAD registradas</h3><div id="labList" class="empty">Nenhuma descrição cadastrada.</div></div>`);
 section('riccm',`
 <div class="toolbar"><div><h2>Descrição RiC-CM 1.0</h2><p>Formulário estruturado a partir das correspondências entre normas ICA e RiC-CM.</p></div></div>
 <div class="module-note"><b>Leitura da planilha</b><p>A planilha enviada é uma matriz de correspondência, não um formulário pronto. Selecione a norma de origem para visualizar os campos de referência e preencher os atributos RiC-CM correspondentes. A correspondência orienta a descrição; não significa equivalência automática entre todos os campos.</p></div>
 <div class="panel"><h3>Nova descrição / correspondência</h3><div class="relationform">
 <label>Norma de referência<select id="ricStandard"><option value="ISAD(G)">ISAD(G) → RiC-CM</option><option value="ISAAR(CPF)">ISAAR(CPF) → RiC-CM</option><option value="ISDF">ISDF → RiC-CM</option><option value="ISDIAH">ISDIAH → RiC-CM</option></select></label>
 <label>Entidade RiC-CM<select id="ricEntityType"><option value="RiC-E04">RiC-E04 · Record</option><option value="RiC-E03">RiC-E03 · Record Set</option><option value="RiC-E06">RiC-E06 · Instantiation</option><option value="RiC-E08">RiC-E08 · Person</option><option value="RiC-E09">RiC-E09 · Group</option><option value="RiC-E10">RiC-E10 · Family</option><option value="RiC-E11">RiC-E11 · Corporate Body</option><option value="RiC-E14">RiC-E14 · Event</option><option value="RiC-E15">RiC-E15 · Activity</option><option value="RiC-E22">RiC-E22 · Place</option><option value="RiC-E18">RiC-E18 · Date</option><option value="RiC-E01">RiC-E01 · Thing</option></select></label>
 <label>Entidade local vinculada<select id="ricEntity"><option value="">Não vinculada</option></select></label>
 <label>Identificador / RiC-A22<input id="ricIdentifier" placeholder="Código de referência / identificador"></label>
 <label class="wide">Nome / título / RiC-A28<input id="ricName" placeholder="Nome ou título atribuído"></label>
 <label>Data inicial / RiC-R (Date)<input id="ricStart" placeholder="Data inicial ou início do período"></label>
 <label>Data final / RiC-R (Date)<input id="ricEnd" placeholder="Data final ou fim do período"></label>
 <label class="wide">Âmbito e conteúdo / Scope and Content<input id="ricScope" placeholder="Conteúdo, função ou contexto documentado"></label>
 <label class="wide">História / History<input id="ricHistory" placeholder="História administrativa, biográfica ou custodial"></label>
 <label class="wide">Relações RiC / entidades relacionadas<input id="ricRelations" placeholder="Ex.: has creator, associated with, has location"></label>
 <label class="wide">Observações, fonte e incertezas<textarea id="ricNotes" rows="2" placeholder="Fonte da informação, lacunas e divergências"></textarea></label>
 <button class="btn primary" id="saveRic">Salvar descrição RiC-CM</button></div></div>
 <div class="panel" id="ricAutoPanel"><div class="panelhead"><div><h3>Tabela de descrição gerada automaticamente</h3><p>O sistema propõe valores a partir das fontes e entidades cadastradas. Clique nas células para editar antes de exportar.</p></div><div class="rowactions"><button class="btn ghost" id="refreshRicTable">Atualizar tabela</button><button class="btn primary" id="exportRicPdf">Exportar tabela em PDF</button></div></div><div class="table-scroll"><table class="description-table" id="ricDescriptionTable"><thead><tr><th>Elemento / atributo</th><th>Valor proposto</th><th>Fonte / evidência</th><th>Situação</th></tr></thead><tbody id="ricTableBody"><tr><td colspan="4">Importe uma fonte para gerar a tabela.</td></tr></tbody></table></div><p class="hint">Os valores automáticos são sugestões. Revise especialmente identidade, datas, autoria, relações e contexto antes de considerar a descrição concluída.</p></div>
 <div class="panel"><h3>Descrições RiC-CM registradas</h3><div id="ricList" class="empty">Nenhuma ficha cadastrada.</div></div>
 <div class="panel"><h3>Correspondências contempladas nesta interface</h3><div id="crosswalkInfo" class="crosswalk-grid"></div><p class="hint">A matriz integral contém oito abas e centenas de linhas. Esta interface inicia pelos campos centrais de descrição e pelos tipos de entidade RiC-CM; não substitui a consulta linha a linha à planilha original.</p></div>`);
 // Atalhos de navegação e compatibilidade com as páginas antigas.
 const oldPage=page;
 window.page=function(id){oldPage(id);const titles={identify:'Identificação',labogad:'Descrição LABOGAD',riccm:'Descrição RiC-CM 1.0',graph:'Grafo de relações'};if(titles[id])document.querySelector('#pagetitle').textContent=titles[id]};
 document.querySelectorAll('.module-link').forEach(b=>b.addEventListener('click',()=>window.page(b.dataset.page)));
 $('#identifyUpload').onclick=()=>$('#moduleFile').click();
 $('#openEntityList').onclick=()=>window.page('entities');
 // Sincroniza os selects das fichas com o cadastro único de entidades.
 function fillEntitySelects(){['labEntity','ricEntity'].forEach(id=>{const el=$('#'+id),v=el.value;el.innerHTML='<option value="">Não vinculada</option>'+state.entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' · '+esc(e.type)+'</option>').join('');el.value=v})}
 function buildRicRows(){
  const body=$('#ricTableBody');if(!body)return;
  const source=state.sources[state.sources.length-1];
  const entities=state.entities.filter(e=>!source||e.source_id===source.id);
  const rows=[];
  const add=(element,value,evidence,status='Revisar')=>rows.push({element,value,evidence,status});
  add('RiC-E — Tipo de entidade','Record Resource / recurso documental',source?.title||'Sem fonte vinculada','Proposta inicial');
  add('RiC-A22 — Identifier',source?.id||'',source?.filename||'','Conferir identificador');
  add('RiC-A28 — Name / Title',source?.title||'',source?.filename||'','Revisar título');
  add('RiC-A — Scope and Content','',source?.filename||'','Preencher após leitura');
  add('RiC-A — History','',source?.filename||'','Preencher após pesquisa');
  add('RiC-R — has or is associated with date',entities.filter(e=>e.type==='Data').map(e=>e.name).join('; '),entities.filter(e=>e.type==='Data').map(e=>e.source_excerpt).join(' | '),'Validar natureza das datas');
  const mapping={'Pessoa':'RiC-E08 Person','Organização':'RiC-E11 Corporate Body','Grupo':'RiC-E09 Group','Família':'RiC-E10 Family','Local':'RiC-E22 Place','Evento':'RiC-E14 Event','Atividade':'RiC-E15 Activity','Data':'RiC-E18 Date','Thing':'RiC-E01 Thing','Record':'RiC-E04 Record','Representação digital':'RiC-E06 Instantiation'};
  entities.forEach(e=>add((mapping[e.type]||e.type)+' — Name',e.name,e.source_excerpt||source?.filename||'','Candidato — validar'));
  if(!entities.length&&!source){body.innerHTML='<tr><td colspan="4">Importe uma fonte para gerar a tabela.</td></tr>';return}
  body.innerHTML=rows.map((r,i)=>'<tr><th>'+esc(r.element)+'</th><td contenteditable="true" data-ric-cell="'+i+'" data-field="value">'+esc(r.value)+'</td><td contenteditable="true" data-ric-cell="'+i+'" data-field="evidence">'+esc(r.evidence)+'</td><td contenteditable="true" data-ric-cell="'+i+'" data-field="status">'+esc(r.status)+'</td></tr>').join('');
  body.querySelectorAll('[contenteditable=true]').forEach(cell=>cell.addEventListener('input',()=>{cell.classList.add('edited');}));
 }
 $('#refreshRicTable').onclick=buildRicRows;
 $('#exportRicPdf').onclick=()=>{const table=$('#ricDescriptionTable');if(!table)return;const title='Descrição arquivística — RiC-CM 1.0';const win=window.open('','_blank');if(!win){alert('Permita pop-ups para gerar o PDF.');return;}win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+title+'</title><style>body{font:12px Arial,sans-serif;color:#263e52;margin:24px}h1{font-size:19px}p{font-size:11px;color:#586b7a}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #b9c7d0;padding:8px;text-align:left;vertical-align:top;white-space:pre-wrap}thead th{background:#eaf0f3}tbody th{width:23%;background:#f5f7f8}@page{size:A4 landscape;margin:14mm}@media print{body{margin:0}}</style></head><body><h1>'+title+'</h1><p>Gerado pelo Sistema RiC · minuta sujeita à revisão arquivística</p>'+table.outerHTML+'<p>Os valores e relações devem ser conferidos com as fontes originais. Campos vazios indicam informação não identificada ou ainda não descrita.</p><script>window.onload=()=>window.print()<\\/script></body></html>');win.document.close();};
 function renderWorkspace(){
  fillEntitySelects();
  $('#idSources').textContent=state.sources.length;$('#idEntities').textContent=state.entities.length;
  $('#idValidated').textContent=state.entities.filter(e=>e.status==='Validada').length;
  $('#idPending').textContent=state.entities.filter(e=>e.status==='Pendente').length;
  const latest=state.entities.slice(-12).reverse();
  $('#identifyResults').innerHTML=latest.length?latest.map(e=>'<div class="sourceitem"><div><b>'+esc(e.name)+'</b><small>'+esc(e.type)+' · '+esc(e.status)+' · '+esc(e.confidence)+'</small><p class="excerpt">'+esc(e.source_excerpt||'')+'</p></div><span class="tag">'+esc(e.status)+'</span></div>').join(''):'Nenhuma identificação disponível.';
  const labs=state.labDescriptions||[];
  $('#labList').innerHTML=labs.length?labs.map(d=>'<article class="sourceitem"><div><b>'+esc(d.title)+'</b><small>'+esc(d.type)+' · '+esc(d.status)+' · '+esc(d.date||'Data não informada')+'</small><p>'+esc(d.scope||'')+'</p><small>'+esc(d.evidence||'')+'</small></div><button class="mini" data-lab-delete="'+esc(d.id)+'">Excluir</button></article>').join(''):'Nenhuma descrição cadastrada.';
  buildRicRows();
  const rics=state.ricDescriptions||[];
  $('#ricList').innerHTML=rics.length?rics.map(d=>'<article class="sourceitem"><div><b>'+esc(d.name)+'</b><small>'+esc(d.standard)+' · '+esc(d.entityType)+' · '+esc(d.status)+'</small><p>'+esc(d.scope||'')+'</p><small>'+esc(d.notes||'')+'</small></div><button class="mini" data-ric-delete="'+esc(d.id)+'">Excluir</button></article>').join(''):'Nenhuma descrição cadastrada.';
  $('#crosswalkInfo').innerHTML=['ISAD(G): identificação, contexto, conteúdo/estrutura, acesso/uso, materiais associados, notas e controle','ISAAR(CPF): identidade, descrição, relações e controle de autoridade de agentes','ISDF: identificação, contexto, relações e controle de funções/atividades','ISDIAH: identificação, contato, acesso, serviços e controle de instituições de custódia'].map(x=>'<div class="crosswalk-card">'+esc(x)+'</div>').join('');
  $('#labList').querySelectorAll('[data-lab-delete]').forEach(b=>b.onclick=()=>{state.labDescriptions=state.labDescriptions.filter(x=>x.id!==b.dataset.labDelete);saveState();renderWorkspace()});
  $('#ricList').querySelectorAll('[data-ric-delete]').forEach(b=>b.onclick=()=>{state.ricDescriptions=state.ricDescriptions.filter(x=>x.id!==b.dataset.ricDelete);saveState();renderWorkspace()});
 }
 $('#saveLab').onclick=()=>{const title=$('#labTitle').value.trim();if(!title)return alert('Informe o título ou denominação.');state.labDescriptions=state.labDescriptions||[];state.labDescriptions.push({id:id(),type:$('#labType').value,entity_id:$('#labEntity').value,identifier:$('#labIdentifier').value,title,date:$('#labDate').value,place:$('#labPlace').value,scope:$('#labScope').value,context:$('#labContext').value,relations:$('#labRelations').value,evidence:$('#labEvidence').value,status:'Rascunho',created_at:new Date().toISOString()});saveState();['labIdentifier','labTitle','labDate','labPlace','labScope','labContext','labRelations','labEvidence'].forEach(k=>$('#'+k).value='');renderWorkspace()};
 $('#saveRic').onclick=()=>{const name=$('#ricName').value.trim();if(!name)return alert('Informe o nome ou título.');state.ricDescriptions=state.ricDescriptions||[];state.ricDescriptions.push({id:id(),standard:$('#ricStandard').value,entityType:$('#ricEntityType').value,entity_id:$('#ricEntity').value,identifier:$('#ricIdentifier').value,name,start:$('#ricStart').value,end:$('#ricEnd').value,scope:$('#ricScope').value,history:$('#ricHistory').value,relations:$('#ricRelations').value,notes:$('#ricNotes').value,status:'Rascunho',created_at:new Date().toISOString()});saveState();['ricIdentifier','ricName','ricStart','ricEnd','ricScope','ricHistory','ricRelations','ricNotes'].forEach(k=>$('#'+k).value='');renderWorkspace()};
 // OCR de imagens no navegador; não envia o arquivo a um servidor.
 $('#moduleFile').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const msg=$('#moduleMsg');msg.textContent='Processando arquivo localmente…';try{
  const ext=f.name.split('.').pop().toLowerCase();let blocks=[];
  if(['jpg','jpeg','png'].includes(ext)){if(!window.Tesseract)throw Error('Biblioteca OCR não carregou. Recarregue a página.');msg.textContent='Executando OCR em português. Imagens grandes podem levar alguns minutos…';const result=await Tesseract.recognize(f,'por',{logger:m=>{if(m.status==='recognizing text')msg.textContent='OCR: '+Math.round((m.progress||0)*100)+'%'}});const text=result.data.text.trim();if(!text)throw Error('O OCR não encontrou texto legível.');blocks=text.split(/\n+/).map(x=>x.trim()).filter(Boolean)}
  else {blocks=await readFile(f)}
  const text=blocks.join('\n'),sid=id(),entities=extractEntities(text,sid);
  const source={id:sid,filename:f.name,title:f.name.replace(/\.[^.]+$/,''),kind:'Documento analisado',text,blocks,entity_count:entities.length,created_at:new Date().toLocaleString('pt-BR'),ocr:['jpg','jpeg','png'].includes(ext)};
  state.sources.push(source);state.entities.push(...entities);if(saveState()){msg.textContent='Concluído: '+blocks.length+' blocos e '+entities.length+' menções candidatas. Revise os resultados.';render();renderWorkspace()}
 }catch(err){msg.textContent=err.message}ev.target.value=''};
 // Acrescenta tipos de entidade sem alterar os registros antigos.
 const oldExtract=extractEntities;
 // Os candidatos de tipos ampliados são identificados por vocabulário contextual.
 const expandedTerms=[['Grupo',['Deixa Falar','União Faz a Força','União das Cores']],['Família',[]],['Atividade',['desfile','composição','gravação','ensaio','fundação','organização']],['Thing',['samba','partitura','fotografia','disco','gravação']],['Record',['ata','estatuto','programa','cartaz','fotografia','documento']]];
 const oldRead=readFile;
 // Atualiza contadores e fichas sempre que os módulos antigos renderizarem.
 const originalRender=render;render=function(){originalRender();renderWorkspace()};
 renderWorkspace();
})();
