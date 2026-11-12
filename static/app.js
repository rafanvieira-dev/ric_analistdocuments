const KEY='ric_analistdocuments_v1';
const emptyState=()=>({project:'Sistema RiC',sources:[],entities:[],relations:[],notes:[]});
let state=loadState();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadState(){try{return {...emptyState(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return emptyState()}}
function saveState(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){alert('O armazenamento do navegador está cheio. Exporte um backup e remova fontes antigas ou reduza o conteúdo.');return false}}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function page(id){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('show',x.id===id));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===id));$('#pagetitle').textContent=({overview:'Visão geral',sources:'Fontes e documentos',entities:'Entidades identificadas',relations:'Rede de relações',quality:'Controle de qualidade',identify:'Identificação de entidades',omeka:'Descrição Omeka S',riccm:'Descrição RiC-CM 1.0',graph:'Grafo de relações','relation-manager':'Cadastro de relações'})[id]||'Visão geral'}
document.querySelectorAll('.nav[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('#goUpload').onclick=()=>$('#uploadPanel').scrollIntoView({behavior:'smooth'});
$('#newUpload').onclick=()=>{page('overview');$('#uploadPanel').scrollIntoView({behavior:'smooth'})};
function highlightText(value,names){const raw=String(value??'');const terms=[...new Set((names||[]).filter(Boolean).map(x=>String(x).trim()).filter(x=>x.length>1))].sort((a,b)=>b.length-a.length);let out='',pos=0;while(pos<raw.length){let best=-1,chosen='';for(const term of terms){const at=raw.toLowerCase().indexOf(term.toLowerCase(),pos);if(at>=0&&(best<0||at<best||(at===best&&term.length>chosen.length))){best=at;chosen=term}}if(best<0){out+=esc(raw.slice(pos));break}out+=esc(raw.slice(pos,best))+'<mark class="entity-highlight">'+esc(raw.slice(best,best+chosen.length))+'</mark>';pos=best+chosen.length}return out}
function sourceHighlights(sourceId){return state.entities.filter(e=>e.source_id===sourceId&&e.name).map(e=>e.name)}
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
 const pendingVisible=es.filter(e=>e.status==='Pendente');const bulkButton=$('#validateAllEntities');if(bulkButton){bulkButton.textContent='Validar todas ('+pendingVisible.length+')';bulkButton.disabled=!pendingVisible.length;bulkButton.onclick=()=>{if(!pendingVisible.length)return;if(!confirm('Validar '+pendingVisible.length+' entidades pendentes que correspondem aos filtros atuais?'))return;const ids=new Set(pendingVisible.map(e=>e.id));state.entities.forEach(e=>{if(ids.has(e.id))e.status='Validada'});if(saveState())render()}};
 $('#entityList').innerHTML=es.length?es.map(e=>'<article class="entity-card" data-id="'+esc(e.id)+'"><div class="entity-compact"><div class="entity-summary"><b>'+esc(e.name)+'</b><span class="tag">'+esc(e.type)+'</span><span class="tag '+(e.status==='Validada'?'valid':e.status==='Rejeitada'?'reject':'pending')+'">'+esc(e.status)+'</span></div><small>'+esc(e.confidence)+' confiança</small><button class="mini" type="button" data-expand-entity>Editar / detalhes</button></div><div class="entity-details" hidden><label>Nome da entidade<input class="entityname" data-field="name" value="'+esc(e.name)+'"></label><label>Tipo<select data-field="type"><option '+(e.type==='Pessoa'?'selected':'')+'>Pessoa</option><option '+(e.type==='Organização'?'selected':'')+'>Organização</option><option '+(e.type==='Grupo'?'selected':'')+'>Grupo</option><option '+(e.type==='Família'?'selected':'')+'>Família</option><option '+(e.type==='Local'?'selected':'')+'>Local</option><option '+(e.type==='Evento'?'selected':'')+'>Evento</option><option '+(e.type==='Data'?'selected':'')+'>Data</option><option '+(e.type==='Atividade'?'selected':'')+'>Atividade</option><option '+(e.type==='Thing'?'selected':'')+'>Coisa (Thing)</option><option '+(e.type==='Record'?'selected':'')+'>Record</option><option '+(e.type==='Representação digital'?'selected':'')+'>Representação digital</option></select></label><div class="excerpt">“'+esc(e.source_excerpt)+'”<br><small>'+esc(e.evidence)+'</small></div><small>Posição no documento: '+e.position+'</small><div class="rowactions"><button class="mini" data-action="valid">Validar</button><button class="mini" data-action="reject">Rejeitar</button><button class="mini" data-action="save">Salvar alterações</button></div></div></article>').join(''):'Nenhuma entidade corresponde aos filtros.';
 $('#entityList').querySelectorAll('.entity-card').forEach(row=>{row.querySelector('[data-expand-entity]').onclick=()=>{const panel=row.querySelector('.entity-details');panel.hidden=!panel.hidden;row.classList.toggle('expanded',!panel.hidden)};row.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const e=state.entities.find(x=>x.id===row.dataset.id);e.name=row.querySelector('[data-field=name]').value.trim();e.type=row.querySelector('[data-field=type]').value;if(!e.name)return alert('Informe o nome da entidade.');if(b.dataset.action==='valid')e.status='Validada';if(b.dataset.action==='reject')e.status='Rejeitada';saveState();render()})});
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
 $('#sourceList')?.querySelectorAll('[data-open-source]').forEach(b=>b.onclick=()=>{const s=state.sources.find(x=>x.id===b.dataset.openSource);let w=window.open('','_blank');if(w){w.document.write('<meta charset="utf-8"><title>'+esc(s.title)+'</title><style>body{font:16px/1.7 system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#243c50}h1{font-size:24px}</style><h1>'+esc(s.title)+'</h1><p>'+esc(s.filename)+'</p><pre style="white-space:pre-wrap;font:inherit">'+highlightText(s.text|| (s.blocks||[]).join('\\n'),sourceHighlights(s.id))+'</pre><p style="font-size:12px;color:#607587">Grifos automáticos: menções localizadas durante a análise. Confira cada ocorrência na fonte.</p>');w.document.close()}});
 $('#sourceList')?.querySelectorAll('[data-delete-source]').forEach(b=>b.onclick=()=>{if(!confirm('Excluir esta fonte e manter as entidades já extraídas?'))return;state.sources=state.sources.filter(s=>s.id!==b.dataset.deleteSource);saveState();render()});
 $('#descriptionList').innerHTML=(state.descriptions||[]).length?state.descriptions.map(d=>'<article class="sourceitem"><div><b>'+esc(d.title)+'</b><small>'+esc(d.level)+' · '+esc(d.date||'Data não informada')+' · '+esc(d.status)+'</small><p>'+esc(d.scope||'')+'</p><small>'+esc(d.history||'')+' '+esc(d.notes||'')+'</small></div><button class="mini" data-del-desc="'+esc(d.id)+'">Excluir</button></article>').join(''):'Nenhuma ficha cadastrada.';
 $('#descriptionList').querySelectorAll('[data-del-desc]').forEach(b=>b.onclick=()=>{state.descriptions=state.descriptions.filter(d=>d.id!==b.dataset.delDesc);saveState();render()});
 $('#noteList').innerHTML=state.notes.length?state.notes.map(n=>'<article class="sourceitem"><div><b>'+esc(n.text)+'</b><small>'+esc(state.sources.find(s=>s.id===n.source_id)?.title||'Sem fonte')+' · '+esc(n.status||'Aberta')+'</small></div><div class="rowactions"><button class="mini" data-note-done="'+esc(n.id)+'">Concluir</button><button class="mini" data-note-del="'+esc(n.id)+'">Excluir</button></div></article>').join(''):'Nenhuma nota registrada.';
 $('#noteList').querySelectorAll('[data-note-done]').forEach(b=>b.onclick=()=>{const n=state.notes.find(x=>x.id===b.dataset.noteDone);n.status=n.status==='Concluída'?'Aberta':'Concluída';saveState();render()});
 $('#noteList').querySelectorAll('[data-note-del]').forEach(b=>b.onclick=()=>{state.notes=state.notes.filter(n=>n.id!==b.dataset.noteDel);saveState();render()});
 renderGraphEditor();
 drawGraph();
}
function renderGraphEditor(){
 const editor=$('#graphRelationEditor');if(!editor)return;
 if(!editor.dataset.initialized){
  editor.innerHTML='<h3>Registrar relações</h3><p class="hint">Escolha uma entidade de origem e adicione quantas ligações precisar. A justificativa é opcional; todas as relações ficarão pendentes para revisão.</p><div class="relationform batch-relation-form"><label class="wide">Entidade de origem<select id="graphSubject"></select></label><div class="batch-relation-head"><b>Entidades relacionadas</b><button class="mini" type="button" id="graphAddRow">＋ Adicionar ligação</button></div><div id="graphRelationRows" class="batch-relation-rows"></div><label class="wide">Evidência / justificativa (opcional)<input id="graphEvidence" placeholder="Se desejar, informe trecho, página ou referência"></label><button class="btn primary" type="button" id="graphAddRelation">Registrar todas as ligações</button></div><div class="graph-relation-list" id="graphRelationList"></div>';
  const predicateOptions='<option value="fundador de">fundador de</option><option value="dirigente de">dirigente de</option><option value="membro de">membro de</option><option value="localizado em">localizado em</option><option value="ocorreu em">ocorreu em</option><option value="associado a">associado a</option><option value="antecessor de">antecessor de</option><option value="sucessor de">sucessor de</option><option value="participou de">participou de</option><option value="produziu">produziu</option><option value="mencionado em">mencionado em</option>';
  const addRow=()=>{const row=document.createElement('div');row.className='batch-relation-row';row.innerHTML='<label>Tipo de relação<select class="batch-predicate">'+predicateOptions+'</select></label><label>Entidade relacionada<select class="batch-object"></select></label><button class="mini danger" type="button" data-remove-relation-row aria-label="Remover ligação">Remover</button>';editor.querySelector('#graphRelationRows').appendChild(row);fillObjects(row.querySelector('.batch-object'))};
  const fillObjects=select=>{const valid=state.entities.filter(e=>e.status==='Validada');select.innerHTML='<option value="">Selecione a entidade</option>'+valid.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' · '+esc(e.type)+'</option>').join('')};
  editor.querySelector('#graphAddRow').addEventListener('click',addRow);
  editor.querySelector('#graphRelationRows').addEventListener('click',ev=>{const b=ev.target.closest('[data-remove-relation-row]');if(!b)return;const rows=editor.querySelectorAll('.batch-relation-row');if(rows.length===1){rows[0].querySelector('.batch-object').value='';rows[0].querySelector('.batch-predicate').selectedIndex=0}else b.closest('.batch-relation-row').remove()});
  editor.querySelector('#graphAddRelation').addEventListener('click',()=>{
   const subject=$('#graphSubject').value,evidence=$('#graphEvidence').value.trim();
   const rows=[...editor.querySelectorAll('.batch-relation-row')].map(row=>({predicate:row.querySelector('.batch-predicate').value,object:row.querySelector('.batch-object').value})).filter(row=>row.object);
   if(!subject)return alert('Selecione uma entidade de origem.');
   if(!rows.length)return alert('Adicione pelo menos uma entidade relacionada.');
   if(rows.some(row=>row.object===subject))return alert('A entidade de origem não pode ser relacionada a ela mesma.');
   if(new Set(rows.map(row=>row.predicate+'|'+row.object)).size!==rows.length)return alert('Há ligações repetidas. Remova as duplicadas antes de continuar.');
   const sourceId=state.entities.find(e=>e.id===subject)?.source_id||'';
   rows.forEach(row=>state.relations.push({id:id(),subject,predicate:row.predicate,object:row.object,evidence,source_id:sourceId,status:'Pendente',created_at:new Date().toISOString()}));
   if(saveState()){editor.querySelector('#graphEvidence').value='';editor.querySelector('#graphRelationRows').innerHTML='';addRow();render()}
  });
  editor.addEventListener('click',ev=>{
   const button=ev.target.closest('[data-graph-action]');if(!button)return;
   const relation=state.relations.find(r=>r.id===button.dataset.id);if(!relation)return;
   if(button.dataset.graphAction==='validate')relation.status='Validada';
   if(button.dataset.graphAction==='delete'){if(!confirm('Excluir esta relação?'))return;state.relations=state.relations.filter(r=>r.id!==relation.id)}
   saveState();render();
  });
  addRow();editor.dataset.initialized='true';
 }
 const valid=state.entities.filter(e=>e.status==='Validada');
 const opts='<option value="">Selecione uma entidade validada</option>'+valid.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' · '+esc(e.type)+'</option>').join('');
 const subject=$('#graphSubject'),sv=subject.value;subject.innerHTML=opts;subject.value=valid.some(e=>e.id===sv)?sv:'';
 editor.querySelectorAll('.batch-object').forEach(select=>{const value=select.value;select.innerHTML='<option value="">Selecione a entidade</option>'+valid.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+' · '+esc(e.type)+'</option>').join('');select.value=valid.some(e=>e.id===value)?value:''});
 const list=$('#graphRelationList');
 list.innerHTML=state.relations.length?'<h3>Relações registradas ('+state.relations.length+')</h3>'+state.relations.slice().reverse().map(r=>{const a=state.entities.find(e=>e.id===r.subject),b=state.entities.find(e=>e.id===r.object);return '<article class="sourceitem graph-relation-item"><div class="relation-compact"><b>'+esc(a?.name||'Entidade indisponível')+'</b> <span class="tag">'+esc(r.predicate)+'</span> <b>'+esc(b?.name||'Entidade indisponível')+'</b><span class="tag '+(r.status==='Validada'?'valid':'pending')+'">'+esc(r.status||'Pendente')+'</span></div><details class="relation-details"><summary>Ver evidência e ações</summary><small>'+esc(r.evidence||'Sem justificativa informada')+'</small><div class="rowactions">'+(r.status==='Validada'?'':'<button class="mini" data-graph-action="validate" data-id="'+esc(r.id)+'">Validar relação</button>')+'<button class="mini" data-graph-action="delete" data-id="'+esc(r.id)+'">Excluir</button></div></details></article>'}).join(''):'<p class="hint">Nenhuma relação cadastrada. Registre uma ou mais ligações acima.</p>';
 if(!valid.length)list.insertAdjacentHTML('afterbegin','<div class="notice">Ainda não há entidades validadas. Vá ao módulo Identificação, valide pelo menos duas entidades e volte aqui para conectá-las.</div>');
}
function drawGraph(){
 const host=$('#graphView');if(!host)return;
 // Somente entidades validadas entram no grafo. Relações precisam ligar dois nós validados.
 const all=state.entities.filter(n=>n.status==='Validada').map(n=>({...n}));
 const byId=new Map(all.map(n=>[n.id,n]));
 const relations=state.relations.filter(e=>e.status==='Validada'&&byId.has(e.subject)&&byId.has(e.object));
 const degree=new Map(all.map(n=>[n.id,0]));
 relations.forEach(r=>{degree.set(r.subject,(degree.get(r.subject)||0)+1);degree.set(r.object,(degree.get(r.object)||0)+1)});
 const maxDegree=Math.max(1,...degree.values());
 const nodeRadius=n=>{const d=degree.get(n.id)||0;return 9+Math.sqrt(d/maxDegree)*25};
 const colors={'Pessoa':'#3478a5','Organização':'#287e76','Grupo':'#568b67','Família':'#9874a8','Local':'#c28b43','Evento':'#b65e62','Data':'#82909e','Atividade':'#4e8caa','Thing':'#9b8650','Record':'#596b9c','Representação digital':'#708b91'};
 if(!all.length||!relations.length){host.innerHTML='<div class="graph-empty"><b>Nenhuma entidade validada com relações</b><span>O grafo exibirá somente entidades validadas que tenham pelo menos uma ligação registrada.</span></div>';return}
 if(!window.d3){host.innerHTML='<div class="graph-empty">A biblioteca de visualização não carregou. Atualize a página.</div>';return}
 const width=Math.max(1100,host.clientWidth||1100),height=Math.max(680,Math.min(980,Math.round(width*.58)));
 host.innerHTML='<div class="graph-toolbar"><div class="graph-legend">'+Object.entries(colors).map(([k,v])=>'<span><i style="background:'+v+'"></i>'+esc(k)+'</span>').join('')+'</div><div class="graph-controls"><button class="mini" id="graphZoomIn">＋</button><button class="mini" id="graphZoomOut">−</button><button class="mini" id="graphReset">Visão inicial</button><button class="mini" id="graphShowAll">Mostrar tudo</button></div></div><div class="graph-stage"><svg id="relationSvg" viewBox="0 0 '+width+' '+height+'"></svg></div><div class="graph-detail" id="graphDetail">Clique em uma entidade para abrir suas conexões. Clique novamente para avançar para o próximo nível de relações.</div><p class="hint graph-count" id="graphCount"></p>';
 const svg=d3.select('#relationSvg'),root=svg.append('g'),zoom=d3.zoom().scaleExtent([.2,3]).on('zoom',ev=>root.attr('transform',ev.transform));svg.call(zoom);
 const connectedIds=new Set();relations.forEach(r=>{connectedIds.add(r.subject);connectedIds.add(r.object)});
 // Começa com um núcleo pequeno, sem despejar todas as entidades na tela.
 const initial=all.filter(n=>connectedIds.has(n.id)).sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)).slice(0,Math.min(18,connectedIds.size));
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
  nodeSel=nodeLayer.selectAll('g').data(shown,d=>d.id).join(enter=>{const g=enter.append('g').attr('class','graph-node').style('cursor','pointer');g.append('circle').attr('r',d=>nodeRadius(d)).attr('fill',d=>colors[d.type]||'#647b8b').attr('stroke','#fff').attr('stroke-width',2);g.append('text').attr('x',12).attr('y',4).attr('font-size',13).attr('fill','#f1f5fb').attr('paint-order','stroke').attr('stroke','#06142f').attr('stroke-width',4).attr('stroke-linejoin','round').text(d=>d.name.length>32?d.name.slice(0,30)+'…':d.name);g.append('title').text(d=>d.name+' · '+d.type);return g;});
  nodeSel.classed('expanded',d=>expanded.has(d.id)).on('click',(ev,d)=>{ev.stopPropagation();expandNode(d)}).call(d3.drag().on('start',(ev,d)=>{if(!ev.active)simulation.alphaTarget(.25).restart();d.fx=d.x;d.fy=d.y}).on('drag',(ev,d)=>{d.fx=ev.x;d.fy=ev.y}).on('end',(ev,d)=>{if(!ev.active)simulation.alphaTarget(0);d.fx=null;d.fy=null}));
  simulation.nodes(shown).on('tick',()=>{linkSel.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);nodeSel.attr('transform',d=>'translate('+d.x+','+d.y+')')});
  simulation.force('link').links(links);simulation.alpha(.8).restart();
  $('#graphCount').textContent=visible.size+' de '+all.length+' entidades validadas com ligações · '+links.length+' relações exibidas · tamanho do nó proporcional ao número de ligações';
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
 $('#graphShowAll').onclick=()=>{all.filter(n=>connectedIds.has(n.id)).forEach(n=>visible.add(n.id));update();$('#graphDetail').textContent='Todas as entidades validadas que possuem ligações estão visíveis.'};
 update();
}
$('#saveDescription').onclick=()=>{const title=$('#descTitle').value.trim();if(!title)return alert('Informe o título da descrição.');state.descriptions=state.descriptions||[];state.descriptions.push({id:id(),entity_id:$('#descEntity').value,level:$('#descLevel').value,title,date:$('#descDate').value,scope:$('#descScope').value,history:$('#descHistory').value,notes:$('#descNotes').value,status:'Rascunho',created_at:new Date().toISOString()});['descTitle','descDate','descScope','descHistory','descNotes'].forEach(k=>$('#'+k).value='');saveState();render()};
$('#addNote').onclick=()=>{const text=$('#noteText').value.trim();if(!text)return alert('Escreva a nota.');state.notes.push({id:id(),source_id:$('#noteSource').value,text,status:'Aberta',created_at:new Date().toISOString()});$('#noteText').value='';saveState();render()};

