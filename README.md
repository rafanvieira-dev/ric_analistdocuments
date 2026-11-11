# Sistema RiC — descrição arquivística local

Aplicação local de apoio à descrição arquivística orientada pelo RiC-CM 1.0. **Não utiliza IA, API externa ou envio de documentos para serviços de terceiros.**

## Executar
- Python 3.9 ou superior.
- Instale as dependências: `python -m pip install -r requirements.txt`.
- Windows: execute `iniciar_windows.bat`.
- Linux/macOS: `chmod +x iniciar_linux_mac.sh && ./iniciar_linux_mac.sh`.
- Acesse http://127.0.0.1:8765.

## Base de conhecimento interna
Coloque os documentos de referência na pasta `conhecimento/fontes/`:
- RiC-CM 1.0 (PDF com texto selecionável);
- Cartilha metodológica LABOGAD (PDF com texto selecionável);
- Crosswalk ICA–RiC-CM (XLSX);
- outros documentos metodológicos que queira consultar (PDF, DOCX, XLSX, TXT ou MD).

Abra **Base de conhecimento** na navegação e pesquise termos. Cada resultado informa o arquivo e a página, parágrafo, linha ou aba de origem. A indexação é local e feita sob demanda. A pasta contém apenas um arquivo .gitkeep no repositório; os documentos de referência devem ser adicionados localmente pelo usuário.

## Análise documental
A tela de importação aceita DOCX e PDF com texto selecionável. O sistema extrai candidatos por vocabulários lexicais e padrões, registra trechos de evidência e permite revisão humana. PDF digitalizado (imagem) ainda exige OCR e não é suportado nesta etapa.

## Limites importantes
- Não é IA nem compreensão semântica.
- Menções e resultados de busca não comprovam fatos, identidade, autoria ou relações.
- A classificação por regras pode gerar falsos positivos e omissões.
- As relações continuam dependentes de revisão e registro humano.
- Não há, nesta etapa, serialização completa de todos os elementos RiC-CM, OCR, autenticação, publicação ou integração Omeka S.
- A base de conhecimento atual realiza busca lexical por frequência de termos, não uma avaliação conceitual ou historiográfica.

## Dados e segurança
Os dados do espaço de trabalho ficam em `data/workspace.json`. O servidor escuta apenas em `127.0.0.1`. Não exponha à internet sem autenticação, autorização, proteção contra requisições maliciosas, backup e revisão de segurança.
