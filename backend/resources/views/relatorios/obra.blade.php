<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
  h1 { color: #1D9E75; font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1D9E75; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .status-concluido { background: #d4edda; color: #155724; }
  .status-em_andamento { background: #cce5ff; color: #004085; }
  .status-atrasado { background: #f8d7da; color: #721c24; }
  .status-nao_iniciado { background: #e2e3e5; color: #383d41; }
  .resumo { display: flex; gap: 16px; margin: 12px 0; }
  .card { border: 1px solid #ddd; border-radius: 6px; padding: 10px 16px; flex: 1; }
  .card-label { font-size: 10px; color: #888; }
  .card-value { font-size: 16px; font-weight: bold; color: #1D9E75; }
  footer { margin-top: 30px; font-size: 10px; color: #aaa; text-align: right; }
</style>
</head>
<body>

<h1>{{ $obra->nome }}</h1>
<p>{{ $obra->endereco }} — {{ $obra->cidade }}/{{ $obra->estado }} &nbsp;|&nbsp;
   Responsável: <strong>{{ $obra->responsavel->nome }}</strong> &nbsp;|&nbsp;
   Emitido em: {{ now()->format('d/m/Y H:i') }}</p>

<table style="width:auto">
  <tr><td><strong>Tipo:</strong></td><td>{{ ucfirst($obra->tipo) }}</td>
      <td><strong>Status:</strong></td><td>{{ str_replace('_', ' ', ucfirst($obra->status)) }}</td></tr>
  <tr><td><strong>Início:</strong></td><td>{{ $obra->data_inicio->format('d/m/Y') }}</td>
      <td><strong>Previsão fim:</strong></td><td>{{ $obra->data_previsao_fim->format('d/m/Y') }}</td></tr>
  <tr><td><strong>Progresso:</strong></td><td>{{ $obra->progresso }}%</td>
      <td><strong>Atrasada:</strong></td><td>{{ $obra->esta_atrasada ? 'Sim' : 'Não' }}</td></tr>
</table>

<h2>Resumo Financeiro</h2>
<table>
  <tr>
    <th>Orçamento Total</th><th>Total Orçado</th><th>Total Realizado</th><th>Saldo</th><th>% Gasto</th>
  </tr>
  <tr>
    <td>R$ {{ number_format($obra->orcamento_total, 2, ',', '.') }}</td>
    <td>R$ {{ number_format($totalOrcado, 2, ',', '.') }}</td>
    <td>R$ {{ number_format($totalRealizado, 2, ',', '.') }}</td>
    <td>R$ {{ number_format($obra->orcamento_total - $totalRealizado, 2, ',', '.') }}</td>
    <td>{{ $obra->percentual_gasto }}%</td>
  </tr>
</table>

<h2>Etapas</h2>
<table>
  <tr><th>Etapa</th><th>Status</th><th>Início Previsto</th><th>Fim Previsto</th><th>Progresso</th></tr>
  @foreach($obra->etapas as $etapa)
  <tr>
    <td>{{ $etapa->nome }}</td>
    <td><span class="badge status-{{ $etapa->status }}">{{ str_replace('_', ' ', $etapa->status) }}</span></td>
    <td>{{ $etapa->data_inicio_prevista->format('d/m/Y') }}</td>
    <td>{{ $etapa->data_fim_prevista->format('d/m/Y') }}</td>
    <td>{{ $etapa->progresso }}%</td>
  </tr>
  @endforeach
</table>

<footer>Obra+ — Relatório gerado automaticamente</footer>
</body>
</html>
