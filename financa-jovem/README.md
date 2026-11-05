# FinançaJovem

Aplicação de literacia financeira em contexto escolar, em português europeu. Abre `index.html` num navegador. Versão publicada: https://insolitos.github.io/apps/financa-jovem/.

## Quatro percursos

O seletor de ciclo altera a missão, os valores, as experiências, os enunciados, as explicações, os desafios e o relatório.

| Percurso | Missão | Experiências | Foco |
| --- | --- | --- | --- |
| 1.º ciclo | A minha semana: 20 € fictícios | 5 | Necessidades, compras, contagem, mealheiro e pequenas vendas |
| 2.º ciclo | A visita de estudo: 40 € fictícios | 6 | Mesada, reserva, embalagens e escolhas coletivas |
| 3.º ciclo | O mês é teu: 60 € fictícios | 7 | Orçamento, imprevistos, juros, risco e segurança digital |
| Secundário | Primeiro mês de autonomia: 450 € fictícios | 8 | Crédito, compromissos futuros, custos, inflação e stock por vender |

Há seis perguntas diferentes por percurso (24 no total). É possível voltar a tentar, conservando o resultado da primeira resposta. As perguntas não avançam automaticamente antes de o aluno ler o feedback.

Nos primeiros ciclos, a poupança usa entregas regulares sem juros. Nos percursos avançados, introduz capitalização e taxas. No secundário, a experiência de risco inclui custo anual e poder de compra; a missão reserva os pagamentos futuros antes de contar a poupança livre.

No 1.º ciclo, os primeiros anos podem beneficiar da leitura acompanhada e de moedas de brincar. O professor pode mudar de percurso para apoiar ou aprofundar. A progressão tem como referência o [Referencial de Educação Financeira da DGE](https://www.dge.mec.pt/referencial-de-educacao-financeira); não é um recurso oficial certificado.

## Progresso e privacidade

- Cada percurso guarda missões, questionários em curso, metas, resultados e reflexões próprios no armazenamento local do navegador.
- Mudar de ciclo ou recarregar a página permite retomar o percurso.
- O relatório TXT identifica o ciclo e inclui escolhas, resultados e reflexão. Também pode ser impresso.
- Corrigir o valor poupado no mesmo dia substitui o registo anterior, sem o duplicar.
- O histórico anterior é preservado; um resultado não é reclassificado como se tivesse sido obtido noutro ciclo.
- Sem contas de alunos, bibliotecas externas, analítica ou envio dos registos para servidores. Usar valores fictícios e não incluir dados pessoais nas reflexões.
- O comando de apagar dados identifica expressamente que elimina os quatro percursos deste navegador.

## Validação

Com Node.js, executar `node validate.cjs` na pasta da aplicação. Num checkout com `dist/index.html`, o mesmo comando deteta essa estrutura.

As verificações cobrem cálculos financeiros, 24 perguntas, quatro percursos, todos os ramos possíveis das missões, compromissos futuros, juros de 0%, compras, impostos, stock, migração e isolamento de dados por ciclo.

Foram também verificados no navegador: troca e retoma entre ciclos; missões; poupança; compras; orçamento coletivo; imprevisto; stock; risco e custos; erro e nova tentativa; metas diárias e relatórios.

## Limites dos modelos

Os valores e taxas são fictícios. As simulações são simplificadas e não são ofertas, previsões ou aconselhamento financeiro. O simulador de crédito não calcula TAEG e identifica os custos excluídos. Os cenários de investimento não são limites de risco nem têm probabilidades atribuídas.

TIC, Educação e WEB · Desenvolvido com o apoio de inteligência artificial (ChatGPT, da OpenAI).
