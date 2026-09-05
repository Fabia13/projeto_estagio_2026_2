# Decisões do projeto

## Tema

Entre as opções que considerei, escolhi construir um sistema de agendamento para uma ESF (Estratégia Saúde da Família). Tenho experiência real como agente comunitária de saúde, e decidi ir por esse caminho justamente por isso: em vez de escolher um tema genérico, preferi um em que eu já entendo o fluxo de verdade  quais tipos de atendimento fazem sentido, o que costuma acontecer na rotina de uma unidade, e o que um sistema desses precisa suportar no dia a dia. Isso me deu confiança nas escolhas de campos e de tipos de agendamento (consulta médica, pré-natal, vacinação, puericultura e visita domiciliar).

## Stack

Escolhi **HTML/CSS/JavaScript puro no front-end** e **Supabase** para banco de dados e autenticação.

**O que ganhei:**
- Já tinha usado exatamente essa combinação antes, então não perdi tempo aprendendo ferramenta nova pra um teste com prazo curto
- Supabase cobre autenticação pronta (permitida pela especificação) e me deixa focar na lógica do sistema, não em configurar servidor
- Sem build, sem instalação de dependências  só abrir com Live Server

**O que perdi:**
- Sem framework, algumas coisas que seriam automáticas (ex: atualização reativa da tela) precisei fazer manipulando o DOM manualmente
- Toda a proteção de dados depende de eu configurar corretamente as políticas de RLS no banco  é uma responsabilidade a mais na configuração, mas em troca eu não tenho que escrever nem manter um back-end próprio

## Ambiguidades que percebi e como decidi

- **Campo horário:** a especificação diz que nem todo tema precisa desse campo. No meu caso, decidi manter horário para todos os tipos (mesmo puericultura e visita domiciliar), porque uma unidade de saúde real agenda por horário marcado independente do tipo de atendimento.
- **Painel sem nenhum agendamento:** tratei como um estado próprio, com uma mensagem explicando que a lista está vazia — em vez de simplesmente mostrar uma tabela em branco, que passaria a impressão de erro.
- **Como o admin decide status:** a especificação não pede uma forma de mudar o status, só de visualizá-lo. Decidi que isso não seria realmente útil sem essa ação (ver o "Além do mínimo" abaixo).

## Além do mínimo

1. **Atualização de status direto no painel.** Sem isso, o admin veria a lista mas não teria como agir sobre ela — e um painel que só mostra dados, sem permitir nenhuma ação, não seria algo que a equipe realmente usaria numa segunda-feira de manhã.
2. **Filtro por tipo de atendimento no painel**, pensando na lista crescendo com o tempo.
3. **Tratamento dos três estados da listagem** (carregando, vazio, erro), não só o caminho feliz com dados.

## Melhoria adicionada após a primeira entrega

Depois de enviar o Pull Request, percebi uma falha que não tinha tratado: nada impedia que dois visitantes agendassem a mesma data e o mesmo horário para o mesmo tipo de atendimento  geraria um "choque" de agendamento, já que é o mesmo profissional/serviço que atenderia os dois. Corrigi em duas camadas, no mesmo espírito da proteção do painel:

- **No banco de dados:** adicionei uma restrição única em `sql/schema.sql` combinando tipo, data e horário  impede fisicamente dois registros não cancelados nessa combinação, mesmo que dois formulários sejam enviados ao mesmo tempo (cancelados não contam, para liberar o horário de novo). Errei na primeira versão dessa regra: coloquei só data e horário, sem o tipo, o que teria bloqueado, por exemplo, uma consulta médica e uma vacinação marcadas no mesmo horário  mas isso não é um choque de verdade, porque são atendidos por pessoas diferentes. Corrigi incluindo o tipo na regra.
- **No formulário:** quando essa restrição barra o envio, o visitante agora vê uma mensagem específica ("Esse horário já está reservado para esse tipo de atendimento. Escolha outra data ou horário.") em vez do erro genérico.

## O que decidi não fazer (e por quê)

**Notificação automática para quem fez o agendamento.** Ao testar o fluxo completo, percebi uma lacuna: depois que o admin confirma ou cancela um agendamento no painel, a pessoa que solicitou não fica sabendo de nada  ela precisaria ligar pra unidade pra descobrir. Isso não fazia sentido pra um sistema que se propõe a ser usado de verdade.

Pensei em duas formas de resolver: enviar um email automático (usando o próprio email que já é coletado no formulário) ou, o que me pareceu mais adequado à realidade das pessoas que uma ESF atende, enviar a resposta por WhatsApp — coletando o número no formulário. Na minha experiência, WhatsApp tem um alcance e uma taxa de abertura muito maior que email nesse público; muita gente nem chega a abrir notificação de email, mas responde WhatsApp na hora.

Decidi não implementar nenhuma das duas por enquanto: envolveria configurar uma Edge Function no Supabase, integrar com um serviço externo (email ou WhatsApp Business API) e gerenciar credenciais sensíveis com segurança — mais uma peça nova para testar e que poderia falhar perto do prazo, por depender de configuração fora do meu próprio código. Prefiro documentar essa lacuna conscientemente a tentar implementar às pressas e entregar algo instável.

## Uso de IA

Usei o Claude como suporte de desenvolvimento durante todo o projeto, dando os comandos do que eu precisava a cada etapa  por exemplo, pedindo um código em HTML, CSS e JS com os campos que eu já tinha decidido usar (nome, email, tipo, data e horário), e conferindo cada parte antes de seguir pra próxima. Sobre o Supabase, eu já tinha mexido com ele antes em outro projeto, mas precisei de ajuda da IA para encontrar a chave de acesso (anon key) e a URL correta do projeto dentro do painel  foi justamente nessa parte que veio o erro que conto a seguir.

Teve um momento em que a orientação da IA levou a um erro: ao configurar o `supabaseClient.js`, copiei a URL da página "Data API" do Supabase, que já vem com `/rest/v1/` no final  só que é a URL *base* do projeto (sem esse caminho) que o código precisa, porque a biblioteca do Supabase adiciona esse caminho sozinha. O resultado foi um erro `PGRST125: Invalid path specified in request URL` ao tentar enviar o formulário. Percebi que era um problema de URL comparando o print da tela do Supabase com o texto exato do erro, e a correção foi remover esse trecho duplicado da URL.

A decisão que tomei diferente da sugestão da IA foi sobre a notificação ao visitante: a IA me ofereceu email (via Resend) como caminho de implementação, mas em nenhum momento pensou na resposta que o cliente de fato receberia nem sugeriu pedir o número de WhatsApp no formulário  e o pessoal que uma ESF atende tem muito mais contato pelo WhatsApp do que por email. Por outro lado, avaliei que configurar notificação via WhatsApp seria mais trabalhoso e poderia até gerar custos, enquanto o email dá pra configurar usando o próprio Supabase, embora também exija mais trabalho de configuração. Documentei essa análise como uma melhoria futura em vez de implementar agora, mas a percepção da lacuna e a comparação entre as duas opções foram minhas, baseadas em conhecimento de campo que a IA não tinha.