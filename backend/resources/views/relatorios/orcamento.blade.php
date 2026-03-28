<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
  h1 { color: #1D9E75; font-size: 18px; }
  h2 { font-size: 13px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #1D9E75; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  tr.total-row td { font-weight: bold; background: #f5f5f5; }
  .tipo-orcado { color: #1a6fc4; }
  .tipo-realizado { color: #28a745; }
  footer { margin-top: 30px; font-size: 10px; color: #aaa; text-align: right; }
</style>
</head>
<body>

<h1>Relatório de Orçamento — {{ $obra->nome }}</h1>
<p>{{ $obra->cidade }}/{{ $obra->estado }} &nbsp;|&nbsp; Emitido em: {{ now()->format('d/m/Y H:i') }}</p>

<h2>Lançamentos por Categoria</h2>
@foreach($porCategoria as $categoria => $lancamentos)
<h2 style="font-size:12px; margin-top:14px">{{ $categoria }}</h2>
<table>
  <tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Lançado por</th><th>Valor</th></tr>
  @foreach($lancamentos as $custo)
  <tr>
    <td>{{ $custo->data->format('d/m/Y') }}</td>
    <td>{{ $custo->descricao }}</td>
    <td class="tipo-{{ $custo->tipo }}">{{ ucfirst($custo->tipo) }}</td>
    <td>{{ $custo->lancadoPor->nome }}</td>
    <td>R$ {{ number_format($custo->valor, 2, ',', '.') }}</td>
  </tr>
  @endforeach
  <tr class="total-row">
    <td colspan="4">Subtotal {{ $categoria }}</td>
    <td>R$ {{ number_format($lancamentos->sum('valor'), 2, ',', '.') }}</td>
  </tr>
</table>
@endforeach

<h2>Resumo Geral</h2>
<table>
  <tr><th>Orçamento Total</th><th>Total Orçado</th><th>Total Realizado</th><th>Saldo</th></tr>
  <tr class="total-row">
    <td>R$ {{ number_format($obra->orcamento_total, 2, ',', '.') }}</td>
    <td>R$ {{ number_format($custos->where('tipo','orcado')->sum('valor'), 2, ',', '.') }}</td>
    <td>R$ {{ number_format($custos->where('tipo','realizado')->sum('valor'), 2, ',', '.') }}</td>
    <td>R$ {{ number_format($obra->orcamento_total - $custos->where('tipo','realizado')->sum('valor'), 2, ',', '.') }}</td>
  </tr>
</table>

<footer>Obra+ — Relatório gerado automaticamente</footer>
</body>
</html>
