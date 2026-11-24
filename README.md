# Sistema RiC — descrição e análise arquivística

Aplicação web de apoio à identificação de entidades, revisão de evidências, construção de relações e preparação de descrições arquivísticas. A interface principal está em `static/` e utiliza Firebase Authentication e Cloud Firestore para autenticação e sincronização seletiva.

## Estado funcional atual

- Autenticação administrativa por Firebase Authentication e perfil `users/{uid}` no Firestore.
- Consulta pública de entidades e relações publicadas.
- Importação de DOCX e PDF pesquisável.
- OCR no navegador para imagens (JPG, PNG, WEBP) e TIFF; TIFF também gera PDF pesquisável.
- Extração lexical de candidatos a entidades. A identificação não é semântica e exige validação humana.
- Revisão de menções, consolidação por nome normalizado e tipo, fontes e evidências.
- Cadastro e validação de relações; grafo interativo com D3.js.
- Formulários de descrição geral, LABOGAD e RiC-CM 1.0; exportação da tabela RiC-CM em PDF.
- Preparação de rascunhos Omeka S e exportação em JSON. **Não há integração de gravação com a API do Omeka S nesta versão.**
- Exportação e restauração de backup JSON.
- Instalação como PWA.

## Armazenamento e sincronização

O espaço de trabalho local é guardado no `localStorage` do navegador. Textos completos de fontes, menções pendentes, notas, descrições e rascunhos Omeka permanecem locais. O Firestore sincroniza entidades, relações e fontes validadas, além das coleções públicas. Portanto, **a sincronização ainda não é integral entre dispositivos**. Faça exportações de backup antes de operações de manutenção ou limpeza.

A base de conhecimento em `static/knowledge.html` armazena os documentos importados no navegador. O módulo Python (`app.py` e `knowledge_base.py`) é uma implementação local/legada separada, com armazenamento em `data/workspace.json`; suas rotas não são a persistência da interface Firebase principal.

## Executar a implementação Python local/legada

- Python 3.9 ou superior.
- Instale as dependências: `python -m pip install -r requirements.txt`.
- Windows: execute `iniciar_windows.bat`.
- Linux/macOS: `chmod +x iniciar_linux_mac.sh && ./iniciar_linux_mac.sh`.
- Acesse `http://127.0.0.1:8765`.

Essa execução local não substitui a configuração Firebase usada pela aplicação web publicada.

## Regras de segurança do Firestore

O arquivo `firestore.rules` contém uma política de referência para permitir leitura e escrita das coleções internas somente a administradores ativos, manter as coleções públicas legíveis e restringir a gestão de perfis. **Adicionar o arquivo ao GitHub não publica as regras no Firebase.** Revise o conteúdo e aplique-o ao projeto Firebase correto antes de considerar a proteção ativa:

```bash
firebase deploy --only firestore:rules --project sistema-ric-estacio
```

O primeiro perfil administrativo deve ser provisionado de forma segura no documento `users/{uid}` correspondente ao UID do Firebase Authentication. Não habilite regras permissivas como `allow read, write: if true`.

## Limitações conhecidas e próximos passos

1. A extração de entidades é baseada em listas e expressões; pode omitir nomes desconhecidos e gerar falsos positivos.
2. A consolidação automática usa nome normalizado + tipo. Homônimos podem exigir decisão humana; não trate a correspondência lexical como prova de identidade.
3. Descrições, notas e rascunhos Omeka ainda precisam de persistência remota para uso confiável em vários dispositivos.
4. A integração Omeka S precisa de endpoint, credenciais, mapeamento de vocabulários e envio de mídias.
5. A base de conhecimento usa busca lexical, não busca semântica nem análise historiográfica.
6. Recomenda-se criar testes automatizados, backup versionado, trilha de auditoria e rotina de reconciliação de dados antes de uso institucional.

## Privacidade

O OCR e a extração no navegador processam os arquivos localmente. Não envie documentos sigilosos para ambientes compartilhados sem avaliar as políticas de acesso, retenção, backup e proteção de dados do projeto Firebase.
