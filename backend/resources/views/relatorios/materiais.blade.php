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
  .critico { background: #f8d7da; }
  .atencao { background: #fff3cd; }
  .badge-critico { background: #dc3545; color: #fff; padding: 2px 7px; border-radius: 8px; font-size: 10px; }
  .badge-atencao { background: #ffc107; color: #333; padding: 2px 7px; border-radius: 8px; font-size: 10px; }
  .badge-ok { background: #28a745; color: #fff; padding: 2px 7px; border-radius: 8px; font-size: 10px; }
  footer { margin-top: 30px; font-size: 10px; color: #aaa; text-align: right; }
</style>
</head>
<body>

<h1>Relatório de Estoque de Materiais</h1>
<p>Emitido em: {{ now()->format('d/m/Y H:i') }}
   &nbsp;|&nbsp; <span style="color:#dc3545">{{ $criticos->count() }} críticos</span>
   &nbsp;|&nbsp; <span style="color:#ffc107">{{ $atencao->count() }} em atenção</span></p>

<h2>Estoque Completo</h2>
<table>
  <tr>
    <th>Material</th><th>Categoria</th><th>Unidade</th>
    <th>Atual</th><th>Mínimo</th><th>Máximo</th>
    <th>Vlr. Unit.</th><th>Status</th>
  </tr>
  @foreach($materiais as $m)
  <tr class="{{ $m->status_estoque === 'critico' ? 'critico' : ($m->status_estoque === 'atencao' ? 'atencao' : '') }}">
    <td>{{ $m->nome }}</td>
    <td>{{ $m->categoria->nome }}</td>
    <td>{{ $m->unidade }}</td>
    <td>{{ number_format($m->estoque_atual, 3, ',', '.') }}</td>
    <td>{{ number_format($m->estoque_minimo, 3, ',', '.') }}</td>
    <td>{{ number_format($m->estoque_maximo, 3, ',', '.') }}</td>
    <td>R$ {{ number_format($m->valor_unitario, 2, ',', '.') }}</td>
    <td><span class="badge-{{ $m->status_estoque }}">{{ strtoupper($m->status_estoque) }}</span></td>
  </tr>
  @endforeach
</table>

<footer>Obra+ — Relatório gerado automaticamente</footer>
</body>
</html>
