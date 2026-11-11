# Sistema RiC — Estácio 100 Anos

Aplicação local para apoiar a descrição arquivística orientada pelo Records in Contexts (RiC-CM 1.0), com fluxo inicial de extração e revisão de entidades a partir das recomendações bibliográficas do projeto Estácio 100 Anos.

## Executar
- Python 3.9+
- Instale dependências: `python -m pip install -r requirements.txt`
- Windows: execute `iniciar_windows.bat`
- Linux/macOS: `chmod +x iniciar_linux_mac.sh && ./iniciar_linux_mac.sh`
- Acesse http://127.0.0.1:8765

Na tela inicial, importe o DOCX “Recomendações de leituras sobre a história do GRES Estácio”. Os dados de trabalho ficam em `data/workspace.json`.

## Recursos
- Leitura de parágrafos e tabelas de arquivos DOCX.
- Extração de menções candidatas a pessoas, organizações, locais, eventos e datas.
- Evidências textuais associadas às sugestões.
- Revisão, edição, validação ou rejeição de entidades.
- Registro manual de relações e exportação JSON.
- Interface responsiva em português.

## Limites metodológicos
A extração atual é lexical, baseada em vocabulário inicial; não é reconhecimento semântico avançado nem desambiguação de identidades. Uma ocorrência textual não comprova um fato, autoria ou papel. Datas encontradas precisam ser classificadas pelo arquivista como data de produção, de arquivo, de publicação ou de fato narrado. Relações são manuais e permanecem pendentes até revisão. Não há integração Omeka S nesta versão.

Os PDFs da Cartilha LABOGAD, RiC-CM e o crosswalk ICA–RiC-CM devem ser consultados como referências metodológicas pelo pesquisador; o programa ainda não indexa automaticamente o conteúdo integral desses arquivos.

## Segurança
O servidor escuta apenas em 127.0.0.1. Não exponha a aplicação à internet sem autenticação, autorização, proteção CSRF, limites de upload, backup e revisão de segurança. Não armazene neste protótipo dados sensíveis sem avaliar os riscos.
