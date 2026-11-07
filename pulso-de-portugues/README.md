# Diário de Observação | Português

Aplicação estática de avaliação formativa para professores de Português do ensino obrigatório. Durante a aula, o professor observa, seleciona o aluno e toca num nível. A evidência fica disponível imediatamente no painel local. Os alunos não precisam de conta ou dispositivo.

## Abrir no computador

1. Extraia todos os ficheiros para a mesma pasta.
2. Abra `index.html` com um duplo clique num navegador moderno. Use sempre o mesmo navegador e perfil.
3. Em **Turmas**, crie uma turma e adicione alunos individualmente ou em **Colar lista de alunos**. Aceita, por exemplo, `1 Ana`, `2 · Bruno` e `Carolina`, um aluno por linha.
4. Em **Planta da sala**, defina as dimensões, selecione um aluno e toque num lugar. Se o lugar estiver ocupado, o outro aluno recebe o lugar anterior do aluno selecionado ou fica sem lugar. A duplicação copia a turma, os alunos e a planta. A nova turma começa com o histórico vazio.

Para importar, selecione a turma em **Turmas → Importar alunos em CSV**. Use UTF-8 e um cabeçalho com a coluna **Nome** e, opcionalmente, **Número**. O separador pode ser vírgula ou ponto e vírgula. Exemplo com ponto e vírgula:

    Número;Nome
    1;Ana
    2;Bruno

O ficheiro é lido no dispositivo. A importação acrescenta alunos à turma selecionada, sem substituir registos. Ignora números repetidos e, quando falta um número, nomes repetidos. Mostra as contagens antes de guardar.

A abertura local dispensa ligação à Internet. A persistência de páginas abertas com `file:` depende do navegador e pode mudar se o ficheiro for movido. Confirme a persistência com uma turma de teste. Se o navegador bloquear o armazenamento local, utilize a versão servida em HTTPS.

## Publicar no GitHub Pages

1. Coloque `index.html`, `styles.css`, `app.js`, `sw.js`, `.nojekyll` e `README.md` diretamente na raiz da branch principal do repositório, normalmente `main`. Inclua o ficheiro oculto `.nojekyll` para publicar os ficheiros estáticos diretamente.
2. No repositório, vá a **Settings → Pages**. Em **Build and deployment**, selecione **Deploy from a branch**, escolha `main` e `/(root)`, e clique em **Save**.
3. Após a publicação, abra o endereço HTTPS indicado em **Pages**. Aguarde a instalação da cópia offline na primeira visita antes de desligar a ligação.

A aplicação dispensa npm, bibliotecas e configuração de compilação. Os caminhos são relativos. O service worker guarda apenas HTML, CSS e JavaScript da própria aplicação, sem guardar evidências na cache. Ao atualizar estes ficheiros, altere também a versão da cache em `sw.js`. Feche as abas antigas para permitir que a nova versão se ative.

[Documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Registar e consultar

- Em **Aula**, escolha o domínio ou uma **Tarefa rápida**. A tarefa mantém-se selecionada ao passar de aluno para aluno e define o domínio. Em observação livre, pode alterar o domínio no painel rápido e registar Insuficiente, Suficiente, Bom ou Muito bom. As tarefas rápidas usam A desenvolver, Em desenvolvimento e Consolidado. Os registos anteriores mantêm o nível original.
- Toque no aluno e no nível. Se quiser acrescentar etiquetas ou uma nota, faça-o antes de escolher o nível. O botão de nível guarda e fecha o painel.
- **Desfazer último registo** remove a última evidência guardada na turma selecionada, mesmo se tiver sido guardada noutra tarefa. Pode repetir o comando para remover a anterior.
- O painel conta alunos distintos com evidência no dia ou na tarefa selecionada. A distribuição conta registos. O alerta de pontuação usa todo o histórico e conta alunos com pelo menos duas evidências «Insuficiente» ou «A desenvolver» com essa etiqueta. O contraste entre compreensão literal e inferencial usa o recorte visível e identifica quantos alunos têm evidências de cada tipo. O lembrete de volume usa todos os registos de hoje.
- Em **Relatórios**, combine filtros de aluno, domínio e datas. Os indicadores individuais mostram as últimas evidências, a frequência de «Insuficiente» e «A desenvolver» e a primeira e última evidência de cada domínio no período. Use **Exportar CSV**, **Exportar JSON** ou **Imprimir**. O CSV usa UTF-8 com BOM e ponto e vírgula. O JSON de relatório contém apenas o recorte escolhido.

## Exportar e recuperar um backup

1. Em **Definições**, clique em **Exportar backup JSON**. O ficheiro contém todas as turmas, lugares, registos e preferências, com exceção do PIN, que pertence ao navegador em uso.
2. Para restaurar ou mudar de dispositivo, escolha **Importar backup JSON**, selecione o ficheiro e confirme a substituição. A aplicação valida a versão, os campos e as referências entre turmas, alunos e registos. Um backup inválido preserva os dados atuais.
3. Para remover todos os dados desta aplicação no navegador, use **Apagar todos os dados** e confirme. As cópias previamente exportadas permanecem nos locais onde as guardou.

## Privacidade e RGPD

A aplicação guarda as evidências no `localStorage` sob a chave `pulso-de-portugues:v1`. O alojamento entrega apenas os ficheiros da aplicação. A aplicação não transmite dados de alunos nem utiliza serviços externos. O armazenamento é separado por navegador, perfil e origem. Ao passar do ficheiro local para o GitHub Pages, transfira os dados por backup.

O professor deve seguir as orientações da escola para tratar, conservar e proteger os dados. Use iniciais ou identificadores curtos e limite as notas a observações pedagógicas necessárias. Guarde backups, CSV e impressões num local protegido. Publique apenas os ficheiros da aplicação no repositório. O PIN reduz acessos casuais na interface. Os dados e os backups ficam sem encriptação.

## Limitações

Os níveis descrevem evidências de avaliação formativa. A aplicação destina-se ao acompanhamento pedagógico. A classificação sumativa pertence aos instrumentos formais de avaliação. A expressão «tempo real» refere-se à atualização imediata do painel local. A primeira e a última evidência podem resultar de tarefas diferentes e devem ser interpretadas no seu contexto.

Use uma aba de cada vez. Se outra aba alterar os dados, recarregue a página antes de continuar. Limpar os dados do navegador, usar um perfil temporário ou mudar de dispositivo pode tornar o histórico inacessível. Faça backups regulares.
