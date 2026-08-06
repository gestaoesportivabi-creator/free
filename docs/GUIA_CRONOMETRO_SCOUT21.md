# Guia do Cronometro Scout21

## Estados principais

- `Pre-jogo`: a partida ainda nao começou.
- `Primeiro tempo`: o jogo esta em andamento na primeira etapa.
- `Partida pausada`: o relogio foi interrompido no tempo atual.
- `Intervalo`: o primeiro tempo foi encerrado e a segunda etapa ainda nao começou.
- `Segundo tempo`: a segunda etapa esta em andamento.
- `Partida encerrada`: o cronometro chegou ao estado final e a coleta pode ser concluida.

## Acoes do cronometro

### Iniciar partida

Use `INICIAR PARTIDA` para abrir o primeiro tempo e iniciar a contagem oficial dos eventos.

### Pausar

Use `PAUSAR` para congelar o tempo atual quando a sua operacao pedir essa interrupcao.

### Continuar partida

Use `CONTINUAR PARTIDA` para retomar o jogo do mesmo ponto pausado.

### Sincronizar cronometro

Use `Sincronizar cronometro` quando o tempo da plataforma precisar bater com o relogio oficial da quadra.

### Encerrar coleta do 1o tempo

Use esse comando ao fim da primeira etapa para levar a coleta ao `Intervalo`.

### Iniciar segundo tempo

Use `INICIAR SEGUNDO TEMPO` para abrir a etapa seguinte.

### Encerrar partida

Use `Encerrar partida` ao fim do jogo para deixar a coleta pronta para finalizacao.

## Salvar e reabrir

### Salvar como incompleta

Use `Salvar como incompleta` quando a coleta vai continuar depois.

Resultado esperado:

- placar preservado;
- eventos preservados;
- periodo preservado;
- relogio preservado.

### Retomar Coleta

Use `Retomar Coleta` para continuar a operacao da partida.

Resultado esperado:

- a coleta reabre com o tempo salvo;
- o relogio abre pausado;
- voce decide entre continuar ou sincronizar antes de seguir.

### Finalizar coleta

Use `Finalizar coleta` somente quando a partida ja estiver no estado `Partida encerrada`.

## Situacoes comuns

### O jogo ja começou e o sistema esta em 00:00

1. Abra `Sincronizar cronometro`.
2. Informe o tempo oficial da quadra.
3. Confirme.
4. Continue a coleta.

### O tempo da plataforma esta diferente do placar da quadra

1. Pause a partida, se isso fizer parte da sua operacao.
2. Abra `Sincronizar cronometro`.
3. Corrija o minuto e o segundo.
4. Retome a partida.

### Preciso sair antes do fim

1. Confira periodo, tempo e placar.
2. Use `Salvar como incompleta`.
3. Feche a coleta.
4. Retome depois por `Retomar Coleta`.

### Reabri uma partida incompleta

1. Confira o periodo.
2. Confira o tempo salvo.
3. Confira o placar.
4. Continue ou sincronize antes de registrar novos eventos.

### O botao Finalizar coleta esta desabilitado

Isso normalmente significa que a partida ainda nao foi encerrada no fluxo do cronometro.
