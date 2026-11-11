"""Base de conhecimento local: indexa fontes LABOGAD/RiC-CM sem IA ou serviços externos."""
from pathlib import Path
import re, unicodedata
import fitz
from docx import Document
from openpyxl import load_workbook

ROOT=Path(__file__).resolve().parent
SOURCES=ROOT/"conhecimento"/"fontes"
SUPPORTED={".pdf",".docx",".xlsx",".txt",".md"}
_CACHE=None

def normalize(value):
    value=unicodedata.normalize("NFKD",str(value).casefold())
    value="".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"\\s+"," ",value).strip()

def _extract(path):
    ext=path.suffix.lower()
    if ext==".pdf":
        pdf=fitz.open(path)
        for n,page in enumerate(pdf,1):
            text=page.get_text("text").strip()
            if text: yield {"source":path.name,"locator":f"página {n}","text":text}
    elif ext==".docx":
        doc=Document(path)
        for n,p in enumerate(doc.paragraphs,1):
            if p.text.strip(): yield {"source":path.name,"locator":f"parágrafo {n}","text":p.text.strip()}
        for ti,table in enumerate(doc.tables,1):
            for ri,row in enumerate(table.rows,1):
                text=" | ".join(c.text.strip() for c in row.cells if c.text.strip())
                if text: yield {"source":path.name,"locator":f"tabela {ti}, linha {ri}","text":text}
    elif ext==".xlsx":
        book=load_workbook(path,data_only=True,read_only=True)
        for sheet in book.worksheets:
            for rn,row in enumerate(sheet.iter_rows(values_only=True),1):
                text=" | ".join(str(v).strip() for v in row if v is not None and str(v).strip())
                if text: yield {"source":path.name,"locator":f"aba {sheet.title}, linha {rn}","text":text}
    else:
        for n,line in enumerate(path.read_text(encoding="utf-8",errors="replace").splitlines(),1):
            if line.strip(): yield {"source":path.name,"locator":f"linha {n}","text":line.strip()}

def build_index(force=False):
    global _CACHE
    if _CACHE is not None and not force: return _CACHE
    SOURCES.mkdir(parents=True,exist_ok=True)
    records=[]
    for path in sorted(SOURCES.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED:
            try:
                for item in _extract(path):
                    text=re.sub(r"\\s+"," ",item["text"]).strip()
                    if text: records.append({**item,"normalized":normalize(text)})
            except Exception as exc:
                records.append({"source":path.name,"locator":"erro de leitura","text":f"Não foi possível indexar: {exc}","normalized":""})
    _CACHE=records
    return records

def status():
    records=build_index()
    return {"documents":len({r["source"] for r in records}),"passages":len(records),"sources":[{"name":n,"passages":sum(r["source"]==n for r in records)} for n in sorted({r["source"] for r in records})],"folder":"conhecimento/fontes","external_services":False}

def search(query,limit=10):
    terms=[t for t in re.findall(r"[a-z0-9]{3,}",normalize(query)) if t not in {"para","com","que","uma","dos","das","the","and","from"}]
    if not terms: return []
    results=[]
    for item in build_index():
        body=item["normalized"]
        score=sum(body.count(term) for term in terms)
        if score:
            results.append({"score":score,"source":item["source"],"locator":item["locator"],"excerpt":item["text"][:1400]})
    results.sort(key=lambda r:(r["score"],len(r["excerpt"])),reverse=True)
    return results[:max(1,min(int(limit),30))]
