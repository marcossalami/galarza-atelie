# Decisão sobre feed automático do Instagram

**Decisão atual: não ativar feed automático.**

O perfil continua sendo vinculado por links seguros e por uma seleção editorial
mantida no próprio site. Isso evita scraping, tokens públicos, pontos de falha
no carregamento da vitrine e dependência de APIs não configuradas.

## Condições para reavaliar

1. A conta do ateliê passa a ser profissional e tem acesso à integração oficial
   da Meta.
2. A artista aprova o escopo e fornece credenciais por secrets do ambiente —
   nunca no repositório ou no front-end.
3. A integração é feita no servidor com a API oficial, cache limitado e
   tratamento de erro.
4. A seleção editorial estática continua como fallback quando a API falhar ou
   estiver indisponível.
