from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from email.parser import BytesParser
from email.policy import default
from docx import Document
import json, re, uuid, os, threading
from datetime import datetime
from knowledge_base import status as knowledge_status, search as knowledge_search

ROOT=Path(__file__).resolve().parent
DATA=ROOT/'data'; STATIC=ROOT/'static'; DB=DATA/'workspace.json'
DATA.mkdir(exist_ok=True); STATIC.mkdir(exist_ok=True)
LOCK=threading.Lock()

PEOPLE=['Rubens Barcelos','Mano Rubens','Ismael Silva','Bide','Brancura','Nilton Bastos','Edgar','Julinho','Donga','Sinhô','Caninha','Tia Ciata','Ricardo Cravo Albin','Nei Lopes','Nelson da Nóbrega Fernandes','Amaury Jório','Hiram de Araújo','José Ramos Tinhorão','Luiz Fernando Vianna','Cartola','Clementina de Jesus','Heitor dos Prazeres','Pixinguinha','João da Bahiana','Candeia','Sérgio Cabral','Mestre Ciça','Mestre Chuvisco']
ORGS=['União Faz a Força','Deixa Falar','Escola de Samba Estácio de Sá','GRES Estácio de Sá','Unidos de São Carlos','União do Estácio de Sá','União das Cores','Portela','Império Serrano','Mangueira','Vizinha Faladeira','Funarte','Instituto Moreira Salles','IMS','UFRJ','Pallas','Prefeitura do Rio de Janeiro','Jornal do Brasil','Biblioteca Nacional','Arquivo Nacional','LIESA']
PLACES=['Estácio','Pilares','Praça Onze','Largo do Estácio','Morro de São Carlos','Cidade Nova','Pequena África','Praça Quinze','Avenida Estácio de Sá','Rua do Estácio','Rua Machado Coelho','Beco D. Paulina','Oswaldo Cruz','Mangueira','Santo Cristo','Rio de Janeiro']
EVENTS=['primeiro desfile do Bloco Deixa Falar','criação do Bloco Deixa Falar','fundação da Deixa Falar','criação do Samba de Sambar','fim do Rancho Deixa Falar','fusão da Deixa Falar e União das Cores']

def load_db():
    if DB.exists():
        try: return json.loads(DB.read_text(encoding='utf-8'))
        except (ValueError,OSError): pass
    return {'project':'Estácio 100 Anos','sources':[],'entities':[],'relations':[],'notes':[]}

def save_db(data):
    with LOCK: DB.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

def read_docx(path):
    doc=Document(path); blocks=[]
    for p in doc.paragraphs:
        value=' '.join(p.text.split())
        if value: blocks.append(value)
    for table in doc.tables:
        for row in table.rows:
            value=' | '.join(' '.join(c.text.split()) for c in row.cells if c.text.strip())
            if value: blocks.append(value)
    return blocks

