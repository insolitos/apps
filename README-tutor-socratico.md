# Pergunta, Pensa, Aprende

Aplicação web autónoma para apoiar a leitura, a interpretação, a escrita, a gramática e a discussão de textos e imagens através de perguntas socráticas.

## Utilização

Abra `tutor-socratico.html` num navegador moderno. A aplicação não precisa de servidor, bases de dados, bibliotecas externas ou chave de API.

Pode ser:

- publicada diretamente num repositório GitHub;
- aberta através do GitHub Pages;
- incorporada num Google Site através de um iframe ou de uma ligação para o ficheiro;
- usada localmente, com o progresso guardado no navegador.

## Funcionalidades

- percurso flexível: observar, compreender, esclarecer, inferir, analisar a linguagem, avaliar, criar e refletir;
- uma pergunta de cada vez, com feedback antes da pergunta seguinte;
- pistas graduadas e comandos `pista`, `outra pergunta`, `mais difícil`, `mais fácil`, `explica-me` e `terminar`;
- apoio a texto, imagem, notícia/artigo, gramática, texto do aluno e outros temas;
- relatório descarregável em `.txt`, impressão e retoma da sessão no mesmo dispositivo;
- modo professor com sequência socrática, equívocos frequentes, pistas, adaptações, grelha e cartão de saída;
- interface responsiva em português europeu.

## Modo professor

O código inicial é `PPA-2026`. Para o alterar, edite a constante `PROFESSOR_CODE` no início do JavaScript. O modo professor é uma proteção de interface, não um mecanismo de segurança: como a aplicação é estática, o código fica tecnicamente acessível no código-fonte.

## Publicação no GitHub Pages

1. Coloque `tutor-socratico.html` no repositório.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Abra o endereço de Pages indicado pelo GitHub.

O banco de perguntas e as regras que deram origem à aplicação podem permanecer nos ficheiros de documentação do projeto, mas não são necessários para a execução do HTML.