// Renderização inicial dos módulos complementares após a extensão do render principal.
render();


/* WORKSPACE 5 MODULOS — camada integrada sobre o modelo local existente */
(function(){
 const navHost=document.querySelector('.sidebar .navlabel');
 const main=document.querySelector('main');
 if(!navHost||!main)return;
 const modules=[
  ['identify','01','Identificação','Quem, o quê, onde e quando'],
  ['omeka','02','Descrição Omeka S','Preparar itens e metadados'],
  ['riccm','03','Descrição RiC-CM 1.0','Campos e correspondências'],
  ['relation-manager','04','Cadastro de relações','Registrar e validar conexões'],
  ['graph','05','Grafo de relações','Visualização da rede']
 ];
 const nav=document.createElement('div');nav.className='module-nav';
 nav.innerHTML='<div class="navlabel">MÓDULOS PRINCIPAIS</div>'+modules.map(m=>'<button class="nav module-link" data-page="'+m[0]+'"><span class="module-num">'+m[1]+'</span><span>'+m[2]+'</span></button>').join('');
 navHost.insertAdjacentElement('afterend',nav);
 nav.querySelectorAll('.nav[data-page]').forEach(button=>button.addEventListener('click',()=>page(button.dataset.page)));
 const insertBefore=document.querySelector('#overview');
 const section=(id,html)=>{const s=document.createElement('section');s.id=id;s.className='page';s.innerHTML=html;insertBefore.insertAdjacentElement('beforebegin',s)};
 section('relation-manager','<div class="toolbar"><div><h2>Cadastro de relações</h2><p>Registre vínculos entre entidades validadas e documente as evidências.</p></div></div><div id="graphRelationEditor" class="panel graph-editor"></div>');
 section('identify',`
 <div class="toolbar"><div><h2>Identificação de entidades</h2><p>Importe livros, documentos ou imagens. O sistema localiza menções e apresenta evidências para revisão.</p></div><button class="btn primary" id="identifyUpload">＋ Adicionar fonte</button></div>
 <div class="module-note"><b>Como interpretar os resultados</b><p>São candidatos encontrados no texto, não fatos confirmados. A identificação de pessoas, organizações e eventos exige validação contextual. PDF digitalizado e fotografia dependem de OCR.</p></div>
 <div class="panel"><div class="panelhead"><div><h3>Adicionar livro, documento ou fotografia</h3><p>DOCX, PDF e imagens · processamento no navegador</p></div></div><div class="photo-actions"><button class="btn primary" type="button" id="takePhoto">▣ Tirar foto com a câmera</button><button class="btn ghost" type="button" id="choosePhoto">＋ Escolher da galeria</button><button class="btn ghost" type="button" id="chooseDocument">Selecionar documento</button></div><input id="moduleCamera" type="file" accept="image/*" capture="environment" hidden><label class="drop" for="moduleFile"><div class="uploadicon">↑</div><b>Ou selecione / arraste um arquivo</b><span>DOCX, PDF pesquisável, JPG, PNG, WEBP ou TIFF</span><input id="moduleFile" type="file" accept=".docx,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff"></label><div id="moduleMsg" class="message" role="status" aria-live="polite"></div><div id="processPanel" class="process-panel" hidden><div class="process-top"><b id="processStage">Aguardando arquivo</b><strong id="processPercent">0%</strong></div><div class="process-track"><div id="processBar" class="process-bar"></div></div><p id="processDetail">O andamento será exibido aqui.</p><a id="downloadOcrPdf" class="btn ghost" hidden download>↓ Baixar PDF pesquisável</a></div><p class="hint">A foto é processada no próprio navegador. O OCR reconhece textos; não identifica automaticamente pessoas ou objetos.</p></div>
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
 section('omeka',`
 <div class="toolbar"><div><h2>Descrição Omeka S</h2><p>Prepare itens e metadados seguindo a lógica de Values, Resource Template, Class, Item Sets e Media do Omeka S.</p></div></div>
 <div class="module-note"><b>Como funciona</b><p>Selecione uma fonte já analisada. O sistema propõe campos Dublin Core e uma classe inicial com base no texto disponível. Cada valor é editável; sugestões não confirmam autoria, identidade, data ou relações. A análise visual avançada de imagens não está incluída nesta versão.</p></div>
 <div class="panel"><h3>1. Fonte para descrição</h3><div class="relationform"><label class="wide">Documento ou fotografia analisada<select id="omSource"><option value="">Selecione uma fonte importada</option></select></label><button class="btn primary" id="omGenerate">Gerar campos sugeridos</button></div><p class="hint">Para imagens, as sugestões dependem do texto reconhecido pelo OCR e do nome do arquivo. Uma fotografia sem texto não será interpretada visualmente.</p></div>
 <div class="panel"><div class="panelhead"><div><h3>2. Estrutura do item</h3><p>Campos administrativos e de organização do Omeka S.</p></div><span class="tag">Rascunho editável</span></div><div class="relationform">
 <label>Título do item<input id="omTitle" placeholder="Título do recurso"></label>
 <label>Modelo de recurso<input id="omTemplate" placeholder="Nome do modelo existente no Omeka S"></label>
 <label>Classe<select id="omClass"><option value="">Não definida</option><option>foaf:Person · Person</option><option>foaf:Organization · Organization</option><option>dcterms:Location · Place</option><option> bibo:Event · Event</option><option>dctype:Text · Text</option><option>dctype:StillImage · Still Image</option><option>dctype:PhysicalObject · Physical Object</option></select></label>
 <label>Conjunto de itens<input id="omItemSet" placeholder="Nome do Item Set no Omeka S"></label>
 <label>Visibilidade<select id="omVisibility"><option value="public">Público</option><option value="private">Privado</option></select></label>
 <label>Idioma<select id="omLanguage"><option value="pt-BR">Português (pt-BR)</option><option value="pt">Português (pt)</option><option value="und">Não identificado (und)</option></select></label>
 </div></div>
 <div class="panel"><div class="panelhead"><div><h3>3. Propriedades / valores</h3><p>Propriedades iniciais do Dublin Core. Você pode corrigir valores, apagar campos ou acrescentar propriedades.</p></div><button class="btn ghost" id="omAddField">＋ Adicionar propriedade</button></div><div id="omFields" class="om-fields"><p class="empty">Selecione uma fonte e gere os campos.</p></div></div>
 <div class="panel"><h3>4. Mídias do item</h3><p>Anexe a imagem, TIFF, PDF ou arquivo original para manter a relação entre o item intelectual e sua representação digital.</p><label class="drop" for="omMedia"><b>Selecionar arquivo de mídia</b><span>O arquivo fica apenas nesta sessão para referência; esta versão não o envia ao Omeka S.</span><input id="omMedia" type="file" accept="image/*,.tif,.tiff,.pdf,.doc,.docx"></label><div id="omMediaName" class="message"></div></div>
 <div class="panel"><div class="rowactions"><button class="btn primary" id="omSave">Salvar rascunho Omeka S</button><button class="btn ghost" id="omExport">Exportar ficha JSON</button></div><p class="hint">O rascunho fica no armazenamento local do navegador. Não cria o item diretamente no Omeka S; para isso seria necessária integração com a API e credenciais do Omeka.</p></div>
 <div class="panel"><h3>Rascunhos preparados</h3><div id="omDraftList" class="empty">Nenhum rascunho Omeka S.</div></div>`);
 // Atalhos de navegação e compatibilidade com as páginas antigas.
 const oldPage=page;
 window.page=function(id){oldPage(id);const titles={identify:'Identificação',riccm:'Descrição RiC-CM 1.0',graph:'Grafo de relações',omeka:'Descrição Omeka S'};if(titles[id])document.querySelector('#pagetitle').textContent=titles[id]};
 document.querySelectorAll('.module-link').forEach(b=>b.addEventListener('click',()=>window.page(b.dataset.page)));
 // Preparação de metadados para Omeka S: sugestões locais, editáveis e rastreáveis.
 const omBaseProps=[
  ['dcterms:title','Título'],['dcterms:description','Descrição'],['dcterms:creator','Criador'],['dcterms:contributor','Colaborador'],['dcterms:date','Data'],['dcterms:subject','Assunto'],['dcterms:spatial','Cobertura espacial'],['dcterms:type','Tipo'],['dcterms:identifier','Identificador'],['dcterms:publisher','Editor / entidade publicadora'],['dcterms:source','Fonte'],['dcterms:language','Idioma'],['dcterms:format','Formato'],['dcterms:rights','Direitos'],['dcterms:relation','Relação']
 ];
 let omCurrentSource=null, omMediaFile=null;
 const omField=(prop,label,value='',origin='Não identificado')=>({id:id(),prop,label,value,origin});
 function omRenderFields(fields){
  $('#omFields').innerHTML=fields.map((f,i)=>'<div class="om-field" data-om-field="'+esc(f.id)+'"><div class="om-field-head"><b>'+esc(f.label)+'</b><code>'+esc(f.prop)+'</code><button class="mini" data-om-remove="'+esc(f.id)+'">Remover</button></div><label>Valor<textarea data-om-value="'+esc(f.id)+'" rows="2">'+esc(f.value)+'</textarea></label><small>Origem: '+esc(f.origin)+'</small></div>').join('')||'<p class="empty">Nenhuma propriedade adicionada.</p>';
  $('#omFields').querySelectorAll('[data-om-value]').forEach(el=>el.oninput=()=>{const f=(state.omekaCurrentFields||[]).find(x=>x.id===el.dataset.omValue);if(f)f.value=el.value});
  $('#omFields').querySelectorAll('[data-om-remove]').forEach(el=>el.onclick=()=>{state.omekaCurrentFields=(state.omekaCurrentFields||[]).filter(x=>x.id!==el.dataset.omRemove);omRenderFields(state.omekaCurrentFields)});
 }
 function omFillSourceOptions(){
  const el=$('#omSource');if(!el)return;const selected=el.value;
  el.innerHTML='<option value="">Selecione uma fonte importada</option>'+state.sources.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.title||s.filename)+'</option>').join('');
  if(state.sources.some(s=>s.id===selected))el.value=selected;
 }
 function omSuggest(){
  const sid=$('#omSource').value,src=state.sources.find(s=>s.id===sid);if(!src)return alert('Selecione uma fonte analisada.');
  omCurrentSource=src;const text=src.text||'',filename=src.filename||src.title||'';
  $('#omTitle').value=src.title||filename.replace(/\.[^.]+$/,'');
  $('#omTemplate').value='';
  const isImage=/\.(jpe?g|png|webp)$/i.test(filename);
  let cls='';if(isImage)cls='dctype:StillImage · Still Image';else if(/\.(pdf|docx?|txt)$/i.test(filename))cls='dctype:Text · Text';
  $('#omClass').value=cls;
  const dateMatches=[...text.matchAll(/\b(?:18|19|20)\d{2}(?:[-/]\d{1,2}(?:[-/]\d{1,2})?)?\b/g)].map(m=>m[0]);
  const uniqueDates=[...new Set(dateMatches)].slice(0,8);
  const terms=(state.entities||[]).filter(e=>e.source_id===sid).map(e=>e.name);
  const subject=[...new Set(terms)].slice(0,12);
  const fields=[
   omField('dcterms:title','Título',src.title||filename,'Nome do arquivo/fonte; revisar'),
   omField('dcterms:description','Descrição',text.slice(0,1200),'Trecho inicial do texto extraído; resumir e revisar'),
   omField('dcterms:date','Data',uniqueDates.join('; '),'Datas encontradas no texto; contexto não confirmado'),
   omField('dcterms:subject','Assunto',subject.join('; '),'Menções candidatas extraídas; não são assuntos confirmados'),
   omField('dcterms:language','Idioma',text?'pt':'','Idioma presumido pelo contexto de OCR/texto; conferir'),
   omField('dcterms:format','Formato',filename.split('.').pop()?.toUpperCase()||'','Extensão do arquivo'),
   omField('dcterms:identifier','','','Não identificado'),
   omField('dcterms:creator','Criador','','Não identificado; não inferir autoria'),
   omField('dcterms:contributor','Colaborador','','Não identificado'),
   omField('dcterms:spatial','Cobertura espacial','','Não identificado; validar local em fonte'),
   omField('dcterms:type','Tipo',isImage?'Imagem':'Texto/documento','Sugestão pela extensão do arquivo'),
   omField('dcterms:publisher','Editor / entidade publicadora','','Não identificado'),
   omField('dcterms:rights','Direitos','','Não identificado; verificar titularidade e licença'),
   omField('dcterms:source','Fonte',filename,'Arquivo analisado'),
   omField('dcterms:relation','Relação','','Adicionar somente após confirmar vínculo com outro item')
  ];
  state.omSourceId=sid;state.omekaCurrentFields=fields;omRenderFields(fields);
  $('#omMediaName').textContent='Fonte analisada: '+filename+(isImage?' · imagem sem interpretação visual; somente OCR/texto disponível.':'');
 }
 $('#omGenerate').onclick=omSuggest;
 $('#omSource').onchange=()=>{omCurrentSource=null};
 $('#omAddField').onclick=()=>{const prop=prompt('Informe a propriedade (ex.: dcterms:extent):');if(!prop)return;const label=prompt('Rótulo do campo:',prop);state.omekaCurrentFields=state.omekaCurrentFields||[];state.omekaCurrentFields.push(omField(prop.trim(),label||prop.trim(),'','Adicionado manualmente'));omRenderFields(state.omekaCurrentFields)};
 $('#omMedia').onchange=ev=>{omMediaFile=ev.target.files[0]||null;$('#omMediaName').textContent=omMediaFile?'Arquivo selecionado: '+omMediaFile.name+' · '+Math.round(omMediaFile.size/1024)+' KB (não enviado ao servidor).':''};
 function omBuildDraft(){
  const src=state.sources.find(s=>s.id===$('#omSource').value)||omCurrentSource;
  return {id:id(),source_id:src?.id||'',source_filename:src?.filename||'',title:$('#omTitle').value,resource_template:$('#omTemplate').value,resource_class:$('#omClass').value,item_set:$('#omItemSet').value,visibility:$('#omVisibility').value,language:$('#omLanguage').value,properties:(state.omekaCurrentFields||[]).map(f=>({...f})),media_filename:omMediaFile?.name||'',media_note:omMediaFile?'Arquivo selecionado localmente; não incorporado no backup nem enviado ao Omeka S.':'',status:'Rascunho para revisão',created_at:new Date().toISOString()};
 }
 $('#omSave').onclick=()=>{if(!$('#omTitle').value.trim())return alert('Informe o título do item.');state.omekaDrafts=state.omekaDrafts||[];const d=omBuildDraft();state.omekaDrafts.push(d);if(saveState()){omRenderDrafts();alert('Rascunho Omeka S salvo localmente.')}};
 $('#omExport').onclick=()=>download('omeka-s-item-'+Date.now()+'.json',JSON.stringify(omBuildDraft(),null,2));
 function omRenderDrafts(){const list=state.omekaDrafts||[];$('#omDraftList').innerHTML=list.length?list.slice().reverse().map(d=>'<article class="sourceitem"><div><b>'+esc(d.title)+'</b><small>'+esc(d.resource_class||'Classe não definida')+' · '+esc(d.status)+' · '+new Date(d.created_at).toLocaleDateString('pt-BR')+'</small><p>'+d.properties.length+' propriedades · '+esc(d.source_filename)+'</p></div></article>').join(''):'Nenhum rascunho Omeka S.'}
 omFillSourceOptions();omRenderDrafts();
 $('#identifyUpload').onclick=()=>$('#moduleFile').click();
 $('#homeCamera').onclick=()=>{window.page('identify');$('#moduleCamera').click()};
 $('#homeTiff').onclick=()=>{window.page('identify');$('#moduleFile').accept='.tif,.tiff';$('#moduleFile').click();$('#moduleFile').accept='.docx,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff'};
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
  $('#identifyResults').innerHTML=latest.length?latest.map(e=>'<div class="sourceitem"><div><b>'+esc(e.name)+'</b><small>'+esc(e.type)+' · '+esc(e.status)+' · '+esc(e.confidence)+'</small><p class="excerpt">'+highlightText(e.source_excerpt||'',[e.name])+'</p></div><span class="tag">'+esc(e.status)+'</span></div>').join(''):'Nenhuma identificação disponível.';
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
 const showProcess=(stage,pct,detail='')=>{const p=$('#processPanel');if(!p)return;p.hidden=false;$('#processStage').textContent=stage;$('#processPercent').textContent=Math.round(pct)+'%';$('#processBar').style.width=Math.max(0,Math.min(100,pct))+'%';$('#processDetail').textContent=detail};
 let convertedPdfUrl=null;
 const processTiff=async f=>{
  if(!window.UTIF)throw Error('Biblioteca TIFF não carregou. Recarregue a página.');
  if(!window.Tesseract)throw Error('Biblioteca OCR não carregou. Recarregue a página.');
  const PDF=window.jspdf?.jsPDF;if(!PDF)throw Error('Biblioteca de geração de PDF não carregou. Recarregue a página.');
  showProcess('Etapa 1 de 4 · Lendo estrutura do TIFF',3,'Abrindo arquivo e identificando páginas…');
  const buffer=await f.arrayBuffer(),pages=UTIF.decode(buffer);if(!pages?.length)throw Error('Não foi possível decodificar este TIFF.');
  const doc=new PDF({orientation:'portrait',unit:'pt',format:'a4',compress:true});let blocks=[],ocrPages=[];
  for(let index=0;index<pages.length;index++){
   const pg=pages[index];showProcess('Etapa 2 de 4 · Preparando página '+(index+1)+' de '+pages.length,5+index/pages.length*5,'Decodificando imagem TIFF…');
   UTIF.decodeImage(buffer,pg);const rgba=UTIF.toRGBA8(pg),canvas=document.createElement('canvas');canvas.width=pg.width;canvas.height=pg.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true}),pixels=ctx.createImageData(pg.width,pg.height);pixels.data.set(rgba);ctx.putImageData(pixels,0,0);
   showProcess('Etapa 3 de 4 · OCR da página '+(index+1)+' de '+pages.length,10+index/pages.length*65,'Reconhecendo texto em português…');
   const result=await Tesseract.recognize(canvas,'por',{logger:m=>{if(m.status==='recognizing text'){const pct=10+((index+(m.progress||0))/pages.length)*65;showProcess('Etapa 3 de 4 · OCR da página '+(index+1)+' de '+pages.length,pct,'Reconhecimento de texto em português…')}}});
   const pageText=(result.data.text||'').trim();ocrPages.push(pageText);if(pageText)blocks.push('[Página '+(index+1)+'] '+pageText);
   if(index>0)doc.addPage('a4','portrait');
   const pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight(),scale=Math.min(pageW/pg.width,pageH/pg.height),w=pg.width*scale,h=pg.height*scale,x=(pageW-w)/2,y=(pageH-h)/2;
   const image=canvas.toDataURL('image/jpeg',0.92);doc.addImage(image,'JPEG',x,y,w,h,undefined,'FAST');
   // Camada textual invisível, alinhada às caixas reconhecidas pelo OCR.
   doc.internal.write('3 Tr');
   doc.setTextColor(0,0,0);
   for(const word of (result.data.words||[])){const value=(word.text||'').trim();if(!value||!word.bbox)continue;const bx=x+word.bbox.x0*scale,by=y+word.bbox.y1*scale,font=Math.max(3,(word.bbox.y1-word.bbox.y0)*scale*.82);doc.setFontSize(font);doc.text(value,bx,by,{renderingMode:'invisible',maxWidth:Math.max(4,(word.bbox.x1-word.bbox.x0)*scale*1.5)});}
   doc.internal.write('0 Tr');
   canvas.width=1;canvas.height=1;
  }
  showProcess('Etapa 4 de 4 · Gerando PDF pesquisável',82,'Montando PDF com imagens e camada de texto OCR…');
  const blob=doc.output('blob');convertedPdfUrl=URL.createObjectURL(blob);
  const link=$('#downloadOcrPdf');link.href=convertedPdfUrl;link.download=f.name.replace(/\\.(tif|tiff)$/i,'')+'-ocr.pdf';link.hidden=false;
  return {blocks,pages:pages.length};
 };
 const processModuleFile=async f=>{if(!f)return;const msg=$('#moduleMsg');msg.textContent='Iniciando processamento…';$('#downloadOcrPdf').hidden=true;showProcess('Preparando arquivo',1,'O arquivo será processado localmente neste navegador.');
 try{
  const ext=f.name.split('.').pop().toLowerCase();let blocks=[],tiffPages=0;
  if(['tif','tiff'].includes(ext)){const result=await processTiff(f);blocks=result.blocks;tiffPages=result.pages}
  else if(['jpg','jpeg','png','webp'].includes(ext)){if(!window.Tesseract)throw Error('Biblioteca OCR não carregou. Recarregue a página.');showProcess('Etapa 1 de 3 · Preparando imagem',8,'Abrindo imagem…');const result=await Tesseract.recognize(f,'por',{logger:m=>{if(m.status==='recognizing text')showProcess('Etapa 2 de 3 · OCR da imagem',15+(m.progress||0)*65,'Reconhecendo texto em português…')}});const text=result.data.text.trim();blocks=text?text.split(/\\n+/).map(x=>x.trim()).filter(Boolean):[]}
  else {showProcess('Etapa 1 de 2 · Lendo documento',20,'Extraindo texto do arquivo…');blocks=await readFile(f)}
  showProcess('Analisando documento · identificando menções',92,'Extraindo candidatos de pessoas, organizações, locais, eventos e datas…');
  const text=blocks.join('\\n'),sid=id(),entities=extractEntities(text,sid);
  const source={id:sid,filename:f.name,title:f.name.replace(/\\.[^.]+$/,''),kind:'Documento analisado',text,blocks,entity_count:entities.length,created_at:new Date().toLocaleString('pt-BR'),ocr:['jpg','jpeg','png','webp','tif','tiff'].includes(ext),original_format:ext,derived_pdf:ext==='tif'||ext==='tiff'?'PDF pesquisável gerado':''};
  state.sources.push(source);state.entities.push(...entities);
  if(saveState()){render();renderWorkspace();omFillSourceOptions();showProcess('Concluído · conversão e análise finalizadas',100,(tiffPages?tiffPages+' páginas convertidas para PDF. ':'')+blocks.length+' blocos de texto e '+entities.length+' menções candidatas encontradas.');msg.textContent=blocks.length?'Documento analisado. Confira as menções candidatas abaixo.':'Arquivo convertido, mas o OCR não encontrou texto legível. A imagem foi preservada no PDF; será necessária revisão manual.'}
 }catch(err){showProcess('Processamento interrompido',0,err.message);msg.textContent=err.message}};

 $('#moduleFile').onchange=ev=>{processModuleFile(ev.target.files[0]);ev.target.value=''};
 $('#moduleCamera').onchange=ev=>{processModuleFile(ev.target.files[0]);ev.target.value=''};
 $('#takePhoto').onclick=()=>$('#moduleCamera').click();
 $('#choosePhoto').onclick=()=>$('#moduleFile').click();
 $('#chooseDocument').onclick=()=>{$('#moduleFile').accept='.docx,.pdf';$('#moduleFile').click();$('#moduleFile').accept='.docx,.pdf,.jpg,.jpeg,.png,.webp'};
 // Acrescenta tipos de entidade sem alterar os registros antigos.
 const oldExtract=extractEntities;
 // Os candidatos de tipos ampliados são identificados por vocabulário contextual.
 const expandedTerms=[['Grupo',['Deixa Falar','União Faz a Força','União das Cores']],['Família',[]],['Atividade',['desfile','composição','gravação','ensaio','fundação','organização']],['Thing',['samba','partitura','fotografia','disco','gravação']],['Record',['ata','estatuto','programa','cartaz','fotografia','documento']]];
 const oldRead=readFile;
 // Atualiza contadores e fichas sempre que os módulos antigos renderizarem.
 const originalRender=render;render=function(){originalRender();renderWorkspace()};
 renderWorkspace();
})();

// Zera os dados locais deste aplicativo. A ação não pode ser desfeita.
const resetButton=$('#resetApp');
if(resetButton)resetButton.onclick=()=>{
 if(!confirm('ATENÇÃO: isso apagará fontes, entidades, relações, descrições, notas e a base de conhecimento deste navegador. Exporte um backup antes. Deseja continuar?'))return;
 if(!confirm('Confirma definitivamente apagar todos os dados locais do Sistema RiC?'))return;
 localStorage.removeItem(KEY);
 localStorage.removeItem('ric_knowledge_local_v1');
 state=emptyState();
 saveState();
 alert('Aplicativo zerado. A página será recarregada.');
 location.reload();
};

/* Instalação como aplicativo (PWA) e cache básico da interface */
let pendingInstallPrompt=null;
const installButton=document.querySelector('#installApp');
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(installButton&&!isStandalone)installButton.hidden=false;
window.addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();pendingInstallPrompt=ev;if(installButton){installButton.hidden=false;installButton.textContent='Instalar aplicativo'}});
window.addEventListener('appinstalled',()=>{pendingInstallPrompt=null;if(installButton){installButton.hidden=true}});
if(installButton)installButton.addEventListener('click',async()=>{
 if(pendingInstallPrompt){pendingInstallPrompt.prompt();const choice=await pendingInstallPrompt.userChoice;if(choice?.outcome==='accepted')installButton.hidden=true;pendingInstallPrompt=null;return}
 const ua=navigator.userAgent||'',isAppleMobile=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(isAppleMobile){alert('Para instalar no iPad/iPhone: abra este site no Safari, toque em Compartilhar (quadrado com seta para cima), role as opções e escolha “Adicionar à Tela de Início”. Confirme em “Adicionar”. Se estiver usando Chrome ou outro navegador, abra o endereço no Safari.');return}
 alert('Para instalar no tablet Android: abra este site no Chrome, toque no menu ⋮ e escolha “Instalar app”. Se essa opção não aparecer, escolha “Adicionar à tela inicial”. Confirme a instalação. Use o Chrome atualizado e acesse o site por HTTPS.');
});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
 window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('Service worker não registrado:',err)));
}


/* Acesso separado: administrador e consulta pública. */
(function(){
 const gate=$('#authGate'),form=$('#adminLoginForm'),email=$('#adminEmail'),password=$('#adminPassword'),msg=$('#authMessage'),status=$('#cloudStatus'),login=$('#adminLoginButton'),logout=$('#logoutAdmin'),visitorBtn=$('#visitorAccessButton'),visitor=$('#visitorView');
 let started=false,manualVisitor=false,entities=[],relations=[];
 const message=(s,error=true)=>{msg.textContent=s;msg.classList.toggle('error',error)};
 const lock=s=>{document.body.classList.add('auth-required');document.body.classList.remove('auth-ready','visitor-ready');gate.hidden=false;visitor.hidden=true;$('.sidebar').hidden=false;$('main').hidden=false;if(status)status.textContent='● '+s;if(logout)logout.hidden=true};
 const admin=()=>{document.body.classList.remove('auth-required','auth-checking','visitor-ready');document.body.classList.add('auth-ready');gate.hidden=true;visitor.hidden=true;$('.sidebar').hidden=false;$('main').hidden=false;if(status)status.textContent='● ADMINISTRADOR · DADOS AINDA LOCAIS';if(logout)logout.hidden=false;message('Acesso administrativo confirmado. Os dados de trabalho continuam neste navegador; somente o grafo publicado será enviado ao Firestore.',false)};
 async function fetchPublic(){const f=window.RiCFirebase,a=f.dbApi,d=f.db;const [es,rs]=await Promise.all([a.getDocs(a.collection(d,'public_entities')),a.getDocs(a.collection(d,'public_relations'))]);entities=es.docs.map(x=>x.data()).filter(x=>x?.id&&x?.name);relations=rs.docs.map(x=>x.data()).filter(x=>x?.subject&&x?.object&&x?.predicate);renderPublic()}
 function visitorMode(){document.body.classList.remove('auth-required','auth-checking','auth-ready');document.body.classList.add('visitor-ready');gate.hidden=true;$('.sidebar').hidden=true;$('main').hidden=true;visitor.hidden=false;if(status)status.textContent='● CONSULTA PÚBLICA';if(logout)logout.hidden=true;fetchPublic().catch(e=>$('#visitorStatus').textContent='Falha ao carregar acervo público: '+(e.code||e.message))}
 function renderPublic(){
  const q=($('#publicSearch').value||'').toLocaleLowerCase('pt-BR'),shown=entities.filter(e=>!q||(e.name+' '+(e.type||'')).toLocaleLowerCase('pt-BR').includes(q)),byId=new Map(entities.map(e=>[e.id,e])),rels=relations.filter(r=>byId.has(r.subject)&&byId.has(r.object));
  $('#publicEntityCount').textContent=entities.length;$('#publicRelationCount').textContent=rels.length;
  $('#publicEntityList').innerHTML=shown.length?shown.map(e=>'<button class="public-entity" data-public-id="'+esc(e.id)+'"><b>'+esc(e.name)+'</b><span>'+esc(e.type||'Entidade')+'</span></button>').join(''):'<p class="public-empty">Nenhuma entidade corresponde à pesquisa.</p>';
  $('#publicRelationList').innerHTML=rels.length?rels.map(r=>'<article class="public-relation"><b>'+esc(byId.get(r.subject).name)+'</b><span>'+esc(r.predicate)+'</span><b>'+esc(byId.get(r.object).name)+'</b></article>').join(''):'<p class="public-empty">Ainda não há relações publicadas.</p>';
  $('#publicEntityList').querySelectorAll('[data-public-id]').forEach(b=>b.onclick=()=>{const e=byId.get(b.dataset.publicId),connected=rels.filter(r=>r.subject===e.id||r.object===e.id);$('#publicDetail').innerHTML='<b>'+esc(e.name)+'</b><span>'+esc(e.type||'Entidade')+'</span><p>'+connected.length+' relação(ões) publicada(s).</p>'+(connected.length?'<ul>'+connected.map(r=>'<li>'+esc(byId.get(r.subject).name)+' — '+esc(r.predicate)+' — '+esc(byId.get(r.object).name)+'</li>').join('')+'</ul>':'')});
  drawPublicGraph(entities,rels);$('#visitorStatus').textContent=entities.length?'Conteúdo publicado pelo administrador.':'O acervo público ainda não possui conteúdo. O administrador precisa validar e publicar entidades e relações.';
 }
 function drawPublicGraph(es,rs){
  const host=$('#publicGraph');if(!es.length||!rs.length){host.innerHTML='<div class="graph-empty"><b>Grafo ainda não disponível</b><span>Quando o administrador publicar entidades e relações validadas, a rede aparecerá aqui.</span></div>';return}
  if(!window.d3){host.textContent='Visualização indisponível.';return}
  const w=Math.max(320,host.clientWidth||900),h=Math.max(420,Math.min(680,Math.round(w*.58))),nodes=es.map(e=>({...e})),links=rs.map(r=>({source:r.subject,target:r.object,predicate:r.predicate}));
  host.innerHTML='<svg id="publicGraphSvg" viewBox="0 0 '+w+' '+h+'"></svg>';const svg=d3.select('#publicGraphSvg'),root=svg.append('g'),zoom=d3.zoom().scaleExtent([.25,3]).on('zoom',e=>root.attr('transform',e.transform));svg.call(zoom);
  const colors={Pessoa:'#65a9d0',Organização:'#59b99e',Grupo:'#8fc47b',Local:'#e6b56a',Evento:'#d98691',Data:'#a9b7c7'};
  const lines=root.append('g').selectAll('line').data(links).join('line').attr('stroke','#8ba6bd').attr('stroke-opacity',.55).attr('stroke-width',1.8);
  const node=root.append('g').selectAll('g').data(nodes).join('g').attr('class','public-node').style('cursor','pointer').call(d3.drag().on('start',(e,d)=>{if(!e.active)sim.alphaTarget(.2).restart();d.fx=d.x;d.fy=d.y}).on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null}));
  node.append('circle').attr('r',9).attr('fill',d=>colors[d.type]||'#9aaec1').attr('stroke','#fff').attr('stroke-width',1.5);node.append('text').attr('x',12).attr('y',4).attr('fill','#f3f7fc').attr('font-size',12).attr('paint-order','stroke').attr('stroke','#071a32').attr('stroke-width',4).text(d=>d.name.length>30?d.name.slice(0,28)+'…':d.name);node.append('title').text(d=>d.name+' · '+(d.type||'Entidade'));
  const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(115)).force('charge',d3.forceManyBody().strength(-260)).force('center',d3.forceCenter(w/2,h/2)).force('collide',d3.forceCollide(30));
  sim.on('tick',()=>{lines.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);node.attr('transform',d=>'translate('+d.x+','+d.y+')')});
  node.on('click',(ev,d)=>{const b=[...$('#publicEntityList').querySelectorAll('[data-public-id]')].find(x=>x.dataset.publicId===d.id);if(b)b.click()});
 }
 async function publish(){
  const f=window.RiCFirebase,a=f.dbApi,d=f.db,es=state.entities.filter(e=>e.status==='Validada'&&e.id&&e.name),ids=new Set(es.map(e=>e.id)),rs=state.relations.filter(r=>r.status==='Validada'&&ids.has(r.subject)&&ids.has(r.object));
  if(!es.length||!rs.length)throw Error('Valide entidades e pelo menos uma relação entre elas antes de publicar.');
  const oldE=await a.getDocs(a.collection(d,'public_entities')),oldR=await a.getDocs(a.collection(d,'public_relations'));
  for(const x of oldE.docs)await a.deleteDoc(x.ref);for(const x of oldR.docs)await a.deleteDoc(x.ref);
  for(const e of es)await a.setDoc(a.doc(d,'public_entities',e.id),{id:e.id,name:e.name,type:e.type||'Entidade',published_at:new Date().toISOString()});
  for(const r of rs)await a.setDoc(a.doc(d,'public_relations',r.id),{id:r.id,subject:r.subject,predicate:r.predicate,object:r.object});
  $('#publishStatus').textContent=es.length+' entidades e '+rs.length+' relações publicadas. Textos de fontes e evidências internas não foram enviados.';alert('Publicação concluída: '+es.length+' entidades e '+rs.length+' relações.');
 }
 $('#publishPublicGraph')?.addEventListener('click',async()=>{if(!confirm('Publicar somente entidades e relações validadas? O conteúdo público atual será substituído. Nenhum texto de documento ou evidência interna será enviado.'))return;const b=$('#publishPublicGraph');b.disabled=true;b.textContent='Publicando…';try{await publish()}catch(e){$('#publishStatus').textContent='Falha na publicação: '+(e.code||e.message)}finally{b.disabled=false;b.textContent='Publicar grafo para visitantes'}});
 $('#publicSearch')?.addEventListener('input',renderPublic);visitorBtn?.addEventListener('click',async()=>{
  const f=window.RiCFirebase;
  manualVisitor=true;
  try{if(f?.auth.currentUser)await f.authApi.signOut(f.auth);visitorMode()}
  catch(e){manualVisitor=false;message('Não foi possível abrir a consulta pública com segurança: '+(e.code||e.message),true)}
 });
 $('#visitorLogout')?.addEventListener('click',()=>{
  manualVisitor=false;lock('Acesso administrativo ou consulta pública');
  message('Você saiu da consulta pública. Escolha como deseja continuar.',false)
 });
 async function verifyAccess(u,f){
  if(!u){lock('Acesso administrativo ou consulta pública');message('Entre com uma conta autorizada ou acesse a consulta pública.',false);return false}
  lock('Verificando permissões');
  try{
   const ref=f.dbApi.doc(f.db,'users',u.uid);
   const p=await Promise.race([f.dbApi.getDoc(ref),new Promise((_,reject)=>setTimeout(()=>reject(new Error('A consulta ao perfil demorou mais de 12 segundos. Verifique a conexão e as regras do Firestore.')),12000))]);
   if(!p.exists()){message('Login realizado, mas o perfil users/'+u.uid+' não existe no Firestore. Crie ou confira esse documento.',true);return false}
   const v=p.data()||{};
   if(v.active!==true||!['admin','visitor'].includes(v.role)){
    message('Login realizado, mas o perfil não está autorizado. Valores encontrados: role='+String(v.role)+', active='+String(v.active)+'.',true);return false
   }
   if(v.role==='admin')admin();else visitorMode();
   return true
  }catch(e){
   lock('Falha ao verificar autorização');
   message('O Firebase autenticou sua conta, mas não conseguiu ler users/'+u.uid+'. Erro: '+(e.code||e.message),true);
   return false
  }
 }
 async function start(f){
  if(started)return;started=true;lock('Verificando sessão');
  f.authApi.onAuthStateChanged(f.auth,u=>{if(manualVisitor&&!u)return;verifyAccess(u,f)});
 }
 function connect(){
  if(window.RiCFirebase){start(window.RiCFirebase);return}
  if(window.RiCFirebaseError){lock('Firebase indisponível');message('Falha ao iniciar o Firebase. Recarregue a página.');return}
  window.addEventListener('ric-firebase-ready',()=>start(window.RiCFirebase),{once:true});
  window.addEventListener('ric-firebase-error',()=>{lock('Firebase indisponível');message('Não foi possível iniciar o Firebase.')},{once:true})
 }
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();manualVisitor=false;const f=window.RiCFirebase;
  if(!f){message('Aguarde a conexão com o Firebase.');return}
  login.disabled=true;login.textContent='Entrando…';message('Validando credenciais…',false);
  try{
   const credential=await f.authApi.signInWithEmailAndPassword(f.auth,email.value.trim(),password.value);
   password.value='';
   await verifyAccess(credential.user||f.auth.currentUser,f);
  }catch(e){
   const m={'auth/invalid-credential':'E-mail ou senha incorretos.','auth/user-not-found':'Não existe uma conta com esse e-mail.','auth/wrong-password':'Senha incorreta.','auth/too-many-requests':'Muitas tentativas. Aguarde.','auth/invalid-email':'E-mail inválido.'};
   message(m[e.code]||('Não foi possível entrar: '+(e.code||e.message)),true)
  }finally{login.disabled=false;login.textContent='Entrar'}
 });
 logout?.addEventListener('click',async()=>{if(window.RiCFirebase&&confirm('Deseja encerrar a sessão?'))await window.RiCFirebase.authApi.signOut(window.RiCFirebase.auth)});
})();