def extract_entities(text, source_id):
    found=[]; lexicons=[('Pessoa',PEOPLE),('Organização',ORGS),('Local',PLACES),('Evento',EVENTS)]
    for kind,terms in lexicons:
        for term in terms:
            pattern=re.compile(r'(?<![\wÀ-ÿ])'+re.escape(term)+r'(?![\wÀ-ÿ])',re.I)
            for match in list(pattern.finditer(text))[:5]:
                a=max(0,match.start()-190); b=min(len(text),match.end()+220)
                found.append({'id':str(uuid.uuid4()),'name':term,'type':kind,'source_id':source_id,'source_excerpt':text[a:b].replace('\n',' '),'position':match.start(),'confidence':'Média' if kind!='Evento' else 'Baixa','status':'Pendente','evidence':'Menção literal encontrada; validar identidade, papel e contexto.','variants':[]})
    date_re=r'(?<!\d)(?:\d{1,2}/\d{1,2}/\d{4}|\d{4}|década de \d{4}|final da década de \d{4}|início da década de \d{4})(?!\d)'
    for m in re.finditer(date_re,text,re.I):
        a=max(0,m.start()-180); b=min(len(text),m.end()+200)
        found.append({'id':str(uuid.uuid4()),'name':m.group(0),'type':'Data','source_id':source_id,'source_excerpt':text[a:b].replace('\n',' '),'position':m.start(),'confidence':'Média','status':'Pendente','evidence':'Expressão temporal localizada. Classificar a natureza da data.','variants':[]})
    out=[]; seen=set()
    for e in sorted(found,key=lambda x:x['position']):
        key=(e['type'],e['name'].casefold())
        if key not in seen: seen.add(key); out.append(e)
    return out

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(STATIC),**kwargs)
    def log_message(self,*args): pass
    def send_json(self,obj,status=200):
        body=json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/state': return self.send_json(load_db())
        if path=='/api/knowledge/status': return self.send_json(knowledge_status())
        if path=='/api/knowledge/search':
            from urllib.parse import parse_qs
            query=parse_qs(urlparse(self.path).query).get('q',[''])[0]
            return self.send_json({'query':query,'results':knowledge_search(query)})
        if path=='/': self.path='/index.html'
        return super().do_GET()
    def do_POST(self):
        path=urlparse(self.path).path; length=int(self.headers.get('Content-Length','0'))
        if length>25*1024*1024: return self.send_json({'error':'Arquivo excede o limite de 25 MB.'},413)
        raw=self.rfile.read(length)
        if path=='/api/upload':
            msg=BytesParser(policy=default).parsebytes((f'Content-Type: {self.headers.get("Content-Type","")}\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
            part=next((p for p in msg.iter_parts() if p.get_filename()),None) if msg.is_multipart() else None
            if not part: return self.send_json({'error':'Envie um arquivo DOCX.'},400)
            filename=os.path.basename(part.get_filename() or 'documento.docx')
            if not filename.lower().endswith('.docx'): return self.send_json({'error':'Formato aceito: DOCX.'},400)
            tmp=DATA/(str(uuid.uuid4())+'.docx'); tmp.write_bytes(part.get_payload(decode=True) or b'')
            try:
                blocks=read_docx(tmp); text='\n'.join(blocks)
            except Exception as exc:
                tmp.unlink(missing_ok=True); return self.send_json({'error':'Não foi possível ler o DOCX: '+str(exc)},400)
            finally: tmp.unlink(missing_ok=True)
            sid=str(uuid.uuid4()); entities=extract_entities(text,sid); db=load_db()
            source={'id':sid,'filename':filename,'title':'Recomendações de leituras sobre a história do GRES Estácio','kind':'Documento-base','text':text,'blocks':blocks,'entity_count':len(entities),'created_at':datetime.now().isoformat(timespec='minutes')}
            db['sources'].append(source); db['entities'].extend(entities)
            db['notes'].append({'id':str(uuid.uuid4()),'source_id':sid,'text':'Revisar metadados de cada obra e vincular citações às páginas/edições disponíveis.','status':'Aberta'})
            save_db(db)
            return self.send_json({'source':{k:v for k,v in source.items() if k not in ('text','blocks')},'entities':entities,'blocks':len(blocks)})
        try: data=json.loads(raw or b'{}')
        except ValueError: return self.send_json({'error':'JSON inválido.'},400)
        db=load_db()
        if path=='/api/entity/update':
            item=next((e for e in db['entities'] if e['id']==data.get('id')),None)
            if not item: return self.send_json({'error':'Entidade não encontrada.'},404)
            for key in ('name','type','status','confidence','evidence'):
                if key in data: item[key]=data[key]
        elif path=='/api/relation/add':
            if not data.get('subject') or not data.get('object') or not data.get('predicate'): return self.send_json({'error':'Preencha sujeito, relação e objeto.'},400)
            db['relations'].append({'id':str(uuid.uuid4()),'subject':data['subject'],'predicate':data['predicate'],'object':data['object'],'source_id':data.get('source_id',''),'status':'Pendente','evidence':data.get('evidence','')})
        elif path=='/api/relation/update':
            item=next((r for r in db['relations'] if r['id']==data.get('id')),None)
            if not item: return self.send_json({'error':'Relação não encontrada.'},404)
            for key in ('subject','predicate','object','status','evidence'):
                if key in data: item[key]=data[key]
        elif path=='/api/note/add':
            db['notes'].append({'id':str(uuid.uuid4()),'source_id':data.get('source_id',''),'text':data.get('text',''),'status':'Aberta'})
        elif path=='/api/export': return self.send_json(db)
        else: return self.send_json({'error':'Rota não encontrada.'},404)
        save_db(db); return self.send_json({'ok':True,'state':db})

if __name__=='__main__':
    os.chdir(ROOT); print('Sistema RiC disponível em http://127.0.0.1:8765')
    ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
