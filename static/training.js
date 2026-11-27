/* Simulador Omeka S para treinamento. Dados isolados em localStorage próprio. */
(()=>{
 const KEY='ric_omeka_training_v2';
 const models=[
  {label:'Acervo',cls:'rico:RecordResource',fields:['dcterms:title','dcterms:description','rico:hasOrHadPart','rico:hasOrHadMember']},
  {label:'Acervo (Documento)',cls:'rico:Record',fields:['dcterms:title','dcterms:description','rico:recordResourceExtent','rico:hasOrHadSubject','rico:hasOrHadProducer','rico:hasOrHadCreationDate']},
  {label:'Acervo (Parte de documento)',cls:'rico:RecordPart',fields:['dcterms:title','dcterms:description','rico:isOrWasPartOf','rico:hasOrHadInstantiation']},
  {label:'Acervo (série de documentos)',cls:'rico:RecordSet',fields:['dcterms:title','dcterms:description','rico:recordSetType','rico:hasOrHadMember']},
  {label:'Coisa (Tema amplo do acervo)',cls:'rico:Thing',fields:['dcterms:title','dcterms:description','rico:thingType']},
  {label:'Instantiation',cls:'rico:Instantiation',fields:['dcterms:title','dcterms:description','rico:instantiationPhysicalCharacteristics','rico:hasOrHadCarrierType','rico:hasOrHadDigitalInstantiation']},
  {label:'Linguagem',cls:'rico:Language',fields:['dcterms:title','rico:languageType']},
  {label:'O Que (Atividade)',cls:'rico:Activity',fields:['dcterms:title','dcterms:description','rico:activityType','rico:activityDate']},
  {label:'O Que (Evento)',cls:'rico:Event',fields:['dcterms:title','dcterms:description','rico:eventType','rico:date']},
  {label:'Onde',cls:'rico:Place',fields:['dcterms:title','dcterms:description','rico:placeType','rico:geographicalCoordinates']},
  {label:'Quando',cls:'rico:Date',fields:['dcterms:title','rico:date','rico:dateType']},
  {label:'Quem (Agent)',cls:'rico:Agent',fields:['dcterms:title','dcterms:description','rico:occupationalHistory']},
  {label:'Quem (Família ou Grupo)',cls:'rico:Group',fields:['dcterms:title','dcterms:description','rico:groupType']},
  {label:'Quem (Organização)',cls:'rico:CorporateBody',fields:['dcterms:title','dcterms:description','rico:corporateBodyType']},
  {label:'Quem (Pessoa)',cls:'rico:Person',fields:['dcterms:title','dcterms:description','rico:personBiographicalHistory','rico:occupationalHistory']}
 ];
 const vocab=['Espécie documental','Tipo de conteúdo','Estado do documento','Tipo de conjunto','Tipo de suporte','Tipo de representação','Técnica de produção','Ocupação','Tipo de organização','Tipo de família','Tipo de evento','Tipo de atividade','Tipo de local','Tipo de data','Situação jurídica'];
 const propInfo={
 'dcterms:title':['Title','A name given to the resource.','Título atribuído ao recurso.'],
 'dcterms:description':['Description','An account of the resource.','Descrição ou resumo do recurso.'],
 'rico:hasOrHadPart':['Has or had part','Relates a resource to a part.','Relaciona o documento a uma de suas partes.'],
 'rico:hasOrHadMember':['Has or had member','Relates a set to a member.','Relaciona um conjunto documental aos seus membros.'],
 'rico:recordResourceExtent':['Record resource extent','The extent of the record resource.','Dimensão e suporte do recurso documental.'],
 'rico:hasOrHadSubject':['Has or had subject','Subject associated with the record.','Assunto documentado pela fonte.'],
 'rico:hasOrHadProducer':['Has or had producer','Agent responsible for production.','Agente responsável pela produção.'],
 'rico:hasOrHadCreationDate':['Has or had creation date','Creation date of the resource.','Data de criação do recurso.'],
 'rico:isOrWasPartOf':['Is or was part of','The larger resource.','Recurso documental do qual esta parte faz parte.'],
 'rico:hasOrHadInstantiation':['Has or had instantiation','An instantiation of the record.','Representação do documento.'],
 'rico:recordSetType':['Record set type','Type of record set.','Tipo de conjunto documental.'],
 'rico:thingType':['Thing type','Type of thing.','Tipo de coisa ou tema.'],
 'rico:instantiationPhysicalCharacteristics':['Physical characteristics','Physical or technical characteristics.','Características físicas ou técnicas da representação.'],
 'rico:hasOrHadCarrierType':['Has or had carrier type','Carrier of the instantiation.','Tipo de suporte.'],
 'rico:hasOrHadDigitalInstantiation':['Has or had digital instantiation','Digital representation.','Representação digital.'],
 'rico:languageType':['Language type','Language used in the resource.','Idioma do recurso.'],
 'rico:activityType':['Activity type','Type of activity.','Tipo de atividade.'],
 'rico:activityDate':['Activity date','Date of the activity.','Data da atividade.'],
 'rico:eventType':['Event type','Type of event.','Tipo de evento.'],
 'rico:date':['Date','Date associated with the entity.','Data ou período associado.'],
 'rico:placeType':['Place type','Type of place.','Tipo de local.'],
 'rico:geographicalCoordinates':['Geographical coordinates','Coordinates of the place.','Coordenadas geográficas do local.'],
 'rico:dateType':['Date type','Type of date.','Tipo de data.'],
 'rico:occupationalHistory':['Occupational history','Occupations of the agent.','Ocupações exercidas pelo agente.'],
 'rico:groupType':['Group type','Type of group.','Tipo de família ou grupo.'],
 'rico:corporateBodyType':['Corporate body type','Type of organization.','Tipo de organização.'],
 'rico:personBiographicalHistory':['Biographical history','Biographical information.','Informações biográficas da pessoa.']
 };
 const initialTemplates=models.map(m=>({label:m.label,cls:m.cls,fields:m.fields}));
 let db=load(),page='items',editId=null,selectedProps=[],activeTab='values';
 function load(){try{return JSON.parse(localStorage.getItem(KEY))||{items:[],media:[],sets:[],templates:initialTemplates,vocabs:vocab.map(x=>({label:x,terms:[]})),done:[]}}catch(e){return {items:[],media:[],sets:[],templates:initialTemplates,vocabs:vocab.map(x=>({label:x,terms:[]})),done:[]}}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){alert('Não foi possível salvar no armazenamento deste navegador.');return false}}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const $=s=>root.querySelector(s);
 const root=document.createElement('div');root.id='training';root.className='page omeka-training';
 const main=document.querySelector('main');if(!main||document.querySelector('#training'))return;
 const oldNav=document.querySelector('.module-nav');
 if(oldNav){const old=oldNav.querySelector('[data-page="training"]');if(old)old.remove();const b=document.createElement('button');b.className='nav module-link';b.dataset-page='training';b.innerHTML='<span class="module-num">05</span><span>Omeka S</span>';oldNav.appendChild(b);b.onclick=()=>open();}
 const footer=main.querySelector('footer');if(footer)footer.insertAdjacentElement('beforebegin',root);else main.appendChild(root);
 function open(){if(typeof window.page==='function')window.page('training');else{document.querySelectorAll('.page').forEach(x=>x.classList.toggle('show',x.id==='training'));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page==='training'))}document.querySelector('#pagetitle').textContent='Omeka S · Treinamento';render()}
 function render(){root.innerHTML=
 '<div class="om-shell"><aside class="om-sidebar"><div class="om-brand">Repositório Digital do Samba e do Carnaval <small>(RDSC) · Ambiente de treinamento</small></div><div class="om-user"><span>♙ Usuário de treinamento</span><button id="omReset" title="Reiniciar dados de treino">⚙</button></div><div class="om-search"><input id="omSearch" placeholder="Search items"><button id="omSearchBtn">⌕</button></div><button class="om-nav" data-page="sites">▣ Sites</button><div class="om-navlabel">RESOURCES</div><button class="om-nav '+(page==='items'?'active':'')+'" data-page="items">⬡ Items</button><button class="om-subnav" data-page="media">›　Media</button><button class="om-nav" data-page="sets">♧ Item sets</button><button class="om-nav" data-page="vocab">▤ Vocabularies</button><button class="om-nav" data-page="templates">▧ Resource templates</button><div class="om-navlabel">ADMIN</div><button class="om-nav" data-page="users">♙ Users</button><button class="om-nav" data-page="assets">▧ Assets</button><div class="om-sidebar-foot">SIMULAÇÃO LOCAL · DADOS FICTÍCIOS</div></aside><section class="om-work"><div class="om-top"><span id="omCrumb">ITEMS</span><h1 id="omHeading">Items</h1><span class="om-spacer"></span><span class="om-eye">◉</span><button id="omCancel" class="om-btn">Cancel</button><button id="omAdd" class="om-btn primary">Add new item</button></div><div id="omContent"></div></section><aside class="om-properties" id="omProperties"></aside></div>';
 root.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{page=b.dataset.page;editId=null;render()}));
 $('#omReset').onclick=()=>{if(!confirm('Apagar somente os dados deste ambiente de treinamento?'))return;db=loadDefaults();save();render()};
 $('#omSearchBtn').onclick=()=>{page='items';render();const q=$('#omSearch').value.toLowerCase();$('#omTable').innerHTML=itemRows(db.items.filter(x=>x.title.toLowerCase().includes(q)))};
 renderPage();
 }
 function loadDefaults(){return {items:[],media:[],sets:[],templates:initialTemplates,vocabs:vocab.map(x=>({label:x,terms:[]})),done:[]}}
 function setHeading(crumb,title,addLabel){$('#omCrumb').textContent=crumb.toUpperCase();$('#omHeading').textContent=title;$('#omAdd').textContent=addLabel||'Add new item';$('#omAdd').hidden=!addLabel;$('#omCancel').hidden=page!=='edit';$('#omCancel').onclick=()=>{page='items';editId=null;render()};}
 function renderPage(){
  const c=$('#omContent'),p=$('#omProperties');p.innerHTML='<div class="om-prop-head">Click on a property to add it to the edit panel.</div><input class="om-filter" placeholder="Filter properties"><div class="om-vocab-list"><button>DUBLIN CORE (55)　›</button><button>PREMIS 3 (37)　›</button><button>RECORDS IN CONTEXTS (555)　›</button></div>';
  if(page==='edit'){renderEditor();return}
  if(page==='items'){setHeading('ITEMS','Items','Add new item');c.innerHTML='<div class="om-list-tools"><span>1 of 1　 ‹　 ›　 '+db.items.length+' results</span><span>Sort by　<select><option>ID</option><option>Title</option></select>　<select><option>Descending</option><option>Ascending</option></select> <button class="om-btn">Sort</button></span></div><div class="om-table-wrap"><table class="om-table"><thead><tr><th></th><th>Title</th><th>Resource class</th><th>Owner</th><th>Created</th><th></th></tr></thead><tbody id="omTable">'+itemRows(db.items)+'</tbody></table></div>';}
  else if(page==='templates'){setHeading('RESOURCE TEMPLATES','Resource templates','Add new resource template');c.innerHTML='<div class="om-list-tools">1 of 1　 ‹　 ›　 1–'+db.templates.length+' of '+db.templates.length+'</div><table class="om-table"><thead><tr><th>Label</th><th>Class</th><th>Owner</th></tr></thead><tbody>'+db.templates.map((t,i)=>'<tr><td>'+esc(t.label)+'</td><td>'+esc(t.cls)+'</td><td>Usuário de treinamento</td></tr>').join('')+'</tbody></table>';}
  else if(page==='vocab'){setHeading('VOCABULARIES','Vocabularies');c.innerHTML='<div class="om-list-tools">Vocabulários do projeto · '+db.vocabs.length+' categorias</div><table class="om-table"><thead><tr><th>Label</th><th>Prefix</th><th>Terms</th></tr></thead><tbody>'+db.vocabs.map(v=>'<tr><td>'+esc(v.label)+'</td><td>rico / projeto</td><td>'+v.terms.length+'</td></tr>').join('')+'</tbody></table>';}
  else if(page==='sets'){setHeading('ITEM SETS','Item sets','Add new item set');c.innerHTML=emptyState('Omeka could not find any item sets.');}
  else if(page==='media'){setHeading('MEDIA','Media');c.innerHTML=emptyState('No media have been added in this training environment.');}
  else if(page==='sites'){setHeading('SITES','Sites','Add new site');c.innerHTML=emptyState('No sites have been created in this training environment.');}
  else if(page==='users'){setHeading('USERS','Users');c.innerHTML=emptyState('Training users are simulated. No real accounts are managed here.');}
  else{setHeading('ASSETS','Assets');c.innerHTML=emptyState('No assets in the training environment.');}
  $('#omAdd').onclick=()=>{if(page==='items'){editId=null;page='edit';render()}else if(page==='templates'){const label=prompt('Nome do modelo de recurso:');if(label){db.templates.push({label,cls:'rico:Record',fields:['dcterms:title','dcterms:description']});save();render()}}else if(page==='sets'){const label=prompt('Nome do conjunto de itens:');if(label){db.sets.push({label});save();render()}}else if(page==='sites'){alert('A criação de sites será adicionada em uma próxima etapa do simulador.')}};
 }
 function emptyState(msg){return '<div class="om-empty"><div class="om-cube">⬡</div><p>'+esc(msg)+'</p></div>'}
 function itemRows(items){return items.length?items.map(x=>'<tr><td>□</td><td><button class="om-link" data-open="'+esc(x.id)+'">'+esc(x.title)+'</button></td><td>'+esc(x.cls)+'</td><td>Usuário de treinamento</td><td>'+esc(x.created)+'</td><td><button class="om-icon" data-edit="'+esc(x.id)+'">✎</button><button class="om-icon" data-del="'+esc(x.id)+'">▤</button></td></tr>').join(''):'<tr><td colspan="6" class="om-no-results">Nenhum item cadastrado. Clique em “Add new item” para começar.</td></tr>'}
 function renderEditor(){
  setHeading('ITEMS','New item','Add');
  const item=db.items.find(x=>x.id===editId)||{id:'',title:'',template:'',cls:'',values:{},media:[],sets:[]};
  selectedProps=Object.keys(item.values||{});
  $('#omAdd').textContent='Add';$('#omAdd').onclick=()=>saveItem();
  $('#omContent').innerHTML='<div class="om-edit-tabs"><button class="selected" data-tab="values">Values</button><button data-tab="media">Media</button><button data-tab="sets">Item sets</button><button data-tab="sites">Sites</button><button data-tab="advanced">Advanced</button><button data-tab="mapping">Mapping</button></div><div id="omTabContent"></div>';
  root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;root.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));renderTab(item)});
  renderTab(item);
  $('#omCancel').hidden=false;$('#omCancel').onclick=()=>{page='items';editId=null;render()};
  $('#omProperties').innerHTML='<div class="om-prop-head">Click on a property to add it to the edit panel. <button id="omCloseProp">×</button></div><input class="om-filter" id="omPropFilter" placeholder="Filter properties"><div class="om-vocab-list" id="omPropGroups"></div>';
  renderPropertyDrawer(item);
 }
 function renderTab(item){
  const box=$('#omTabContent');if(!box)return;
  if(activeTab==='values'){
   const fields=selectedProps.length?selectedProps:['dcterms:title','dcterms:description'];
   box.innerHTML='<div class="om-select-row"><label>Resource template</label><select id="omTemplate"><option value="">Select a template</option>'+db.templates.map(t=>'<option value="'+esc(t.label)+'" '+(item.template===t.label?'selected':'')+'>'+esc(t.label)+'</option>').join('')+'</select></div><div class="om-select-row"><label>Class</label><select id="omClass"><option value="">Select a class</option>'+models.map(m=>'<option value="'+esc(m.cls)+'" '+(item.cls===m.cls?'selected':'')+'>'+esc(m.cls)+'</option>').join('')+'</select></div><div id="omFields">'+fields.map(f=>fieldHtml(f,item.values?.[f]||'')).join('')+'</div>';
   $('#omTemplate').onchange=()=>{const t=db.templates.find(x=>x.label===$('#omTemplate').value);if(t){item.template=t.label;item.cls=t.cls;selectedProps=[...new Set(['dcterms:title','dcterms:description',...t.fields])];renderTab(item);renderPropertyDrawer(item)}};
   $('#omClass').onchange=()=>{item.cls=$('#omClass').value};
   $('#omFields').querySelectorAll('[data-prop]').forEach(el=>el.addEventListener('input',()=>{item.values[el.dataset.prop]=el.value}));
   $('#omFields').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{selectedProps=selectedProps.filter(x=>x!==b.dataset.remove);delete item.values[b.dataset.remove];renderTab(item);renderPropertyDrawer(item)});
  }else if(activeTab==='media'){box.innerHTML='<div class="om-tab-content"><h3>Media</h3><p>Adicione arquivos de treinamento ao item.</p><input type="file" id="omMediaFile" multiple><div class="om-hint">Arquivos selecionados são apenas demonstrativos nesta versão; não são enviados ao acervo real.</div></div>'}
  else if(activeTab==='sets'){box.innerHTML='<div class="om-tab-content"><h3>Item sets</h3>'+db.sets.map(s=>'<label class="om-check"><input type="checkbox" value="'+esc(s.label)+'"> '+esc(s.label)+'</label>').join('')+'<p class="om-hint">Selecione os conjuntos aos quais o item pertence.</p></div>'}
  else if(activeTab==='sites'){box.innerHTML='<div class="om-tab-content"><h3>Sites</h3><p>Selecione sites de treinamento para associar este item.</p><div class="om-hint">Nenhum site de treinamento cadastrado.</div></div>'}
  else if(activeTab==='advanced'){box.innerHTML='<div class="om-tab-content"><h3>Advanced</h3><label class="om-check"><input type="checkbox" id="omPrivate"> Private item</label><label>Owner<input value="Usuário de treinamento" disabled></label><p class="om-hint">As configurações avançadas são simuladas.</p></div>'}
  else{box.innerHTML='<div class="om-tab-content"><h3>Mapping</h3><p>Dados de localização podem ser associados pela propriedade rico:geographicalCoordinates.</p><div class="om-hint">O mapa será habilitado quando o item possuir coordenadas válidas.</div></div>'}
 }
 function fieldHtml(prop,value){const info=propInfo[prop]||[prop.split(':').pop(),'Property from the selected vocabulary.','Propriedade do vocabulário selecionado.'];return '<div class="om-field"><div class="om-field-label"><b>'+esc(info[0])+'　⌄</b><span>'+esc(info[1])+'</span><small>'+esc(prop)+'</small><em>'+esc(info[2])+'</em></div><div class="om-field-input"><textarea data-prop="'+esc(prop)+'" placeholder="">'+esc(value)+'</textarea><div class="om-field-actions"><button type="button">＋</button><button type="button">▦ Text</button><button type="button">♧ Omeka resource</button><button type="button">↗ URI</button><button type="button" data-remove="'+esc(prop)+'">×</button></div></div></div>'}
 function renderPropertyDrawer(item){const host=$('#omPropGroups');if(!host)return;const groups=[['DUBLIN CORE (55)',['dcterms:title','dcterms:description']],['PREMIS 3 (37)',['premis:hasMessageDigest','premis:hasSize']],['RECORDS IN CONTEXTS (555)',Object.keys(propInfo).filter(x=>x.startsWith('rico:'))]];host.innerHTML=groups.map(g=>'<div class="om-prop-group"><button>'+g[0]+'　›</button><div>'+g[1].map(prop=>'<button class="om-prop-option" data-add-prop="'+esc(prop)+'">'+esc(prop)+'</button>').join('')+'</div></div>').join('');host.querySelectorAll('[data-add-prop]').forEach(b=>b.onclick=()=>{const prop=b.dataset.addProp;if(!selectedProps.includes(prop)){selectedProps.push(prop);renderTab(item);renderPropertyDrawer(item)}});$('#omCloseProp').onclick=()=>{$('#omProperties').classList.toggle('collapsed')};$('#omPropFilter').oninput=()=>{const q=$('#omPropFilter').value.toLowerCase();host.querySelectorAll('[data-add-prop]').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q))}}
 function saveItem(){const item=db.items.find(x=>x.id===editId)||{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),values:{},media:[],sets:[]};const title=item.values['dcterms:title']||$('#omFields textarea[data-prop="dcterms:title"]')?.value||'';item.title=title.trim()||'Untitled resource';item.cls=$('#omClass')?.value||item.cls||'';item.template=$('#omTemplate')?.value||item.template||'';if(!db.items.some(x=>x.id===item.id)){item.created=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});db.items.push(item)}else Object.assign(db.items.find(x=>x.id===item.id),item);if(!save())return;page='items';editId=null;render()}
 root.addEventListener('click',ev=>{const e=ev.target.closest('[data-edit],[data-open],[data-del]');if(!e)return;if(e.dataset.edit||e.dataset.open){editId=e.dataset.edit||e.dataset.open;page='edit';render()}else if(e.dataset.del){if(confirm('Excluir este item de treinamento?')){db.items=db.items.filter(x=>x.id!==e.dataset.del);save();render()}}});
 render();
})();